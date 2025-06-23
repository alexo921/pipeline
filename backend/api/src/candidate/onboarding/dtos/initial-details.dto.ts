import { HealthcareRole, OnboardingStep } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { CertificationStatus } from 'src/common/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class InitialDetailsDto {
  @ApiProperty({
    example: 'Brian Lewis',
    description: 'Full name of the candidate',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'brian@example.com',
    description: 'Email address of the candidate',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: HealthcareRole,
    description: 'Healthcare role of the candidate',
  })
  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @ApiProperty({
    enum: CertificationStatus,
    description: 'Certification status of the candidate',
  })
  @IsEnum(CertificationStatus)
  certificationStatus: CertificationStatus;

  @ApiProperty({
    enum: OnboardingStep,
    description: 'Current onboarding step of the candidate',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
