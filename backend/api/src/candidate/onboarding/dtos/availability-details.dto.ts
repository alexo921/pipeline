import {
  HealthcareRole,
  WorkType,
  ShiftType,
  JobStatus,
  OnboardingStep,
  CertificationStatus,
} from 'src/common/enums/enums';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityDetailsDto {
  @ApiProperty({ example: 'uuid-or-id-123' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: HealthcareRole })
  @IsOptional()
  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @ApiPropertyOptional({ enum: CertificationStatus })
  @IsOptional()
  @IsEnum(CertificationStatus)
  certificationStatus: CertificationStatus;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ example: '123 Main St, Springfield' })
  @IsOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxTravelDistance: number;

  @ApiPropertyOptional({ enum: WorkType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkType, { each: true })
  workType: WorkType[];

  @ApiPropertyOptional({ enum: ShiftType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ShiftType, { each: true })
  shiftType: ShiftType[];

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  currentJobStatus: JobStatus;

  @ApiProperty({ enum: OnboardingStep })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
