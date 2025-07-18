# Pipeline Deployment Guide

This guide covers how to deploy updates to the Pipeline Workforce platform running on Ubuntu with Docker and Nginx.

## Quick Start

For most common scenarios, use the quick deployment script:

```bash
# Update job data and redeploy frontend
./quick-deploy.sh update-jobs

# Quick frontend hotfix (no rebuild)
./quick-deploy.sh hotfix

# Check deployment status
./quick-deploy.sh check
```

## Fixed Deployment Scripts

### Simple Deployment Script (Recommended)

The new `simple-deploy.sh` script fixes common issues and provides better error handling:

```bash
# Deploy everything (recommended)
./simple-deploy.sh

# Deploy only specific components
./simple-deploy.sh frontend
./simple-deploy.sh backend
./simple-deploy.sh admin
./simple-deploy.sh scraper

# Check deployment status
./simple-deploy.sh check
```

**Key improvements:**
- ✅ Fixed database backup (uses correct `pipeline_admin` user)
- ✅ Handles Prisma checksum issues automatically
- ✅ Better error handling and logging
- ✅ Stops and removes containers before rebuilding
- ✅ Automatically copies updated .env files to containers

### Full Deployment Script

The main deployment script (`./deploy.sh`) has been updated with fixes:

```bash
# Deploy everything (frontend, backend, admin, scraper)
./deploy.sh

# Deploy only specific components
./deploy.sh frontend
./deploy.sh backend  # or 'api'
./deploy.sh admin
./deploy.sh scraper

# Run only database migrations
./deploy.sh migrations

# Reload nginx configuration
./deploy.sh nginx
```

### Advanced Options

```bash
# See what would be deployed without executing
./deploy.sh --dry-run

# Deploy without rebuilding Docker images (faster)
./deploy.sh --no-build frontend

# Deploy without restarting services
./deploy.sh --no-restart backend

# Rollback to previous deployment
./deploy.sh --rollback
```

### Combined Examples

```bash
# Quick frontend update without rebuild
./deploy.sh --no-build frontend

# See what a full deployment would do
./deploy.sh --dry-run

# Deploy only backend with migrations
./deploy.sh backend
```

## Recent Fixes

### Database Backup Issues
- **Problem**: Script was using `postgres` user instead of `pipeline_admin`
- **Fix**: Updated to use correct database user and added error handling
- **Result**: Database backups now work correctly

### Prisma Build Issues
- **Problem**: Prisma checksum validation failing during builds
- **Fix**: Added `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` environment variable
- **Result**: Backend builds complete successfully

### Docker Container Issues
- **Problem**: Container config errors during rebuilds
- **Fix**: Stop and remove containers before rebuilding
- **Result**: Clean rebuilds without container conflicts

### Environment Variable Updates
- **Problem**: .env changes not reflected in running containers
- **Fix**: Automatic copying of .env files to containers
- **Result**: Configuration changes apply immediately

## Components

### Frontend (web-dashboard)
- **Location**: `frontend/web-dashboard/`
- **Port**: 3000
- **Service**: `pipeline-web`
- **What it does**: Automatically copies latest job data and rebuilds Next.js app

### Backend (API)
- **Location**: `backend/api/`
- **Port**: 3001
- **Service**: `pipeline-api`
- **What it does**: Runs Prisma migrations and rebuilds NestJS API

### Admin Panel
- **Location**: `admin-panel/`
- **Port**: 3002
- **Service**: `pipeline-admin`
- **What it does**: Rebuilds and restarts admin interface

### Job Scraper
- **Location**: `backend/job-scraper/`
- **Service**: `pipeline-scraper`
- **What it does**: Rebuilds scraping service with latest code

## Safety Features

### Automatic Backups
Every deployment creates a timestamped backup:
- Database dump (with proper error handling)
- Git commit hash
- Docker container states
- Nginx configuration

Backups are stored in `./backups/` and automatically cleaned up (keeps last 10).

### Health Checks
After deployment, the script automatically verifies:
- ✅ All containers are running
- ✅ Website is accessible
- ✅ API endpoints respond correctly

### Rollback Capability
If something goes wrong:
```bash
./deploy.sh --rollback
```
This restores:
- Database from backup
- Previous git commit
- Previous nginx configuration

## Troubleshooting

### Check System Status
```bash
./simple-deploy.sh check
# or
./quick-deploy.sh check
```

### View Recent Logs
```bash
./quick-deploy.sh logs
# or
tail -f deployment.log
```

### Manual Container Management
```bash
# View all containers
docker ps

# Restart a specific service
docker-compose restart web-dashboard

# View service logs
docker-compose logs web-dashboard

# Rebuild and restart
docker-compose up -d --build web-dashboard
```

### Common Issues

#### "Container Config Error"
If you get Docker Compose container config errors:
```bash
# Use the simple deploy script (handles this automatically)
./simple-deploy.sh frontend

# Or manually clean up
docker container prune -f
./deploy.sh
```

#### "API Not Found"
Check nginx routing:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### "Database Connection Failed"
Ensure PostgreSQL is running:
```bash
docker-compose up -d postgres
./deploy.sh migrations
```

#### "Prisma Build Failed"
The simple deploy script handles this automatically, but if using the old script:
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 docker-compose build api
```

## File Structure

```
pipeline/
├── deploy.sh              # Main deployment script (fixed)
├── simple-deploy.sh       # New simplified deployment script (recommended)
├── quick-deploy.sh        # Quick deployment scenarios (fixed)
├── deployment.log         # Deployment history
├── backups/               # Automatic backups
├── docker-compose.yml     # Service definitions
├── frontend/
│   └── web-dashboard/     # Next.js frontend
├── backend/
│   ├── api/              # NestJS API
│   └── job-scraper/      # Job scraping service
└── admin-panel/          # Admin interface
```

## Nginx Configuration

The deployment script automatically manages nginx routing:
- `/` → Frontend (port 3000)
- `/api/jobs` → Frontend API (port 3000)
- `/api/*` → Backend API (port 3001)
- `/admin/` → Admin panel (port 3002) 