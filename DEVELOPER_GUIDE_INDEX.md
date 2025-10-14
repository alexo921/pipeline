# Pipeline Workforce Platform - Developer Guide Index

## 📚 Complete Developer Documentation Suite

Welcome to the Pipeline Workforce Platform! This index provides quick access to all developer documentation and guides.

---

## 🚀 Quick Start

### New Developer? Start Here!
1. **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get running in 10 minutes
2. **[Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md)** - Comprehensive overview
3. **[Architecture Overview](./ARCHITECTURE_OVERVIEW.md)** - System design and components

---

## 📖 Core Documentation

### 🏗️ Architecture & Design
- **[Architecture Overview](./ARCHITECTURE_OVERVIEW.md)** - System architecture, data flow, and component relationships
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with endpoints and database schema

### 🛠️ Development Guides
- **[Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md)** - Complete development setup and workflow
- **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Fastest way to get started

### 🚀 Deployment & Operations
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[README.md](./README.md)** - Project overview and basic setup

---

## 🎯 What Each Guide Covers

### 📋 [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md)
**Perfect for**: New team members, comprehensive understanding

**Covers**:
- ✅ Project overview and value proposition
- ✅ Complete system architecture
- ✅ Technology stack details
- ✅ Development environment setup
- ✅ Project structure explanation
- ✅ Key component descriptions
- ✅ Development workflow and best practices
- ✅ Testing strategies
- ✅ Troubleshooting common issues
- ✅ Security considerations
- ✅ Performance optimization
- ✅ Learning resources and next steps

### 🏗️ [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
**Perfect for**: Understanding system design, making architectural decisions

**Covers**:
- ✅ High-level system architecture diagrams
- ✅ Component communication flows
- ✅ Data flow architecture
- ✅ Security architecture
- ✅ Scalability considerations
- ✅ Deployment architecture
- ✅ Monitoring and observability
- ✅ Future architecture plans

### 🌐 [API Documentation](./API_DOCUMENTATION.md)
**Perfect for**: Backend development, API integration, database understanding

**Covers**:
- ✅ Complete API endpoint reference
- ✅ Authentication and authorization
- ✅ Request/response formats
- ✅ Database schema documentation
- ✅ Error handling
- ✅ Rate limiting
- ✅ Testing instructions
- ✅ Development notes

### ⚡ [Quick Start Guide](./QUICK_START_GUIDE.md)
**Perfect for**: Getting up and running quickly, proof of concept

**Covers**:
- ✅ 10-minute setup process
- ✅ Prerequisites check
- ✅ Step-by-step instructions
- ✅ Verification steps
- ✅ Common troubleshooting
- ✅ Next steps

---

## 🗺️ Navigation Map

```
Pipeline Workforce Platform Documentation
├── 🚀 Quick Start (10 minutes)
│   └── [Quick Start Guide](./QUICK_START_GUIDE.md)
│
├── 📚 Comprehensive Learning (1-2 hours)
│   └── [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md)
│
├── 🏗️ Architecture Deep Dive (30-60 minutes)
│   └── [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
│
├── 🌐 API Reference (Ongoing reference)
│   └── [API Documentation](./API_DOCUMENTATION.md)
│
└── 🚀 Production Deployment
    └── [Deployment Guide](./DEPLOYMENT.md)
```

---

## 🎯 Recommended Learning Path

### For New Developers (Week 1)

#### Day 1: Get Started
1. Read [Quick Start Guide](./QUICK_START_GUIDE.md) (10 minutes)
2. Follow setup instructions to get environment running
3. Explore the running applications

#### Day 2-3: Understand the System
1. Read [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md) (2-3 hours)
2. Focus on sections: Project Overview, Architecture, Key Components
3. Explore the codebase structure

#### Day 4-5: Deep Dive
1. Study [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) (1 hour)
2. Review [API Documentation](./API_DOCUMENTATION.md) (1 hour)
3. Make your first small contribution

### For Experienced Developers (Day 1)

1. **Quick Setup**: [Quick Start Guide](./QUICK_START_GUIDE.md) (10 minutes)
2. **Architecture**: [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) (30 minutes)
3. **API Reference**: [API Documentation](./API_DOCUMENTATION.md) (30 minutes)
4. **Start Contributing**: Begin with small tasks

### For DevOps/Infrastructure Engineers

1. **Architecture**: [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
2. **Deployment**: [Deployment Guide](./DEPLOYMENT.md)
3. **API**: [API Documentation](./API_DOCUMENTATION.md) (for monitoring)

---

## 🔍 Quick Reference

### Common Tasks

#### Setting Up Development Environment
```bash
# 1. Clone repository
git clone <repository-url>
cd pipeline

# 2. Start core services
docker-compose up -d postgres redis chromadb

# 3. Set up backend
cd backend/api
npm install
npx prisma generate && npx prisma db push
npm run start:dev

# 4. Set up frontend
cd frontend/web-dashboard
npm install
npm run dev
```

#### Accessing Applications
- **Web Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs
- **Mobile App**: http://localhost:3003

#### Common Commands
```bash
# Backend
npm run start:dev    # Development server
npm run test         # Run tests
npx prisma studio    # Database GUI

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting

# Mobile
npm start            # Expo development server
npm run android      # Android emulator
```

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo, TypeScript
- **Backend**: NestJS, Node.js, TypeScript, PostgreSQL
- **AI/ML**: Jan AI, Rasa, ChromaDB, Python
- **Infrastructure**: Docker, Nginx, Ubuntu

### Important Files
- `docker-compose.yml` - Service orchestration
- `backend/api/prisma/schema.prisma` - Database schema
- `package.json` - Root dependencies
- `requirements.txt` - Python dependencies

---

## 🆘 Getting Help

### Documentation Issues
- Check if the information is in the appropriate guide
- Look for troubleshooting sections
- Review the API documentation for technical details

### Development Issues
- Follow the troubleshooting section in [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md)
- Check the [Quick Start Guide](./QUICK_START_GUIDE.md) for common issues
- Review error logs and console output

### Team Support
- **Slack Channel**: #pipeline-dev
- **Code Reviews**: GitHub Pull Requests
- **Issues**: GitHub Issues repository
- **Emergency**: Contact project lead

---

## 📈 Documentation Maintenance

### Keeping Documentation Updated
- Documentation is updated with each major release
- API documentation is automatically generated from code
- Architecture documentation is reviewed quarterly
- Quick start guide is tested with each environment change

### Contributing to Documentation
- All documentation is version controlled
- Follow the established format and structure
- Include code examples and screenshots where helpful
- Test all instructions before submitting changes

---

## 🎉 Welcome to the Team!

You now have access to comprehensive documentation for the Pipeline Workforce Platform. Start with the [Quick Start Guide](./QUICK_START_GUIDE.md) to get up and running, then dive deeper with the [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md).

**Happy coding! 🚀**

---

*Last updated: [Current Date]*
*Documentation Version: 1.0.0*
