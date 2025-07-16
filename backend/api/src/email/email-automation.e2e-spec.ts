import { Test, TestingModule } from '@nestjs/testing';
import { UserEventsListener } from './user-events.listener';
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
    ],
  })
    .overrideProvider(EmailService)
    .useValue({ sendTemplateMail: jest.fn() })
    .compile();
}

describe('Email Automation E2E', () => {
  let listener: UserEventsListener;
  let emailService: { sendTemplateMail: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await createTestingModule();
    listener = module.get<UserEventsListener>(UserEventsListener);
    emailService = module.get<EmailService>(EmailService) as any;
    emailService.sendTemplateMail.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send welcome email on account creation', async () => {
    await listener.handleAccountCreated(new AccountCreatedEvent(MOCK_USER_ID));
    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      'Welcome to Pipeline',
      'welcome-email',
      {}
    );
  });

  it('should send partial signup reminder for tier2 triggers', async () => {
    await (listener as any).scheduleNoTier2Followups(MOCK_USER_ID, MOCK_EMAIL);
    jest.runAllTimers(); // Fast-forward all scheduled timeouts

    // Flush all pending microtasks (async callbacks in setTimeout)
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      expect.any(String),
      'partial-signup-reminder',
      {}
    );
  });

  it('should send apply nudge email', async () => {
    await listener.handleJobApplyClickedNoConfirm(new JobApplyClickedNoConfirmEvent(MOCK_USER_ID, MOCK_JOB_ID));
    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      'Did You Apply to This Job?',
      'apply-nudge-email',
      { jobId: MOCK_JOB_ID }
    );
  });

  it('should send local job alert email', async () => {
    await listener.handleNewJobPostedNearZip(new NewJobPostedNearZipEvent(MOCK_USER_ID, MOCK_JOB_ID));
    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      'New Job in Your Area',
      'local-job-alert',
      expect.objectContaining({ jobTitle: 'Nurse', jobLink: expect.any(String) })
    );
  });

  it('should send weekly digest email', async () => {
    await listener.handleIntakeComplete(new IntakeCompleteEvent(MOCK_USER_ID));
    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      'Top 10 Jobs This Week',
      'launch-email',
      {}
    );
  });

  it('should send welcome back email', async () => {
    await listener.handleReactivatedUserLogin(new ReactivatedUserLoginEvent(MOCK_USER_ID));
    expect(emailService.sendTemplateMail).toHaveBeenCalledWith(
      MOCK_EMAIL,
      'Welcome Back',
      'welcome-email',
      {}
    );
  });
}); 