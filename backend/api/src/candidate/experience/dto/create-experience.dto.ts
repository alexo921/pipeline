import { Type } from 'class-transformer';
import { IsString, IsDateString, IsOptional, IsBoolean, IsDate } from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  candidateId: string;

  @IsString()
  employer: string;

  @IsString()
  role: string;

  @IsDate()
  @Type(() => Date)
  startDate: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
