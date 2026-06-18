import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MarksService {
  constructor(private readonly prisma: PrismaService) {}

  // Enter/Upsert marks for multiple students (bulk)
  async enterMarks(
    schoolId: string,
    examId: string,
    subjectId: string,
    academicYearId: string,
    enteredBy: string,
    entries: { student_id: string; score: number; max_score: number; remarks?: string }[],
  ) {
    const results = [];

    for (const entry of entries) {
      const percentage = entry.max_score > 0 ? (entry.score / entry.max_score) * 100 : 0;
      const grade = this.percentageToGrade(percentage);

      const record = await this.prisma.mark.upsert({
        where: {
          student_id_exam_id_subject_id: {
            student_id: entry.student_id,
            exam_id: examId,
            subject_id: subjectId,
          },
        },
        update: {
          score: entry.score,
          max_score: entry.max_score,
          percentage,
          grade,
          remarks: entry.remarks,
          entered_by: enteredBy,
        },
        create: {
          school_id: schoolId,
          student_id: entry.student_id,
          exam_id: examId,
          subject_id: subjectId,
          academic_year_id: academicYearId,
          score: entry.score,
          max_score: entry.max_score,
          percentage,
          grade,
          remarks: entry.remarks,
          entered_by: enteredBy,
        },
      });
      results.push(record);
    }

    return results;
  }

  // Get marks for a student
  async getStudentMarks(studentId: string, schoolId: string) {
    return this.prisma.mark.findMany({
      where: { student_id: studentId, school_id: schoolId },
      include: {
        subject: true,
        exam: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Get marks for a class roster (useful for spreadsheet marks entry view)
  async getClassMarks(classId: string, examId: string, subjectId: string, schoolId: string) {
    const students = await this.prisma.student.findMany({
      where: { class_id: classId, school_id: schoolId, status: 'ACTIVE' },
      include: {
        marks: {
          where: { exam_id: examId, subject_id: subjectId },
          take: 1,
        },
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    return students.map((s) => ({
      student_id: s.id,
      student_code: s.student_code,
      name: `${s.first_name} ${s.last_name}`,
      photo_url: s.photo_url,
      mark: s.marks[0] || null,
      score: s.marks[0]?.score ?? null,
      max_score: s.marks[0]?.max_score ?? 100,
      remarks: s.marks[0]?.remarks ?? '',
    }));
  }

  async getClasses(schoolId: string) {
    return this.prisma.class.findMany({
      where: { school_id: schoolId },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    });
  }

  async getSubjects(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { school_id: schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async getExams(schoolId: string) {
    return this.prisma.exam.findMany({
      where: { school_id: schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async getAcademicYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { school_id: schoolId },
      orderBy: { name: 'desc' },
    });
  }

  private percentageToGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }
}
