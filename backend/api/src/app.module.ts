import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { CandidateModule } from './candidate/candidate.module';
import { JobModule } from './job/job.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './email/email.module';
import { UserEventsListener } from './email/user-events.listener';
import { JobsService } from './email/jobs.service';
import { QueueModule } from './queue/queue.module';
import { UnsubscribeModule } from './unsubscribe/unsubscribe.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IntakeFormsModule } from './intake-forms/intake-forms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
        
      ],
    }),
    ProjectsModule,
    TasksModule,
    UsersModule,
    AuthModule,
    PrismaModule,
    CandidateModule,
    JobModule,
    QueueModule,
    EmailModule,
    UnsubscribeModule,
    AnalyticsModule,
    IntakeFormsModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [UserEventsListener, JobsService],
})
export class AppModule {}
