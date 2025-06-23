import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SaveJobDto {
  @ApiProperty({ required: true })
  @IsString()
  jobId: string;

  @ApiProperty({ required: true })
  @IsString()
  userId: string;
}
