import { Injectable } from '@nestjs/common';
import { CreateUserSavedJobDto } from './dto/create-user_saved_job.dto';
import { UpdateUserSavedJobDto } from './dto/update-user_saved_job.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserSavedJobsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create() {
    const user_saved_job = {
      userId: '67811873-1beb-4f1b-8e73-2614295cfcef',
      jobId: '572c35ad-aafe-4740-8af6-fa61cde00cc6',
      notes: 'Looking forward to applying for this job.',
      status: 'saved',
      appliedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await this.prismaService.saved_jobs.create({ data: user_saved_job });
  }

  findAll() {
    return `This action returns all userSavedJobs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userSavedJob`;
  }

  update(id: number, updateUserSavedJobDto: UpdateUserSavedJobDto) {
    return `This action updates a #${id} userSavedJob`;
  }

  remove(id: number) {
    return `This action removes a #${id} userSavedJob`;
  }
}
