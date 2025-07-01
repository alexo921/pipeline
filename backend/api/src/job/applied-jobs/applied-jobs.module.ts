import { Module } from '@nestjs/common';
import { AppliedJobsController } from './applied-jobs.controller';
import { AppliedJobsService } from './applied-jobs.service';

@Module({
  controllers: [AppliedJobsController],
  providers: [AppliedJobsService]
})
export class AppliedJobsModule {}
