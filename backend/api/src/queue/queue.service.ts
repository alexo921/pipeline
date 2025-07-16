import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobData } from './processors/email-queue.processor';
import { ScheduledJobData } from './processors/scheduled-jobs.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue<EmailJobData>,
    @InjectQueue('scheduled-jobs') private readonly scheduledJobsQueue: Queue<ScheduledJobData>,
  ) {}

  /**
   * Add an email job to the queue
   */
  async addEmailJob(data: EmailJobData, delay?: number): Promise<void> {
    const jobOptions = delay ? { delay } : {};
    
    await this.emailQueue.add('send-email', data, jobOptions);
    this.logger.log(`Added email job to queue: ${data.template} to ${data.to}`);
  }

  /**
   * Schedule weekly top jobs email (runs every Monday at 8am)
   */
  async scheduleWeeklyTopJobs(): Promise<void> {
    // Calculate next Monday at 8am
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((8 - now.getDay() + 7) % 7));
    nextMonday.setHours(8, 0, 0, 0);
    
    // If it's already Monday 8am or later, schedule for next Monday
    if (now.getDay() === 1 && now.getHours() >= 8) {
      nextMonday.setDate(nextMonday.getDate() + 7);
    }

    const delay = nextMonday.getTime() - now.getTime();
    
    await this.scheduledJobsQueue.add(
      'weekly-top-jobs',
      { type: 'weekly-top-jobs' },
      { 
        delay,
        repeat: {
          pattern: '0 8 * * 1', // Every Monday at 8am (cron pattern)
        }
      }
    );
    
    this.logger.log(`Scheduled weekly top jobs email for ${nextMonday.toISOString()}`);
  }

  /**
   * Schedule tier2 followup emails
   */
  async scheduleTier2Followups(userId: string, userEmail: string): Promise<void> {
    const delays = [
      60 * 60 * 1000,    // 1 hour
      24 * 60 * 60 * 1000, // 24 hours
      3 * 24 * 60 * 60 * 1000, // 3 days
    ];

    for (let i = 0; i < delays.length; i++) {
      await this.scheduledJobsQueue.add(
        `tier2-followup-${i + 1}`,
        {
          type: 'tier2-followup',
          userId,
          userEmail,
          attempt: i + 1,
        },
        { delay: delays[i] }
      );
    }

    this.logger.log(`Scheduled tier2 followup emails for user ${userId}`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const emailStats = await this.emailQueue.getJobCounts();
    const scheduledStats = await this.scheduledJobsQueue.getJobCounts();

    return {
      emailQueue: emailStats,
      scheduledJobsQueue: scheduledStats,
    };
  }

  /**
   * Clean up completed jobs
   */
  async cleanupCompletedJobs(): Promise<void> {
    await this.emailQueue.clean(1000 * 60 * 60 * 24, 'completed' as any); // 24 hours
    await this.scheduledJobsQueue.clean(1000 * 60 * 60 * 24 * 7, 'completed' as any); // 7 days
    
    this.logger.log('Cleaned up completed jobs');
  }
} 