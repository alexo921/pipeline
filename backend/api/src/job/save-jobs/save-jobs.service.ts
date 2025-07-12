import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class SaveJobsService {
  constructor(private prisma: PrismaService) {}

  async getSavedJobByJobId(userId: string, jobId: string) {
    return this.prisma.saved_jobs.findFirst({
      where: {
        userId: userId,
        jobId: jobId,
      },
    });
  }

  async getSavedJobs(userId: string) {
    return await this.prisma.saved_jobs.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async removeSavedJob(userId: string, jobId: string) {
    const savedJob = await this.prisma.saved_jobs.findFirst({
      where: {
        userId,
        jobId,
      },
    });

    if (!savedJob) {
      throw new Error('Saved job not found');
    }

    return this.prisma.saved_jobs.delete({
      where: {
        id: savedJob.id,
      },
    });
  }

  async addSavedJob(userId: string, jobId: string) {
    // Check if the job is already saved for the user
    const existingJob = await this.getSavedJobByJobId(userId, jobId);

    if (existingJob) {
      return existingJob; // Job already saved, return it
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
