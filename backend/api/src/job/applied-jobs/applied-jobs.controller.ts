import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AppliedJobsService } from './applied-jobs.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplyJobDto } from './dto/apply-job-dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Applied Jobs')
@Controller('applied-jobs')
export class AppliedJobsController {
  constructor(private readonly appliedJobsService: AppliedJobsService) {}

  @Post()
  async applyForJob(@Body() applyDto: ApplyJobDto) {
    return await this.appliedJobsService.applyForJob(applyDto.userId, applyDto.jobId);
  }
}
