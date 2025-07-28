import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OnboardingStep } from 'src/common/enums/enums';

export class IntakeDetailsDto {
  @ApiPropertyOptional({ example: '7575758400' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ 
    example: 'PCA',
    description: 'Current healthcare role of the candidate',
    enum: ['RN', 'LPN', 'CNA', 'HHA', 'PCA', 'OTHER']
  })
  @IsString()
  currentRole: string;

  @ApiProperty({ 
    example: 'HOSPITAL',
    description: 'Preferred work setting',
    enum: ['HOSPITAL', 'NURSING_HOME', 'HOME_HEALTH', 'ASSISTED_LIVING', 'OTHER']
  })
  @IsString()
  preferredSetting: string;

  @ApiProperty({ 
    example: 'FULL_TIME',
    description: 'Preferred job type',
    enum: ['FULL_TIME', 'PART_TIME', 'PRN', 'CONTRACT']
  })
  @IsString()
  jobType: string;

  @ApiProperty({
    enum: OnboardingStep,
    description: 'Current onboarding step of the candidate',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;

  @ApiPropertyOptional({ example: 'user-id-123' })
  @IsOptional()
  @IsString()
  userId?: string;
} 