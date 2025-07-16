import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../email/email.service';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Processor('email-queue')
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id}: ${job.data.template} to ${job.data.to}`);
    
    try {
      await this.emailService.sendTemplateMail(
        job.data.to,
        job.data.subject,
        job.data.template,
        job.data.context
      );
      
      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Re-throw to trigger retry mechanism
    }
  }
} 