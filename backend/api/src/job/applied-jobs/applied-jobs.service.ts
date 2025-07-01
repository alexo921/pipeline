import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ApplyJobDto } from './dto/apply-job-dto';

@Injectable()
export class AppliedJobsService {
  constructor(private prisma: PrismaService) {}

  async setAppliedJob({ userId, jobId, jobUrl }: ApplyJobDto): Promise<any> {
    const existingJob = await this.prisma.applied_jobs.findFirst({
      where: {
        userId: userId,
        jobId: jobId,
      },
    });

    if (existingJob) {
      return existingJob;
    }

    return await this.prisma.applied_jobs.create({
      data: {
        userId,
        jobId,
        appliedDate: new Date(),
        jobUrl,
      },
    });
  }
}
