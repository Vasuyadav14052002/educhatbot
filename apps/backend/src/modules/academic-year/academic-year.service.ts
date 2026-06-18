import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AcademicYearService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findAll(schoolId: string) {
    const years = await this.prisma.academicYear.findMany({
      where: { school_id: schoolId },
      include: { terms: true },
      orderBy: { start_date: 'desc' }
    });

    return Promise.all(years.map(async y => {
      const stats = await this.getYearSummaryStats(schoolId, y.id);
      return { ...y, ...stats };
    }));
  }

  async getYearSummaryStats(schoolId: string, academicYearId: string) {
    const cacheKey = `year:stats:${academicYearId}`;
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats;

    const [studentCount, classCount, termCount] = await Promise.all([
      this.prisma.student.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
      this.prisma.class.count({ where: { school_id: schoolId } }),
      this.prisma.term.count({ where: { academic_year_id: academicYearId } })
    ]);

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { class: { school_id: schoolId } },
      select: { teacher_id: true }
    });
    const teacherCount = new Set(classSubjects.filter(cs => cs.teacher_id).map(cs => cs.teacher_id)).size;

    const stats = { studentCount, classCount, teacherCount, termCount };
    await this.cacheManager.set(cacheKey, stats, 300000); // 5 minutes
    return stats;
  }

  async findOne(schoolId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id, school_id: schoolId },
      include: {
        terms: { orderBy: { start_date: 'asc' } },
        events: { orderBy: { event_date: 'asc' } },
        school_achievements: { orderBy: { achievement_date: 'desc' } },
      }
    });

    if (!year) throw new NotFoundException('Academic year not found');

    const summary = await this.getDetailedSummary(schoolId, id);

    return {
      overview: year,
      summary,
      calendar: year.events,
      achievements: year.school_achievements,
      terms: year.terms
    };
  }

  async getDetailedSummary(schoolId: string, academicYearId: string) {
    const cacheKey = `year:detail:stats:${academicYearId}`;
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats;

    const [enrolled, promoted, graduated, transferred, dropouts] = await Promise.all([
      this.prisma.student.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
      this.prisma.student.count({ where: { school_id: schoolId, promotion_status: 'PROMOTED' } }),
      this.prisma.student.count({ where: { school_id: schoolId, promotion_status: 'GRADUATED', exit_reason: 'GRADUATION' } }),
      this.prisma.student.count({ where: { school_id: schoolId, exit_reason: 'TRANSFER' } }),
      this.prisma.student.count({ where: { school_id: schoolId, exit_reason: 'DROPOUT' } }),
    ]);

    const summary = { enrolled, promoted, graduated, transferred, dropouts, newAdmissions: 0 };
    await this.cacheManager.set(cacheKey, summary, 600000); // 10 minutes
    return summary;
  }

  async activateYear(schoolId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, school_id: schoolId } });
    if (!year) throw new NotFoundException('Academic year not found');

    await this.prisma.$transaction(async (tx) => {
      // Deactivate current active year
      await tx.academicYear.updateMany({
        where: { school_id: schoolId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED', is_current: false }
      });
      // Activate new year
      await tx.academicYear.update({
        where: { id },
        data: { status: 'ACTIVE', is_current: true }
      });
    });
    return { success: true };
  }

  async archiveYear(schoolId: string, id: string) {
    return this.prisma.academicYear.update({
      where: { id, school_id: schoolId },
      data: { status: 'ARCHIVED', is_current: false }
    });
  }

  async closeYear(schoolId: string, id: string, userId: string, body: { confirmationText: string, nextYearId?: string }) {
    if (body.confirmationText !== 'Confirm') throw new BadRequestException('Invalid confirmation');

    await this.prisma.$transaction(async (tx) => {
      await tx.academicYear.update({
        where: { id, school_id: schoolId },
        data: { status: 'ARCHIVED', is_current: false }
      });

      if (body.nextYearId) {
        await tx.academicYear.update({
          where: { id: body.nextYearId, school_id: schoolId },
          data: { status: 'ACTIVE', is_current: true }
        });
      }

      await tx.auditLog.create({
        data: {
          school_id: schoolId,
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'AcademicYear',
          entity_id: id,
          metadata: { action: 'academic_year_closed' }
        }
      });
    });
    return { success: true };
  }

  async getPromotions(schoolId: string) {
    return this.prisma.class.findMany({
      where: { school_id: schoolId },
      include: { students: { where: { status: 'ACTIVE' } } },
      orderBy: { name: 'asc' } // Will be sorted numerically on frontend or by separate logic
    });
  }

  async promoteStudents(schoolId: string, userId: string, body: any) {
    const { promotions, academicYearId } = body;
    
    await this.prisma.$transaction(async (tx) => {
      for (const p of promotions) {
        await tx.studentPromotion.create({
          data: {
            student_id: p.studentId,
            from_class_id: p.fromClassId,
            to_class_id: p.toClassId,
            academic_year_id: academicYearId,
            action: p.status.toUpperCase(),
            promoted_by: userId
          }
        });

        await tx.student.update({
          where: { id: p.studentId },
          data: { 
            class_id: p.toClassId,
            promotion_status: p.status.toUpperCase()
          }
        });
      }
    });

    return { success: true, message: 'Bulk promotion successful' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TERMS
  // ─────────────────────────────────────────────────────────────────────────────
  async createTerm(schoolId: string, academicYearId: string, data: any) {
    return this.prisma.term.create({
      data: { ...data, academic_year_id: academicYearId }
    });
  }
  async updateTerm(schoolId: string, termId: string, data: any) {
    return this.prisma.term.update({ where: { id: termId }, data });
  }
  async deleteTerm(schoolId: string, termId: string) {
    return this.prisma.term.delete({ where: { id: termId } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────────────────────────
  async createEvent(schoolId: string, academicYearId: string, userId: string, data: any) {
    return this.prisma.event.create({
      data: { ...data, school_id: schoolId, academic_year_id: academicYearId, created_by: userId }
    });
  }
  async updateEvent(schoolId: string, eventId: string, data: any) {
    return this.prisma.event.update({ where: { id: eventId, school_id: schoolId }, data });
  }
  async deleteEvent(schoolId: string, eventId: string) {
    return this.prisma.event.delete({ where: { id: eventId, school_id: schoolId } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  async createAchievement(schoolId: string, academicYearId: string, data: any) {
    return this.prisma.schoolAchievement.create({
      data: { ...data, academic_year_id: academicYearId }
    });
  }
  async updateAchievement(schoolId: string, achievementId: string, data: any) {
    return this.prisma.schoolAchievement.update({ where: { id: achievementId }, data });
  }
  async deleteAchievement(schoolId: string, achievementId: string) {
    return this.prisma.schoolAchievement.delete({ where: { id: achievementId } });
  }
}
