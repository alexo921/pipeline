import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(
    private readonly emailService: EmailService, 
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    // Schedule the weekly top jobs email when the module initializes
    await this.queueService.scheduleWeeklyTopJobs();
  }
} 