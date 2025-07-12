import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ApplyJobDto } from './dto/apply-job-dto';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class AppliedJobsService {
  constructor(private prisma: PrismaService) {}

  async applyForJob(userId: string, jobId: string) {
    const existingJob = await this.prisma.applied_jobs.findFirst({
      where: {
        userId,
        jobId,
      },
    });

    if (existingJob) {
      throw new ConflictException('You have already applied for this job');
    }

    return await this.prisma.applied_jobs.create({
      data: {
        userId,
        jobId,
      },
    });
  }
}
