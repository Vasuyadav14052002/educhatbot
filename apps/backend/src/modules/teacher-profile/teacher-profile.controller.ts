import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { TeacherProfileService } from './teacher-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@Controller({ path: 'teachers', version: '1' })
@UseGuards(JwtAuthGuard)
export class TeacherProfileController {
  constructor(private readonly teacherProfileService: TeacherProfileService) {}

  @Get(':id/profile')
  getProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id') teacherId: string,
    @Query('subjectId') subjectId: string
  ) {
    return this.teacherProfileService.getProfile(user.school_id!, teacherId, subjectId);
  }

  @Patch(':id/profile')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id') teacherId: string,
    @Body() data: any
  ) {
    return this.teacherProfileService.updateProfile(user.school_id!, teacherId, data);
  }
}
