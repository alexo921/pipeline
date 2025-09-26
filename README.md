# Pipeline Workforce Platform

A comprehensive healthcare workforce intelligence platform that connects healthcare professionals with employers through AI-powered matching, analytics, and workforce management tools.

## 🏥 Overview

Pipeline Workforce is a full-stack platform designed to revolutionize healthcare staffing by providing:

- **AI-Powered Job Matching**: Intelligent matching between healthcare professionals and employers
- **Workforce Analytics**: Comprehensive analytics for both employers and employees
- **Real-time Communication**: Chat-based shift assistance and support
- **Resume Parsing**: Advanced NLP-based resume analysis and skill extraction
- **Multi-Platform Access**: Web dashboard, mobile app, and admin panel

## 🏗️ Architecture

### Core Components

```
Pipeline Workforce Platform
├── 🌐 Web Dashboard (Next.js)
├── 📱 Mobile App (React Native/Expo)
├── 🔧 Admin Panel (Next.js)
├── 🚀 Backend API (NestJS)
├── 🤖 AI Backend (Jan AI)
├── 📊 Resume Parser (Python/NLP)
└── 🗄️ Database (PostgreSQL + Redis)
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo, TypeScript
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL, Redis
- **AI/ML**: Jan AI, Python, spaCy, NLTK
- **Infrastructure**: Docker, Nginx, Ubuntu
- **Authentication**: JWT, Passport.js
- **Email**: Nodemailer with Gmail OAuth

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- Ubuntu/Linux (for production)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pipeline
```

2. **Start the development environment**
```bash
# Start all services with Docker
docker-compose up -d

# Or start individual services
docker-compose up -d postgres redis
```

3. **Access the applications**
- **Web Dashboard**: http://localhost:3000
- **Mobile App**: http://localhost:3003
- **Admin Panel**: http://localhost:3002
- **API**: http://localhost:3001
- **AI Backend**: http://localhost:1337

## 📱 Applications

### 1. Web Dashboard (`frontend/web-dashboard/`)

**Technology**: Next.js 15, React 19, TypeScript, Tailwind CSS

**Features**:
- **Role-based Dashboards**:
  - **My Pipeline** (Employers): Job management, analytics, candidate matching
  - **Your Pipeline** (Employees): Profile management, job matches, applications
- **Analytics Dashboard**: KPIs, retention metrics, workforce insights
- **Job Management**: Posting, editing, applicant tracking
- **Candidate Matching**: AI-powered matching with scoring
- **Real-time Updates**: Live data synchronization

**Key Pages**:
- `/` - Landing page
- `/jobs` - Job listings
- `/my-pipeline` - Employer dashboard
- `/your-pipeline` - Employee dashboard
- `/applicants` - Candidate management

### 2. Mobile App (`frontend/mobile-app/`)

**Technology**: React Native, Expo, TypeScript

**Features**:
- **Dual Tab Interface**:
  - **Chat Tab**: AI-powered shift assistance and support
  - **MyPipeline Tab**: Personal profile and career dashboard
- **Healthcare Shift Documentation**: Track and document work shifts
- **Wellness Features**: Sentiment tracking, wellness tips
- **Real-time Chat**: AI assistant for healthcare professionals
- **Cross-platform**: iOS, Android, and Web support

**Key Screens**:
- Chat interface with AI assistant
- Profile management with completion tracking
- Job matches and recommendations
- Application tracking
- Wellness and facility updates

### 3. Admin Panel (`admin-panel/`)

**Technology**: Next.js, React, TypeScript

**Features**:
- **System Administration**: User management, system monitoring
- **Analytics Overview**: Platform-wide metrics and insights
- **Content Management**: Job data, user profiles, system settings
- **Audit Logs**: User activity and system events

### 4. Backend API (`backend/api/`)

**Technology**: NestJS, Node.js, TypeScript, PostgreSQL, Redis

**Features**:
- **RESTful API**: Comprehensive API for all platform features
- **Authentication**: JWT-based auth with role management
- **Database Management**: Prisma ORM with PostgreSQL
- **Email Services**: Automated emails with Gmail OAuth
- **File Uploads**: Resume and document handling
- **Background Jobs**: Queue-based processing with BullMQ

**Key Modules**:
- Authentication & Authorization
- User Management
- Job Management
- Resume Processing
- Email Services
- Analytics & Reporting

### 5. AI Backend (`jan/`)

**Technology**: Jan AI, Python

**Features**:
- **AI Chat Interface**: Healthcare-focused AI assistant
- **Model Management**: Local AI model hosting
- **Chat Completions**: Real-time AI responses
- **Healthcare Context**: Specialized healthcare knowledge

### 6. Resume Parser (`Resume-NLP-Parser/`)

**Technology**: Python, spaCy, NLTK, Streamlit

**Features**:
- **Advanced NLP**: Resume parsing with machine learning
- **Skill Extraction**: Automated skill identification
- **Data Visualization**: Interactive resume analysis
- **Multi-format Support**: PDF, DOC, and other formats
- **Web Interface**: Streamlit-based user interface

## 🗄️ Database Schema

### Core Entities

- **Users**: Healthcare professionals and employers
- **Jobs**: Job postings and requirements
- **Applications**: Job applications and status tracking
- **Resumes**: Parsed resume data and skills
- **Analytics**: Platform metrics and insights
- **Chat Messages**: AI chat conversations

### Key Relationships

- Users can have multiple applications
- Jobs can have multiple applicants
- Resumes are linked to users
- Analytics track user and job metrics

## 🔧 Development

### Environment Setup

1. **Backend Environment** (`backend/api/.env`)
```env
DATABASE_URL=postgresql://pipeline_admin:password@localhost:5432/pipeline_production_db
JWT_SECRET=your-jwt-secret
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
```

2. **Frontend Environment** (`frontend/web-dashboard/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. **Mobile App Environment** (`frontend/mobile-app/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_JAN_API_URL=http://localhost:1337/v1/chat/completions
```

### Development Commands

**Backend API**:
```bash
cd backend/api
npm run start:dev    # Development server
npm run build        # Production build
npm run test         # Run tests
```

**Web Dashboard**:
```bash
cd frontend/web-dashboard
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
```

**Mobile App**:
```bash
cd frontend/mobile-app
npm start            # Expo development server
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
```

**Admin Panel**:
```bash
cd admin-panel
npm run dev          # Development server
npm run build        # Production build
```

## 🚀 Deployment

### Production Deployment

The platform includes comprehensive deployment scripts:

**Quick Deployment**:
```bash
./quick-deploy.sh update-jobs    # Update job data
./quick-deploy.sh hotfix         # Quick frontend fix
./quick-deploy.sh check          # Check status
```

**Full Deployment**:
```bash
./deploy.sh                      # Deploy everything
./deploy.sh frontend             # Deploy frontend only
./deploy.sh backend              # Deploy backend only
./deploy.sh admin                # Deploy admin panel
```

**Simple Deployment** (Recommended):
```bash
./simple-deploy.sh               # Deploy with better error handling
./simple-deploy.sh check         # Check deployment status
```

**Manual Deployment**:
```bash
docker-compose down && docker-compose up --build -d && sudo systemctl restart nginx
```

### Production URLs

- **Main Platform**: https://pipelineworkforce.com
- **API**: https://api.pipelineworkforce.com
- **Mobile App**: https://mobile.pipelineworkforce.com
- **Admin Panel**: https://pipelineworkforce.com/admin

### Infrastructure

- **Server**: Ubuntu with Docker
- **Web Server**: Nginx with SSL
- **Database**: PostgreSQL with Redis caching
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Health checks and logging

## 📊 Features

### For Healthcare Professionals

- **Profile Management**: Complete profile with skills, experience, and bio
- **Job Matching**: AI-powered job recommendations
- **Application Tracking**: Monitor application status
- **Shift Documentation**: Track and document work shifts
- **AI Assistant**: Chat-based support and guidance
- **Wellness Tracking**: Sentiment and wellness monitoring

### For Healthcare Employers

- **Job Posting**: Create and manage job postings
- **Candidate Matching**: AI-powered candidate recommendations
- **Analytics Dashboard**: Workforce insights and metrics
- **Applicant Management**: Track and manage applicants
- **Retention Analytics**: Monitor employee retention
- **Performance Metrics**: Track hiring success

### For Administrators

- **System Management**: User and system administration
- **Analytics Overview**: Platform-wide metrics
- **Content Management**: Manage jobs, users, and content
- **Audit Logs**: Monitor system activity
- **Configuration**: System settings and configuration

## 🔒 Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted data transmission
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and throttling
- **CORS**: Cross-origin resource sharing configuration
- **SSL/TLS**: End-to-end encryption

## 📈 Analytics

### Key Metrics

- **Retention Forecast**: Employee retention predictions
- **No-Show Risk**: Candidate no-show probability
- **Turnover Cost**: Cost analysis of employee turnover
- **Match Quality**: AI matching accuracy
- **Platform Usage**: User engagement metrics
- **Performance KPIs**: Hiring success rates

### Reporting

- **Real-time Dashboards**: Live metrics and insights
- **Export Capabilities**: CSV and PDF exports
- **Custom Reports**: Configurable reporting
- **Historical Data**: Trend analysis and comparisons

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- **Documentation**: Check the individual README files in each component
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added mobile app and AI chat
- **v1.2.0**: Enhanced analytics and reporting
- **v1.3.0**: Improved matching algorithms and UI

## 🎯 Roadmap

### Upcoming Features

- **Advanced AI Matching**: Enhanced machine learning algorithms
- **Video Interviews**: Integrated video interview platform
- **Mobile Notifications**: Push notifications for mobile app
- **Advanced Analytics**: Predictive analytics and insights
- **Integration APIs**: Third-party system integrations
- **Multi-language Support**: Internationalization support

### Long-term Goals

- **Machine Learning Platform**: Advanced ML model training
- **Blockchain Integration**: Secure credential verification
- **IoT Integration**: Healthcare device integration
- **Global Expansion**: Multi-region deployment
- **Enterprise Features**: Advanced enterprise capabilities

---

**Pipeline Workforce Platform** - Revolutionizing healthcare staffing through technology and innovation.