import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApplyJobDto {
  @ApiProperty({ required: true })
  @IsString()
  jobId: string;

  @ApiProperty({ required: true })
  @IsString()
  userId: string;

  @ApiProperty({ required: true })
  @IsString()
  jobUrl: string;
}
