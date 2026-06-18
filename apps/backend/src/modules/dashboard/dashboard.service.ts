import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getFirstSchoolId(): Promise<string> {
    const school = await this.prisma.school.findFirst();
    return school?.id || '';
  }

  async getKpis(schoolId: string, academicYearId: string) {
    const cacheKey = `dashboard:kpis:${schoolId}:${academicYearId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0,0,0,0);
    
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0,0,0,0);

    // 1. Total Students & Trend
    const [totalStudents, lastMonthStudents, prevTotalStudents] = await Promise.all([
      this.prisma.student.count({
        where: { school_id: schoolId, status: 'ACTIVE' },
      }),
      this.prisma.student.count({
        where: {
          school_id: schoolId,
          status: 'ACTIVE',
          joined_date: { lt: thisMonthStart },
        },
      }),
      this.prisma.student.count({
        where: {
          school_id: schoolId,
          status: 'ACTIVE',
          joined_date: { lt: lastMonthStart },
        },
      }),
    ]);
    const newStudents = totalStudents - lastMonthStudents;
    const prevNewStudents = lastMonthStudents - prevTotalStudents; // not strictly needed, but let's just return delta

    // 2. Attendance Rate Today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayObj = new Date(todayStr);
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: todayObj },
    });
    
    let presentCount = 0;
    attendanceRecords.forEach(a => {
      if (a.status === 'PRESENT' || a.status === 'LATE') presentCount++;
    });
    const totalMarked = attendanceRecords.length;
    const attendanceRateToday = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    // Previous month attendance rate (approx)
    const prevMonthAtt = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: { gte: lastMonthStart, lt: thisMonthStart } },
      select: { status: true }
    });
    const prevMonthTotalMarked = prevMonthAtt.length;
    let prevMonthPresent = 0;
    prevMonthAtt.forEach(a => { if (a.status === 'PRESENT' || a.status === 'LATE') prevMonthPresent++ });
    const prevMonthAttendanceRate = prevMonthTotalMarked > 0 ? Math.round((prevMonthPresent / prevMonthTotalMarked) * 100) : 0;

    // 3. Total Teachers
    const totalTeachers = await this.prisma.user.count({
      where: { school_id: schoolId, role: 'TEACHER', status: 'ACTIVE' },
    });
    const teachersOnLeave = await this.prisma.teacherLeaveRecord.count({
      where: {
        teacher: { school_id: schoolId },
        status: 'approved',
        start_date: { lte: todayObj },
        end_date: { gte: todayObj },
      },
    });

    // 4. Fee Collection Rate this month
    const feesThisMonth = await this.prisma.fee.findMany({
      where: { school_id: schoolId, due_date: { gte: thisMonthStart } },
    });
    const amountDue = feesThisMonth.reduce((acc, f) => acc + f.amount, 0);
    const amountCollected = feesThisMonth.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0);
    const feeCollectionRate = amountDue > 0 ? Math.round((amountCollected / amountDue) * 100) : 0;
    const pendingFeesAmount = amountDue - amountCollected;

    const feesLastMonth = await this.prisma.fee.findMany({
      where: { school_id: schoolId, due_date: { gte: lastMonthStart, lt: thisMonthStart } },
    });
    const prevAmountDue = feesLastMonth.reduce((acc, f) => acc + f.amount, 0);
    const prevAmountCollected = feesLastMonth.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0);
    const prevFeeCollectionRate = prevAmountDue > 0 ? Math.round((prevAmountCollected / prevAmountDue) * 100) : 0;

    // 5. Open Admissions
    const openAdmissions = await this.prisma.student.count({
      where: { school_id: schoolId, status: 'INACTIVE', exit_reason: null },
    });

    // 6. Syllabus Completion
    const topics = await this.prisma.subjectTopic.findMany({
      where: { syllabus: { subject: { school_id: schoolId } } },
    });
    const completedTopics = topics.filter(t => t.completion_date !== null).length;
    const syllabusCompletion = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

    // 7. Upcoming Exams
    const upcomingExams = await this.prisma.exam.findMany({
      where: { school_id: schoolId, start_date: { gte: new Date() } },
      orderBy: { start_date: 'asc' },
      take: 1,
    });
    const nextExam = upcomingExams[0] || null;

    const data = {
      totalStudents,
      prevTotalStudents: lastMonthStudents,
      newStudentsThisMonth: newStudents,
      attendanceRateToday,
      prevMonthAttendanceRate,
      totalTeachers,
      teachersOnLeaveToday: teachersOnLeave,
      feeCollectionRate,
      prevFeeCollectionRate,
      amountCollected,
      amountDue,
      pendingFeesAmount,
      openAdmissions,
      syllabusCompletion,
      nextExam: nextExam ? { name: nextExam.name, date: nextExam.start_date } : null,
    };

    await this.cacheManager.set(cacheKey, data, 300000); // 5 min TTL
    return data;
  }

  async getAlerts(schoolId: string, academicYearId: string) {
    const cacheKey = `dashboard:alerts:${schoolId}:${academicYearId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0,0,0,0);

    const alerts = [];

    // 1. ERROR: Fee module not configured
    const currentMonthStart = new Date(new Date().setDate(1));
    const feesThisMonth = await this.prisma.fee.findMany({
      where: { school_id: schoolId, due_date: { gte: currentMonthStart } },
    });
    const expectedFeeTotal = feesThisMonth.reduce((acc, f) => acc + f.amount, 0);
    if (expectedFeeTotal === 0) {
      alerts.push({
        severity: 'error',
        message: 'Fee structure is not configured. Students cannot be billed.',
        link: '/fees',
        count: 0
      });
    }

    // 2. ERROR: Classes with no attendance today
    const classes = await this.prisma.class.findMany({ where: { school_id: schoolId } });
    const markedClasses = await this.prisma.attendance.groupBy({
      by: ['student_id'],
      where: { school_id: schoolId, date: today },
    });
    // Find class_ids that have attendance records
    const studentsWithAttendance = await this.prisma.student.findMany({
      where: { id: { in: markedClasses.map(m => m.student_id) } },
      select: { class_id: true }
    });
    const markedClassIds = new Set(studentsWithAttendance.map(s => s.class_id));
    const unmarkedClassesToday = classes.filter(c => !markedClassIds.has(c.id)).length;
    
    if (unmarkedClassesToday > 0) {
      alerts.push({
        severity: 'error',
        message: `${unmarkedClassesToday} classes have not marked attendance today.`,
        link: '/attendance?status=unmarked&date=today',
        count: unmarkedClassesToday
      });
    }

    // 3. WARNING: Students below 75% attendance this term
    // (We will approximate to last 30 days for performance/demo purposes)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAtt = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: { gte: thirtyDaysAgo } }
    });
    const studentAttMap = new Map();
    recentAtt.forEach(a => {
      if (!studentAttMap.has(a.student_id)) studentAttMap.set(a.student_id, { total: 0, present: 0 });
      const s = studentAttMap.get(a.student_id);
      s.total++;
      if (a.status === 'PRESENT' || a.status === 'LATE') s.present++;
    });
    let atRiskStudents = 0;
    studentAttMap.forEach(s => {
      if (s.total > 0 && (s.present / s.total) < 0.75) atRiskStudents++;
    });
    if (atRiskStudents > 0) {
      alerts.push({
        severity: 'warning',
        message: `${atRiskStudents} students have attendance below 75% recently.`,
        link: '/students?filter=attendance-risk',
        count: atRiskStudents
      });
    }

    // 4. WARNING: Fee overdue > 30 days
    const thirtyDaysOverdue = new Date();
    thirtyDaysOverdue.setDate(thirtyDaysOverdue.getDate() - 30);
    const overdueCount = await this.prisma.fee.count({
      where: { school_id: schoolId, status: 'PENDING', due_date: { lt: thirtyDaysOverdue } },
    });
    if (overdueCount > 0) {
      alerts.push({
        severity: 'warning',
        message: `${overdueCount} students have fee dues overdue by more than 30 days.`,
        link: '/fees?status=overdue',
        count: overdueCount
      });
    }

    // 5. WARNING: Pending leave approvals
    const pendingLeaves = await this.prisma.teacherLeaveRecord.count({
      where: { teacher: { school_id: schoolId }, status: 'pending' },
    });
    if (pendingLeaves > 0) {
      alerts.push({
        severity: 'warning',
        message: `${pendingLeaves} leave requests pending approval.`,
        link: '/leaves?status=pending',
        count: pendingLeaves
      });
    }

    // 6. SUCCESS: All checks pass
    if (alerts.length === 0) {
      alerts.push({
        severity: 'success',
        message: 'Everything looks good today.',
        link: '',
        count: 0
      });
    } else {
      // Sort error > warning > info > success
      const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }

    const result = { alerts: alerts.slice(0, 3), total: alerts.length };
    await this.cacheManager.set(cacheKey, result, 120000); // 2 min TTL
    return result;
  }

  async getAttendanceTrend(schoolId: string, rangeMonths: number) {
    const cacheKey = `dashboard:attendance-trend:${schoolId}:${rangeMonths}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - rangeMonths);
    
    // Group attendance by month
    const records = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: { gte: startDate } },
      select: { date: true, status: true }
    });

    const monthsMap = new Map();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last N months with 0
    for(let i=rangeMonths-1; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: monthNames[d.getMonth()],
        present: 0,
        total: 0
      });
    }

    let hasEnoughData = false;
    records.forEach(r => {
      const key = `${r.date.getFullYear()}-${r.date.getMonth()}`;
      if (monthsMap.has(key)) {
        const m = monthsMap.get(key);
        m.total++;
        if (r.status === 'PRESENT' || r.status === 'LATE') m.present++;
        hasEnoughData = true;
      }
    });

    const months = Array.from(monthsMap.values()).map(m => ({
      label: m.label,
      rate: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0,
      count: m.total
    }));

    await this.cacheManager.set(cacheKey, { months, hasEnoughData, dataQualityNote: "Not enough attendance data to show trend. Check back after 30 days." }, 900000); // 15 min TTL
    return { months, hasEnoughData, dataQualityNote: "Not enough attendance data to show trend. Check back after 30 days." };
  }

  async getSubjectPerformance(schoolId: string, academicYearId: string) {
    const cacheKey = `dashboard:subject-performance:${schoolId}:${academicYearId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Find subjects and their recent exam marks
    const subjects = await this.prisma.subject.findMany({
      where: { school_id: schoolId },
      include: {
        marks: {
          include: { exam: true }
        },
        class_subjects: true
      }
    });

    const results = subjects.map(s => {
      const relevantMarks = s.marks.filter((m: any) => m.exam.academic_year_id === academicYearId);
      const totalMarks = relevantMarks.reduce((acc: number, m: any) => acc + m.marks_obtained, 0);
      const avgScore = relevantMarks.length > 0 ? Math.round(totalMarks / relevantMarks.length) : 0;
      
      const passes = relevantMarks.filter((m: any) => m.marks_obtained >= m.exam.max_marks * 0.4).length;
      const passRate = relevantMarks.length > 0 ? Math.round((passes / relevantMarks.length) * 100) : 0;

      return {
        name: s.name,
        avgScore,
        passRate,
        classCount: s.class_subjects.length
      };
    }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5); // top 5 subjects

    await this.cacheManager.set(cacheKey, { subjects: results }, 900000); // 15 min TTL
    return { subjects: results };
  }

  async getTodayAttendanceBreakdown(schoolId: string) {
    const cacheKey = `dashboard:today-attendance:${schoolId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0,0,0,0);

    const records = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: today },
      include: { student: { include: { class: true } } }
    });

    let present = 0, absent = 0, late = 0, leave = 0;
    const classMap = new Map();

    records.forEach((r: any) => {
      if (r.status === 'PRESENT') present++;
      if (r.status === 'ABSENT') absent++;
      if (r.status === 'LATE') late++;
      if (r.status === 'HALF_DAY') leave++;

      const classId = r.student.class_id;
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          className: r.student.class.name,
          present: 0, absent: 0, late: 0,
        });
      }
      const c = classMap.get(classId);
      if (r.status === 'PRESENT') c.present++;
      if (r.status === 'ABSENT') c.absent++;
      if (r.status === 'LATE') c.late++;
    });

    const result = {
      present, absent, late, leave, total: records.length,
      classBreakdown: Array.from(classMap.values())
    };

    await this.cacheManager.set(cacheKey, result, 180000); // 3 min TTL
    return result;
  }

  async getRecentActivity(schoolId: string, limit: number) {
    const cacheKey = `dashboard:recent-activity:${schoolId}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const activities = await this.prisma.auditLog.findMany({
      where: { school_id: schoolId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { user: { select: { first_name: true, last_name: true } } }
    });

    const result = {
      activities: activities.map(a => ({
        id: a.id,
        type: a.entity_type,
        description: a.action,
        actor: a.user ? `${a.user.first_name} ${a.user.last_name}` : 'System',
        createdAt: a.created_at,
        link: '#'
      }))
    };

    await this.cacheManager.set(cacheKey, result, 60000); // 1 min TTL
    return result;
  }

  async getUpcomingEvents(schoolId: string, limit: number) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const events = await this.prisma.event.findMany({
      where: { school_id: schoolId, event_date: { gte: today } },
      orderBy: { event_date: 'asc' },
      take: limit,
    });

    return {
      events: events.map(e => {
        const diffTime = Math.abs(e.event_date.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: e.id,
          name: e.title,
          date: e.event_date,
          type: e.event_type,
          daysUntil: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`
        };
      })
    };
  }

  async getFeeCollectionTrend(schoolId: string, rangeMonths: number) {
    const cacheKey = `dashboard:fee-trend:${schoolId}:${rangeMonths}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - rangeMonths);

    const fees = await this.prisma.fee.findMany({
      where: { school_id: schoolId, due_date: { gte: startDate } }
    });

    const monthsMap = new Map();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for(let i=rangeMonths-1; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: monthNames[d.getMonth()],
        expected: 0,
        collected: 0
      });
    }

    let hasEnoughData = false;
    fees.forEach(f => {
      const key = `${f.due_date.getFullYear()}-${f.due_date.getMonth()}`;
      if (monthsMap.has(key)) {
        const m = monthsMap.get(key);
        m.expected += f.amount;
        if (f.status === 'PAID') m.collected += f.amount;
        hasEnoughData = true; // At least one fee record found
      }
    });

    const months = Array.from(monthsMap.values());

    await this.cacheManager.set(cacheKey, { months, hasEnoughData, dataQualityNote: "Not enough fee data to establish a trend." }, 900000); // 15 min TTL
    return { months, hasEnoughData, dataQualityNote: "Not enough fee data to establish a trend." };
  }

  async getInsights(schoolId: string, academicYearId: string) {
    const cacheKey = `dashboard:insights:${schoolId}:${academicYearId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const insights = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // Rule 1 - Fee unconfigured
    const currentMonthStart = new Date(new Date().setDate(1));
    const feesThisMonth = await this.prisma.fee.findMany({
      where: { school_id: schoolId, due_date: { gte: currentMonthStart } },
    });
    const expectedFeeTotal = feesThisMonth.reduce((acc, f) => acc + f.amount, 0);
    if (expectedFeeTotal === 0) {
      insights.push({
        id: 'fee-setup', type: 'error', icon: 'ti-alert-triangle',
        title: 'Fee structure not configured',
        description: 'Students cannot be billed until fee heads are set up.',
        ctaLabel: 'Configure Fees', ctaLink: '/fees/setup'
      });
    }

    // Rule 2 - Attendance unmarked
    const classes = await this.prisma.class.findMany({ where: { school_id: schoolId } });
    const markedClasses = await this.prisma.attendance.groupBy({
      by: ['student_id'],
      where: { school_id: schoolId, date: today },
    });
    const studentsWithAttendance = await this.prisma.student.findMany({
      where: { id: { in: markedClasses.map(m => m.student_id) } },
      select: { class_id: true }
    });
    const markedClassIds = new Set(studentsWithAttendance.map(s => s.class_id));
    const unmarkedClassesToday = classes.filter(c => !markedClassIds.has(c.id)).length;
    if (unmarkedClassesToday > 0) {
      insights.push({
        id: 'attendance-unmarked', type: 'error', icon: 'ti-alert-triangle',
        title: `${unmarkedClassesToday} classes missing today's attendance`,
        description: `Attendance has not been recorded for ${unmarkedClassesToday} of ${classes.length} classes.`,
        ctaLabel: 'Mark Now', ctaLink: '/attendance?date=today&status=unmarked'
      });
    }

    // Rule 3 - Attendance at-risk students
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAtt = await this.prisma.attendance.findMany({
      where: { school_id: schoolId, date: { gte: thirtyDaysAgo } }
    });
    const studentAttMap = new Map();
    recentAtt.forEach(a => {
      if (!studentAttMap.has(a.student_id)) studentAttMap.set(a.student_id, { total: 0, present: 0 });
      const s = studentAttMap.get(a.student_id);
      s.total++;
      if (a.status === 'PRESENT' || a.status === 'LATE') s.present++;
    });
    let atRiskStudents = 0;
    studentAttMap.forEach(s => {
      if (s.total > 0 && (s.present / s.total) < 0.75) atRiskStudents++;
    });
    if (atRiskStudents > 0) {
      insights.push({
        id: 'attendance-risk', type: 'warning', icon: 'ti-alert-circle',
        title: `${atRiskStudents} students below 75% attendance`,
        description: 'These students may be at risk. Review and notify parents.',
        ctaLabel: 'View Students', ctaLink: '/students?filter=attendance-risk'
      });
    }

    // Rule 4 - Syllabus behind
    const topics = await this.prisma.subjectTopic.findMany({
      where: { syllabus: { subject: { school_id: schoolId } } },
    });
    const completedTopics = topics.filter(t => t.completion_date !== null).length;
    const syllabusCompletion = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;
    if (syllabusCompletion < 50) { // simplified condition for demo
      insights.push({
        id: 'syllabus-behind', type: 'warning', icon: 'ti-book',
        title: `Syllabus completion at ${syllabusCompletion}%`,
        description: 'Average completion is below target pace for this term.',
        ctaLabel: 'View Subjects', ctaLink: '/subjects'
      });
    }

    // Rule 5 - No exams scheduled
    const upcomingExams = await this.prisma.exam.findMany({
      where: { school_id: schoolId, start_date: { gte: today } },
      take: 1
    });
    if (upcomingExams.length === 0) {
      insights.push({
        id: 'exams-unscheduled', type: 'warning', icon: 'ti-calendar-event',
        title: 'No exams scheduled for the current term',
        description: 'There are no upcoming scheduled exams in the calendar.',
        ctaLabel: 'Schedule Exam', ctaLink: '/academic-years'
      });
    }

    // Rule 6 & 7 - Successes
    const amountDue = feesThisMonth.reduce((acc, f) => acc + f.amount, 0);
    const amountCollected = feesThisMonth.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0);
    const feeCollectionRate = amountDue > 0 ? Math.round((amountCollected / amountDue) * 100) : 0;
    
    if (feeCollectionRate > 90) {
      insights.push({
        id: 'fee-success', type: 'success', icon: 'ti-check',
        title: `Fee collection at ${feeCollectionRate}% this month`,
        description: 'Excellent. Keep up the good work.'
      });
    }

    if (unmarkedClassesToday === 0 && classes.length > 0) {
      insights.push({
        id: 'attendance-success', type: 'success', icon: 'ti-check',
        title: 'All classes have marked attendance today',
        description: 'Great job staying on top of attendance records.'
      });
    }

    // Sort order
    const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 };
    insights.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

    const result = { insights: insights.slice(0, 5) };
    await this.cacheManager.set(cacheKey, result, 180000); // 3 min TTL
    return result;
  }

  async getClassPerformance(schoolId: string, academicYearId: string) {
    const cacheKey = `dashboard:class-perf:${schoolId}:${academicYearId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const classes = await this.prisma.class.findMany({
      where: { school_id: schoolId },
      include: {
        students: {
          where: { status: 'ACTIVE' },
          include: {
            attendance: true,
            marks: true,
            fees: true
          }
        }
      }
    });

    const rows = classes.map(c => {
      let totalAtt = 0, presentAtt = 0;
      let totalMarksObj = 0, totalMarksMax = 0;
      let totalFeeDue = 0, totalFeePaid = 0;
      
      c.students.forEach(s => {
        s.attendance.forEach(a => {
          totalAtt++;
          if (a.status === 'PRESENT' || a.status === 'LATE') presentAtt++;
        });
        s.marks.forEach(m => {
          totalMarksObj += m.marks_obtained;
          // approximate max mark handling
          totalMarksMax += 100; // Assuming 100 for simplicity if exam isn't fully fetched
        });
        s.fees.forEach(f => {
          totalFeeDue += f.amount;
          if (f.status === 'PAID') totalFeePaid += f.amount;
        });
      });

      const avgAttendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
      const avgMarksPercent = totalMarksMax > 0 ? Math.round((totalMarksObj / totalMarksMax) * 100) : null;
      const feeCollectedPercent = totalFeeDue > 0 ? Math.round((totalFeePaid / totalFeeDue) * 100) : null;

      let attendanceStatus = 'good';
      if (avgAttendancePercent < 75) attendanceStatus = 'critical';
      else if (avgAttendancePercent < 85) attendanceStatus = 'warning';

      return {
        classId: c.id,
        className: c.name,
        studentCount: c.students.length,
        avgAttendancePercent,
        avgMarksPercent,
        feeCollectedPercent,
        attendanceStatus
      };
    });

    // Sort by class name numerically (extracting numbers)
    rows.sort((a, b) => {
      const numA = parseInt(a.className.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.className.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    await this.cacheManager.set(cacheKey, { classes: rows }, 600000); // 10 min TTL
    return { classes: rows };
  }
}
