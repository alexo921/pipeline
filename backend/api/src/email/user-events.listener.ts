import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import {
  AccountCreatedEvent,
  JobApplyClickedNoConfirmEvent,
  NewJobPostedNearZipEvent,
  IntakeCompleteEvent,
  ReactivatedUserLoginEvent,
} from '../events/user-events';

@Injectable()
export class UserEventsListener {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    return user?.email || 'alex@pipelineworkforce.com'; // Fallback to Alex's email
  }

  private async hasTier2(userId: string): Promise<boolean> {
    const candidate = await this.prisma.candidates.findUnique({ where: { userId } });
    return candidate?.isOnboarded === true || candidate?.step === 'LOCATION_DETAILS' || candidate?.step === 'AVAILABILITY_DETAILS';
  }

  private async getJobDetails(jobId: string): Promise<any> {
    const job = await this.prisma.jobs.findUnique({ where: { id: jobId } });
    return {
      jobTitle: job?.title,
      jobLink: `https://pipelineworkforce.com/jobs/${jobId}`,
      location: job?.location,
    };
  }

  @OnEvent('account.created')
  async handleAccountCreated(event: AccountCreatedEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use existing welcome-email.html with proper data
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Welcome to Pipeline',
      template: 'welcome-email',
      context: {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
    await this.queueService.scheduleTier2Followups(event.userId, userEmail);
  }



  @OnEvent('job.apply_clicked_no_confirm')
  async handleJobApplyClickedNoConfirm(event: JobApplyClickedNoConfirmEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use apply-nudge-email.html
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Did You Apply to This Job?',
      template: 'apply-nudge-email',
      context: { 
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  }

  @OnEvent('new_job_posted_near_zip')
  async handleNewJobPostedNearZip(event: NewJobPostedNearZipEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    const jobDetails = await this.getJobDetails(event.jobId);
    // Use local-job-alert.html
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'New Job in Your Area',
      template: 'local-job-alert',
      context: { 
        firstName: user?.firstName || 'there',
        city: jobDetails.location || 'your area',
        jobCount: 1,
        cityJobsUrl: `${process.env.FRONTEND_URL}/jobs?city=${encodeURIComponent(jobDetails.location || 'your area')}`,
        jobTitle: jobDetails.jobTitle,
        jobLink: jobDetails.jobLink
      }
    });
  }

  @OnEvent('intake_complete')
  async handleIntakeComplete(event: IntakeCompleteEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use top_10_jobs_this_week.html for weekly digest
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Top 10 Jobs This Week',
      template: 'top_10_jobs_this_week',
      context: {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  }

  @OnEvent('reactivated_user_login')
  async handleReactivatedUserLogin(event: ReactivatedUserLoginEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use welcome-email.html for reactivation as a fallback
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Welcome Back',
      template: 'welcome-email',
      context: {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  }
} 