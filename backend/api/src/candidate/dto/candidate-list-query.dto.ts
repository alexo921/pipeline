import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumberString()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumberString()
  limit?: number;
}
