import { IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OnboardingStep } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDetailsDto {
  @ApiProperty({
    example: 'a1b2c3d4',
    description: 'Unique identifier for the candidate or location entry',
  })
  @IsString()
  id: string;

  @ApiProperty({
    example: '90210',
    description: 'ZIP code of the candidate’s location',
  })
  @IsString()
  zipCode: string;

  @ApiProperty({
    example: '123 Main St, Los Angeles, CA',
    description: 'Full address of the candidate',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: 15,
    description:
      'Maximum distance (in miles or km) the candidate is willing to travel',
  })
  @Type(() => Number)
  @IsNumber()
  maxTravelDistance: number;

  @ApiProperty({
    enum: OnboardingStep,
    description: 'Current step of the onboarding process',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
