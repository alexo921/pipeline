import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CertificationStatus,
  HealthcareRole,
  JobStatus,
  PreferredSetting,
  ShiftType,
  ThrivingFactor,
  WorkSettingExperience,
  WorkType,
} from 'src/common/enums/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCandidateDto {
  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: HealthcareRole })
  @IsOptional()
  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @ApiPropertyOptional({ enum: CertificationStatus })
  @IsOptional()
  @IsEnum(CertificationStatus)
  certificationStatus: CertificationStatus;

  @ApiPropertyOptional({ example: '90210' })
  @IsOptional()
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 25 })
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

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  hourlyRate: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  yearlySalary: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  payLocationBased: boolean;

  @ApiPropertyOptional({ example: 'Low flexibility in current job' })
  @IsOptional()
  @IsString()
  jobFrustationNotes: string;

  @ApiPropertyOptional({ example: 'Referral Campaign July 2025' })
  @IsOptional()
  @IsString()
  referrencedBy: string;

  @ApiPropertyOptional({ enum: WorkSettingExperience, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkSettingExperience, { each: true })
  workSettingExperience: WorkSettingExperience[];

  @ApiPropertyOptional({ enum: PreferredSetting, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PreferredSetting, { each: true })
  preferredSetting: PreferredSetting[];

  @ApiPropertyOptional({ enum: ThrivingFactor, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ThrivingFactor, { each: true })
  thrivingFactors: ThrivingFactor[];
}
