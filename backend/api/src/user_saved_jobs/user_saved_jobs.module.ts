import { Module } from '@nestjs/common';
import { UserSavedJobsService } from './user_saved_jobs.service';
import { UserSavedJobsController } from './user_saved_jobs.controller';

@Module({
  controllers: [UserSavedJobsController],
  providers: [UserSavedJobsService],
})
export class UserSavedJobsModule {}
