import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { createCandidateUser } from './utils/helper';

describe('Job Controller ', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobId: string;
  let token: string;
  let userId: string;

  const apiPrefix = '/job';

  const jobData = {
    title: 'Home Health Aide/HHA',
    company: 'BrightStar Care',
    location: 'Melbourne, FL',
    description:
      'CompetitiveMelbourne,FL32940CNACHHAPart TimeDay ShiftWeekdayWeekendJOB DESCRIPTIONHome Health Aide / HHA...',
    url: `https://w.mjobs.com/job-listings/494251/home-health-aide-hha.html?searchId=1750101598.${Date.now()}&page=1`,
    source: 'myCNAjobs',
    scrapedDate: new Date('2025-06-16'),
    postedDate: new Date('2025-05-15'),
    jobType: 'Part Time',
    duties: [
      'Provide client care according to approved Plan of Care',
      'Assist clients with personal care and hygiene',
      'Provide transportation as required',
      'Assist in providing a safe environment for client',
      'Comply with all documentation and record keeping',
    ],
    requirements: [
      'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
    ],
    benefits: [
      'Weekly pay Live-in opportunities Private home environment Each independently owned BrightStar location makes more possible for the community it serves.',
    ],
    shift: 'Day Shift, Weekday, Weekend',
    city: 'Melbourne',
    state: 'FL',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Create a candidate user for testing
    const { user, token: jwt } = await createCandidateUser(prisma, app);
    token = jwt;
    userId = user.id;

    // Create a job for testing
    const job = await prisma.jobs.create({
      data: jobData,
    });

    jobId = job.id;
  });

  afterAll(async () => {
    // delete the candidate and user created for testing
    await prisma.candidates.deleteMany({ where: { userId } });

    // Then delete the user
    await prisma.users.delete({ where: { id: userId } });

    await prisma.saved_jobs.deleteMany({ where: { userId } });
    await prisma.jobs.delete({ where: { id: jobId } });
    await app.close();
  });

  it(`GET ${apiPrefix} - should return all jobs`, async () => {
    const res = await request(app.getHttpServer()).get(apiPrefix).expect(200);

    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.jobs[0]).toHaveProperty('title');
    expect(res.body.jobs[0]).toHaveProperty('company');
  });

  it(`GET ${apiPrefix}/:id - should return job by id`, async () => {
    const res = await request(app.getHttpServer())
      .get(`${apiPrefix}/${jobId}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', jobId);
    expect(res.body).toHaveProperty('title', jobData.title);
    expect(res.body).toHaveProperty('company', jobData.company);
  });

  it(`GET ${apiPrefix}/:id - should return 404 for invalid id`, async () => {
    await request(app.getHttpServer())
      .get(`${apiPrefix}/non-existent-id`)
      .expect(404);
  });

  describe('Save Job By Candidate', () => {
    const savedJobApiPrefix = '/save-jobs';

    it('POST - should save a job for the user', async () => {
      const res = await request(app.getHttpServer())
        .post(`${savedJobApiPrefix}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.jobId).toBe(jobId);
    });

    it('GET - should return all saved jobs for the user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${savedJobApiPrefix}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('jobId', jobId);
    });

    it('DELETE - should delete a saved job for the user', async () => {
      await request(app.getHttpServer())
        .delete(`${savedJobApiPrefix}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId })
        .expect(200);

      const savedJobs = await prisma.saved_jobs.findMany({ where: { userId } });
      expect(savedJobs.find((j) => j.jobId === jobId)).toBeUndefined();
    });
  });

  
});
