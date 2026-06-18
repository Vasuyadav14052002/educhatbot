import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TeacherProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(schoolId: string, teacherId: string, subjectId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { teacher_id: teacherId }
    });

    if (!profile) throw new NotFoundException('Teacher profile not found');

    const user = await this.prisma.user.findUnique({
      where: { id: teacherId, school_id: schoolId }
    });

    if (!user) throw new NotFoundException('Teacher not found in this school');

    const skills = await this.prisma.teacherSkill.findMany({
      where: { teacher_id: teacherId }
    });

    const awards = await this.prisma.teacherAward.findMany({
      where: { teacher_id: teacherId }
    });

    // Leave stats
    const leaves = await this.prisma.teacherLeaveRecord.findMany({
      where: { teacher_id: teacherId }
    });
    const leavesTaken = leaves.filter(l => l.status === 'approved').length;

    // Syllabus Progress
    const topics = await this.prisma.subjectTopic.findMany({
      where: { teacher_id: teacherId, syllabus: { subject_id: subjectId } }
    });
    
    let syllabusCompleted = 0;
    if (topics.length > 0) {
      const completed = topics.filter(t => t.status === 'Completed').length;
      syllabusCompleted = Math.round((completed / topics.length) * 100);
    }

    // Classes Assigned
    const classesAssigned = await this.prisma.classSubject.findMany({
      where: { teacher_id: teacherId, subject_id: subjectId },
      include: { class: true }
    });

    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      photoUrl: profile.photo_url || user.avatar_url,
      bio: profile.bio,
      qualification: profile.qualification,
      experienceYears: profile.experience_years,
      joinedDate: profile.joined_date,
      skills,
      awards,
      leavesTaken,
      syllabusCompleted,
      classesAssigned: classesAssigned.map(c => ({ id: c.class.id, name: c.class.name }))
    };
  }

  async updateProfile(schoolId: string, teacherId: string, data: any) {
    const existing = await this.prisma.teacherProfile.findUnique({ where: { teacher_id: teacherId } });
    if (!existing) throw new NotFoundException('Teacher profile not found');

    // Simple update logic for demo purposes
    return this.prisma.teacherProfile.update({
      where: { teacher_id: teacherId },
      data: {
        bio: data.bio,
        qualification: data.qualification,
        photo_url: data.photoUrl,
      }
    });
  }
}
