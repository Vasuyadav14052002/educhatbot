import { Controller, Get, Post, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Parent Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT, UserRole.STUDENT)
@Controller({ path: 'parent', version: '1' })
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('linked-students')
  @ApiOperation({ summary: 'Get linked students list for dropdown switcher (or self for student)' })
  getLinkedStudents(@CurrentUser() user: JwtPayload) {
    return this.parentService.getLinkedStudents(user.sub, user.role);
  }

  @Post('verify-student-id')
  @ApiOperation({ summary: 'Verify a student by their student code and confirm parent access' })
  verifyStudentId(
    @Body('studentCode') studentCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!studentCode || !studentCode.trim()) {
      throw new ForbiddenException('Student ID is required.');
    }
    return this.parentService.verifyStudentByCode(user.sub, studentCode.trim().toUpperCase());
  }

  @Get('student-profile')
  @ApiOperation({ summary: 'Get student profile including class and school info' })
  getStudentProfile(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getStudentProfile(user.sub, studentId, user.role);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get student attendance stats and logs' })
  getAttendance(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getAttendance(user.sub, studentId, user.role, month ? +month : undefined, year ? +year : undefined);
  }

  @Get('marks')
  @ApiOperation({ summary: 'Get student academic marks' })
  getMarks(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getMarks(user.sub, studentId, user.role);
  }

  @Get('homework')
  @ApiOperation({ summary: 'Get student homework and assignments status' })
  getHomework(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getHomework(user.sub, studentId, user.role);
  }

  @Get('fees')
  @ApiOperation({ summary: 'Get student fee invoice and logs' })
  getFees(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getFees(user.sub, studentId, user.role);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Get school announcements' })
  getAnnouncements(@CurrentUser() user: JwtPayload) {
    return this.parentService.getAnnouncements(user.school_id!);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get student chronological activity timeline' })
  getTimeline(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getTimeline(user.sub, studentId, user.role);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get chat threads with class teachers' })
  getMessages(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getMessages(user.sub, studentId, user.role);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send message to teacher' })
  sendMessage(
    @Query('studentId') studentId: string,
    @Body('teacherId') teacherId: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    if (!teacherId || !content) {
      throw new ForbiddenException('Teacher ID and message content are required.');
    }
    return this.parentService.sendMessage(user.sub, studentId, user.role, teacherId, content);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get student report card list' })
  getReports(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getReports(user.sub, studentId, user.role);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get student achievements' })
  getAchievements(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getAchievements(user.sub, studentId, user.role);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get student badges' })
  getBadges(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getBadges(user.sub, studentId, user.role);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get student rankings' })
  getRankings(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getRankings(user.sub, studentId, user.role);
  }

  @Get('remarks')
  @ApiOperation({ summary: 'Get teacher remarks' })
  getRemarks(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getRemarks(user.sub, studentId, user.role);
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Get student gallery photos' })
  getGallery(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getGallery(user.sub, studentId, user.role);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get student daily progress logs' })
  getProgress(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getProgress(user.sub, studentId, user.role);
  }

  @Get('ai-insights')
  @ApiOperation({ summary: 'Get student growth summary generated by AI' })
  getAiInsights(
    @Query('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateQueryParam(studentId, user.role);
    return this.parentService.getAiInsights(user.sub, studentId, user.role);
  }

  private validateQueryParam(studentId: string, role: string) {
    if (role === 'STUDENT') return; // studentId query param is ignored for students
    if (!studentId) {
      throw new ForbiddenException('Student ID is required as a query parameter.');
    }
  }
}
