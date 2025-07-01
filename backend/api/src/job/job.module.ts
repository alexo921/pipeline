import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { SaveJobsModule } from './save-jobs/save-jobs.module';
import { AppliedJobsModule } from './applied-jobs/applied-jobs.module';

@Module({
  controllers: [JobController],
  providers: [JobService],
  imports: [SaveJobsModule, AppliedJobsModule],
})
export class JobModule {}
