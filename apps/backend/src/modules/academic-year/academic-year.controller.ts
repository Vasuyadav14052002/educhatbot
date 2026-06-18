import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AcademicYearService } from './academic-year.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@Controller({ path: 'academic-years', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.academicYearService.findAll(user.school_id!);
  }

  @Post('promote')
  promoteStudents(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.academicYearService.promoteStudents(user.school_id!, user.sub, body);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.academicYearService.findOne(user.school_id!, id);
  }

  @Get(':id/promotions')
  getPromotions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.academicYearService.getPromotions(user.school_id!);
  }

  @Patch(':id/activate')
  activateYear(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.academicYearService.activateYear(user.school_id!, id);
  }

  @Patch(':id/archive')
  archiveYear(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.academicYearService.archiveYear(user.school_id!, id);
  }

  @Post(':id/close')
  closeYear(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.academicYearService.closeYear(user.school_id!, id, user.sub, body);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TERMS
  // ─────────────────────────────────────────────────────────────────────────────
  @Post(':id/terms')
  createTerm(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.academicYearService.createTerm(user.school_id!, id, body);
  }
  @Patch(':id/terms/:termId')
  updateTerm(@CurrentUser() user: JwtPayload, @Param('termId') termId: string, @Body() body: any) {
    return this.academicYearService.updateTerm(user.school_id!, termId, body);
  }
  @Delete(':id/terms/:termId')
  deleteTerm(@CurrentUser() user: JwtPayload, @Param('termId') termId: string) {
    return this.academicYearService.deleteTerm(user.school_id!, termId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────────────────────────
  @Post(':id/events')
  createEvent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.academicYearService.createEvent(user.school_id!, id, user.sub, body);
  }
  @Patch(':id/events/:eventId')
  updateEvent(@CurrentUser() user: JwtPayload, @Param('eventId') eventId: string, @Body() body: any) {
    return this.academicYearService.updateEvent(user.school_id!, eventId, body);
  }
  @Delete(':id/events/:eventId')
  deleteEvent(@CurrentUser() user: JwtPayload, @Param('eventId') eventId: string) {
    return this.academicYearService.deleteEvent(user.school_id!, eventId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  @Post(':id/achievements')
  createAchievement(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.academicYearService.createAchievement(user.school_id!, id, body);
  }
  @Patch(':id/achievements/:achievementId')
  updateAchievement(@CurrentUser() user: JwtPayload, @Param('achievementId') achievementId: string, @Body() body: any) {
    return this.academicYearService.updateAchievement(user.school_id!, achievementId, body);
  }
  @Delete(':id/achievements/:achievementId')
  deleteAchievement(@CurrentUser() user: JwtPayload, @Param('achievementId') achievementId: string) {
    return this.academicYearService.deleteAchievement(user.school_id!, achievementId);
  }
}
