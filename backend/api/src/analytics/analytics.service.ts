import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackJobView(jobId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return await this.prisma.job_views.create({
      data: {
        jobId,
        userId,
        ipAddress,
        userAgent,
      },
    });
  }

  async trackApplyClick(jobId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return await this.prisma.apply_clicks.create({
      data: {
        jobId,
        userId,
        ipAddress,
        userAgent,
      },
    });
  }

  async startUserSession(userId?: string, ipAddress?: string, userAgent?: string) {
    return await this.prisma.user_sessions.create({
      data: {
        userId,
        ipAddress,
        userAgent,
      },
    });
  }

  async endUserSession(sessionId: string) {
    return await this.prisma.user_sessions.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  async getAnalyticsSummary(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalJobViews,
      totalApplyClicks,
      totalUsers,
      jobViewsByDay,
      applyClicksByDay,
      topViewedJobs,
      topAppliedJobs,
    ] = await Promise.all([
      // Total job views in the period
      this.prisma.job_views.count({
        where: { viewedAt: { gte: startDate } },
      }),
      // Total apply clicks in the period
      this.prisma.apply_clicks.count({
        where: { clickedAt: { gte: startDate } },
      }),
      // Total unique users in the period
      this.prisma.users.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Job views by day
      this.prisma.$queryRaw`
        SELECT DATE("viewedAt") as date, COUNT(*) as count
        FROM job_views
        WHERE "viewedAt" >= ${startDate}
        GROUP BY DATE("viewedAt")
        ORDER BY date DESC
        LIMIT ${days}
      `,
      // Apply clicks by day
      this.prisma.$queryRaw`
        SELECT DATE("clickedAt") as date, COUNT(*) as count
        FROM apply_clicks
        WHERE "clickedAt" >= ${startDate}
        GROUP BY DATE("clickedAt")
        ORDER BY date DESC
        LIMIT ${days}
      `,
      // Top viewed jobs
      this.prisma.job_views.groupBy({
        by: ['jobId'],
        where: { viewedAt: { gte: startDate } },
        _count: { jobId: true },
        orderBy: { _count: { jobId: 'desc' } },
        take: 10,
      }),
      // Top applied jobs
      this.prisma.apply_clicks.groupBy({
        by: ['jobId'],
        where: { clickedAt: { gte: startDate } },
        _count: { jobId: true },
        orderBy: { _count: { jobId: 'desc' } },
        take: 10,
      }),
    ]);

    // Get job details for top viewed and applied jobs
    const topViewedJobIds = topViewedJobs.map(job => job.jobId);
    const topAppliedJobIds = topAppliedJobs.map(job => job.jobId);

    const [topViewedJobDetails, topAppliedJobDetails] = await Promise.all([
      this.prisma.jobs.findMany({
        where: { id: { in: topViewedJobIds } },
        select: { id: true, title: true, company: true, location: true },
      }),
      this.prisma.jobs.findMany({
        where: { id: { in: topAppliedJobIds } },
        select: { id: true, title: true, company: true, location: true },
      }),
    ]);

    return {
      summary: {
        totalJobViews,
        totalApplyClicks,
        totalUsers,
        conversionRate: totalJobViews > 0 ? (totalApplyClicks / totalJobViews * 100).toFixed(2) : '0',
      },
      trends: {
        jobViewsByDay,
        applyClicksByDay,
      },
      topJobs: {
        viewed: topViewedJobs.map((job, index) => ({
          ...job,
          job: topViewedJobDetails.find(detail => detail.id === job.jobId),
        })),
        applied: topAppliedJobs.map((job, index) => ({
          ...job,
          job: topAppliedJobDetails.find(detail => detail.id === job.jobId),
        })),
      },
    };
  }

  async getJobAnalytics(jobId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [views, clicks, jobDetails] = await Promise.all([
      this.prisma.job_views.count({
        where: { jobId, viewedAt: { gte: startDate } },
      }),
      this.prisma.apply_clicks.count({
        where: { jobId, clickedAt: { gte: startDate } },
      }),
      this.prisma.jobs.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, company: true, location: true },
      }),
    ]);

    return {
      job: jobDetails,
      views,
      clicks,
      conversionRate: views > 0 ? (clicks / views * 100).toFixed(2) : '0',
    };
  }
} 