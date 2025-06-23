import { IsString, IsOptional, IsDate, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design homepage' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Create wireframes for the new homepage' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'in-progress' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: '2025-07-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: 'c56a4180-65aa-42ec-a945-5fd21dec0538' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
