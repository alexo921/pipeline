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

## Full Deployment Script

The main deployment script (`./deploy.sh`) provides comprehensive deployment options with safety features:

### Basic Usage

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
- Database dump
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

## File Structure

```
pipeline/
├── deploy.sh              # Main deployment script
├── quick-deploy.sh         # Quick deployment scenarios
├── deployment.log          # Deployment history
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

## Environment Variables

Key environment variables are managed through Docker Compose:
- Database credentials
- API keys
- SSL certificates
- Port configurations

## Best Practices

1. **Always test first**: Use `--dry-run` for important deployments
2. **Deploy incrementally**: Update one component at a time for easier debugging
3. **Monitor logs**: Check `deployment.log` after deployments
4. **Keep backups**: The script automatically manages this, but verify backups exist
5. **Use quick-deploy**: For routine updates like new job data

## Monitoring

### Health Check URLs
- Website: https://pipelineworkforce.com
- Jobs API: https://pipelineworkforce.com/api/jobs
- Admin: https://pipelineworkforce.com/admin

### Log Locations
- Deployment logs: `./deployment.log`
- Container logs: `docker-compose logs [service]`
- Nginx logs: `/var/log/nginx/`

## Support

If you encounter issues:
1. Check `./quick-deploy.sh check` for system status
2. Review `deployment.log` for recent errors
3. Use `./deploy.sh --rollback` if needed
4. Check individual container logs with `docker-compose logs [service]` 