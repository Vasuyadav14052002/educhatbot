import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Staff Management (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('staff')
  @ApiOperation({ summary: 'Get list of school staff (teachers and admins)' })
  getStaff(@CurrentUser() user: JwtPayload) {
    return this.userService.getStaff(user.school_id!);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Register a new staff member' })
  createStaff(
    @Body('first_name') firstName: string,
    @Body('last_name') lastName: string,
    @Body('email') email: string,
    @Body('phone') phone: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.userService.createStaff(user.school_id!, { first_name: firstName, last_name: lastName, email, phone, role });
  }

  @Put('staff/:id')
  @ApiOperation({ summary: 'Update staff member profile details' })
  updateStaff(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('first_name') firstName?: string,
    @Body('last_name') lastName?: string,
    @Body('phone') phone?: string,
    @Body('role') role?: UserRole,
    @Body('status') status?: UserStatus,
  ) {
    return this.userService.updateStaff(user.school_id!, id, { first_name: firstName, last_name: lastName, phone, role, status });
  }

  @Patch('staff/:id/status')
  @ApiOperation({ summary: 'Change staff member active status' })
  setStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.userService.setStatus(user.school_id!, id, status);
  }
}
