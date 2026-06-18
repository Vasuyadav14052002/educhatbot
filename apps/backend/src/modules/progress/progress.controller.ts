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
import { ProgressService } from './progress.service';
import { BulkProgressDto } from './dto/progress.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Student Daily Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'progress', version: '1' })
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk save/update daily progress for a class' })
  bulkUpdate(
    @Body() dto: BulkProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.bulkUpdateProgress(dto, user.sub, user.school_id!);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get all students progress in a class for a date and subject' })
  getClassProgress(
    @Param('classId') classId: string,
    @Query('date') date: string,
    @Query('subjectId') subjectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getClassProgress(classId, date, subjectId, user.school_id!);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get overall school progress logs analytics' })
  getAnalytics(@CurrentUser() user: JwtPayload) {
    return this.progressService.getProgressAnalytics(user.school_id!);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get progress history log list for a student' })
  getStudentHistory(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getStudentProgressLogs(studentId, user.school_id!);
  }
}
