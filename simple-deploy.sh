#!/bin/bash

# Simple Deployment Script - Fixed version
# Usage: ./simple-deploy.sh [component]

set -e

PROJECT_DIR="/home/ubuntu/pipeline"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Simple Deployment Script

Usage: ./simple-deploy.sh [COMPONENT]

COMPONENTS:
    all         Deploy everything (default)
    frontend    Deploy web-dashboard only
    backend     Deploy API backend only
    admin       Deploy admin panel only
    scraper     Deploy job scraper only
    check       Check deployment status

EXAMPLES:
    ./simple-deploy.sh              # Deploy everything
    ./simple-deploy.sh frontend     # Deploy only frontend
    ./simple-deploy.sh check        # Check status

EOF
}

check_status() {
    log "Checking deployment status..."
    
    echo "=== Docker Containers ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== Service Health ==="
    
    # Check website
    if curl -s -f https://pipelineworkforce.com >/dev/null 2>&1; then
        echo "✅ Website: https://pipelineworkforce.com"
    else
        echo "❌ Website: https://pipelineworkforce.com"
    fi
    
    # Check API
    if curl -s -f http://localhost:3001/api/job?limit=1 >/dev/null 2>&1; then
        echo "✅ Jobs API: Working"
    else
        echo "❌ Jobs API: Failed"
    fi
}

deploy_frontend() {
    log "Deploying frontend (web-dashboard)..."
    
    # Copy job data files (but preserve cleaned files)
    mkdir -p "$PROJECT_DIR/frontend/web-dashboard/public/"
    
    # Copy JSON files from backend/job-scraper, but don't overwrite cleaned files
    find "$PROJECT_DIR/backend/job-scraper/" -maxdepth 1 -type f -name "*.json" | while read file; do
        filename=$(basename "$file")
        target="$PROJECT_DIR/frontend/web-dashboard/public/$filename"
        
        # Don't overwrite cleaned files
        if [[ "$filename" == "improved_ct_jobs_20250725_054659.json" ]]; then
            log "Preserving cleaned file: $filename"
            continue
        fi
        
        cp "$file" "$target" 2>/dev/null || true
    done
    
    # Stop and remove existing container
    docker-compose stop web-dashboard 2>/dev/null || true
    docker-compose rm -f web-dashboard 2>/dev/null || true
    
    # Build and start
    log "Building frontend..."
    if docker-compose build web-dashboard; then
        log "Frontend build completed"
    else
        error "Frontend build failed"
        return 1
    fi
    
    log "Starting frontend..."
    if docker-compose up -d web-dashboard; then
        log "Frontend started successfully"
    else
        error "Failed to start frontend"
        return 1
    fi
    
    log "Frontend deployed successfully"
}

deploy_backend() {
    log "Deploying backend (API)..."
    
    # Stop and remove existing container
    docker-compose stop api 2>/dev/null || true
    docker-compose rm -f api 2>/dev/null || true
    
    # Build with Prisma checksum ignore
    log "Building backend..."
    if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 docker-compose build api; then
        log "Backend build completed"
    else
        error "Backend build failed"
        return 1
    fi
    
    # Start
    log "Starting backend..."
    if docker-compose up -d api; then
        log "Backend started successfully"
    else
        error "Failed to start backend"
        return 1
    fi
    
    # Copy updated .env file if it exists
    if [[ -f "backend/api/.env" ]]; then
        log "Updating environment variables..."
        docker cp backend/api/.env pipeline-api:/app/.env 2>/dev/null || true
        docker restart pipeline-api 2>/dev/null || true
    fi
    
    log "Backend deployed successfully"
}

deploy_admin() {
    log "Deploying admin panel..."
    
    # Stop and remove existing container
    docker-compose stop admin-panel 2>/dev/null || true
    docker-compose rm -f admin-panel 2>/dev/null || true
    
    # Build and start
    log "Building admin panel..."
    if docker-compose build admin-panel; then
        log "Admin panel build completed"
    else
        error "Admin panel build failed"
        return 1
    fi
    
    log "Starting admin panel..."
    if docker-compose up -d admin-panel; then
        log "Admin panel started successfully"
    else
        error "Failed to start admin panel"
        return 1
    fi
    
    log "Admin panel deployed successfully"
}

deploy_scraper() {
    log "Deploying job scraper..."
    
    # Stop and remove existing container
    docker-compose stop job-scraper 2>/dev/null || true
    docker-compose rm -f job-scraper 2>/dev/null || true
    
    # Build and start
    log "Building job scraper..."
    if docker-compose build job-scraper; then
        log "Job scraper build completed"
    else
        error "Job scraper build failed"
        return 1
    fi
    
    log "Starting job scraper..."
    if docker-compose up -d job-scraper; then
        log "Job scraper started successfully"
    else
        error "Failed to start job scraper"
        return 1
    fi
    
    log "Job scraper deployed successfully"
}

deploy_all() {
    log "Deploying all components..."
    
    deploy_frontend
    deploy_backend
    deploy_admin
    # deploy_scraper  # Temporarily disabled to save disk space
    
    log "All components deployed successfully"
}

# Parse arguments
case ${1:-"all"} in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    admin)
        deploy_admin
        ;;
    scraper)
        deploy_scraper
        ;;
    all)
        deploy_all
        ;;
    check)
        check_status
        ;;
    --help|help)
        show_help
        ;;
    *)
        error "Unknown component: $1"
        show_help
        exit 1
        ;;
esac

log "Deployment completed successfully!" 