import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getKpis(@CurrentUser() user: JwtPayload, @Query('academicYearId') academicYearId: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getKpis(schoolId, academicYearId);
  }

  @Get('alerts')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getAlerts(@CurrentUser() user: JwtPayload, @Query('academicYearId') academicYearId: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getAlerts(schoolId, academicYearId);
  }

  @Get('attendance-trend')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getAttendanceTrend(@CurrentUser() user: JwtPayload, @Query('range') range: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    const months = range === 'thisyear' ? 12 : range === '3months' ? 3 : 6;
    return this.dashboardService.getAttendanceTrend(schoolId, months);
  }

  @Get('subject-performance')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getSubjectPerformance(@CurrentUser() user: JwtPayload, @Query('academicYearId') academicYearId: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getSubjectPerformance(schoolId, academicYearId);
  }

  @Get('today-attendance-breakdown')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getTodayAttendanceBreakdown(@CurrentUser() user: JwtPayload) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getTodayAttendanceBreakdown(schoolId);
  }

  @Get('fee-collection-trend')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getFeeCollectionTrend(@CurrentUser() user: JwtPayload, @Query('range') range: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    const months = range === '12months' ? 12 : 6;
    return this.dashboardService.getFeeCollectionTrend(schoolId, months);
  }

  @Get('recent-activity')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getRecentActivity(@CurrentUser() user: JwtPayload, @Query('limit') limit: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getRecentActivity(schoolId, limit ? parseInt(limit) : 8);
  }

  @Get('upcoming-events')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getUpcomingEvents(@CurrentUser() user: JwtPayload, @Query('limit') limit: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getUpcomingEvents(schoolId, limit ? parseInt(limit) : 4);
  }

  @Get('insights')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getInsights(@CurrentUser() user: JwtPayload, @Query('academicYearId') academicYearId: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getInsights(schoolId, academicYearId);
  }

  @Get('class-performance')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getClassPerformance(@CurrentUser() user: JwtPayload, @Query('academicYearId') academicYearId: string) {
    const schoolId = user.school_id || await this.dashboardService.getFirstSchoolId();
    return this.dashboardService.getClassPerformance(schoolId, academicYearId);
  }
}
