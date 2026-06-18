import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('admin-kpis')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard KPIs' })
  getAdminKPIs(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAdminKPIs(user.school_id!);
  }

  @Get('detailed')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get detailed admin dashboard analytics' })
  getDetailedAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDetailedAnalytics(user.school_id!);
  }

  @Get('teacher-kpis')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get teacher dashboard KPIs' })
  getTeacherKPIs(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getTeacherKPIs(user.sub, user.school_id!);
  }

  @Get('parent-kpis/:studentId')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get parent dashboard KPIs for a student' })
  getParentKPIs(@Param('studentId') studentId: string, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getParentKPIs(studentId, user.school_id!);
  }
}
