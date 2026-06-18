import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto, GetAttendanceQueryDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('bulk')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk mark attendance for a class on a date' })
  bulkMark(@Body() dto: BulkAttendanceDto, @CurrentUser() user: JwtPayload) {
    return this.attendanceService.bulkMarkAttendance(dto, user.sub, user.school_id!);
  }

  @Get('student/:studentId')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PARENT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student attendance history' })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: GetAttendanceQueryDto,
  ) {
    return this.attendanceService.getStudentAttendance(
      studentId,
      user.school_id!,
      query,
    );
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all students attendance for a class on a specific date' })
  getClassAttendance(
    @Param('classId') classId: string,
    @Query('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.getClassAttendance(classId, date, user.school_id!);
  }

  @Get('calendar/:studentId')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PARENT, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get monthly attendance calendar for student' })
  getCalendar(
    @Param('studentId') studentId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.getAttendanceCalendar(
      studentId,
      user.school_id!,
      +month,
      +year,
    );
  }
}
