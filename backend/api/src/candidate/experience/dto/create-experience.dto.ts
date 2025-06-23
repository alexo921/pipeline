import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperienceDto {
  @ApiProperty({
    description: 'ID of the candidate associated with this experience',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  @IsString()
  candidateId: string;

  @ApiProperty({
    description: 'Name of the employer',
    example: 'Tech Solutions Inc.',
  })
  @IsString()
  employer: string;

  @ApiProperty({
    description: 'Role or position held',
    example: 'Software Engineer',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Start date of the experience',
    example: '2022-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date of the experience (optional if currently employed)',
    example: '2023-06-30T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Indicates if this is the current job',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
