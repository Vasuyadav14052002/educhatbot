import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@Controller({ path: 'subjects', version: '1' })
@UseGuards(JwtAuthGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.subjectService.findAll(user.school_id!);
  }

  @Get(':id/dashboard')
  getDashboard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.subjectService.getDashboard(user.school_id!, id);
  }

  @Get(':id/syllabus')
  getSyllabus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.subjectService.getSyllabus(user.school_id!, id);
  }

  @Get(':id/resources')
  getResources(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.subjectService.getResources(user.school_id!, id);
  }

  @Get(':id/activity')
  getActivity(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.subjectService.getActivity(user.school_id!, id);
  }
}
