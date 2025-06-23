import { Body, Controller, Get, Post } from '@nestjs/common';
import { SaveJobsService } from './save-jobs.service';
import { SaveJobDto } from './dto/save-job.dto';

@Controller('save-jobs')
export class SaveJobsController {
  constructor(private readonly saveJobsService: SaveJobsService) {}

  @Get()
  async getSavedJob(@Body() { userId, jobId }: SaveJobDto): Promise<any> {//candidate id 
    return this.saveJobsService.getSavedJob(userId, jobId);
  }

  @Post('remove')
  async deleteSavedJob(@Body() { userId, jobId }: SaveJobDto): Promise<any> {
    return this.saveJobsService.deleteSavedJob(userId, jobId);
  }
  @Post()
  async addJob(@Body() { userId, jobId }: SaveJobDto): Promise<any>{
    return this.saveJobsService.addSavedJob(userId,jobId);
  } 
}
