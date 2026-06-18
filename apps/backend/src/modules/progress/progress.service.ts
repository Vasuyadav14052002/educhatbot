import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BulkProgressDto } from './dto/progress.dto';
import { HomeworkStatus, EngagementLevel } from '@prisma/client';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Get Class Progress for Grid ──────────────────────────────────────────
  async getClassProgress(classId: string, date: string, subjectId: string, schoolId: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get active students in this class
    const students = await this.prisma.student.findMany({
      where: { class_id: classId, school_id: schoolId, status: 'ACTIVE' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        student_code: true,
        admission_no: true,
        photo_url: true,
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    // Find progress entries for the class, subject and date
    const progressRecords = await this.prisma.studentProgress.findMany({
      where: {
        school_id: schoolId,
        subject_id: subjectId,
        date: targetDate,
        student_id: { in: students.map((s) => s.id) },
      },
    });

    // Find attendance records for the class and date
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        school_id: schoolId,
        date: targetDate,
        student_id: { in: students.map((s) => s.id) },
      },
      select: {
        student_id: true,
        status: true,
      },
    });

    // Create maps for quick lookup
    const progressMap = new Map(progressRecords.map((r) => [r.student_id, r]));
    const attendanceMap = new Map(attendanceRecords.map((a) => [a.student_id, a.status]));

    return students.map((student) => {
      const record = progressMap.get(student.id);
      const attStatus = attendanceMap.get(student.id) || null;

      return {
        student_id: student.id,
        roll_number: student.student_code, // use code as roll_number
        name: `${student.first_name} ${student.last_name}`,
        photo_url: student.photo_url,
        subject_id: subjectId,
        date,
        attendance: attStatus,
        performance_score: record?.performance_score ?? null,
        homework_status: record?.homework_status ?? null,
        class_engagement: record?.class_engagement ?? null,
        behavior_notes: record?.behavior_notes ?? null,
        class_activity_score: record?.class_activity_score ?? null,
        teacher_comments: record?.teacher_comments ?? null,
        parent_visible: record?.parent_visible ?? true,
        remarks_category: record?.remarks_category ?? null,
        participation_ratings: record?.participation_ratings ?? null,
        behavior_ratings: record?.behavior_ratings ?? null,
        activities: record?.activities ?? null,
        last_updated: record?.updated_at ?? record?.created_at ?? null,
        status: record ? 'Completed' : 'Pending',
      };
    });
  }

  // ─── Bulk Update Progress ──────────────────────────────────────────────────
  async bulkUpdateProgress(dto: BulkProgressDto, teacherId: string, schoolId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academic_year_id, school_id: schoolId, is_current: true },
    });
    if (!academicYear) {
      throw new BadRequestException('No active academic year found for this school');
    }

    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);
    const results = [];

    for (const entry of dto.entries) {
      const record = await this.prisma.studentProgress.upsert({
        where: {
          student_id_subject_id_date: {
            student_id: entry.student_id,
            subject_id: dto.subject_id,
            date: targetDate,
          },
        },
        update: {
          performance_score: entry.performance_score,
          teacher_comments: entry.teacher_comments,
          homework_status: entry.homework_status,
          class_engagement: entry.class_engagement,
          behavior_notes: entry.behavior_notes,
          class_activity_score: entry.class_activity_score,
          parent_visible: entry.parent_visible ?? true,
          remarks_category: entry.remarks_category,
          participation_ratings: entry.participation_ratings || {},
          behavior_ratings: entry.behavior_ratings || {},
          activities: entry.activities || [],
          created_by: teacherId,
        },
        create: {
          school_id: schoolId,
          student_id: entry.student_id,
          subject_id: dto.subject_id,
          academic_year_id: dto.academic_year_id,
          date: targetDate,
          performance_score: entry.performance_score,
          teacher_comments: entry.teacher_comments,
          homework_status: entry.homework_status,
          class_engagement: entry.class_engagement,
          behavior_notes: entry.behavior_notes,
          class_activity_score: entry.class_activity_score,
          parent_visible: entry.parent_visible ?? true,
          remarks_category: entry.remarks_category,
          participation_ratings: entry.participation_ratings || {},
          behavior_ratings: entry.behavior_ratings || {},
          activities: entry.activities || [],
          created_by: teacherId,
        },
        include: {
          student: { select: { first_name: true, last_name: true } },
          subject: { select: { name: true } },
        },
      });

      results.push(record);

      // Save as Teacher Remark if comments are provided
      if (entry.teacher_comments && entry.teacher_comments.trim()) {
        await this.prisma.teacherRemark.create({
          data: {
            student_id: entry.student_id,
            teacher_id: teacherId,
            remark: entry.teacher_comments.trim(),
            category: entry.remarks_category || 'ACADEMIC',
          },
        });
      }

      // Invalidate student caches in Redis
      await this.redisService.invalidateStudentCache(schoolId, entry.student_id);

      // Emit real-time event for websocket dispatch
      this.eventEmitter.emit('progress.updated', {
        school_id: schoolId,
        student_id: entry.student_id,
        date: dto.date,
        performance_score: entry.performance_score,
        subject_name: record.subject.name,
        student_name: `${record.student.first_name} ${record.student.last_name}`,
      });
    }

    // Invalidate full school cache to force analytics reload
    await this.redisService.invalidateSchoolCache(schoolId);

    this.logger.log(
      `Bulk progress updated by teacher ${teacherId} for ${dto.entries.length} students on ${dto.date}`,
    );

    return {
      updated: results.length,
      date: dto.date,
      records: results,
    };
  }

  // ─── Get Chronological Progress Logs for Student ───────────────────────────
  async getStudentProgressLogs(studentId: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, school_id: schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.studentProgress.findMany({
      where: { student_id: studentId, school_id: schoolId },
      include: {
        subject: { select: { name: true, code: true, color: true } },
        creator: { select: { first_name: true, last_name: true } },
        student: {
          include: {
            class: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ─── Get Dashboard/School Level Progress Analytics ─────────────────────────
  async getProgressAnalytics(schoolId: string) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const cacheKey = `progress:analytics:${schoolId}:${today.toISOString().split('T')[0]}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) return cached;

    // Get today's progress entries count
    const updatedToday = await this.prisma.studentProgress.count({
      where: { school_id: schoolId, date: today },
    });

    // Get total students
    const totalStudents = await this.prisma.student.count({
      where: { school_id: schoolId, status: 'ACTIVE' },
    });

    const pendingUpdates = Math.max(0, totalStudents - updatedToday);

    // Calculate averages of all entries in the school
    const aggregates = await this.prisma.studentProgress.aggregate({
      where: { school_id: schoolId },
      _avg: {
        performance_score: true,
        class_activity_score: true,
      },
    });

    const allProgress = await this.prisma.studentProgress.findMany({
      where: { school_id: schoolId },
      select: {
        homework_status: true,
        participation_ratings: true,
        behavior_ratings: true,
        date: true,
        performance_score: true,
      },
    });

    // Homework rates
    const totalHw = allProgress.length;
    const completedHw = allProgress.filter((p) => p.homework_status === HomeworkStatus.COMPLETED).length;
    const homeworkRate = totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0;

    // Sub ratings score calculations (behavior & participation averages)
    let behaviorSum = 0;
    let behaviorCount = 0;
    let participationSum = 0;
    let participationCount = 0;

    allProgress.forEach((p) => {
      const bRatings = p.behavior_ratings as Record<string, number> | null;
      if (bRatings) {
        const values = Object.values(bRatings).filter((v) => typeof v === 'number');
        if (values.length > 0) {
          behaviorSum += values.reduce((s, v) => s + v, 0) / values.length;
          behaviorCount++;
        }
      }

      const pRatings = p.participation_ratings as Record<string, number> | null;
      if (pRatings) {
        const values = Object.values(pRatings).filter((v) => typeof v === 'number');
        if (values.length > 0) {
          participationSum += values.reduce((s, v) => s + v, 0) / values.length;
          participationCount++;
        }
      }
    });

    const avgBehavior = behaviorCount > 0 ? Math.round((behaviorSum / behaviorCount) * 20) : 90; // scale 1-5 to 100%
    const avgParticipation = participationCount > 0 ? Math.round((participationSum / participationCount) * 20) : 85;

    // Time-series trend groupings (last 7 days of logs)
    const dateGroups = new Map<string, { performance: number[]; homework: number[]; count: number }>();
    allProgress.forEach((p) => {
      const dStr = p.date.toISOString().split('T')[0];
      if (!dateGroups.has(dStr)) {
        dateGroups.set(dStr, { performance: [], homework: [], count: 0 });
      }
      const g = dateGroups.get(dStr)!;
      g.performance.push(p.performance_score);
      g.homework.push(p.homework_status === HomeworkStatus.COMPLETED ? 100 : 0);
      g.count++;
    });

    const trendData = Array.from(dateGroups.entries()).map(([date, g]) => {
      return {
        date,
        performance: Math.round(g.performance.reduce((a,b)=>a+b,0) / g.performance.length),
        homework: Math.round(g.homework.reduce((a,b)=>a+b,0) / g.homework.length),
      };
    }).sort((a,b) => a.date.localeCompare(b.date)).slice(-10); // last 10 log dates

    const result = {
      updatedToday,
      totalStudents,
      pendingUpdates,
      avgPerformance: Math.round(aggregates._avg.performance_score ?? 85),
      homeworkCompletionRate: homeworkRate || 90,
      participationScore: avgParticipation,
      behaviorScore: avgBehavior,
      trend: trendData,
    };

    await this.redisService.setJson(cacheKey, result, this.CACHE_TTL);
    return result;
  }
}
