import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto, LinkParentDto, PromoteStudentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@edutrack/shared-types';

@ApiTags('Students Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'students', version: '1' })
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student profile' })
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: JwtPayload) {
    return this.studentService.create(dto, user.school_id!);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students with query filters' })
  findAll(@Query() query: StudentQueryDto, @CurrentUser() user: JwtPayload) {
    return this.studentService.findAll(user.school_id!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single student detail profile' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.studentService.findOne(id, user.school_id!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update student profile details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentService.update(id, dto, user.school_id!);
  }

  @Post(':id/link-parent')
  @ApiOperation({ summary: 'Link parent to student' })
  linkParent(
    @Param('id') studentId: string,
    @Body() dto: LinkParentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentService.linkParent(studentId, dto, user.school_id!);
  }

  @Post(':id/promote')
  @ApiOperation({ summary: 'Promote student to next class or change lifecycle status' })
  promote(
    @Param('id') studentId: string,
    @Body() dto: PromoteStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentService.promoteStudent(studentId, dto, user.school_id!, user.sub);
  }
}
