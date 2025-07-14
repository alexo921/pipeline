import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';
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
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
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
    await this.emailService.sendTemplateMail(
      userEmail,
      'Welcome to Pipeline',
      'welcome-email',
      {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    );
    this.scheduleNoTier2Followups(event.userId, userEmail);
  }

  private scheduleNoTier2Followups(userId: string, userEmail: string) {
    // +1 hour
    const timeout1 = setTimeout(async () => {
      if (!(await this.hasTier2(userId))) {
        // Use partial-signup-reminder.html
        await this.emailService.sendTemplateMail(
          userEmail,
          'Finish Your Setup',
          'partial-signup-reminder',
          {
            firstName: 'there',
            profileUrl: `${process.env.FRONTEND_URL}/dashboard/profile`
          }
        );
      }
    }, 60 * 60 * 1000);
    this.schedulerRegistry.addTimeout(`no-tier2-1h-${userId}`, timeout1);

    // +24 hours
    const timeout2 = setTimeout(async () => {
      if (!(await this.hasTier2(userId))) {
        // Use partial-signup-reminder.html
        await this.emailService.sendTemplateMail(
          userEmail,
          'Help Us Help You',
          'partial-signup-reminder',
          {
            firstName: 'there',
            profileUrl: `${process.env.FRONTEND_URL}/dashboard/profile`
          }
        );
      }
    }, 24 * 60 * 60 * 1000);
    this.schedulerRegistry.addTimeout(`no-tier2-24h-${userId}`, timeout2);

    // +3 days
    const timeout3 = setTimeout(async () => {
      if (!(await this.hasTier2(userId))) {
        // Use partial-signup-reminder.html
        await this.emailService.sendTemplateMail(
          userEmail,
          'Jobs Are Waiting Near You',
          'partial-signup-reminder',
          {
            firstName: 'there',
            profileUrl: `${process.env.FRONTEND_URL}/dashboard/profile`
          }
        );
      }
    }, 3 * 24 * 60 * 60 * 1000);
    this.schedulerRegistry.addTimeout(`no-tier2-3d-${userId}`, timeout3);
  }

  @OnEvent('job.apply_clicked_no_confirm')
  async handleJobApplyClickedNoConfirm(event: JobApplyClickedNoConfirmEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use apply-nudge-email.html
    await this.emailService.sendTemplateMail(
      userEmail,
      'Did You Apply to This Job?',
      'apply-nudge-email',
      { 
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    );
  }

  @OnEvent('new_job_posted_near_zip')
  async handleNewJobPostedNearZip(event: NewJobPostedNearZipEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    const jobDetails = await this.getJobDetails(event.jobId);
    // Use local-job-alert.html
    await this.emailService.sendTemplateMail(
      userEmail,
      'New Job in Your Area',
      'local-job-alert',
      { 
        firstName: user?.firstName || 'there',
        city: jobDetails.location || 'your area',
        jobCount: 1,
        cityJobsUrl: `${process.env.FRONTEND_URL}/jobs?city=${encodeURIComponent(jobDetails.location || 'your area')}`,
        jobTitle: jobDetails.jobTitle,
        jobLink: jobDetails.jobLink
      }
    );
  }

  @OnEvent('intake_complete')
  async handleIntakeComplete(event: IntakeCompleteEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use top_10_jobs_this_week.html for weekly digest
    await this.emailService.sendTemplateMail(
      userEmail,
      'Top 10 Jobs This Week',
      'top_10_jobs_this_week',
      {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    );
  }

  @OnEvent('reactivated_user_login')
  async handleReactivatedUserLogin(event: ReactivatedUserLoginEvent) {
    const userEmail = await this.getUserEmail(event.userId);
    const user = await this.prisma.users.findUnique({ where: { id: event.userId } });
    // Use welcome-email.html for reactivation as a fallback
    await this.emailService.sendTemplateMail(
      userEmail,
      'Welcome Back',
      'welcome-email',
      {
        firstName: user?.firstName || 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    );
  }
} 