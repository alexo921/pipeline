import { Test, TestingModule } from '@nestjs/testing';
import { UserEventsListener } from './user-events.listener';
import { EmailService } from './email.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import {
  AccountCreatedEvent,
  JobApplyClickedNoConfirmEvent,
  NewJobPostedNearZipEvent,
  IntakeCompleteEvent,
  ReactivatedUserLoginEvent,
} from '../events/user-events';

// --- Mock Data ---
const MOCK_EMAIL = 'alex@pipelineworkforce.com';
const MOCK_USER_ID = 'user1';
const MOCK_JOB_ID = 'job1';
const MOCK_JOB = { id: MOCK_JOB_ID, title: 'Nurse', location: '12345' };
const MOCK_USER = { id: MOCK_USER_ID, email: MOCK_EMAIL };
const MOCK_CANDIDATE = { userId: MOCK_USER_ID, isOnboarded: false, step: 'BASIC_INFO', user: MOCK_USER };

// --- Helper to flush timers ---
const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 100));

// --- Helper to create module ---
async function createTestingModule() {
  return Test.createTestingModule({
    providers: [
      UserEventsListener,
      EmailService,
      SchedulerRegistry,
      {
        provide: PrismaService,
        useValue: {
          users: { findUnique: jest.fn().mockResolvedValue(MOCK_USER) },
          candidates: {
            findUnique: jest.fn().mockResolvedValue(MOCK_CANDIDATE),
            findMany: jest.fn().mockResolvedValue([MOCK_CANDIDATE]),
          },
          jobs: {
            findUnique: jest.fn().mockResolvedValue(MOCK_JOB),
            create: jest.fn().mockResolvedValue(MOCK_JOB),
          },
        },
      },
      {
        provide: QueueService,
        useValue: {
          addEmailJob: jest.fn(),
          scheduleTier2Followups: jest.fn(),
        },
      },
    ],
  })
    .overrideProvider(EmailService)
    .useValue({ sendTemplateMail: jest.fn() })
    .compile();
}

describe('Email Automation E2E', () => {
  let listener: UserEventsListener;
  let emailService: { sendTemplateMail: jest.Mock };
  let queueService: { addEmailJob: jest.Mock; scheduleTier2Followups: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await createTestingModule();
    listener = module.get<UserEventsListener>(UserEventsListener);
    emailService = module.get<EmailService>(EmailService) as any;
    queueService = module.get<QueueService>(QueueService) as any;
    emailService.sendTemplateMail.mockClear();
    queueService.addEmailJob.mockClear();
    queueService.scheduleTier2Followups.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send welcome email on account creation', async () => {
    await listener.handleAccountCreated(new AccountCreatedEvent(MOCK_USER_ID));
    expect(queueService.addEmailJob).toHaveBeenCalledWith({
      to: MOCK_EMAIL,
      subject: 'Welcome to Pipeline',
      template: 'welcome-email',
      context: {
        firstName: 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
    expect(queueService.scheduleTier2Followups).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_EMAIL);
  });

  it('should send partial signup reminder for tier2 triggers', async () => {
    // Test that tier2 followups are scheduled when account is created
    await listener.handleAccountCreated(new AccountCreatedEvent(MOCK_USER_ID));
    expect(queueService.scheduleTier2Followups).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_EMAIL);
  });

  it('should send apply nudge email', async () => {
    await listener.handleJobApplyClickedNoConfirm(new JobApplyClickedNoConfirmEvent(MOCK_USER_ID, MOCK_JOB_ID));
    expect(queueService.addEmailJob).toHaveBeenCalledWith({
      to: MOCK_EMAIL,
      subject: 'Did You Apply to This Job?',
      template: 'apply-nudge-email',
      context: { 
        firstName: 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  });

  it('should send local job alert email', async () => {
    await listener.handleNewJobPostedNearZip(new NewJobPostedNearZipEvent(MOCK_USER_ID, MOCK_JOB_ID));
    expect(queueService.addEmailJob).toHaveBeenCalledWith({
      to: MOCK_EMAIL,
      subject: 'New Job in Your Area',
      template: 'local-job-alert',
      context: { 
        firstName: 'there',
        city: '12345',
        jobCount: 1,
        cityJobsUrl: `${process.env.FRONTEND_URL}/jobs?city=${encodeURIComponent('12345')}`,
        jobTitle: 'Nurse',
        jobLink: 'https://pipelineworkforce.com/jobs/job1'
      }
    });
  });

  it('should send weekly digest email', async () => {
    await listener.handleIntakeComplete(new IntakeCompleteEvent(MOCK_USER_ID));
    expect(queueService.addEmailJob).toHaveBeenCalledWith({
      to: MOCK_EMAIL,
      subject: 'Top 10 Jobs This Week',
      template: 'top_10_jobs_this_week',
      context: {
        firstName: 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  });

  it('should send welcome back email', async () => {
    await listener.handleReactivatedUserLogin(new ReactivatedUserLoginEvent(MOCK_USER_ID));
    expect(queueService.addEmailJob).toHaveBeenCalledWith({
      to: MOCK_EMAIL,
      subject: 'Welcome Back',
      template: 'welcome-email',
      context: {
        firstName: 'there',
        jobsUrl: `${process.env.FRONTEND_URL}/jobs`
      }
    });
  });
}); 