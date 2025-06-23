import { Body, Controller, Post } from '@nestjs/common';
import { SaveJobsService } from './save-jobs.service';
import { SaveJobDto } from './dto/save-job.dto';

@Controller('save-jobs')
export class SaveJobsController {
  constructor(private readonly saveJobsService: SaveJobsService) {}

  @Post('add')
  async getSavedJob(@Body() { userId, jobId }: SaveJobDto): Promise<any> {
    return this.saveJobsService.getSavedJob(userId, jobId);
  }

  @Post('remove')
  async deleteSavedJob(@Body() { userId, jobId }: SaveJobDto): Promise<any> {
    return this.saveJobsService.deleteSavedJob(userId, jobId);
  }
}
