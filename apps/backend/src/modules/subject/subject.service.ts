import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { school_id: schoolId },
      include: {
        class_subjects: true,
        teacher_subjects: true,
      },
    }) as any[];

    return subjects.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      description: sub.description,
      color: sub.color,
      classes: new Set(sub.class_subjects.map((cs: any) => cs.class_id)).size,
      teachers: new Set(sub.teacher_subjects.map((ts: any) => ts.teacher_id)).size,
    }));
  }

  async getDashboard(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, school_id: schoolId },
      include: {
        class_subjects: {
          include: {
            class: {
              include: {
                students: {
                  where: { status: 'ACTIVE' },
                  include: {
                    attendance: true,
                    marks: { where: { subject_id: subjectId } },
                    homework_submissions: {
                      include: { homework: true }
                    },
                    progress: { where: { subject_id: subjectId } }
                  }
                }
              }
            }
          }
        },
        teacher_subjects: {
          include: {
            subject: true
          }
        }
      }
    }) as any;

    if (!subject) throw new NotFoundException('Subject not found');

    const teacherIds = subject.class_subjects.map((cs: any) => cs.teacher_id).filter((id: any) => id) as string[];
    const uniqueTeacherIds = [...new Set(teacherIds)];
    const teachers = await this.prisma.user.findMany({
      where: { id: { in: uniqueTeacherIds } },
      include: { teacher_profile: true }
    });

    const topics = await (this.prisma as any).subjectTopic.findMany({
      where: { syllabus: { subject_id: subjectId } }
    });

    let totalStudents = 0;
    let totalClasses = subject.class_subjects.length;
    let allMarks: number[] = [];
    let allAttendance: number[] = [];
    let hwAssigned = 0;
    let hwCompleted = 0;

    const classMapping: any[] = [];
    const studentPerformance: any[] = [];
    const gradeDistribution: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0 };
    
    // Process Data
    for (const cs of subject.class_subjects) {
      const cls = cs.class;
      const students = cls.students;
      totalStudents += students.length;

      let classMarksTotal = 0;
      let classMarksCount = 0;
      let classAttTotal = 0;
      let classAttCount = 0;

      for (const st of students) {
        // Marks
        const stMarks = st.marks.map((m: any) => m.percentage || 0);
        allMarks.push(...stMarks);
        const stAvgMark = stMarks.length ? stMarks.reduce((a: number, b: number) => a + b, 0) / stMarks.length : 0;
        
        if (stMarks.length) {
          classMarksTotal += stAvgMark;
          classMarksCount++;
        }

        for (const m of st.marks) {
          if (m.grade && gradeDistribution[m.grade] !== undefined) {
            gradeDistribution[m.grade]++;
          }
        }

        // Attendance
        const stAtt = st.attendance;
        const presentDays = stAtt.filter((a: any) => a.status === 'PRESENT').length;
        const stAttPercent = stAtt.length ? (presentDays / stAtt.length) * 100 : 100;
        allAttendance.push(stAttPercent);
        
        classAttTotal += stAttPercent;
        classAttCount++;

        // Homework - Filter manually since we couldn't filter relation object inside nested include
        const hws = st.homework_submissions.filter((hs: any) => hs.homework && hs.homework.subject_id === subjectId);
        const completedHws = hws.filter((hs: any) => hs.status === 'COMPLETED').length;
        hwAssigned += hws.length;
        hwCompleted += completedHws;

        // Progress score
        const progScores = st.progress.map((p: any) => p.performance_score);
        const avgProg = progScores.length ? progScores.reduce((a: number, b: number) => a + b, 0) / progScores.length : 0;

        studentPerformance.push({
          id: st.id,
          student_code: st.student_code,
          name: `${st.first_name} ${st.last_name}`,
          className: cls.name,
          attendance: Math.round(stAttPercent),
          averageMarks: Math.round(stAvgMark),
          performanceScore: Math.round(avgProg),
          homeworkCompletion: hws.length ? Math.round((completedHws/hws.length)*100) : 100,
          status: 'Active'
        });
      }

      classMapping.push({
        class_id: cls.id,
        name: cls.name,
        students: students.length,
        teacher: teachers.find(t => t.id === cs.teacher_id)?.first_name || 'Unassigned',
        averageMarks: classMarksCount ? Math.round(classMarksTotal / classMarksCount) : 0,
        attendance: classAttCount ? Math.round(classAttTotal / classAttCount) : 0,
      });
    }

    const avgSubjectScore = allMarks.length ? allMarks.reduce((a,b)=>a+b,0)/allMarks.length : 0;
    const passPercentage = allMarks.length ? (allMarks.filter(m => m >= 50).length / allMarks.length) * 100 : 0;
    const hwCompletionRate = hwAssigned ? (hwCompleted / hwAssigned) * 100 : 0;
    const avgAttendance = allAttendance.length ? allAttendance.reduce((a,b)=>a+b,0)/allAttendance.length : 0;

    const highestMarks = allMarks.length ? Math.max(...allMarks) : 0;
    const lowestMarks = allMarks.length ? Math.min(...allMarks) : 0;

    return {
      overview: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        department: 'General',
        status: 'Active'
      },
      kpis: {
        totalClasses,
        totalStudents,
        assignedTeachers: uniqueTeacherIds.length,
        averageSubjectScore: Math.round(avgSubjectScore),
        passPercentage: Math.round(passPercentage),
        homeworkCompletionRate: Math.round(hwCompletionRate)
      },
      teachers: teachers.map(t => {
        const tTopics = topics.filter((top: any) => top.teacher_id === t.id);
        let syllabusCompleted = 0;
        if (tTopics.length > 0) {
          const completed = tTopics.filter((top: any) => top.status === 'Completed').length;
          syllabusCompleted = Math.round((completed / tTopics.length) * 100);
        }
        
        const profile = (t as any).teacher_profile;
        return {
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
          photoUrl: profile?.photo_url || t.avatar_url,
          qualification: profile?.qualification || 'Not specified',
          experienceYears: profile?.experience_years || 0,
          syllabusCompleted
        };
      }),
      classMapping,
      studentPerformance,
      marksAnalytics: {
        averageMarks: Math.round(avgSubjectScore),
        highestMarks: Math.round(highestMarks),
        lowestMarks: Math.round(lowestMarks),
        passRate: Math.round(passPercentage),
        gradeDistribution
      },
      attendanceAnalytics: {
        attendancePercentage: Math.round(avgAttendance)
      },
      insights: [
        `${subject.name} performance has stabilized around ${Math.round(avgSubjectScore)}%.`,
        `${gradeDistribution['A+'] || 0} students achieved A+ grade.`,
        `Attendance remains strong at ${Math.round(avgAttendance)}%.`
      ]
    };
  }

  async getSyllabus(schoolId: string, subjectId: string) {
    const syllabi = await (this.prisma as any).subjectSyllabus.findMany({
      where: { school_id: schoolId, subject_id: subjectId },
      include: {
        topics: {
          include: { teacher: true, class: true }
        }
      },
      orderBy: { order_index: 'asc' }
    });
    return syllabi;
  }

  async getResources(schoolId: string, subjectId: string) {
    return (this.prisma as any).subjectResource.findMany({
      where: { school_id: schoolId, subject_id: subjectId },
      orderBy: { created_at: 'desc' },
      include: { uploader: true }
    });
  }

  async getActivity(schoolId: string, subjectId: string) {
    return (this.prisma as any).teacherActivity.findMany({
      where: { school_id: schoolId, subject_id: subjectId },
      orderBy: { created_at: 'desc' },
      include: { teacher: true }
    });
  }
}
