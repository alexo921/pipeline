import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  JobStatus,
  OnboardingStep,
  ShiftType,
  WorkType,
} from 'src/common/enums/enums';

export async function createCandidateUser(
  prisma: PrismaService,
  app: INestApplication,
  overrides: { email?: string } = {},
) {
  const password = 'testpass123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = overrides.email || 'candidate-test-user@example.com';

  const user = await prisma.users.create({
    data: {
      name: 'Candidate User',
      email,
      password: hashedPassword,
      role: 'CANDIDATE',
    },
  });

  const candidate = await prisma.candidates.create({
    data: {
      name: 'Exp User',
      email: email,
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

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password });

  return {
    user,
    candidate,
    token: res.body.token,
  };
}
