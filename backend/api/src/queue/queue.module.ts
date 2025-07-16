import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueueProcessor } from './processors/email-queue.processor';
import { ScheduledJobsProcessor } from './processors/scheduled-jobs.processor';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'redis'),
          port: configService.get('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3, // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 second delay
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'email-queue',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
        },
      },
      {
        name: 'scheduled-jobs',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
    ),
  ],
  controllers: [QueueController],
  providers: [EmailQueueProcessor, ScheduledJobsProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {} 