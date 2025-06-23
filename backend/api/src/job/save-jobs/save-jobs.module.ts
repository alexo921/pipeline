import { Module } from '@nestjs/common';
import { SaveJobsController } from './save-jobs.controller';
import { SaveJobsService } from './save-jobs.service';

@Module({
  controllers: [SaveJobsController],
  providers: [SaveJobsService]
})
export class SaveJobsModule {}
