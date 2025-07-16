import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../../email/email.service';

export interface ScheduledJobData {
  type: 'weekly-top-jobs' | 'tier2-followup';
  userId?: string;
  userEmail?: string;
  delay?: number;
  attempt?: number;
}

@Processor('scheduled-jobs')
export class ScheduledJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledJobsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<ScheduledJobData>): Promise<void> {
    this.logger.log(`Processing scheduled job ${job.id}: ${job.data.type}`);
    
    try {
      switch (job.data.type) {
        case 'weekly-top-jobs':
          await this.processWeeklyTopJobs();
          break;
        case 'tier2-followup':
          await this.processTier2Followup(job.data);
          break;
        default:
          throw new Error(`Unknown scheduled job type: ${job.data.type}`);
      }
      
      this.logger.log(`Scheduled job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Scheduled job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async processWeeklyTopJobs(): Promise<void> {
    // Find all candidates who are onboarded and join users for email
    const candidates = await this.prisma.candidates.findMany({
      where: { isOnboarded: true },
      include: { user: true },
    });

    for (const candidate of candidates) {
      await this.emailService.sendTemplateMail(
        candidate.user.email,
        'Top 10 Jobs This Week',
        'top_10_jobs_this_week',
        {
          firstName: candidate.user.firstName || 'there',
          jobsUrl: `${process.env.FRONTEND_URL}/jobs`
        }
      );
    }
  }

  private async processTier2Followup(data: ScheduledJobData): Promise<void> {
    if (!data.userId || !data.userEmail) {
      throw new Error('Missing userId or userEmail for tier2 followup');
    }

    // Check if user has completed tier2 onboarding
    const candidate = await this.prisma.candidates.findUnique({ 
      where: { userId: data.userId } 
    });
    
    const hasTier2 = candidate?.isOnboarded === true || 
                    candidate?.step === 'LOCATION_DETAILS' || 
                    candidate?.step === 'AVAILABILITY_DETAILS';

    if (!hasTier2) {
      const attempt = data.attempt || 1;
      let subject = 'Finish Your Setup';
      
      if (attempt === 2) {
        subject = 'Help Us Help You';
      } else if (attempt === 3) {
        subject = 'Jobs Are Waiting Near You';
      }

      await this.emailService.sendTemplateMail(
        data.userEmail,
        subject,
        'partial-signup-reminder',
        {
          firstName: 'there',
          profileUrl: `${process.env.FRONTEND_URL}/dashboard/profile`
        }
      );
    }
  }
} 