import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HomeworkStatus } from '@prisma/client';

@Injectable()
export class StudentRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // Achievements CRUD
  async createAchievement(schoolId: string, studentId: string, title: string, description: string, date: string, certificateUrl?: string) {
    return this.prisma.achievement.create({
      data: {
        school_id: schoolId,
        student_id: studentId,
        title,
        description,
        date: new Date(date),
        certificate_url: certificateUrl,
      },
    });
  }

  async deleteAchievement(id: string) {
    return this.prisma.achievement.delete({ where: { id } });
  }

  // Badges CRUD
  async awardBadge(schoolId: string, studentId: string, badgeName: string, badgeIcon: string, awardedDate: string) {
    return this.prisma.badge.create({
      data: {
        school_id: schoolId,
        student_id: studentId,
        badge_name: badgeName,
        badge_icon: badgeIcon,
        description: '',
        awarded_date: new Date(awardedDate),
      },
    });
  }

  async revokeBadge(id: string) {
    return this.prisma.badge.delete({ where: { id } });
  }

  // Cultural Activities CRUD
  async createCulturalActivity(schoolId: string, studentId: string, name: string, description: string, date: string, photos: string[]) {
    return this.prisma.culturalActivity.create({
      data: {
        school_id: schoolId,
        student_id: studentId,
        activity_name: name,
        description,
        event_date: new Date(date),
        photos,
      },
    });
  }

  async deleteCulturalActivity(id: string) {
    return this.prisma.culturalActivity.delete({ where: { id } });
  }

  // Teacher Remarks CRUD
  async createRemark(studentId: string, teacherId: string, remark: string, category: string) {
    return this.prisma.teacherRemark.create({
      data: {
        student_id: studentId,
        teacher_id: teacherId,
        remark,
        category,
      },
    });
  }

  async deleteRemark(id: string) {
    return this.prisma.teacherRemark.delete({ where: { id } });
  }

  // Homework CRUD
  async createHomework(schoolId: string, classId: string, subjectId: string, title: string, description: string, assignedDate: string, dueDate: string) {
    const homework = await this.prisma.homework.create({
      data: {
        school_id: schoolId,
        class_id: classId,
        subject_id: subjectId,
        title,
        description,
        assigned_date: new Date(assignedDate),
        due_date: new Date(dueDate),
      },
    });

    // Automatically create empty/pending submissions for all active students in the class
    const students = await this.prisma.student.findMany({
      where: { class_id: classId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (students.length > 0) {
      await this.prisma.homeworkSubmission.createMany({
        data: students.map((s) => ({
          homework_id: homework.id,
          student_id: s.id,
          status: HomeworkStatus.NOT_SUBMITTED,
        })),
        skipDuplicates: true,
      });
    }

    return homework;
  }

  async getHomeworkByClass(classId: string) {
    return this.prisma.homework.findMany({
      where: { class_id: classId },
      include: {
        subject: true,
        submissions: {
          include: {
            student: { select: { first_name: true, last_name: true, student_code: true } },
          },
        },
      },
      orderBy: { due_date: 'desc' },
    });
  }

  async markHomeworkSubmission(submissionId: string, status: HomeworkStatus, remarks?: string) {
    return this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        remarks,
        submitted_at: status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // Fees CRUD
  async createFee(schoolId: string, studentId: string, title: string, amount: number, dueDate: string) {
    return this.prisma.fee.create({
      data: {
        school_id: schoolId,
        student_id: studentId,
        title,
        amount,
        status: 'PENDING',
        due_date: new Date(dueDate),
      },
    });
  }

  async recordFeePayment(feeId: string, receiptNo: string) {
    return this.prisma.fee.update({
      where: { id: feeId },
      data: {
        status: 'PAID',
        paid_at: new Date(),
        receipt_no: receiptNo,
      },
    });
  }

  // Announcements CRUD
  async createAnnouncement(schoolId: string, title: string, content: string, category: string) {
    return this.prisma.announcement.create({
      data: {
        school_id: schoolId,
        title,
        content,
        category,
      },
    });
  }

  // Staff-side Messaging
  async getStaffMessages(teacherId: string, parentId: string) {
    const parent = await this.prisma.user.findFirst({
      where: { id: parentId, role: 'PARENT' },
      select: { id: true, first_name: true, last_name: true, email: true },
    });
    if (!parent) throw new NotFoundException('Parent user not found');

    const chat = await this.prisma.message.findMany({
      where: {
        OR: [
          { sender_id: teacherId, receiver_id: parentId },
          { sender_id: parentId, receiver_id: teacherId },
        ],
      },
      orderBy: { created_at: 'asc' },
    });

    return {
      parent,
      messages: chat,
    };
  }

  async sendStaffMessage(schoolId: string, teacherId: string, parentId: string, content: string) {
    return this.prisma.message.create({
      data: {
        school_id: schoolId,
        sender_id: teacherId,
        receiver_id: parentId,
        content,
      },
    });
  }
}
