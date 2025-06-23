import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SaveJobDto } from './dto/save-job.dto';

@Injectable()
export class SaveJobsService {
  constructor(private prisma: PrismaService) {}

  async getSavedJob(userId: string, jobId: string): Promise<any> {
    return this.prisma.saved_jobs.findFirst({
      where: {
        userId: userId,
        jobId: jobId,
      },
    });
  }

  async saveJob(data: SaveJobDto): Promise<any> {
    const getSavedJob = await this.getSavedJob(data.userId, data.jobId);

    if (getSavedJob) {
      // If the job is already saved, return it or throw an error
      throw new Error('Job already saved');
    }

    return this.prisma.saved_jobs.create({ data });
  }

  async deleteSavedJob(userId: string, jobId: string): Promise<any> {
    const savedJob = await this.getSavedJob(userId, jobId);

    if (!savedJob) {
      throw new Error('Saved job not found');
    }

    return this.prisma.saved_jobs.delete({
      where: {
        saved_jobs_user_job_unique: {
          jobId,
          userId,
        },
      },
    });
  }

  async addSavedJob(userId: string, jobId: string) {
    const existingJob = await this.prisma.saved_jobs.findFirst({
      where: {
        userId,
        jobId,
      },
    });

    if (existingJob) {
      return { message: 'Job already saved for this user.' };
    }

    const savedJob = await this.prisma.saved_jobs.create({
      data: {
        userId,
        jobId,
      },
    });

    return savedJob;
  }
}
