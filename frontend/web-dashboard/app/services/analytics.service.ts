// Frontend Analytics Service for tracking user interactions
export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface JobViewEvent {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary?: string;
  tags: string[];
  source: 'job_list' | 'search' | 'filter' | 'recommendation';
  userId?: string;
  sessionId?: string;
}

export interface JobApplyEvent {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary?: string;
  tags: string[];
  source: 'job_details' | 'job_list' | 'search';
  userId?: string;
  sessionId?: string;
}

export interface SearchEvent {
  searchTerm: string;
  filters: Record<string, any>;
  resultCount: number;
  userId?: string;
  sessionId?: string;
}

export interface FilterEvent {
  filterType: 'location' | 'job_setting' | 'employment_type' | 'shift';
  filterValue: string;
  resultCount: number;
  userId?: string;
  sessionId?: string;
}

export interface UserSessionEvent {
  action: 'start' | 'end';
  sessionDuration?: number;
  pagesVisited?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserRegistrationEvent {
  registrationMethod: 'email' | 'google' | 'facebook';
  source: 'job_board' | 'email_campaign' | 'referral' | 'organic';
  userId: string;
}

export interface JobSaveEvent {
  jobId: string;
  action: 'save' | 'unsave';
  userId: string;
}

class AnalyticsService {
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private pagesVisited: number = 0;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeSession();
    }
  }

  private initializeSession() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Generate or retrieve session ID
    this.sessionId = localStorage.getItem('analytics_session_id') || this.generateSessionId();
    localStorage.setItem('analytics_session_id', this.sessionId);
    
    // Track session start
    this.sessionStartTime = Date.now();
    this.trackSession('start');
    
    // Track page view
    this.trackPageView();
    
    // Set up beforeunload to track session end
    window.addEventListener('beforeunload', () => {
      this.trackSession('end');
    });
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getUserId(): string | undefined {
    // Only run on client side
    if (typeof window === 'undefined') return undefined;
    
    // Get user ID from localStorage or context
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.warn('Failed to send analytics event to backend:', response.status);
      }
    } catch (error) {
      console.warn('Error sending analytics event:', error);
    }
  }

  private sendToGoogleAnalytics(event: AnalyticsEvent) {
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
          
        case 'page_view':
          gtag('event', 'page_view', {
            page_title: event.eventData.pageTitle,
            page_location: event.eventData.pageLocation,
            user_id: event.userId,
          });
          break;
      }
    }
  }

  private async trackEvent(event: AnalyticsEvent) {
    // Send to backend
    await this.sendToBackend(event);
    
    // Send to Google Analytics
    this.sendToGoogleAnalytics(event);
    
    return event;
  }

  // Public tracking methods
  async trackJobView(data: JobViewEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'job_view',
      eventData: data,
      userId: data.userId || this.getUserId(),
      sessionId: data.sessionId || this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  async trackJobApply(data: JobApplyEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'job_apply',
      eventData: data,
      userId: data.userId || this.getUserId(),
      sessionId: data.sessionId || this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  async trackSearch(data: SearchEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'search',
      eventData: data,
      userId: data.userId || this.getUserId(),
      sessionId: data.sessionId || this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  async trackFilter(data: FilterEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'filter',
      eventData: data,
      userId: data.userId || this.getUserId(),
      sessionId: data.sessionId || this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  async trackUserRegistration(data: UserRegistrationEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'user_registration',
      eventData: data,
      userId: data.userId,
      sessionId: this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  async trackJobSave(data: JobSaveEvent) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType: 'job_save',
      eventData: data,
      userId: data.userId,
      sessionId: this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  private async trackPageView() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    this.pagesVisited++;
    
    const event: AnalyticsEvent = {
      eventType: 'page_view',
      eventData: {
        pageTitle: document.title,
        pageLocation: window.location.href,
        pagePath: window.location.pathname,
      },
      userId: this.getUserId(),
      sessionId: this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

    private async trackSession(action: 'start' | 'end') {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    let sessionDuration: number | undefined;
    
    if (action === 'end' && this.sessionStartTime) {
      sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }
    
    const event: AnalyticsEvent = {
      eventType: 'session',
      eventData: {
        action,
        sessionDuration,
        pagesVisited: this.pagesVisited,
      },
      userId: this.getUserId(),
      sessionId: this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  // Utility method to track custom events
  async trackCustomEvent(eventType: string, eventData: Record<string, any>) {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const event: AnalyticsEvent = {
      eventType,
      eventData,
      userId: this.getUserId(),
      sessionId: this.sessionId || undefined,
      timestamp: new Date(),
    };

    return await this.trackEvent(event);
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      pagesVisited: this.pagesVisited,
      userId: this.getUserId(),
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 