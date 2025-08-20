# Intake Forms System

This document describes the new intake forms system that allows employers and employees to submit information through dedicated forms.

## Overview

The system includes:
- **Employer Intake Form** (`/employer-intake`) - For companies looking to hire talent
- **Employee Intake Form** (`/employee-intake`) - For job seekers looking for work
- **Admin Dashboard** (`/admin/intake-forms`) - For administrators to manage submissions

## Features

### Employer Intake Form
- Company information (name, contact person, email, phone)
- Company details (size, industry)
- Hiring needs and requirements
- Location preferences
- Additional information

### Employee Intake Form
- Personal information (name, email, phone)
- Professional details (current role, experience)
- Job preferences (location, availability, salary expectations)
- Additional information

### Admin Dashboard
- View all submitted forms
- Update form status (pending, reviewed, contacted, archived)
- Filter between employer and employee forms
- Manage form workflow

## Database Schema

### employer_intake_forms
```sql
- id (UUID, primary key)
- companyName (string, required)
- contactName (string, required)
- email (string, required)
- phone (string, optional)
- companySize (string, optional)
- industry (string, optional)
- hiringNeeds (string, required)
- location (string, optional)
- additionalInfo (string, optional)
- submittedAt (datetime, auto)
- status (string, default: "pending")
- notes (string, optional)
- createdAt (datetime, auto)
- updatedAt (datetime, auto)
```

### employee_intake_forms
```sql
- id (UUID, primary key)
- firstName (string, required)
- lastName (string, required)
- email (string, required)
- phone (string, optional)
- currentRole (string, optional)
- experience (string, optional)
- preferredLocation (string, optional)
- availability (string, optional)
- salaryExpectations (string, optional)
- additionalInfo (string, optional)
- submittedAt (datetime, auto)
- status (string, default: "pending")
- notes (string, optional)
- createdAt (datetime, auto)
- updatedAt (datetime, auto)
```

## API Endpoints

### Backend (NestJS)
- `POST /intake-forms/employer` - Submit employer intake form
- `POST /intake-forms/employee` - Submit employee intake form
- `GET /intake-forms/employer` - Get all employer forms (admin)
- `GET /intake-forms/employee` - Get all employee forms (admin)
- `GET /intake-forms/employer/:id` - Get specific employer form
- `GET /intake-forms/employee/:id` - Get specific employee form
- `PUT /intake-forms/employer/:id/status` - Update employer form status
- `PUT /intake-forms/employee/:id/status` - Update employee form status

### Frontend (Next.js)
- `POST /api/intake-forms/employer` - Proxy to backend
- `POST /api/intake-forms/employee` - Proxy to backend

## Setup Instructions

### 1. Database Migration
Run the Prisma migration to create the new tables:
```bash
cd backend/api
npx prisma migrate dev --name add-intake-forms
```

### 2. Backend Setup
The backend module is already configured in `app.module.ts`. The system will automatically start when the backend is running.

### 3. Frontend Setup
The frontend pages and API routes are already created. No additional setup is required.

### 4. Environment Variables
Ensure the following environment variables are set:
```bash
# Backend
DATABASE_URL=your_database_connection_string

# Frontend (optional, defaults to localhost:3001)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Usage

### For Users
1. Navigate to `/employer-intake` or `/employee-intake`
2. Fill out the form with required information
3. Submit the form
4. Receive confirmation message

### For Administrators
1. Navigate to `/admin/intake-forms` (requires ADMIN role)
2. View submitted forms in tabs (Employer/Employee)
3. Update form status as needed
4. Monitor form workflow

## Navigation

The intake forms are accessible through:
- **Main Navigation**: "Hire Talent" and "Find Work" links in the navbar
- **Mobile Menu**: Same links in the mobile navigation
- **Admin Access**: "Intake Forms" link in admin user dropdown

## Styling

The forms follow the same design system as the jobs page:
- Consistent color scheme (`#2466D0`, `#01253F`, `#7691A4`)
- Same container styling and shadows
- Mobile-responsive design
- Font families (Baloo for headings, Avenir for body text)

## Form Validation

- Required fields are marked with asterisks (*)
- Email validation for email fields
- Form submission prevents empty required fields
- Success/error messages display after submission

## Status Workflow

Forms follow this status progression:
1. **Pending** - Newly submitted form
2. **Reviewed** - Form has been reviewed by admin
3. **Contacted** - Admin has contacted the submitter
4. **Archived** - Form is no longer active

## Future Enhancements

Potential improvements:
- Email notifications for new submissions
- Form analytics and reporting
- Integration with CRM systems
- Automated follow-up workflows
- Form templates for different industries
- File upload capabilities
- Multi-language support

## Troubleshooting

### Common Issues
1. **Forms not submitting**: Check backend connectivity and database
2. **Admin access denied**: Verify user has ADMIN role
3. **Forms not loading**: Check API endpoints and CORS settings

### Debug Steps
1. Check browser console for errors
2. Verify backend API is running
3. Check database connection
4. Verify environment variables
5. Check user authentication and role

## Support

For technical issues or questions about the intake forms system, refer to the main project documentation or contact the development team.
