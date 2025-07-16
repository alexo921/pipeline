import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('Queue Management')
@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('scheduled-jobs') private readonly scheduledJobsQueue: Queue,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  @Get('jobs/:queueName')
  @ApiOperation({ summary: 'Get jobs from a specific queue' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async getJobs(
    @Param('queueName') queueName: string,
    @Query('status') status: string = 'waiting',
    @Query('limit') limit: number = 10,
  ) {
    const queue = queueName === 'email' ? this.emailQueue : this.scheduledJobsQueue;
    const jobs = await queue.getJobs([status as any], 0, limit);
    
    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      status: job.status,
      progress: job.progress,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));
  }

  @Delete('jobs/:queueName/:jobId')
  @ApiOperation({ summary: 'Remove a specific job from queue' })
  @ApiResponse({ status: 200, description: 'Job removed successfully' })
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    const queue = queueName === 'email' ? this.emailQueue : this.scheduledJobsQueue;
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    await job.remove();
    return { message: 'Job removed successfully' };
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up completed jobs' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupJobs() {
    await this.queueService.cleanupCompletedJobs();
    return { message: 'Cleanup completed successfully' };
  }

  @Post('pause/:queueName')
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  async pauseQueue(@Param('queueName') queueName: string) {
    const queue = queueName === 'email' ? this.emailQueue : this.scheduledJobsQueue;
    await queue.pause();
    return { message: `${queueName} queue paused successfully` };
  }

  @Post('resume/:queueName')
  @ApiOperation({ summary: 'Resume a queue' })
  @ApiResponse({ status: 200, description: 'Queue resumed successfully' })
  async resumeQueue(@Param('queueName') queueName: string) {
    const queue = queueName === 'email' ? this.emailQueue : this.scheduledJobsQueue;
    await queue.resume();
    return { message: `${queueName} queue resumed successfully` };
  }
} 