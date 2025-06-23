import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'AI Chatbot Development',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Short description of the project',
    example: 'A chatbot that can answer FAQs and automate support tasks',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Current status of the project',
    example: 'In Progress',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Start date of the project',
    example: '2025-06-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date) // ✅ This ensures transformation from string to Date
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the project',
    example: '2025-12-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date) // ✅ Same here
  @IsOptional()
  endDate?: Date;
}
