import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MarksService } from './marks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Marks Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'marks', version: '1' })
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Post()
  @ApiOperation({ summary: 'Bulk upload marks for students' })
  enterMarks(
    @Body('exam_id') examId: string,
    @Body('subject_id') subjectId: string,
    @Body('academic_year_id') academicYearId: string,
    @Body('entries') entries: { student_id: string; score: number; max_score: number; remarks?: string }[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.marksService.enterMarks(user.school_id!, examId, subjectId, academicYearId, user.sub, entries);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get marks for a student' })
  getStudentMarks(@Param('studentId') studentId: string, @CurrentUser() user: JwtPayload) {
    return this.marksService.getStudentMarks(studentId, user.school_id!);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get roster list of class student scores for sheet entry' })
  getClassMarks(
    @Param('classId') classId: string,
    @Query('examId') examId: string,
    @Query('subjectId') subjectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.marksService.getClassMarks(classId, examId, subjectId, user.school_id!);
  }

  @Get('meta/classes')
  @ApiOperation({ summary: 'Get classes list' })
  getClasses(@CurrentUser() user: JwtPayload) {
    return this.marksService.getClasses(user.school_id!);
  }

  @Get('meta/subjects')
  @ApiOperation({ summary: 'Get subjects list' })
  getSubjects(@CurrentUser() user: JwtPayload) {
    return this.marksService.getSubjects(user.school_id!);
  }

  @Get('meta/exams')
  @ApiOperation({ summary: 'Get exams list' })
  getExams(@CurrentUser() user: JwtPayload) {
    return this.marksService.getExams(user.school_id!);
  }

  @Get('meta/academic-years')
  @ApiOperation({ summary: 'Get academic years list' })
  getAcademicYears(@CurrentUser() user: JwtPayload) {
    return this.marksService.getAcademicYears(user.school_id!);
  }
}
