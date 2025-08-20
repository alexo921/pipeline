# Pipeline Dashboard System

This document describes the "My Pipeline" and "Your Pipeline" dashboards built for the Pipeline platform.

## Overview

The dashboard system consists of two main dashboards with role-based access:

1. **My Pipeline** (`/my-pipeline`) - **For Employers** to manage job postings, view analytics, and manage applicants
2. **Your Pipeline** (`/your-pipeline`) - **For Employees/Users** to manage their profile, view matches, and track applications

## User Role Access

- **Employers** (users with `role: 'EMPLOYER'` in database) → **My Pipeline**
- **Employees/Users** (users without employer role) → **Your Pipeline**
- **Admin Users** (users with `role: 'ADMIN'` in database) → **Access to BOTH dashboards**
- **Unauthenticated users** → Redirected to home page

### Admin Access Details

Admin users have special privileges:
- **Can access both dashboards** for testing and management purposes
- **My Pipeline**: Full employer dashboard access with admin indicator
- **Your Pipeline**: Full employee/user dashboard access with admin indicator
- **Visual indicators** show "Admin Access" labels on both dashboards
- **Admin Navigation Bar**: Easy switching between dashboard types
- **No role restrictions** - can view and test all functionality

## Architecture

### Layout Structure

The dashboards use the existing `BaseLayout` component which provides:
- **Header**: Pipeline logo and navigation (Find Jobs, Hire Talent, Find Work)
- **Footer**: Company information and social links
- **Background**: Proper Pipeline brand styling with blue blur effects
- **Authentication**: Login modal and user management
- **Responsive Design**: Mobile-first approach

### Components Structure

```
app/
├── components/
│   ├── layout/
│   │   ├── BaseLayout.tsx          # Main layout wrapper
│   │   ├── Navbar.tsx              # Navigation header
│   │   └── Footer.tsx              # Footer component
│   └── AdminDashboardNav.tsx       # Admin navigation between dashboards
├── my-pipeline/
│   └── page.tsx                    # Employer dashboard (accessible by employers + admins)
└── your-pipeline/
    └── page.tsx                    # Employee/User dashboard (accessible by employees + admins)
```

### Pages Structure

```
app/
├── my-pipeline/
│   └── page.tsx            # Employer dashboard (accessible by employers + admins)
└── your-pipeline/
    └── page.tsx            # Employee/User dashboard (accessible by employees + admins)
```

## Features

### My Pipeline (Employer Dashboard)

- **Analytics Dashboard**: Key performance indicators and insights
  - Environment Score, Continuity of Care Index, Strong Matches, Pulse Trends
  - Work Environment Score, Retention Forecast, Telemedicine Fill Rate, Performance Score, Culture Fit
- **Job Management**: View and manage active job postings
- **Candidate Matches**: View matched candidates for positions
- **Applicant Tracking**: Monitor job applicants and their status
- **Job Posting**: Create new job postings
- **Admin Features**: Special admin access indicator and full functionality
- **Admin Navigation**: Easy switching to employee dashboard view

### Your Pipeline (Employee/User Dashboard)

- **Profile Management**: Complete profile with bio, skills, and experience
  - Profile completion tracking
  - Editable bio and experience sections
  - Skills management with tags
- **Job Matches**: View matched job opportunities
- **Recommended Jobs**: Personalized job recommendations
- **Expressed Interest**: Track jobs of interest
- **Applications**: Monitor application status and history
- **Admin Features**: Special admin access indicator and full functionality
- **Admin Navigation**: Easy switching to employer dashboard view

## Admin Navigation Component

### AdminDashboardNav.tsx

A specialized navigation component that appears only for admin users:

- **Visual Design**: Blue-themed navigation bar with clear labeling
- **Dashboard Switching**: Easy navigation between employer and employee views
- **Active State**: Highlights current dashboard with blue background
- **Icons**: Building2 icon for employer dashboard, User icon for employee dashboard
- **Responsive**: Adapts to different screen sizes
- **Conditional Rendering**: Only displays for users with `role: 'ADMIN'`

### Features:
- **Employer Dashboard Link**: Quick access to `/my-pipeline`
- **Employee Dashboard Link**: Quick access to `/your-pipeline`
- **Active State Indication**: Current dashboard highlighted
- **Hover Effects**: Smooth transitions and visual feedback
- **Professional Styling**: Consistent with Pipeline brand colors

## Design System

### Color Palette
- Primary: Blue (#2466D0)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray scale (#F9FAFB to #111827)

### Typography
- Headings: Baloo 2 font family
- Body: DM Sans font family
- Font weights: 400, 500, 600, 700, 800

### Components
- Cards with subtle shadows and borders
- Rounded corners (lg: 8px, xl: 12px)
- Consistent spacing (4, 6, 8, 12, 16, 24, 32)
- Hover effects with smooth transitions

## Authentication & Security

### Role-Based Access Control
- **Employers**: Can only access `/my-pipeline`
- **Employees/Users**: Can only access `/your-pipeline`
- **Admins**: Can access **both** dashboards
- **Unauthenticated**: Redirected to home page
- **Role Mismatch**: Automatically redirected to correct dashboard

### User Session Management
- Uses existing `AuthContext` for user authentication
- Automatic role validation on page load
- Secure redirects based on user permissions
- Admin users bypass role restrictions

### Admin Privileges
- **Full Access**: Can view and test both dashboard types
- **Visual Indicators**: Clear labeling of admin access
- **Admin Navigation**: Easy switching between dashboard types
- **No Restrictions**: Bypass normal role-based redirects
- **Testing Capability**: Can verify both user experiences

## Responsive Design

The dashboards are fully responsive with:
- Mobile-first approach
- Grid layouts that adapt to screen size
- Touch-friendly button sizes
- Optimized spacing for different devices
- Consistent with existing Pipeline design system

## Navigation

Users access dashboards through:
- **Direct URLs**: `/my-pipeline` or `/your-pipeline`
- **Automatic Redirects**: Based on user role (except admins)
- **Existing Navigation**: Uses Pipeline's main navigation system
- **Admin Access**: Can manually navigate to either dashboard
- **Admin Navigation Bar**: Quick switching between dashboard types

## State Management

Currently using React local state with:
- **useAuth Hook**: For user authentication and role checking
- **useRouter**: For programmatic navigation and redirects
- **useEffect**: For role-based access control
- **Admin Override**: Special logic for admin users
- **Conditional Rendering**: Admin components only show for admin users

Future enhancements could include:
- Redux/Zustand for global state
- React Query for server state
- Context API for user preferences

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced filtering and search
- Data visualization charts
- Export functionality
- Mobile app integration
- Job application tracking
- Resume upload and management
- Enhanced admin controls and analytics
- Admin dashboard management tools
- Role-based admin permissions

### Technical Improvements
- Server-side rendering (SSR)
- Progressive Web App (PWA) features
- Performance optimization
- Accessibility improvements
- Internationalization (i18n)
- API integration for real data
- Admin dashboard management tools
- Enhanced admin navigation features

## Getting Started

1. Navigate to the dashboard directory:
   ```bash
   cd frontend/web-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Access the dashboards:
   - **Employers**: http://localhost:3000/my-pipeline
   - **Employees/Users**: http://localhost:3000/your-pipeline
   - **Admins**: Can access both URLs with navigation between them

## Dependencies

- **Next.js 15**: React framework
- **React 19**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **TypeScript**: Type safety
- **Existing Pipeline Components**: BaseLayout, Navbar, Footer, AuthContext

## Contributing

When adding new features or components:

1. Follow the existing Pipeline component structure
2. Use TypeScript interfaces for props
3. Implement responsive design
4. Add hover states and transitions
5. Maintain consistent spacing and typography
6. Test on multiple screen sizes
7. Ensure role-based access control
8. Use existing authentication system
9. **Consider admin access** - ensure admins can test all functionality
10. **Add admin indicators** where appropriate
11. **Include admin navigation** for new dashboard types
12. **Test admin functionality** thoroughly

## Admin Testing

For admin users testing the system:

1. **Login as admin** user with `role: 'ADMIN'`
2. **Access both dashboards** to verify functionality
3. **Use admin navigation** to switch between dashboard types
4. **Test role-based features** from both perspectives
5. **Verify admin indicators** are displayed correctly
6. **Test navigation** between both dashboard types
7. **Validate user experience** for both employer and employee views
8. **Check admin navigation bar** functionality and styling

## Support

For questions or issues related to the dashboard system, please refer to the main project documentation or contact the development team.
