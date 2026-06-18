import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, HomeworkStatus } from '@prisma/client';
import { StudentRecordsService } from './student-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Student Records (Staff)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'student-records', version: '1' })
export class StudentRecordsController {
  constructor(private readonly studentRecordsService: StudentRecordsService) {}

  @Post('achievements')
  @ApiOperation({ summary: 'Create student achievement record' })
  createAchievement(
    @Body('student_id') studentId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('date') date: string,
    @Body('certificate_url') certificateUrl: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createAchievement(user.school_id!, studentId, title, description, date, certificateUrl);
  }

  @Delete('achievements/:id')
  @ApiOperation({ summary: 'Delete achievement record' })
  deleteAchievement(@Param('id') id: string) {
    return this.studentRecordsService.deleteAchievement(id);
  }

  @Post('badges')
  @ApiOperation({ summary: 'Award badge to student' })
  awardBadge(
    @Body('student_id') studentId: string,
    @Body('badge_name') badgeName: string,
    @Body('badge_icon') badgeIcon: string,
    @Body('awarded_date') awardedDate: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.awardBadge(user.school_id!, studentId, badgeName, badgeIcon, awardedDate);
  }

  @Delete('badges/:id')
  @ApiOperation({ summary: 'Revoke badge' })
  revokeBadge(@Param('id') id: string) {
    return this.studentRecordsService.revokeBadge(id);
  }

  @Post('cultural-activities')
  @ApiOperation({ summary: 'Log student cultural activity participation' })
  createCulturalActivity(
    @Body('student_id') studentId: string,
    @Body('activity_name') name: string,
    @Body('description') description: string,
    @Body('event_date') date: string,
    @Body('photos') photos: string[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createCulturalActivity(user.school_id!, studentId, name, description, date, photos || []);
  }

  @Delete('cultural-activities/:id')
  @ApiOperation({ summary: 'Delete cultural activity record' })
  deleteCulturalActivity(@Param('id') id: string) {
    return this.studentRecordsService.deleteCulturalActivity(id);
  }

  @Post('remarks')
  @ApiOperation({ summary: 'Add teacher observation remark' })
  createRemark(
    @Body('student_id') studentId: string,
    @Body('remark') remark: string,
    @Body('category') category: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createRemark(studentId, user.sub, remark, category);
  }

  @Delete('remarks/:id')
  @ApiOperation({ summary: 'Delete teacher remark' })
  deleteRemark(@Param('id') id: string) {
    return this.studentRecordsService.deleteRemark(id);
  }

  @Post('homeworks')
  @ApiOperation({ summary: 'Post homework for a class' })
  createHomework(
    @Body('class_id') classId: string,
    @Body('subject_id') subjectId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('assigned_date') assignedDate: string,
    @Body('due_date') dueDate: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createHomework(user.school_id!, classId, subjectId, title, description, assignedDate, dueDate);
  }

  @Get('homeworks/class/:classId')
  @ApiOperation({ summary: 'Get homeworks and submissions for a class' })
  getHomeworkByClass(@Param('classId') classId: string) {
    return this.studentRecordsService.getHomeworkByClass(classId);
  }

  @Patch('homeworks/submissions/:id')
  @ApiOperation({ summary: 'Grade homework submission status' })
  markHomeworkSubmission(
    @Param('id') id: string,
    @Body('status') status: HomeworkStatus,
    @Body('remarks') remarks?: string,
  ) {
    return this.studentRecordsService.markHomeworkSubmission(id, status, remarks);
  }

  @Post('fees')
  @ApiOperation({ summary: 'Create fee invoice for student' })
  createFee(
    @Body('student_id') studentId: string,
    @Body('title') title: string,
    @Body('amount') amount: number,
    @Body('due_date') dueDate: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createFee(user.school_id!, studentId, title, +amount, dueDate);
  }

  @Patch('fees/:id/pay')
  @ApiOperation({ summary: 'Record fee invoice payment status' })
  recordFeePayment(
    @Param('id') id: string,
    @Body('receipt_no') receiptNo: string,
  ) {
    return this.studentRecordsService.recordFeePayment(id, receiptNo);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Post school announcement' })
  createAnnouncement(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('category') category: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.createAnnouncement(user.school_id!, title, content, category);
  }

  @Get('messages/parent/:parentId')
  @ApiOperation({ summary: 'Get messaging thread with a parent' })
  getStaffMessages(
    @Param('parentId') parentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.getStaffMessages(user.sub, parentId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send message to parent' })
  sendStaffMessage(
    @Body('parent_id') parentId: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentRecordsService.sendStaffMessage(user.school_id!, user.sub, parentId, content);
  }
}
