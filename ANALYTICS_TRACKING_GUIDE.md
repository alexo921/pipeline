# Analytics Tracking Guide

This guide covers the comprehensive analytics tracking system implemented for Pipeline, including data classes, tracking events, and integration with Google Analytics.

## Overview

The analytics system provides:
- **Type-safe tracking** with data classes
- **Comprehensive event tracking** for user interactions
- **Google Analytics 4 integration**
- **Backend storage** for detailed analytics
- **Session tracking** and user journey analysis

## Architecture

### Backend Components
- `AnalyticsTrackingService` - Core tracking service with data classes
- `AnalyticsController` - API endpoints for tracking
- `analytics_events` table - Database storage for all events

### Frontend Components
- `analyticsService` - Frontend tracking service
- Automatic session tracking
- Google Analytics 4 integration

## Data Classes

### Base Analytics Event
```typescript
export class AnalyticsEvent {
  constructor(
    public readonly eventType: string,
    public readonly eventData: Record<string, any>,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
```

### Job View Event
```typescript
export class JobViewEvent extends AnalyticsEvent {
  constructor(
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly companyName: string,
    public readonly location: string,
    public readonly salary?: string,
    public readonly tags: string[] = [],
    public readonly source: 'job_list' | 'search' | 'filter' | 'recommendation' = 'job_list',
    // ... other parameters
  ) {}
}
```

### Job Apply Event
```typescript
export class JobApplyEvent extends AnalyticsEvent {
  constructor(
    public readonly jobId: string,
    public readonly jobTitle: string,
    public readonly companyName: string,
    public readonly location: string,
    public readonly salary?: string,
    public readonly tags: string[] = [],
    public readonly source: 'job_details' | 'job_list' | 'search' = 'job_details',
    // ... other parameters
  ) {}
}
```

### Search Event
```typescript
export class SearchEvent extends AnalyticsEvent {
  constructor(
    public readonly searchTerm: string,
    public readonly filters: Record<string, any>,
    public readonly resultCount: number,
    // ... other parameters
  ) {}
}
```

### Filter Event
```typescript
export class FilterEvent extends AnalyticsEvent {
  constructor(
    public readonly filterType: 'location' | 'job_setting' | 'employment_type' | 'shift',
    public readonly filterValue: string,
    public readonly resultCount: number,
    // ... other parameters
  ) {}
}
```

## Tracking Events

### 1. Job Views
Track when users view job details:

```typescript
// Frontend
analyticsService.trackJobView({
  jobId: job.id,
  jobTitle: job.title,
  companyName: job.company,
  location: job.location,
  salary: job.salary,
  tags: job.tags?.map(tag => tag.label) || [],
  source: 'job_list',
  userId: user?.id,
});

// Backend
analyticsTrackingService.trackJobView(
  jobId,
  jobTitle,
  companyName,
  location,
  salary,
  tags,
  source,
  userId,
  sessionId,
  ipAddress,
  userAgent,
);
```

### 2. Job Applications
Track when users apply for jobs:

```typescript
// Frontend
analyticsService.trackJobApply({
  jobId: job.id,
  jobTitle: job.title,
  companyName: job.company,
  location: job.location,
  salary: job.salary,
  tags: job.tags?.map(tag => tag.label) || [],
  source: 'job_details',
  userId: user.id,
});

// Backend
analyticsTrackingService.trackJobApply(
  jobId,
  jobTitle,
  companyName,
  location,
  salary,
  tags,
  source,
  userId,
  sessionId,
  ipAddress,
  userAgent,
);
```

### 3. Search Events
Track user search behavior:

```typescript
// Frontend
analyticsService.trackSearch({
  searchTerm: searchTerm,
  filters: {
    location: selectedLocation,
    activeFilters: activeFilters.map(f => ({ type: f.type, label: f.label })),
  },
  resultCount: filteredJobs.length,
  userId: user?.id,
});

// Backend
analyticsTrackingService.trackSearch(
  searchTerm,
  filters,
  resultCount,
  userId,
  sessionId,
  ipAddress,
  userAgent,
);
```

### 4. Filter Events
Track filter usage:

```typescript
// Frontend
analyticsService.trackFilter({
  filterType: filter.type,
  filterValue: filter.label,
  resultCount: filteredJobs.length,
  userId: user?.id,
});

// Backend
analyticsTrackingService.trackFilter(
  filterType,
  filterValue,
  resultCount,
  userId,
  sessionId,
  ipAddress,
  userAgent,
);
```

### 5. User Registration
Track new user registrations:

```typescript
// Frontend
analyticsService.trackUserRegistration({
  registrationMethod: 'email',
  source: 'job_board',
  userId: user.id,
});

// Backend
analyticsTrackingService.trackUserRegistration(
  registrationMethod,
  source,
  userId,
  ipAddress,
  userAgent,
);
```

### 6. Session Tracking
Automatic session tracking:

```typescript
// Session start (automatic)
analyticsService.trackSession('start');

// Session end (automatic on page unload)
analyticsService.trackSession('end');
```

## Google Analytics 4 Integration

All events are automatically sent to Google Analytics 4 with the following event structure:

### Job View Event
```javascript
gtag('event', 'job_view', {
  job_id: 'job_123',
  job_title: 'Registered Nurse',
  company_name: 'Healthcare Corp',
  location: 'New York, NY',
  salary: '$75,000 per year',
  tags: ['Full-Time', 'Nursing Home'],
  source: 'job_list',
  user_id: 'user_456'
});
```

### Job Apply Event
```javascript
gtag('event', 'job_apply', {
  job_id: 'job_123',
  job_title: 'Registered Nurse',
  company_name: 'Healthcare Corp',
  location: 'New York, NY',
  salary: '$75,000 per year',
  tags: ['Full-Time', 'Nursing Home'],
  source: 'job_details',
  user_id: 'user_456'
});
```

### Search Event
```javascript
gtag('event', 'search', {
  search_term: 'CNA',
  filters: {
    location: 'Connecticut',
    activeFilters: [
      { type: 'job_setting', label: 'Nursing Home' }
    ]
  },
  result_count: 45,
  user_id: 'user_456'
});
```

## Database Schema

### analytics_events Table
```sql
CREATE TABLE analytics_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eventType  VARCHAR NOT NULL,
  eventData  JSONB NOT NULL,
  userId     UUID REFERENCES users(id),
  sessionId  VARCHAR,
  ipAddress  VARCHAR,
  userAgent  VARCHAR,
  timestamp  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_event_type ON analytics_events(eventType);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(userId);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(sessionId);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
```

## API Endpoints

### Track Event
```http
POST /api/analytics/track
Content-Type: application/json

{
  "eventType": "job_view",
  "eventData": {
    "jobId": "job_123",
    "jobTitle": "Registered Nurse",
    "companyName": "Healthcare Corp",
    "location": "New York, NY",
    "salary": "$75,000 per year",
    "tags": ["Full-Time", "Nursing Home"],
    "source": "job_list"
  },
  "userId": "user_456",
  "sessionId": "session_789",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Analytics Summary
```http
GET /api/analytics/summary?days=30
Authorization: Bearer <jwt_token>
```

### Job Analytics
```http
GET /api/analytics/job/:jobId?days=30
Authorization: Bearer <jwt_token>
```

## Integration Examples

### React Component Integration
```typescript
import { analyticsService } from '../services/analytics.service';

const JobCard = ({ job, user }) => {
  const handleJobClick = () => {
    // Track job view
    analyticsService.trackJobView({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      location: job.location,
      salary: job.salary,
      tags: job.tags?.map(tag => tag.label) || [],
      source: 'job_list',
      userId: user?.id,
    });
    
    // Navigate to job details
    router.push(`/jobs/${job.id}`);
  };

  return (
    <div onClick={handleJobClick}>
      {/* Job card content */}
    </div>
  );
};
```

### Search Component Integration
```typescript
const SearchBar = ({ onSearch, user }) => {
  const handleSearch = (searchTerm: string) => {
    // Track search
    analyticsService.trackSearch({
      searchTerm,
      filters: currentFilters,
      resultCount: searchResults.length,
      userId: user?.id,
    });
    
    // Perform search
    onSearch(searchTerm);
  };

  return (
    <input 
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search jobs..."
    />
  );
};
```

## Analytics Dashboard

The analytics dashboard provides:
- **Job performance metrics** (views, applications, conversion rates)
- **User behavior insights** (search patterns, filter usage)
- **Session analytics** (duration, pages visited)
- **Geographic data** (location-based analytics)
- **Time-based trends** (daily, weekly, monthly)

## Best Practices

### 1. Consistent Event Naming
- Use descriptive event names
- Follow a consistent naming convention
- Include all relevant data in eventData

### 2. User Privacy
- Don't track personally identifiable information
- Respect user privacy preferences
- Anonymize data when possible

### 3. Performance
- Send events asynchronously
- Batch events when possible
- Handle network failures gracefully

### 4. Data Quality
- Validate event data before sending
- Include required fields
- Use proper data types

## Troubleshooting

### Common Issues

1. **Events not appearing in Google Analytics**
   - Check GTM configuration
   - Verify gtag is loaded
   - Check browser console for errors

2. **Backend tracking failures**
   - Check API endpoint availability
   - Verify database connection
   - Check event data format

3. **Session tracking issues**
   - Verify localStorage is available
   - Check session ID generation
   - Ensure beforeunload event fires

### Debug Mode
Enable debug logging:
```typescript
// Frontend
localStorage.setItem('analytics_debug', 'true');

// Backend
process.env.ANALYTICS_DEBUG = 'true';
```

## Future Enhancements

1. **Real-time Analytics**
   - WebSocket connections for live data
   - Real-time dashboard updates

2. **Advanced Segmentation**
   - User behavior cohorts
   - Custom audience creation

3. **Predictive Analytics**
   - Job recommendation engine
   - User churn prediction

4. **A/B Testing Integration**
   - Feature flag tracking
   - Conversion optimization

5. **Export Functionality**
   - CSV/Excel export
   - API data access
   - Custom report generation 