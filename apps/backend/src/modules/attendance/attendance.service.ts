import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { BulkAttendanceDto, GetAttendanceQueryDto } from './dto/attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Bulk Attendance Entry (Teacher's primary action) ─────────────────────────

  async bulkMarkAttendance(
    dto: BulkAttendanceDto,
    teacherId: string,
    schoolId: string,
  ) {
    // Validate academic year belongs to school
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academic_year_id, school_id: schoolId, is_current: true },
    });
    if (!academicYear) {
      throw new BadRequestException('No active academic year found for this school');
    }

    const date = new Date(dto.date);
    const results = [];

    for (const entry of dto.entries) {
      const record = await this.prisma.attendance.upsert({
        where: {
          student_id_date: { student_id: entry.student_id, date },
        },
        update: {
          status: entry.status,
          remarks: entry.remarks,
          marked_by: teacherId,
          marked_at: new Date(),
        },
        create: {
          school_id: schoolId,
          student_id: entry.student_id,
          academic_year_id: dto.academic_year_id,
          date,
          status: entry.status,
          remarks: entry.remarks,
          marked_by: teacherId,
        },
        include: {
          student: { select: { id: true, first_name: true, last_name: true } },
        },
      });

      results.push(record);

      // Invalidate cache
      await this.redisService.invalidateStudentCache(schoolId, entry.student_id);

      // Emit real-time event
      this.eventEmitter.emit('attendance.updated', {
        school_id: schoolId,
        student_id: entry.student_id,
        date: dto.date,
        status: entry.status,
        student_name: `${record.student.first_name} ${record.student.last_name}`,
      });
    }

    this.logger.log(
      `Bulk attendance marked by teacher ${teacherId} for ${dto.entries.length} students on ${dto.date}`,
    );

    return {
      marked: results.length,
      date: dto.date,
      records: results,
    };
  }

  // ─── Get Student Attendance (with caching) ──────────────────────────────────

  async getStudentAttendance(
    studentId: string,
    schoolId: string,
    query: GetAttendanceQueryDto,
  ) {
    // Ensure student belongs to school
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, school_id: schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const cacheKey = `attendance:${schoolId}:${studentId}:${query.academic_year_id || 'current'}:${query.month || 'all'}`;
    const cached = await this.redisService.getJson<object>(cacheKey);
    if (cached) return cached;

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.from_date) dateFilter.gte = new Date(query.from_date);
    if (query.to_date) dateFilter.lte = new Date(query.to_date);
    if (query.month && query.year) {
      dateFilter.gte = new Date(query.year, query.month - 1, 1);
      dateFilter.lte = new Date(query.year, query.month, 0);
    }

    const records = await this.prisma.attendance.findMany({
      where: {
        student_id: studentId,
        school_id: schoolId,
        ...(query.academic_year_id && { academic_year_id: query.academic_year_id }),
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      orderBy: { date: 'desc' },
      include: {
        teacher: { select: { first_name: true, last_name: true } },
      },
    });

    const stats = this.calculateStats(records);
    const result = { records, stats };

    await this.redisService.setJson(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  // ─── Class Attendance for a Date ────────────────────────────────────────────

  async getClassAttendance(classId: string, date: string, schoolId: string) {
    const students = await this.prisma.student.findMany({
      where: { class_id: classId, school_id: schoolId, status: 'ACTIVE' },
      include: {
        attendance: {
          where: { date: new Date(date) },
          take: 1,
        },
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    return students.map((student) => ({
      student_id: student.id,
      student_code: student.student_code,
      name: `${student.first_name} ${student.last_name}`,
      photo_url: student.photo_url,
      attendance: student.attendance[0] || null,
      status: student.attendance[0]?.status || null,
    }));
  }

  // ─── Attendance Calendar (Monthly View) ──────────────────────────────────────

  async getAttendanceCalendar(
    studentId: string,
    schoolId: string,
    month: number,
    year: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendance.findMany({
      where: {
        student_id: studentId,
        school_id: schoolId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, status: true, remarks: true },
      orderBy: { date: 'asc' },
    });

    const calendarMap: Record<string, { status: AttendanceStatus; remarks?: string | null }> = {};
    records.forEach((r) => {
      calendarMap[r.date.toISOString().split('T')[0]] = {
        status: r.status,
        remarks: r.remarks,
      };
    });

    return {
      month,
      year,
      calendar: calendarMap,
      summary: this.calculateStats(records as Parameters<typeof this.calculateStats>[0]),
    };
  }

  // ─── Statistics Helper ───────────────────────────────────────────────────────

  private calculateStats(records: { status: AttendanceStatus }[]) {
    const total = records.length;
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
      leave: 0,
    };

    records.forEach((r) => {
      switch (r.status) {
        case 'PRESENT': counts.present++; break;
        case 'ABSENT': counts.absent++; break;
        case 'LATE': counts.late++; break;
        case 'HALF_DAY': counts.half_day++; break;
        case 'LEAVE': counts.leave++; break;
      }
    });

    const effectivePresent = counts.present + counts.late + counts.half_day * 0.5;
    const percentage = total > 0 ? Math.round((effectivePresent / total) * 100 * 10) / 10 : 0;

    return { ...counts, total_days: total, percentage };
  }
}
