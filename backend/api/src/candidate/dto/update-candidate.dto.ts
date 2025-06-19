import { OnboardingStep } from '@prisma/client';
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

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @IsOptional()
  @IsEnum(CertificationStatus)
  certificationStatus: CertificationStatus;

  @IsOptional()
  @IsString()
  zipCode: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxTravelDistance: number;

  @IsOptional()
  @IsArray()
  @IsEnum(WorkType, { each: true })
  workType: WorkType[];

  @IsOptional()
  @IsArray()
  @IsEnum(ShiftType, { each: true })
  shiftType: ShiftType[];

  @IsOptional()
  @IsEnum(JobStatus)
  currentJobStatus: JobStatus;

  @IsNumber()
  @IsOptional()
  hourlyRate: number;

  @IsNumber()
  @IsOptional()
  yearlySalary: number;

  @IsBoolean()
  @IsOptional()
  payLocationBased: boolean;

  @IsString()
  @IsOptional()
  jobFrustationNotes: string;

  @IsString()
  @IsOptional()
  referrencedBy: string;

  @IsEnum(WorkSettingExperience, { each: true })
  @IsArray()
  @IsOptional()
  workSettingExperience: WorkSettingExperience[];

  @IsEnum(PreferredSetting, { each: true })
  @IsArray()
  @IsOptional()
  preferredSetting: PreferredSetting[];

  @IsEnum(ThrivingFactor, { each: true })
  @IsArray()
  @IsOptional()
  thrivingFactors: ThrivingFactor[];
}
