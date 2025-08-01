import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InternalAnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'pipeline_web';
  version: string;
}

@Injectable()
export class InternalAnalyticsService {
  private readonly logger = new Logger(InternalAnalyticsService.name);
  private readonly internalDashboardUrl: string | undefined;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.internalDashboardUrl = this.configService.get<string>('INTERNAL_ANALYTICS_URL');
    this.isEnabled = this.configService.get<boolean>('INTERNAL_ANALYTICS_ENABLED', true);
  }

  /**
   * Send analytics event to internal dashboard
   */
  async sendToInternalDashboard(event: InternalAnalyticsEvent): Promise<boolean> {
    if (!this.isEnabled || !this.internalDashboardUrl) {
      this.logger.debug('Internal analytics disabled or URL not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.internalDashboardUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'pipeline_web',
          'X-Version': '1.0.0',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        this.logger.error(`Failed to send to internal dashboard: ${response.status} ${response.statusText}`);
        return false;
      }

      this.logger.debug(`Successfully sent ${event.eventType} event to internal dashboard`);
      return true;
    } catch (error) {
      this.logger.error('Error sending to internal dashboard:', error);
      return false;
    }
  }

  /**
   * Send job view event to internal dashboard
   */
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
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'job_view',
      eventData: {
        jobId,
        jobTitle,
        companyName,
        location,
        salary,
        tags,
        source,
        platform: 'web',
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send job apply event to internal dashboard
   */
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
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'job_apply',
      eventData: {
        jobId,
        jobTitle,
        companyName,
        location,
        salary,
        tags,
        source,
        platform: 'web',
        conversion: true,
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send search event to internal dashboard
   */
  async trackSearch(
    searchTerm: string,
    filters: Record<string, any>,
    resultCount: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'search',
      eventData: {
        searchTerm,
        filters,
        resultCount,
        platform: 'web',
        searchQuality: this.calculateSearchQuality(resultCount),
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send filter event to internal dashboard
   */
  async trackFilter(
    filterType: 'location' | 'job_setting' | 'employment_type' | 'shift',
    filterValue: string,
    resultCount: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'filter',
      eventData: {
        filterType,
        filterValue,
        resultCount,
        platform: 'web',
        filterEffectiveness: this.calculateFilterEffectiveness(resultCount),
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send user registration event to internal dashboard
   */
  async trackUserRegistration(
    registrationMethod: 'email' | 'google' | 'facebook',
    source: 'job_board' | 'email_campaign' | 'referral' | 'organic',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'user_registration',
      eventData: {
        registrationMethod,
        source,
        platform: 'web',
        acquisitionChannel: source,
      },
      userId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send job save event to internal dashboard
   */
  async trackJobSave(
    jobId: string,
    action: 'save' | 'unsave',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'job_save',
      eventData: {
        jobId,
        action,
        platform: 'web',
        engagement: action === 'save' ? 'positive' : 'negative',
      },
      userId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send session event to internal dashboard
   */
  async trackUserSession(
    action: 'start' | 'end',
    sessionDuration?: number,
    pagesVisited?: number,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType: 'session',
      eventData: {
        action,
        sessionDuration,
        pagesVisited,
        platform: 'web',
        sessionQuality: this.calculateSessionQuality(sessionDuration, pagesVisited),
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send custom event to internal dashboard
   */
  async trackCustomEvent(
    eventType: string,
    eventData: Record<string, any>,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const event: InternalAnalyticsEvent = {
      eventType,
      eventData: {
        ...eventData,
        platform: 'web',
      },
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      source: 'pipeline_web',
      version: '1.0.0',
    };

    return await this.sendToInternalDashboard(event);
  }

  /**
   * Send batch events to internal dashboard
   */
  async sendBatchEvents(events: InternalAnalyticsEvent[]): Promise<boolean> {
    if (!this.isEnabled || !this.internalDashboardUrl) {
      return false;
    }

    try {
      const response = await fetch(`${this.internalDashboardUrl}/api/analytics/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'pipeline_web',
          'X-Version': '1.0.0',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        this.logger.error(`Failed to send batch to internal dashboard: ${response.status}`);
        return false;
      }

      this.logger.debug(`Successfully sent ${events.length} events to internal dashboard`);
      return true;
    } catch (error) {
      this.logger.error('Error sending batch to internal dashboard:', error);
      return false;
    }
  }

  /**
   * Calculate search quality score based on result count
   */
  private calculateSearchQuality(resultCount: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (resultCount >= 20) return 'excellent';
    if (resultCount >= 10) return 'good';
    if (resultCount >= 5) return 'fair';
    return 'poor';
  }

  /**
   * Calculate filter effectiveness based on result count
   */
  private calculateFilterEffectiveness(resultCount: number): 'high' | 'medium' | 'low' {
    if (resultCount >= 15) return 'high';
    if (resultCount >= 5) return 'medium';
    return 'low';
  }

  /**
   * Calculate session quality based on duration and pages visited
   */
  private calculateSessionQuality(duration?: number, pagesVisited?: number): 'high' | 'medium' | 'low' {
    if (!duration || !pagesVisited) return 'low';
    
    const avgTimePerPage = duration / pagesVisited;
    if (pagesVisited >= 5 && avgTimePerPage >= 30) return 'high';
    if (pagesVisited >= 3 && avgTimePerPage >= 15) return 'medium';
    return 'low';
  }

  /**
   * Get internal dashboard configuration status
   */
  getConfigurationStatus() {
    return {
      enabled: this.isEnabled,
      urlConfigured: !!this.internalDashboardUrl,
      url: this.internalDashboardUrl,
    };
  }
} 