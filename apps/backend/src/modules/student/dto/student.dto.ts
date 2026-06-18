import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, RelationshipType, PromotionAction, StudentStatus } from '@prisma/client';
import { PaginationQuery } from '@edutrack/shared-types';

export class CreateStudentDto {
  @ApiProperty() @IsString() class_id: string;
  @ApiProperty() @IsString() student_code: string;
  @ApiProperty() @IsString() admission_no: string;
  @ApiProperty() @IsString() first_name: string;
  @ApiProperty() @IsString() last_name: string;
  @ApiProperty() @IsDateString() dob: string;
  @ApiProperty({ enum: Gender }) @IsEnum(Gender) gender: Gender;
  @ApiProperty({ required: false }) @IsOptional() @IsString() photo_url?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() blood_group?: string;
}

export class UpdateStudentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() first_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() last_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() class_id?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() photo_url?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() blood_group?: string;
  @ApiProperty({ enum: StudentStatus, required: false }) @IsOptional() @IsEnum(StudentStatus) status?: StudentStatus;
}

export class StudentQueryDto implements Partial<PaginationQuery> {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() class_id?: string;
  @IsOptional() @IsEnum(StudentStatus) status?: StudentStatus;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() sort_by?: string;
  @IsOptional() sort_order?: 'asc' | 'desc';
}

export class LinkParentDto {
  @ApiProperty() @IsString() parent_user_id: string;
  @ApiProperty({ enum: RelationshipType }) @IsEnum(RelationshipType) relationship: RelationshipType;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() is_primary?: boolean;
}

export class PromoteStudentDto {
  @ApiProperty() @IsString() to_class_id: string;
  @ApiProperty() @IsString() academic_year_id: string;
  @ApiProperty({ enum: PromotionAction }) @IsEnum(PromotionAction) action: PromotionAction;
  @ApiProperty({ required: false }) @IsOptional() @IsString() reason?: string;
}
