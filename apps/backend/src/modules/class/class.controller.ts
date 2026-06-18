import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Classes Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'classes', version: '1' })
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get grade card listing overview' })
  getClassesOverview(@CurrentUser() user: JwtPayload) {
    return this.classService.getClassesOverview(user.school_id!);
  }

  @Get('details/:grade')
  @ApiOperation({ summary: 'Get detailed dashboard, directory, and analytics for a specific grade' })
  getClassDetails(
    @Param('grade') grade: string,
    @Query() query: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.classService.getClassDetails(user.school_id!, grade, query);
  }
}
