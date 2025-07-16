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

// Integration test - uses real EmailService
describe('Email Integration Tests', () => {
  let listener: UserEventsListener;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEventsListener,
        EmailService,
        SchedulerRegistry,
        {
          provide: PrismaService,
          useValue: {
            users: { 
              findUnique: jest.fn().mockResolvedValue({ 
                id: 'user1', 
                email: 'alex@pipelineworkforce.com' 
              }) 
            },
            candidates: {
              findUnique: jest.fn().mockResolvedValue({ 
                userId: 'user1', 
                isOnboarded: false, 
                step: 'BASIC_INFO' 
              }),
              findMany: jest.fn().mockResolvedValue([]),
            },
            jobs: {
              findUnique: jest.fn().mockResolvedValue({ 
                id: 'job1', 
                title: 'Nurse', 
                location: '12345' 
              }),
            },
          },
        },
      ],
    }).compile();

    listener = module.get<UserEventsListener>(UserEventsListener);
    emailService = module.get<EmailService>(EmailService);
  });

  // Only run these tests when you want to send real emails
  // Use: npm test -- --testNamePattern="Email Integration Tests" --runInBand
  it('should send real welcome email', async () => {
    // This will actually send an email to alex@pipelineworkforce.com
    await listener.handleAccountCreated(new AccountCreatedEvent('user1'));
    
    // No assertions - just check your inbox
    console.log('✅ Welcome email should be sent to alex@pipelineworkforce.com');
  }, 30000); // 30 second timeout for real email sending

  it('should send real apply nudge email', async () => {
    await listener.handleJobApplyClickedNoConfirm(
      new JobApplyClickedNoConfirmEvent('user1', 'job1')
    );
    
    console.log('✅ Apply nudge email should be sent to alex@pipelineworkforce.com');
  }, 30000);

  it('should send real local job alert email', async () => {
    await listener.handleNewJobPostedNearZip(
      new NewJobPostedNearZipEvent('user1', 'job1')
    );
    
    console.log('✅ Local job alert email should be sent to alex@pipelineworkforce.com');
  }, 30000);
}); 