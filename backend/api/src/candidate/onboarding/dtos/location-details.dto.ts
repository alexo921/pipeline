import { IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OnboardingStep } from '@prisma/client';

export class LocationDetailsDto {
  @IsString()
  id: string;

  @IsString()
  zipCode: string;

  @IsString()
  address: string;

  @Type(() => Number)
  @IsNumber()
  maxTravelDistance: number;

  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
