import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsTrackingService: AnalyticsTrackingService,
  ) {}

  @Post('track/view')
  async trackJobView(
    @Body() body: { jobId: string; userId?: string },
    @Req() req: any,
  ) {
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
    return await this.analyticsService.endUserSession(body.sessionId);
  }

  @Post('track')
  async trackEvent(
    @Body() body: { 
      eventType: string; 
      eventData: Record<string, any>; 
      userId?: string; 
      sessionId?: string; 
      timestamp?: string;
    },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Create the appropriate event based on eventType
    switch (body.eventType) {
      case 'job_view':
        return await this.analyticsTrackingService.trackJobView(
          body.eventData.jobId,
          body.eventData.jobTitle,
          body.eventData.companyName,
          body.eventData.location,
          body.eventData.salary,
          body.eventData.tags || [],
          body.eventData.source || 'job_list',
          body.userId,
          body.sessionId,
          ipAddress,
          userAgent,
        );
        
      case 'job_apply':
        return await this.analyticsTrackingService.trackJobApply(
          body.eventData.jobId,
          body.eventData.jobTitle,
          body.eventData.companyName,
          body.eventData.location,
          body.eventData.salary,
          body.eventData.tags || [],
          body.eventData.source || 'job_details',
          body.userId,
          body.sessionId,
          ipAddress,
          userAgent,
        );
        
      case 'search':
        return await this.analyticsTrackingService.trackSearch(
          body.eventData.searchTerm,
          body.eventData.filters || {},
          body.eventData.resultCount,
          body.userId,
          body.sessionId,
          ipAddress,
          userAgent,
        );
        
      case 'filter':
        return await this.analyticsTrackingService.trackFilter(
          body.eventData.filterType,
          body.eventData.filterValue,
          body.eventData.resultCount,
          body.userId,
          body.sessionId,
          ipAddress,
          userAgent,
        );
        
      case 'user_registration':
        return await this.analyticsTrackingService.trackUserRegistration(
          body.eventData.registrationMethod,
          body.eventData.source,
          body.userId!,
          ipAddress,
          userAgent,
        );
        
      case 'job_save':
        return await this.analyticsTrackingService.trackJobSave(
          body.eventData.jobId,
          body.eventData.action,
          body.userId!,
          ipAddress,
          userAgent,
        );
        
      case 'session':
        return await this.analyticsTrackingService.trackUserSession(
          body.eventData.action,
          body.eventData.sessionDuration,
          body.eventData.pagesVisited,
          body.userId,
          body.sessionId,
          ipAddress,
          userAgent,
        );
        
      default:
        // For custom events, use the generic trackEvent method
        const { AnalyticsEvent } = await import('./analytics-tracking.service');
        const event = new AnalyticsEvent(
          body.eventType,
          body.eventData,
          body.userId,
          body.sessionId,
          body.timestamp ? new Date(body.timestamp) : new Date(),
        );
        return await this.analyticsTrackingService.trackEvent(event, ipAddress, userAgent);
    }
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  async getAnalyticsSummary(@Req() req: any, @Query('days') days?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    return await this.analyticsService.getAnalyticsSummary(daysNumber);
  }

  @Get('job/:jobId')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async getAnalyticsDetails(@Req() req: any, @Query('days') days?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    return await this.analyticsService.getAnalyticsDetails(daysNumber);
  }

  @Get('internal/config')
  @UseGuards(AuthGuard('jwt'))
  async getInternalAnalyticsConfig(@Req() req: any) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return {
      status: 'success',
      data: this.analyticsTrackingService['internalAnalytics'].getConfigurationStatus(),
    };
  }

  @Get('details/job-views')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async getDetailedUserSessions(@Req() req: any, @Query('days') days?: string, @Query('limit') limit?: string) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const daysNumber = days ? parseInt(days) : 30;
    const limitNumber = limit ? parseInt(limit) : 50;
    return await this.analyticsService.getDetailedUserSessions(daysNumber, limitNumber);
  }

  @Get('events/batch')
  @UseGuards(AuthGuard('jwt'))
  async getAnalyticsEventsBatch(
    @Req() req: any, 
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('eventType') eventType?: string,
    @Query('days') days?: string
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const limitNumber = limit ? parseInt(limit) : 100;
    const offsetNumber = offset ? parseInt(offset) : 0;
    const daysNumber = days ? parseInt(days) : 30;

    try {
      const events = await this.analyticsTrackingService.getAnalyticsEventsBatch(
        limitNumber,
        offsetNumber,
        eventType,
        daysNumber
      );

      return {
        success: true,
        data: {
          events: events,
          pagination: {
            limit: limitNumber,
            offset: offsetNumber,
            total: events.length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          events: [],
          pagination: {
            limit: limitNumber,
            offset: offsetNumber,
            total: 0
          }
        }
      };
    }
  }

  @Post('events/batch')
  @UseGuards(AuthGuard('jwt'))
  async postAnalyticsEventsBatch(
    @Req() req: any,
    @Body() body: { events: any[] }
  ) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const results = await Promise.all(
        body.events.map(event => 
          this.analyticsTrackingService.trackEvent(event, ipAddress, userAgent)
        )
      );

      return {
        success: true,
        data: {
          processed: results.length,
          results: results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          processed: 0,
          results: []
        }
      };
    }
  }
} 