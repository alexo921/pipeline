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

export class AvailabilityDetailsDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

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

  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
