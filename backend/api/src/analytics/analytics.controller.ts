import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track/view')
  async trackJobView(
    @Body() body: { jobId: string; userId?: string },
    @Req() req: any,
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return await this.analyticsService.trackJobView(
      body.jobId,
      body.userId,
      ipAddress,
      userAgent,
    );
  }

  @Post('track/apply')
  async trackApplyClick(
    @Body() body: { jobId: string; userId?: string },
    @Req() req: any,
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return await this.analyticsService.trackApplyClick(
      body.jobId,
      body.userId,
      ipAddress,
      userAgent,
    );
  }

  @Post('track/session/start')
  async startUserSession(
    @Body() body: { userId?: string },
    @Req() req: any,
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return await this.analyticsService.startUserSession(
      body.userId,
      ipAddress,
      userAgent,
    );
  }

  @Post('track/session/end')
  async endUserSession(@Body() body: { sessionId: string }, @Req() req: any) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return await this.analyticsService.endUserSession(body.sessionId);
  }

  @Get('summary')
  async getAnalyticsSummary(@Req() req: any, @Query('days') days?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    return await this.analyticsService.getAnalyticsSummary(daysNumber);
  }

  @Get('job/:jobId')
  async getJobAnalytics(
    @Req() req: any,
    @Param('jobId') jobId: string,
    @Query('days') days?: string,
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    return await this.analyticsService.getJobAnalytics(jobId, daysNumber);
  }

  @Get('details')
  async getAnalyticsDetails(@Req() req: any, @Query('days') days?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    return await this.analyticsService.getAnalyticsDetails(daysNumber);
  }

  @Get('details/job-views')
  async getDetailedJobViews(@Req() req: any, @Query('days') days?: string, @Query('limit') limit?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    const limitNumber = limit ? parseInt(limit) : 50;
    return await this.analyticsService.getDetailedJobViews(daysNumber, limitNumber);
  }

  @Get('details/apply-clicks')
  async getDetailedApplyClicks(@Req() req: any, @Query('days') days?: string, @Query('limit') limit?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    const limitNumber = limit ? parseInt(limit) : 50;
    return await this.analyticsService.getDetailedApplyClicks(daysNumber, limitNumber);
  }

  @Get('details/user-sessions')
  async getDetailedUserSessions(@Req() req: any, @Query('days') days?: string, @Query('limit') limit?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    const limitNumber = limit ? parseInt(limit) : 50;
    return await this.analyticsService.getDetailedUserSessions(daysNumber, limitNumber);
  }
} 