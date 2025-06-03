import { IsString, IsOptional, IsDate, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
} 
