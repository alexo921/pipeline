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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply for a job' })
  async applyForJob(@Body() applyDto: ApplyJobDto): Promise<any> {
    return await this.appliedJobsService.setAppliedJob(applyDto);
  }
}
