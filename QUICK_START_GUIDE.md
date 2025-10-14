# Pipeline Workforce Platform - Quick Start Guide

## 🚀 Get Up and Running in 10 Minutes

This guide will get you from zero to running the entire Pipeline Workforce Platform in just 10 minutes.

### Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Docker & Docker Compose installed
- ✅ Git installed
- ✅ At least 8GB RAM available

### Step 1: Clone and Navigate (1 minute)

```bash
git clone <repository-url>
cd pipeline
```

### Step 2: Start Core Services (3 minutes)

```bash
# Start database and core services
docker-compose up -d postgres redis chromadb

# Wait for services to be ready (check logs)
docker-compose logs -f postgres
# Press Ctrl+C when you see "database system is ready to accept connections"
```

### Step 3: Set Up Backend API (3 minutes)

```bash
cd backend/api

# Install dependencies
npm install

# Set up environment (use defaults for quick start)
echo "DATABASE_URL=postgresql://pipeline:pipeline_password@localhost:5432/pipeline
JWT_SECRET=dev-secret-key-change-in-production
REDIS_URL=redis://localhost:6379" > .env

# Set up database
npx prisma generate
npx prisma db push

# Start API server
npm run start:dev
```

### Step 4: Set Up Web Dashboard (2 minutes)

```bash
# In a new terminal
cd frontend/web-dashboard

# Install dependencies
npm install

# Set up environment
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start web dashboard
npm run dev
```

### Step 5: Set Up Mobile App (1 minute)

```bash
# In a new terminal
cd frontend/mobile-app

# Install dependencies
npm install

# Set up environment
echo "EXPO_PUBLIC_API_URL=http://localhost:3001" > .env

# Start mobile app
npm start
```

### Step 6: Verify Everything is Working

Open these URLs in your browser:

- ✅ **Web Dashboard**: http://localhost:3000
- ✅ **API Health Check**: http://localhost:3001/health
- ✅ **Mobile App**: http://localhost:3003 (or scan QR code with Expo Go app)

### 🎉 You're Done!

The Pipeline Workforce Platform is now running locally. You can:

1. **Explore the Web Dashboard** at http://localhost:3000
2. **Test the Mobile App** by scanning the QR code with Expo Go
3. **Check API Documentation** at http://localhost:3001/api (if Swagger is enabled)
4. **View Database** using Prisma Studio: `npx prisma studio`

### Next Steps

- Read the [Developer Onboarding Guide](./DEVELOPER_ONBOARDING_GUIDE.md) for detailed information
- Check out the [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) to understand the system
- Review the [API Documentation](./API_DOCUMENTATION.md) for backend details

### Troubleshooting

**Port already in use?**
```bash
# Kill processes on common ports
sudo lsof -ti:3000,3001,3003,5432,6379 | xargs kill -9
```

**Docker issues?**
```bash
# Reset Docker containers
docker-compose down -v
docker-compose up -d postgres redis chromadb
```

**Database connection issues?**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# Should show "Up" status
```

### Need Help?

- Check the [Troubleshooting Section](./DEVELOPER_ONBOARDING_GUIDE.md#troubleshooting) in the main guide
- Ask the team on Slack #pipeline-dev
- Create an issue in the repository

---

**Happy coding! 🚀**
