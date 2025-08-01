# Internal Analytics Setup Guide

This guide explains how to configure Pipeline to send analytics data to your internal analytics dashboards.

## Overview

The internal analytics system forwards all user interactions to your internal dashboard endpoints, providing real-time data for:
- Job performance metrics
- User behavior analysis
- Conversion tracking
- Search and filter effectiveness
- Session analytics

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Internal Analytics Configuration
INTERNAL_ANALYTICS_ENABLED=true
INTERNAL_ANALYTICS_URL=https://your-internal-dashboard.com
```

### Configuration Options

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `INTERNAL_ANALYTICS_ENABLED` | Enable/disable internal analytics | No | `true` |
| `INTERNAL_ANALYTICS_URL` | Base URL of your internal dashboard | Yes | - |

## API Endpoints

Your internal dashboard should implement these endpoints:

### 1. Single Event Endpoint
```http
POST /api/analytics/events
Content-Type: application/json
X-Source: pipeline_web
X-Version: 1.0.0

{
  "eventType": "job_view",
  "eventData": {
    "jobId": "job_123",
    "jobTitle": "Registered Nurse",
    "companyName": "Healthcare Corp",
    "location": "New York, NY",
    "salary": "$75,000 per year",
    "tags": ["Full-Time", "Nursing Home"],
    "source": "job_list",
    "platform": "web"
  },
  "userId": "user_456",
  "sessionId": "session_789",
  "timestamp": "2025-01-15T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "source": "pipeline_web",
  "version": "1.0.0"
}
```

### 2. Batch Events Endpoint
```http
POST /api/analytics/events/batch
Content-Type: application/json
X-Source: pipeline_web
X-Version: 1.0.0

{
  "events": [
    {
      "eventType": "job_view",
      "eventData": { ... },
      "userId": "user_456",
      "sessionId": "session_789",
      "timestamp": "2025-01-15T10:30:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "source": "pipeline_web",
      "version": "1.0.0"
    },
    {
      "eventType": "job_apply",
      "eventData": { ... },
      "userId": "user_456",
      "sessionId": "session_789",
      "timestamp": "2025-01-15T10:35:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "source": "pipeline_web",
      "version": "1.0.0"
    }
  ]
}
```

## Event Types

### 1. Job View Events
```json
{
  "eventType": "job_view",
  "eventData": {
    "jobId": "string",
    "jobTitle": "string",
    "companyName": "string",
    "location": "string",
    "salary": "string (optional)",
    "tags": ["string"],
    "source": "job_list | search | filter | recommendation",
    "platform": "web"
  }
}
```

### 2. Job Apply Events
```json
{
  "eventType": "job_apply",
  "eventData": {
    "jobId": "string",
    "jobTitle": "string",
    "companyName": "string",
    "location": "string",
    "salary": "string (optional)",
    "tags": ["string"],
    "source": "job_details | job_list | search",
    "platform": "web",
    "conversion": true
  }
}
```

### 3. Search Events
```json
{
  "eventType": "search",
  "eventData": {
    "searchTerm": "string",
    "filters": {
      "location": "string",
      "activeFilters": [
        {
          "type": "job_setting | employment_type | shift",
          "label": "string"
        }
      ]
    },
    "resultCount": "number",
    "platform": "web",
    "searchQuality": "excellent | good | fair | poor"
  }
}
```

### 4. Filter Events
```json
{
  "eventType": "filter",
  "eventData": {
    "filterType": "location | job_setting | employment_type | shift",
    "filterValue": "string",
    "resultCount": "number",
    "platform": "web",
    "filterEffectiveness": "high | medium | low"
  }
}
```

### 5. User Registration Events
```json
{
  "eventType": "user_registration",
  "eventData": {
    "registrationMethod": "email | google | facebook",
    "source": "job_board | email_campaign | referral | organic",
    "platform": "web",
    "acquisitionChannel": "job_board | email_campaign | referral | organic"
  }
}
```

### 6. Job Save Events
```json
{
  "eventType": "job_save",
  "eventData": {
    "jobId": "string",
    "action": "save | unsave",
    "platform": "web",
    "engagement": "positive | negative"
  }
}
```

### 7. Session Events
```json
{
  "eventType": "session",
  "eventData": {
    "action": "start | end",
    "sessionDuration": "number (seconds)",
    "pagesVisited": "number",
    "platform": "web",
    "sessionQuality": "high | medium | low"
  }
}
```

## Response Format

Your internal dashboard should respond with:

```json
{
  "success": true,
  "message": "Event processed successfully",
  "eventId": "internal_event_id_123"
}
```

For batch requests:
```json
{
  "success": true,
  "message": "Batch processed successfully",
  "processedCount": 2,
  "eventIds": ["internal_event_id_123", "internal_event_id_124"]
}
```

## Error Handling

If your dashboard cannot process an event, respond with:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_API_KEY` - Authentication failed
- `INVALID_EVENT_DATA` - Event data is malformed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - Dashboard is temporarily unavailable

## Security Considerations

1. **Internal Network Security**
   - Ensure your internal dashboard is properly secured
   - Use HTTPS for data transmission
   - Implement proper firewall rules

2. **Rate Limiting**
   - Implement rate limiting on your endpoints
   - Consider implementing exponential backoff

3. **Data Validation**
   - Validate all incoming event data
   - Sanitize user inputs
   - Implement proper error handling

4. **HTTPS**
   - Always use HTTPS for data transmission
   - Validate SSL certificates

## Testing

### 1. Check Configuration
```bash
curl -X GET "https://your-pipeline-api.com/api/analytics/internal/config" \
  -H "Authorization: Bearer your_jwt_token"
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "urlConfigured": true,
    "url": "https://your-internal-dashboard.com"
  }
}
```

### 2. Test Event Sending
```bash
curl -X POST "https://your-pipeline-api.com/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "job_view",
    "eventData": {
      "jobId": "test_job_123",
      "jobTitle": "Test Job",
      "companyName": "Test Company",
      "location": "Test Location",
      "source": "job_list"
    },
    "userId": "test_user_456"
  }'
```

## Monitoring

### 1. Log Monitoring
Monitor your application logs for:
- Successful event transmissions
- Failed API calls
- Rate limiting issues
- Authentication errors

### 2. Dashboard Monitoring
Monitor your internal dashboard for:
- Event processing rates
- Data quality metrics
- System performance
- Error rates

### 3. Alerting
Set up alerts for:
- High error rates
- Service unavailability
- Data processing delays
- Authentication failures

## Troubleshooting

### Common Issues

1. **Events not reaching dashboard**
   - Check dashboard URL configuration
   - Verify network connectivity
   - Review firewall settings

2. **Rate limiting**
   - Implement exponential backoff
   - Reduce event frequency
   - Contact dashboard provider

3. **Data format errors**
   - Validate event structure
   - Check required fields
   - Review data types

### Debug Mode

Enable debug logging by setting:
```bash
ANALYTICS_DEBUG=true
```

This will log all internal analytics events to your application logs.

## Performance Considerations

1. **Asynchronous Processing**
   - Events are sent asynchronously
   - No blocking of user interactions
   - Failed events don't affect user experience

2. **Batch Processing**
   - Use batch endpoints for high-volume scenarios
   - Reduce API call frequency
   - Improve overall performance

3. **Caching**
   - Cache dashboard responses when appropriate
   - Implement retry logic for failed requests
   - Use connection pooling

## Future Enhancements

1. **Real-time Webhooks**
   - Webhook notifications for important events
   - Real-time dashboard updates
   - Event streaming capabilities

2. **Advanced Analytics**
   - Predictive analytics
   - Machine learning insights
   - Custom event tracking

3. **Multi-platform Support**
   - Mobile app integration
   - Third-party platform support
   - Cross-platform analytics

4. **Data Export**
   - CSV/Excel export capabilities
   - API data access
   - Custom report generation