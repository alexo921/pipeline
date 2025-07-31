# Analytics Dashboard

A lightweight analytics dashboard for admin users to track job performance and user engagement.

## Features

### Tracking
- **Job Views**: Tracks when users view job details
- **Apply Clicks**: Tracks when users click the apply button
- **User Sessions**: Tracks user session data (IP, user agent, etc.)

### Dashboard Metrics
- Total job views in selected time period
- Total apply clicks in selected time period
- New user registrations
- Conversion rate (apply clicks / job views)
- Top viewed jobs
- Top applied jobs
- Daily trends (placeholder for future chart implementation)

## Access

The analytics dashboard is only accessible to users with the `ADMIN` role.

### Admin User
- Email: `admin@pipeline.com`
- Password: `admin123`

## API Endpoints

### Analytics Tracking
- `POST /analytics/track/view` - Track job view
- `POST /analytics/track/apply` - Track apply click
- `POST /analytics/track/session/start` - Start user session
- `POST /analytics/track/session/end` - End user session

### Analytics Data
- `GET /analytics/summary?days=30` - Get analytics summary
- `GET /analytics/job/:jobId?days=30` - Get specific job analytics

## Database Schema

### New Tables
- `job_views` - Tracks job view events
- `apply_clicks` - Tracks apply click events
- `user_sessions` - Tracks user session data

## Frontend Integration

### Automatic Tracking
- Job views are automatically tracked when users click on job cards
- Apply clicks are automatically tracked when users click the apply button

### Navigation
- Admin users can access the analytics dashboard via the user dropdown menu
- Direct URL: `/analytics`

## Future Enhancements

- Chart visualizations for trends
- Export functionality
- More detailed user analytics
- Job performance comparisons
- Geographic analytics
- Time-based filtering
- Custom date ranges

## Setup

1. Run database migrations: `npx prisma migrate dev`
2. Create admin user: `node scripts/create-admin.js`
3. Access dashboard at `/analytics` with admin credentials 