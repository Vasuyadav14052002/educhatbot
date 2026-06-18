import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ParticipationService } from './participation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Participation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'participation', version: '1' })
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview metrics' })
  async getOverview(@Req() req: any) {
    const schoolId = req.user.school_id;
    // For demo, we fetch current academic year inline
    const currentYear = await this.participationService['prisma'].academicYear.findFirst({
      where: { school_id: schoolId, is_current: true }
    });
    return this.participationService.getOverview(schoolId, currentYear?.id || '');
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  async getAnalytics(@Req() req: any) {
    const schoolId = req.user.school_id;
    const currentYear = await this.participationService['prisma'].academicYear.findFirst({
      where: { school_id: schoolId, is_current: true }
    });
    return this.participationService.getAnalytics(schoolId, currentYear?.id || '');
  }

  @Get('records')
  @ApiOperation({ summary: 'Get participation records' })
  async getRecords(@Req() req: any) {
    const schoolId = req.user.school_id;
    const currentYear = await this.participationService['prisma'].academicYear.findFirst({
      where: { school_id: schoolId, is_current: true }
    });
    return this.participationService.getParticipations(schoolId, currentYear?.id || '');
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get achievements' })
  async getAchievements(@Req() req: any) {
    return this.participationService.getAchievements(req.user.school_id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get badges' })
  async getBadges(@Req() req: any) {
    return this.participationService.getBadges(req.user.school_id);
  }

  @Get('student/:id')
  @ApiOperation({ summary: 'Get student activity profile' })
  async getStudentProfile(@Param('id') id: string) {
    return this.participationService.getStudentProfile(id);
  }

  @Post('record')
  @ApiOperation({ summary: 'Add a participation record' })
  async addParticipation(@Req() req: any, @Body() data: any) {
    return this.participationService.addParticipation({
      ...data,
      school_id: req.user.school_id,
      recorded_by: req.user.sub,
    });
  }

  @Post('achievement')
  @ApiOperation({ summary: 'Add an achievement' })
  async addAchievement(@Req() req: any, @Body() data: any) {
    return this.participationService.addAchievement({
      ...data,
      school_id: req.user.school_id,
    });
  }

  @Post('badge')
  @ApiOperation({ summary: 'Award a badge' })
  async awardBadge(@Req() req: any, @Body() data: any) {
    return this.participationService.awardBadge({
      ...data,
      school_id: req.user.school_id,
    });
  }
}
