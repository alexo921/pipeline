import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsEmail,
} from 'class-validator';
import {
  HealthcareRole,
  PreferredSetting,
  WorkType,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfile {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: HealthcareRole })
  @IsEnum(HealthcareRole)
  healthcareRole: HealthcareRole;

  @ApiProperty({ enum: PreferredSetting, isArray: true })
  @IsArray()
  @IsEnum(PreferredSetting, { each: true })
  preferredSetting: PreferredSetting[];

  @ApiProperty({ enum: WorkType, isArray: true })
  @IsArray()
  @IsEnum(WorkType, { each: true })
  workType: WorkType[];

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

}
