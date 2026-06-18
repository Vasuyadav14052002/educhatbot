import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ParticipationService {
  private readonly logger = new Logger(ParticipationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOverview(schoolId: string, academicYearId: string) {
    const students = await this.prisma.student.count({ where: { school_id: schoolId } });
    
    const activeParticipantsData = await this.prisma.participation.groupBy({
      by: ['student_id'],
      where: { school_id: schoolId, academic_year_id: academicYearId },
    });
    
    const totalActivities = await this.prisma.participation.count({
      where: { school_id: schoolId, academic_year_id: academicYearId },
    });

    const achievementsEarned = await this.prisma.achievement.count({
      where: { school_id: schoolId },
    });

    const badgesAwarded = await this.prisma.badge.count({
      where: { school_id: schoolId },
    });

    const culturalEvents = await this.prisma.culturalActivity.count({
      where: { school_id: schoolId },
    });

    const sportsParticipants = await this.prisma.sportsRecord.groupBy({
      by: ['student_id'],
      where: { school_id: schoolId },
    });
    
    const sportsParticipationRate = students > 0 
      ? Math.round((sportsParticipants.length / students) * 100) 
      : 0;

    return {
      activeParticipants: activeParticipantsData.length,
      totalStudents: students,
      totalActivities,
      achievementsEarned,
      badgesAwarded,
      culturalEventsParticipated: culturalEvents,
      sportsParticipationRate,
    };
  }

  async getAnalytics(schoolId: string, academicYearId: string) {
    const participations = await this.prisma.participation.findMany({
      where: { school_id: schoolId, academic_year_id: academicYearId },
      select: { category: true, points: true, date: true }
    });

    const categoryCounts: Record<string, number> = {};
    const monthlyParticipation: Record<string, number> = {};

    participations.forEach(p => {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const month = new Date(p.date).toLocaleString('default', { month: 'short' });
      monthlyParticipation[month] = (monthlyParticipation[month] || 0) + 1;
    });

    const categoryDistribution = Object.keys(categoryCounts).map(name => ({
      name,
      value: categoryCounts[name],
    }));

    const monthlyTrend = Object.keys(monthlyParticipation).map(month => ({
      month,
      count: monthlyParticipation[month],
    }));

    return {
      categoryDistribution,
      monthlyTrend,
    };
  }

  async getParticipations(schoolId: string, academicYearId: string) {
    return this.prisma.participation.findMany({
      where: { school_id: schoolId, academic_year_id: academicYearId },
      include: {
        student: { select: { student_code: true, first_name: true, last_name: true } },
        recorder: { select: { first_name: true, last_name: true } }
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAchievements(schoolId: string) {
    return this.prisma.achievement.findMany({
      where: { school_id: schoolId },
      include: {
        student: { select: { student_code: true, first_name: true, last_name: true } }
      },
      orderBy: { date: 'desc' },
    });
  }

  async getBadges(schoolId: string) {
    return this.prisma.badge.findMany({
      where: { school_id: schoolId },
      include: {
        student: { select: { student_code: true, first_name: true, last_name: true, photo_url: true } }
      },
      orderBy: { awarded_date: 'desc' },
    });
  }

  async getStudentProfile(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        participation: { orderBy: { date: 'desc' } },
        achievements: { orderBy: { date: 'desc' } },
        badges: { orderBy: { awarded_date: 'desc' } },
        cultural_activities: { orderBy: { event_date: 'desc' } },
        sports_records: { orderBy: { participation_date: 'desc' } },
        student_leaderships: { orderBy: { start_date: 'desc' } },
        club_memberships: true,
      }
    });
  }

  async addParticipation(data: any) {
    return this.prisma.participation.create({ data });
  }

  async addAchievement(data: any) {
    return this.prisma.achievement.create({ data });
  }

  async awardBadge(data: any) {
    return this.prisma.badge.create({ data });
  }
}
