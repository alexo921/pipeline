import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly emailService: EmailService, private readonly prisma: PrismaService) {}

  @Cron('0 8 * * 1') // Every Monday at 8am
  async sendWeeklyTopJobs() {
    // Find all candidates who are onboarded and join users for email
    const candidates = await this.prisma.candidates.findMany({
      where: { isOnboarded: true },
      include: { user: true },
    });
    for (const candidate of candidates) {
      await this.emailService.sendTemplateMail(
        candidate.user.email,
        'Top 10 Jobs This Week',
        'top_10_jobs_this_week',
        {}
      );
    }
  }
} 