#!/bin/bash

# Quick Deploy Script - Common deployment scenarios
# Usage: ./quick-deploy.sh [scenario]

set -e

PROJECT_DIR="/home/ubuntu/pipeline"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_help() {
    cat << EOF
Quick Deployment Script

Usage: ./quick-deploy.sh [SCENARIO]

SCENARIOS:
    update-jobs     Update frontend with latest job data
    hotfix          Quick frontend fix without building
    new-jobs        Copy new job data and restart frontend
    full            Full deployment (same as ./deploy.sh)
    check           Check deployment status
    logs            Show recent deployment logs

EXAMPLES:
    ./quick-deploy.sh update-jobs   # Update jobs data and redeploy frontend
    ./quick-deploy.sh hotfix        # Quick frontend update without rebuild
    ./quick-deploy.sh check         # Check if all services are running

EOF
}

update_jobs() {
    log "Updating job data and redeploying frontend..."
    
    # Find the latest job file
    LATEST_JOB_FILE=$(find backend/job-scraper/ -name "*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$LATEST_JOB_FILE" ]]; then
        info "Found latest job file: $LATEST_JOB_FILE"
        cp "$LATEST_JOB_FILE" frontend/web-dashboard/
        ./deploy.sh frontend
    else
        info "No job files found in backend/job-scraper/"
    fi
}

hotfix() {
    log "Performing hotfix deployment (no rebuild)..."
    ./deploy.sh --no-build frontend
}

new_jobs() {
    log "Copying new job data and restarting frontend..."
    
    # Copy any JSON files from job-scraper to web-dashboard
    find backend/job-scraper/ -name "*.json" -type f -exec cp {} frontend/web-dashboard/ \;
    
    # Just restart without rebuilding
    docker-compose restart web-dashboard
    
    log "Frontend restarted with new job data"
}

check_status() {
    log "Checking deployment status..."
    
    echo "=== Docker Containers ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== Service Health ==="
    
    # Check website
    if curl -s -f https://pipelineworkforce.com >/dev/null; then
        echo "✅ Website: https://pipelineworkforce.com"
    else
        echo "❌ Website: https://pipelineworkforce.com"
    fi
    
    # Check API
    if curl -s -f https://pipelineworkforce.com/api/jobs?limit=1 >/dev/null; then
        echo "✅ Jobs API: Working"
    else
        echo "❌ Jobs API: Failed"
    fi
    
    echo ""
    echo "=== Recent Logs ==="
    tail -5 deployment.log 2>/dev/null || echo "No deployment logs found"
}

show_logs() {
    log "Recent deployment logs:"
    tail -20 deployment.log 2>/dev/null || echo "No deployment logs found"
}

# Parse arguments
case ${1:-""} in
    update-jobs)
        update_jobs
        ;;
    hotfix)
        hotfix
        ;;
    new-jobs)
        new_jobs
        ;;
    full)
        ./deploy.sh
        ;;
    check)
        check_status
        ;;
    logs)
        show_logs
        ;;
    --help|help|"")
        show_help
        ;;
    *)
        echo "Unknown scenario: $1"
        show_help
        exit 1
        ;;
esac 