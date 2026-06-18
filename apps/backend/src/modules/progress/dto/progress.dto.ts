import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HomeworkStatus, EngagementLevel } from '@prisma/client';

export class ProgressEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  student_id: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  performance_score: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teacher_comments?: string;

  @ApiProperty({ enum: HomeworkStatus })
  @IsEnum(HomeworkStatus)
  homework_status: HomeworkStatus;

  @ApiProperty({ enum: EngagementLevel })
  @IsEnum(EngagementLevel)
  class_engagement: EngagementLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  behavior_notes?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  class_activity_score?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  parent_visible?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks_category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  participation_ratings?: Record<string, number>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  behavior_ratings?: Record<string, number>;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];
}

export class BulkProgressDto {
  @ApiProperty({ example: '2024-2025' })
  @IsString()
  @IsNotEmpty()
  academic_year_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  class_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({ example: '2024-10-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [ProgressEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressEntryDto)
  entries: ProgressEntryDto[];
}
