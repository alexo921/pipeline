import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CertificationStatus,
  HealthcareRole,
  JobStatus,
  OnboardingStep,
  ShiftType,
  WorkType,
} from 'src/common/enums/enums';
import { EmailService } from 'src/email/email.service';

describe('Candidate Onboarding', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const apiEndpoint = '/candidate/onboarding';
  let candidateUser;
  let candidate;
  let sentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest
          .fn()
          .mockImplementation((email: string, token: string) => {
            sentToken = token;
            return Promise.resolve();
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup candidates created during tests
    await prismaService.candidates.deleteMany({
      where: {
        email: {
          in: [
            'candidate-user@example.com',
            'candidate@example.com',
          ],
        },
      },
    });

    await prismaService.users.deleteMany({
      where: {
        email: {
          in: [
            'candidate-user@example.com',
            'candidate@example.com',
          ],
        },
      },
    });

    await app.close();
  });

  it('should fail with invalid step number', () => {
    return request(app.getHttpServer())
      .put(apiEndpoint)
      .send({ step: 99 })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid step number');
      });
  });

  describe('Step 1: INITIAL_DETAILS', () => {
    it('should fail when required fields are missing', () => {
      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({ step: OnboardingStep.INITIAL_DETAILS })
        .expect(400);
    });

    it('should fail if candidate email already exists', async () => {
      candidateUser = await prismaService.users.create({
        data: {
          email: 'candidate-user@example.com',
          password: '',
          name: 'Existing User',
        },
      });

      await prismaService.candidates.create({
        data: {
          email: 'candidate-user@example.com',
          name: 'Existing User',
          healthcareRole: HealthcareRole.CNA,
          certificationStatus: CertificationStatus.Certified,
          userId: candidateUser.id,
          step: OnboardingStep.INITIAL_DETAILS,
        },
      });

      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({
          step: OnboardingStep.INITIAL_DETAILS,
          email: 'candidate-user@example.com',
          name: 'Test User',
          healthcareRole: 'RN',
          certificationStatus: 'Certified',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'User already exists with email candidate-user@example.com',
          );
        });
    });

    it('should succeed with valid initial details', async () => {
      let res = await request(app.getHttpServer())
        .put(apiEndpoint)
        .send({
          email: 'candidate@example.com',
          name: 'Existing User',
          healthcareRole: HealthcareRole.CNA,
          certificationStatus: CertificationStatus.Certified,
          userId: candidateUser.id,
          step: OnboardingStep.INITIAL_DETAILS,
        })
        .expect(200);

      candidate = res.body;

      return res;
    });
  });

  describe('Step 2: LOCATION_DETAILS', () => {
    it('should fail if id is missing', () => {
      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({ step: OnboardingStep.LOCATION_DETAILS })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('ID is required');
        });
    });

    it('should succeed with valid location details', () => {
      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({
          id: candidate.id,
          zipCode: '12345',
          address: 'USA',
          maxTravelDistance: '10',
          step: OnboardingStep.LOCATION_DETAILS,
        })
        .expect(200);
    });
  });

  describe('Step 3: AVAILABILITY_DETAILS', () => {
    it('should fail if id is missing', () => {
      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({ step: OnboardingStep.AVAILABILITY_DETAILS })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('ID is required');
        });
    });

    it('should fail with invalid key values type', () => {
      return request(app.getHttpServer())
        .put(apiEndpoint)
        .send({
          id: candidate.id,
          workType: WorkType.FullTime,
          currentJobStatus: JobStatus.NotWorkingAvailable,
          shiftType: ShiftType.Day,
          step: OnboardingStep.AVAILABILITY_DETAILS,
        })
        .expect((res) => {
          expect(res.body.message).toContain('workType must be an array');
          expect(res.body.message).toContain('shiftType must be an array');
        })
        .expect(400);
    });

    it('should succeed with valid availability details', async () => {
      const res = await request(app.getHttpServer())
        .put(apiEndpoint)
        .send({
          id: candidate.id,
          workType: [WorkType.FullTime],
          currentJobStatus: JobStatus.NotWorkingAvailable,
          shiftType: [ShiftType.Day],
          step: OnboardingStep.AVAILABILITY_DETAILS,
        })
        .expect(200);

    });
  });

  it('should not verify email with invalid token', async () => {
    expect(sentToken).toBeDefined();

    await request(app.getHttpServer())
      .post(`${apiEndpoint}/verify-email`)
      .send({ token: sentToken + 'i' })
      .expect(400)
      .expect((res) => {
        console.log(res.body); // log response
        expect(res.body.message).toMatch(/invalid token/i);
      });
  });
  

  it('should verify email with valid token', async () => {
    // Make sure `sentToken` was set in a previous test
    expect(sentToken).toBeDefined();

    const res = await request(app.getHttpServer())
      .post(`${apiEndpoint}/verify-email`)
      .send({ token: sentToken })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch('Email verified');
  });

  

  it('should set password for user after email verification', async () => {

    expect(sentToken).toBeDefined();

    const res = await request(app.getHttpServer())
      .post(`${apiEndpoint}/set-password`)
      .send({
        token: sentToken,
        password: 'StrongPassword123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/password set/i);
  });
});
