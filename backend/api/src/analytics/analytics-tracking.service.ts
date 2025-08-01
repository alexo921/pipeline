import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { InternalAnalyticsService } from './internal-analytics.service';

// Data classes for analytics tracking
export class AnalyticsEvent {
  constructor(
    public readonly eventType: string,
    public readonly eventData: Record<string, any>,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class JobViewEvent extends AnalyticsEvent {
  constructor(
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly companyName: string,
    public readonly location: string,
    public readonly salary?: string,
    public readonly tags: string[] = [],
    public readonly source: 'job_list' | 'search' | 'filter' | 'recommendation' = 'job_list',
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('job_view', {
      jobId,
      jobTitle,
      companyName,
      location,
      salary,
      tags,
      source,
    }, userId, sessionId, timestamp);
  }
}

export class JobApplyEvent extends AnalyticsEvent {
  constructor(
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly companyName: string,
    public readonly location: string,
    public readonly salary?: string,
    public readonly tags: string[] = [],
    public readonly source: 'job_details' | 'job_list' | 'search' = 'job_details',
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('job_apply', {
      jobId,
      jobTitle,
      companyName,
      location,
      salary,
      tags,
      source,
    }, userId, sessionId, timestamp);
  }
}

export class SearchEvent extends AnalyticsEvent {
  constructor(
    public readonly searchTerm: string,
    public readonly filters: Record<string, any>,
    public readonly resultCount: number,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('search', {
      searchTerm,
      filters,
      resultCount,
    }, userId, sessionId, timestamp);
  }
}

export class FilterEvent extends AnalyticsEvent {
  constructor(
    public readonly filterType: 'location' | 'job_setting' | 'employment_type' | 'shift',
    public readonly filterValue: string,
    public readonly resultCount: number,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('filter', {
      filterType,
      filterValue,
      resultCount,
    }, userId, sessionId, timestamp);
  }
}

export class UserSessionEvent extends AnalyticsEvent {
  constructor(
    public readonly action: 'start' | 'end',
    public readonly sessionDuration?: number, // in seconds
    public readonly pagesVisited?: number,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('session', {
      action,
      sessionDuration,
      pagesVisited,
    }, userId, sessionId, timestamp);
  }
}

export class UserRegistrationEvent extends AnalyticsEvent {
  constructor(
    public readonly registrationMethod: 'email' | 'google' | 'facebook',
    public readonly source: 'job_board' | 'email_campaign' | 'referral' | 'organic',
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('user_registration', {
      registrationMethod,
      source,
    }, userId, undefined, timestamp);
  }
}

export class JobSaveEvent extends AnalyticsEvent {
  constructor(
    public readonly jobId: string,
    public readonly action: 'save' | 'unsave',
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super('job_save', {
      jobId,
      action,
    }, userId, undefined, timestamp);
  }
}

@Injectable()
export class AnalyticsTrackingService {
  constructor(
    private prisma: PrismaService,
    private internalAnalytics: InternalAnalyticsService,
  ) {}

  // Track any analytics event
  async trackEvent(event: AnalyticsEvent, ipAddress?: string, userAgent?: string) {
    // Store in database
    await this.storeEvent(event, ipAddress, userAgent);
    
    // Send to external analytics (Google Analytics, etc.)
    await this.sendToExternalAnalytics(event);
    
    // Send to internal analytics dashboard
    await this.sendToInternalAnalytics(event, ipAddress, userAgent);
    
    return event;
  }

  // Track job view with enhanced data
  async trackJobView(
    jobId: string,
    jobTitle: string,
    companyName: string,
    location: string,
    salary?: string,
    tags: string[] = [],
    source: 'job_list' | 'search' | 'filter' | 'recommendation' = 'job_list',
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new JobViewEvent(
      jobId,
      jobTitle,
      companyName,
      location,
      salary,
      tags,
      source,
      userId,
      sessionId,
    );

    // Store in existing job_views table for backward compatibility
    await this.prisma.job_views.create({
      data: {
        jobId,
        userId,
        ipAddress,
        userAgent,
      },
    });

    // Track enhanced event
    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track job apply with enhanced data
  async trackJobApply(
    jobId: string,
    jobTitle: string,
    companyName: string,
    location: string,
    salary?: string,
    tags: string[] = [],
    source: 'job_details' | 'job_list' | 'search' = 'job_details',
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new JobApplyEvent(
      jobId,
      jobTitle,
      companyName,
      location,
      salary,
      tags,
      source,
      userId,
      sessionId,
    );

    // Store in existing apply_clicks table for backward compatibility
    await this.prisma.apply_clicks.create({
      data: {
        jobId,
        userId,
        ipAddress,
        userAgent,
      },
    });

    // Track enhanced event
    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track search events
  async trackSearch(
    searchTerm: string,
    filters: Record<string, any>,
    resultCount: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new SearchEvent(
      searchTerm,
      filters,
      resultCount,
      userId,
      sessionId,
    );

    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track filter events
  async trackFilter(
    filterType: 'location' | 'job_setting' | 'employment_type' | 'shift',
    filterValue: string,
    resultCount: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new FilterEvent(
      filterType,
      filterValue,
      resultCount,
      userId,
      sessionId,
    );

    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track user session events
  async trackUserSession(
    action: 'start' | 'end',
    sessionDuration?: number,
    pagesVisited?: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new UserSessionEvent(
      action,
      sessionDuration,
      pagesVisited,
      userId,
      sessionId,
    );

    if (action === 'start') {
      // Store in existing user_sessions table for backward compatibility
      await this.prisma.user_sessions.create({
        data: {
          userId,
          ipAddress,
          userAgent,
        },
      });
    } else if (action === 'end' && sessionId) {
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });
    }

    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track user registration
  async trackUserRegistration(
    registrationMethod: 'email' | 'google' | 'facebook',
    source: 'job_board' | 'email_campaign' | 'referral' | 'organic',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new UserRegistrationEvent(
      registrationMethod,
      source,
      userId,
    );

    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Track job save/unsave
  async trackJobSave(
    jobId: string,
    action: 'save' | 'unsave',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = new JobSaveEvent(
      jobId,
      action,
      userId,
    );

    return await this.trackEvent(event, ipAddress, userAgent);
  }

  // Private methods for storing and sending events
  private async storeEvent(event: AnalyticsEvent, ipAddress?: string, userAgent?: string) {
    // Store in analytics_events table (you'll need to create this)
    try {
      await this.prisma.analytics_events.create({
        data: {
          eventType: event.eventType,
          eventData: event.eventData,
          userId: event.userId,
          sessionId: event.sessionId,
          ipAddress,
          userAgent,
          timestamp: event.timestamp,
        },
      });
    } catch (error) {
      // If analytics_events table doesn't exist, log the event
      console.log('Analytics event:', {
        eventType: event.eventType,
        eventData: event.eventData,
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress,
        userAgent,
        timestamp: event.timestamp,
      });
    }
  }

  private async sendToExternalAnalytics(event: AnalyticsEvent) {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;
      
      switch (event.eventType) {
        case 'job_view':
          gtag('event', 'job_view', {
            job_id: event.eventData.jobId,
            job_title: event.eventData.jobTitle,
            company_name: event.eventData.companyName,
            location: event.eventData.location,
            salary: event.eventData.salary,
            tags: event.eventData.tags,
            source: event.eventData.source,
            user_id: event.userId,
          });
          break;
          
        case 'job_apply':
          gtag('event', 'job_apply', {
            job_id: event.eventData.jobId,
            job_title: event.eventData.jobTitle,
            company_name: event.eventData.companyName,
            location: event.eventData.location,
            salary: event.eventData.salary,
            tags: event.eventData.tags,
            source: event.eventData.source,
            user_id: event.userId,
          });
          break;
          
        case 'search':
          gtag('event', 'search', {
            search_term: event.eventData.searchTerm,
            filters: event.eventData.filters,
            result_count: event.eventData.resultCount,
            user_id: event.userId,
          });
          break;
          
        case 'filter':
          gtag('event', 'filter', {
            filter_type: event.eventData.filterType,
            filter_value: event.eventData.filterValue,
            result_count: event.eventData.resultCount,
            user_id: event.userId,
          });
          break;
          
        case 'user_registration':
          gtag('event', 'user_registration', {
            registration_method: event.eventData.registrationMethod,
            source: event.eventData.source,
            user_id: event.userId,
          });
          break;
          
        case 'job_save':
          gtag('event', 'job_save', {
            job_id: event.eventData.jobId,
            action: event.eventData.action,
            user_id: event.userId,
          });
          break;
      }
    }
  }

  private async sendToInternalAnalytics(event: AnalyticsEvent, ipAddress?: string, userAgent?: string) {
    try {
      switch (event.eventType) {
        case 'job_view':
          await this.internalAnalytics.trackJobView(
            event.eventData.jobId,
            event.eventData.jobTitle,
            event.eventData.companyName,
            event.eventData.location,
            event.eventData.salary,
            event.eventData.tags,
            event.eventData.source,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'job_apply':
          await this.internalAnalytics.trackJobApply(
            event.eventData.jobId,
            event.eventData.jobTitle,
            event.eventData.companyName,
            event.eventData.location,
            event.eventData.salary,
            event.eventData.tags,
            event.eventData.source,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'search':
          await this.internalAnalytics.trackSearch(
            event.eventData.searchTerm,
            event.eventData.filters,
            event.eventData.resultCount,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'filter':
          await this.internalAnalytics.trackFilter(
            event.eventData.filterType,
            event.eventData.filterValue,
            event.eventData.resultCount,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'user_registration':
          await this.internalAnalytics.trackUserRegistration(
            event.eventData.registrationMethod,
            event.eventData.source,
            event.userId!,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'job_save':
          await this.internalAnalytics.trackJobSave(
            event.eventData.jobId,
            event.eventData.action,
            event.userId!,
            ipAddress,
            userAgent,
          );
          break;
          
        case 'session':
          await this.internalAnalytics.trackUserSession(
            event.eventData.action,
            event.eventData.sessionDuration,
            event.eventData.pagesVisited,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
          
        default:
          // Send custom events
          await this.internalAnalytics.trackCustomEvent(
            event.eventType,
            event.eventData,
            event.userId,
            event.sessionId,
            ipAddress,
            userAgent,
          );
          break;
      }
    } catch (error) {
      console.error('Error sending to internal analytics:', error);
    }
  }
} 