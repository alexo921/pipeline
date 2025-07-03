import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testUser;
  let accessToken: string = '';
  let sentToken: string;

  const rawPassword = 'testpass';
  const apiPrefix = '/auth';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendPasswordResetEmail: jest
          .fn()
          .mockImplementation((email: string, token: string) => {
            sentToken = token;
            return Promise.resolve();
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    testUser = await prismaService.users.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Test User',
      },
    });

    const res = await request(app.getHttpServer())
      .post(`${apiPrefix}/login`)
      .send({ email: testUser.email, password: rawPassword });

    accessToken = res.body.token;
  });

  afterAll(async () => {
    await prismaService.users.deleteMany({
      where: { email: testUser.email },
    });

    await app.close();
  });

  describe(`${apiPrefix}/login (POST)`, () => {
    it('should return token for valid credentials', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/login`)
        .send({ email: testUser.email, password: rawPassword })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
        });
    });

    it('should fail for invalid credentials', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/login`)
        .send({ email: 'wrong@mail.com', password: 'wrongpass' })
        .expect(401);
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/login`)
        .send({ email: testUser.email })
        .expect(400);
    });
  });

  describe(`${apiPrefix}/forgot-password (POST)`, () => {
    it('should return 201 for valid email', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/forgot-password`)
        .send({ email: testUser.email })
        .expect(201);
    });

    it('should fail for missing email', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/forgot-password`)
        .send({ email: '' })
        .expect(400);
    });
  });

  describe(`${apiPrefix}/change-password (POST)`, () => {
    it('should succeed with valid token and data', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/change-password`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: rawPassword,
          newPassword: 'NewPassword456!',
        })
        .expect(201);
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/change-password`)
        .send({
          currentPassword: rawPassword,
          newPassword: 'NewPassword456!',
        })
        .expect(401);
    });

    it('should fail with invalid current password', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/change-password`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpass',
          newPassword: 'AnotherNewPass1!',
        })
        .expect(401);
    });
  });
  
  describe(`${apiPrefix}/reset-password (POST)`, () => {
    it('should fail for missing newPassword and token', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/reset-password`)
        .send({})
        .expect(400);
    });

    it('should return 201 for valid email', () => {
      return request(app.getHttpServer())
        .post(`${apiPrefix}/reset-password`)
        .send({ token: sentToken, newPassword: 'NewPassword123!' })
        .expect(201);
    });
  });

});
