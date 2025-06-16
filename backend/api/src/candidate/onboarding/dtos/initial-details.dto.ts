import { HealthcareRole, OnboardingStep } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { CertificationStatus } from 'src/common/enums/enums';

export class InitialDetailsDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @IsEnum(CertificationStatus)
  certificationStatus: CertificationStatus;

  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
