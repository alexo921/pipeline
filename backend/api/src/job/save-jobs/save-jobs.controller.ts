import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { SaveJobsService } from './save-jobs.service';
import { SaveJobDto } from './dto/save-job.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/decorators/user.decorator';

@ApiTags('Save Jobs')
@Controller('save-jobs')
export class SaveJobsController {
  constructor(private readonly saveJobsService: SaveJobsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all saved jobs for a user' })
  async getSavedJob(@User('userId') userId: string): Promise<any> {
    return this.saveJobsService.getSavedJobs(userId);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a saved job for a user' })
  async deleteSavedJob(
    @Body() { jobId }: SaveJobDto,
    @User('userId') userId: string,
  ): Promise<any> {
    return this.saveJobsService.deleteSavedJob(userId, jobId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a job to saved jobs for a user' })
  async addJob(
    @Body() { jobId }: SaveJobDto,
    @User('userId') userId: string,
  ): Promise<any> {
    return this.saveJobsService.addSavedJob(userId, jobId);
  }
}
