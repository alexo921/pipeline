import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateExperienceDto } from 'src/candidate/experience/dto/create-experience.dto';
import {
  JobStatus,
  OnboardingStep,
  ShiftType,
  WorkType,
} from 'src/common/enums/enums';
import { JwtService } from '@nestjs/jwt';

describe('Candidate Experience Controller ', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let candidateId: string;
  let experienceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    const user = await prisma.users.create({
      data: {
        email: 'expuser@example.com',
        name: 'Exp User',
        password: '',
        role: 'CANDIDATE',
      },
    });

    const candidate = await prisma.candidates.create({
      data: {
        name: 'Exp User',
        email: 'expuser@example.com',
        userId: user.id,
        healthcareRole: 'CNA',
        certificationStatus: 'Certified',
        zipCode: '12345',
        address: 'USA',
        maxTravelDistance: 10,
        workType: [WorkType.FullTime],
        currentJobStatus: JobStatus.NotWorkingAvailable,
        shiftType: [ShiftType.Day],
        isActive: true,
        isOnboarded: true,
        step: OnboardingStep.AVAILABILITY_DETAILS,
      },
    });

    candidateId = candidate.id;

    const jwtService = app.get(JwtService);
    accessToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      candidateId: candidate.id,
      role: 'CANDIDATE',
    });
  });

  afterAll(async () => {
    await prisma.experiences.deleteMany({ where: { candidateId } });
    await prisma.candidates.delete({ where: { id: candidateId } });
    await prisma.users.delete({ where: { email: 'expuser@example.com' } });
    await app.close();
  });

  const apiPrefix = '/candidate-experience';

  it('should create a new experience', async () => {
    const createDto: CreateExperienceDto = {
      candidateId,
      employer: 'Nurse Assistant',
      role: 'HealthCare Inc.',
      startDate: '2022-01-01T00:00:00.000Z',
      endDate: '2022-01-01T00:00:00.000Z',
      isCurrent: false,
    };

    const res = await request(app.getHttpServer())
      .post(apiPrefix)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    experienceId = res.body.id;

    expect(res.body).toHaveProperty('employer', createDto.employer);
  });

  it('should fail to create experience without token', async () => {
    await request(app.getHttpServer())
      .post(apiPrefix)
      .send({ candidateId })
      .expect(401);
  });

  it('should get all experiences for candidate', async () => {
    const res = await request(app.getHttpServer())
      .get(apiPrefix)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ candidateId })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should get a specific experience by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`${apiPrefix}/${experienceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', experienceId);
  });

  it('should update an experience', async () => {
    const res = await request(app.getHttpServer())
      .put(`${apiPrefix}/${experienceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ employer: 'Updated Title' })
      .expect(200);

    expect(res.body).toHaveProperty('employer', 'Updated Title');
  });

  it('should delete an experience', async () => {
    await request(app.getHttpServer())
      .delete(`${apiPrefix}/${experienceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const exp = await prisma.experiences.findUnique({
      where: { id: experienceId },
    });
    expect(exp).toBeNull();
  });
});
