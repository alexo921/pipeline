# Pipeline Workforce Platform - API Documentation

## 🌐 API Overview

The Pipeline Workforce Platform API is built with NestJS and provides a comprehensive RESTful interface for all platform functionality. The API is documented using Swagger/OpenAPI and is available at `/docs` when running locally.

### Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.pipelineworkforce.com/api`

### API Version
- **Current Version**: v1.0
- **Global Prefix**: `/api`

---

## 🔐 Authentication

### Authentication Method
The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Getting an Access Token

#### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CANDIDATE",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Login successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Using the Access Token
Include the token in the Authorization header for all protected endpoints:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles
- **CANDIDATE**: Healthcare professionals looking for jobs
- **EMPLOYER**: Healthcare employers posting jobs
- **ADMIN**: System administrators with full access

---

## 📋 API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "role": "CANDIDATE|EMPLOYER|ADMIN",
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

#### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "CANDIDATE|EMPLOYER"
}
```

#### POST /api/auth/logout
Logout and invalidate the current session.

#### GET /api/auth/profile
Get the current user's profile information.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "candidate": {
      // Candidate-specific data if role is CANDIDATE
    }
  }
}
```

---

### User Management Endpoints

#### GET /api/users
Get all users (Admin only).

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (CANDIDATE, EMPLOYER, ADMIN)
- `search`: Search by name or email

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "string",
        "email": "string",
        "role": "string",
        "firstName": "string",
        "lastName": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### GET /api/users/:id
Get a specific user by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "candidate": {
      // Candidate data if applicable
    }
  }
}
```

#### PATCH /api/users/:id
Update a user's information.

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```

#### DELETE /api/users/:id
Delete a user account (Admin only).

---

### Job Management Endpoints

#### GET /api/job
Get all job listings.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `location`: Filter by location
- `zipCode`: Filter by ZIP code
- `company`: Filter by company name
- `salary`: Filter by salary range
- `search`: Search in title and description

**Response**:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "location": "string",
        "zipCode": "string",
        "company": "string",
        "salary": "string",
        "requirements": "string",
        "benefits": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET /api/job/:id
Get a specific job by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "location": "string",
    "zipCode": "string",
    "company": "string",
    "salary": "string",
    "requirements": "string",
    "benefits": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/job
Create a new job posting (Employers only).

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "location": "string",
  "zipCode": "string",
  "company": "string",
  "salary": "string",
  "requirements": "string",
  "benefits": "string"
}
```

---

### Candidate Management Endpoints

#### GET /api/candidate
Get candidate information for the current user.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "healthcareRole": "RN|LPN|CNA|PCA|HHA|OTHER",
    "certificationStatus": "Certified|NotCertified|Pending|Inprogress",
    "zipCode": "string",
    "address": "string",
    "maxTravelDistance": 50,
    "workType": ["FullTime", "PartTime"],
    "shiftType": ["Day", "Night"],
    "currentJobStatus": "WorkingFullTime",
    "step": "INITIAL_DETAILS|LOCATION_DETAILS|AVAILABILITY_DETAILS",
    "isOnboarded": true,
    "isActive": true,
    "hourlyRate": 25,
    "yearlySalary": 50000,
    "workSettingExperience": ["LTC", "Hospital"],
    "preferredSetting": ["LTC", "HomeCare"],
    "thrivingFactors": ["FriendlyTeam", "HigherPay"]
  }
}
```

#### PATCH /api/candidate
Update candidate information.

**Request Body**:
```json
{
  "healthcareRole": "RN",
  "certificationStatus": "Certified",
  "zipCode": "78701",
  "maxTravelDistance": 30,
  "workType": ["FullTime"],
  "shiftType": ["Day", "Night"],
  "hourlyRate": 30,
  "workSettingExperience": ["Hospital"],
  "preferredSetting": ["Hospital"]
}
```

---

### Experience Management Endpoints

#### GET /api/experience
Get all experiences for the current candidate.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "companyName": "string",
      "position": "string",
      "startDate": "2020-01-01",
      "endDate": "2022-01-01",
      "isCurrentJob": false,
      "description": "string"
    }
  ]
}
```

#### POST /api/experience
Add a new work experience.

**Request Body**:
```json
{
  "companyName": "string",
  "position": "string",
  "startDate": "2020-01-01",
  "endDate": "2022-01-01",
  "isCurrentJob": false,
  "description": "string"
}
```

#### PATCH /api/experience/:id
Update an existing work experience.

#### DELETE /api/experience/:id
Delete a work experience.

---

### Job Application Endpoints

#### GET /api/applied-jobs
Get all job applications for the current user.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "jobId": "string",
      "userId": "string",
      "status": "PENDING|REVIEWED|ACCEPTED|REJECTED",
      "appliedAt": "2024-01-01T00:00:00.000Z",
      "job": {
        "id": "string",
        "title": "string",
        "company": "string",
        "location": "string"
      }
    }
  ]
}
```

#### POST /api/applied-jobs
Apply for a job.

**Request Body**:
```json
{
  "jobId": "string"
}
```

#### PATCH /api/applied-jobs/:id
Update application status (Employers only).

**Request Body**:
```json
{
  "status": "REVIEWED|ACCEPTED|REJECTED"
}
```

---

### Saved Jobs Endpoints

#### GET /api/saved-jobs
Get all saved jobs for the current user.

#### POST /api/saved-jobs
Save a job for later.

**Request Body**:
```json
{
  "jobId": "string"
}
```

#### DELETE /api/saved-jobs/:id
Remove a saved job.

---

### Email Endpoints

#### POST /api/email/send
Send an email (Admin only).

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

#### POST /api/email/send-bulk
Send bulk emails (Admin only).

**Request Body**:
```json
{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Bulk Email Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

---

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get dashboard analytics (Admin only).

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalJobs": 500,
    "totalApplications": 2000,
    "activeCandidates": 800,
    "activeEmployers": 50,
    "recentActivity": [
      {
        "type": "USER_REGISTRATION",
        "count": 25,
        "date": "2024-01-01"
      }
    ]
  }
}
```

#### GET /api/analytics/user-activity
Get user activity analytics.

**Query Parameters**:
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `userId`: Specific user ID (optional)

#### GET /api/analytics/job-performance
Get job performance analytics.

---

### Intake Forms Endpoints

#### GET /api/intake-forms
Get all intake forms (Admin only).

#### GET /api/intake-forms/:id
Get a specific intake form.

#### POST /api/intake-forms
Submit a new intake form.

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "currentRole": "string",
  "experience": "string",
  "preferredLocation": "string",
  "availability": "string",
  "salaryExpectations": "string",
  "additionalInfo": "string"
}
```

#### PATCH /api/intake-forms/:id
Update intake form status (Admin only).

---

### Queue Management Endpoints

#### GET /api/queue/status
Get queue processing status (Admin only).

#### POST /api/queue/process
Trigger queue processing (Admin only).

#### GET /api/queue/jobs
Get queued jobs (Admin only).

---

## 📊 Database Schema

### Core Models

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role Role NOT NULL DEFAULT 'CANDIDATE',
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  emailSubscribed BOOLEAN DEFAULT true,
  unsubscribedAt TIMESTAMP,
  googleId VARCHAR(255) UNIQUE,
  googlePicture TEXT,
  emailVerified BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Candidates
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  userId UUID UNIQUE NOT NULL REFERENCES users(id),
  healthcareRole HealthcareRole NOT NULL,
  certificationStatus CertificationStatus NOT NULL,
  zipCode VARCHAR(10),
  address TEXT,
  maxTravelDistance INTEGER,
  workType WorkType[],
  shiftType ShiftType[],
  currentJobStatus JobStatus,
  step OnboardingStep NOT NULL,
  isOnboarded BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT false,
  hourlyRate INTEGER,
  yearlySalary INTEGER,
  payLocationBased BOOLEAN DEFAULT false,
  workSettingExperience WorkSettingExperience[],
  preferredSetting PreferredSetting[],
  thrivingFactors ThrivingFactor[],
  jobFrustationNotes TEXT,
  referredBy VARCHAR(255),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  zipCode VARCHAR(10),
  company VARCHAR(255),
  salary VARCHAR(100),
  requirements TEXT,
  benefits TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Applied Jobs
```sql
CREATE TABLE applied_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobId UUID NOT NULL REFERENCES jobs(id),
  userId UUID NOT NULL REFERENCES users(id),
  status ApplicationStatus DEFAULT 'PENDING',
  appliedAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Saved Jobs
```sql
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobId UUID NOT NULL REFERENCES jobs(id),
  userId UUID NOT NULL REFERENCES users(id),
  savedAt TIMESTAMP DEFAULT NOW()
);
```

#### Experiences
```sql
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidateId UUID NOT NULL REFERENCES candidates(id),
  companyName VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  isCurrentJob BOOLEAN DEFAULT false,
  description TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Enums

#### Role
```sql
CREATE TYPE Role AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN');
```

#### HealthcareRole
```sql
CREATE TYPE HealthcareRole AS ENUM ('CNA', 'LPN', 'RN', 'PCA', 'HHA', 'OTHER');
```

#### CertificationStatus
```sql
CREATE TYPE CertificationStatus AS ENUM ('Certified', 'NotCertified', 'Pending', 'Inprogress');
```

#### WorkType
```sql
CREATE TYPE WorkType AS ENUM ('FullTime', 'PartTime', 'PerDiem', 'LiveIn');
```

#### ShiftType
```sql
CREATE TYPE ShiftType AS ENUM ('Day', 'Night', 'Weekend', 'Overnight', 'Flexible');
```

#### JobStatus
```sql
CREATE TYPE JobStatus AS ENUM (
  'WorkingFullTime',
  'WorkingFullTimeAvailable',
  'WorkingPartTimeAvailable',
  'NotWorkingAvailable',
  'NotWorkingOpenOffers'
);
```

#### ApplicationStatus
```sql
CREATE TYPE ApplicationStatus AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');
```

---

## 🔄 Response Format

### Success Response
All successful API responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INTERNAL_SERVER_ERROR`: Server error

---

## 🔒 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **File upload endpoints**: 20 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## 📝 API Testing

### Using Swagger UI
The API documentation is available at `/docs` when running locally:
- **Development**: http://localhost:3001/docs
- **Production**: https://api.pipelineworkforce.com/docs

### Using cURL
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get jobs (with token)
curl -X GET http://localhost:3001/api/job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman
1. Import the OpenAPI specification from `/docs`
2. Set up environment variables for base URL and auth token
3. Use the collection to test all endpoints

---

## 🔧 Development Notes

### API Versioning
- Current version: v1.0
- Version is included in the global prefix: `/api`
- Future versions will use `/api/v2`, `/api/v3`, etc.

### CORS Configuration
- Development: Allows localhost origins
- Production: Restricted to frontend domain
- Credentials are enabled for cookie-based auth

### Validation
- All inputs are validated using class-validator
- DTOs define the expected request/response structure
- Validation errors return detailed field-level messages

### Logging
- All API requests are logged
- Error logs include stack traces in development
- Production logs are sanitized for security

---

## 📞 Support

For API-related questions or issues:
- Check the Swagger documentation at `/docs`
- Review the error response format
- Contact the development team
- Create an issue in the repository

---

*Last updated: [Current Date]*
*API Version: 1.0.0*
