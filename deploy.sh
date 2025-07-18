#!/bin/bash

# Pipeline Deployment Script
# Usage: ./deploy.sh [OPTIONS] [COMPONENT]
# Components: all, frontend, backend, api, admin, scraper, migrations
# Options: --no-build, --no-restart, --dry-run, --rollback

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/ubuntu/pipeline"
BACKUP_DIR="$PROJECT_DIR/backups"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
NGINX_CONFIG="/etc/nginx/sites-available/pipelineworkforce.com"
LOG_FILE="$PROJECT_DIR/deployment.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Pipeline Deployment Script

Usage: ./deploy.sh [OPTIONS] [COMPONENT]

COMPONENTS:
    all         Deploy everything (default)
    frontend    Deploy web-dashboard only
    backend     Deploy API backend only
    api         Same as backend
    admin       Deploy admin panel only
    scraper     Deploy job scraper only
    migrations  Run Prisma migrations only
    nginx       Reload nginx configuration only

OPTIONS:
    --no-build      Skip Docker image building
    --no-restart    Skip service restart
    --dry-run       Show what would be done without executing
    --rollback      Rollback to previous deployment
    --help          Show this help message

EXAMPLES:
    ./deploy.sh                    # Deploy everything
    ./deploy.sh frontend           # Deploy only frontend
    ./deploy.sh --dry-run          # See what would be deployed
    ./deploy.sh --no-build api     # Deploy API without rebuilding
    ./deploy.sh migrations         # Run database migrations only

EOF
}

# Parse command line arguments
DRY_RUN=false
NO_BUILD=false
NO_RESTART=false
ROLLBACK=false
COMPONENT="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --no-restart)
            NO_RESTART=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        all|frontend|backend|api|admin|scraper|migrations|nginx)
            COMPONENT=$1
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Normalize component names
case $COMPONENT in
    api)
        COMPONENT="backend"
        ;;
esac

# Pre-deployment checks
check_prerequisites() {
    log "Running pre-deployment checks..."
    
    # Check if running as correct user
    if [[ "$EUID" -eq 0 ]]; then
        error "Don't run this script as root"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error "docker-compose.yml not found. Please run from project directory."
        exit 1
    fi
    
    # Check disk space (warn if less than 2GB free)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 2097152 ]]; then
        warning "Less than 2GB of disk space available"
    fi
    
    log "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would create backup"
        return
    fi
    
    log "Creating deployment backup..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker ps | grep -q pipeline-postgres; then
        log "Backing up database..."
        if docker exec pipeline-postgres pg_dump -U pipeline_admin pipeline_production_db > "$BACKUP_PATH/database.sql" 2>/dev/null; then
            log "Database backup completed"
        else
            warning "Database backup failed - continuing without backup"
        fi
    else
        warning "PostgreSQL container not running - skipping database backup"
    fi
    
    # Backup important config files
    cp "$NGINX_CONFIG" "$BACKUP_PATH/nginx.conf" 2>/dev/null || true
    cp "$DOCKER_COMPOSE_FILE" "$BACKUP_PATH/docker-compose.yml"
    
    # Save current git commit
    git rev-parse HEAD > "$BACKUP_PATH/git_commit.txt" 2>/dev/null || echo "no-git" > "$BACKUP_PATH/git_commit.txt"
    
    # Save current container states
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" > "$BACKUP_PATH/containers.txt"
    
    echo "$BACKUP_PATH" > "$BACKUP_DIR/latest_backup.txt"
    log "Backup created at: $BACKUP_PATH"
}

# Git operations
update_code() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would pull latest code from git"
        return
    fi
    
    log "Updating code from git..."
    
    # Stash any local changes
    if git status --porcelain | grep -q .; then
        warning "Stashing local changes"
        git stash push -m "Auto-stash before deployment $(date)"
    fi
    
    # Pull latest changes
    git pull origin main || {
        error "Failed to pull latest code"
        exit 1
    }
    
    log "Code updated successfully"
}

# Prisma migrations
run_migrations() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would run Prisma migrations"
        return
    fi
    
    log "Running Prisma migrations..."
    
    # Check if API container is running
    if ! docker ps | grep -q pipeline-api; then
        warning "API container not running, starting temporarily for migrations"
        docker-compose up -d api
        sleep 10
    fi
    
    # Run migrations with checksum ignore flag
    if docker-compose exec -T api PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate deploy; then
        log "Migrations completed successfully"
    else
        warning "Migrations failed - continuing deployment"
    fi
}

# Build and deploy specific components
deploy_component() {
    local component=$1
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would deploy component: $component"
        return
    fi
    
    log "Deploying component: $component"
    
    case $component in
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
        nginx)
            reload_nginx
            ;;
        all)
            deploy_frontend
            deploy_backend
            deploy_admin
            deploy_scraper
            reload_nginx
            ;;
    esac
}

deploy_frontend() {
    log "Deploying frontend (web-dashboard)..."
    
    # Copy all job data JSON files to public directory for Next.js static serving
    mkdir -p "$PROJECT_DIR/frontend/web-dashboard/public/"
    find "$PROJECT_DIR/backend/job-scraper/" -maxdepth 1 -type f -name "*.json" -exec cp {} "$PROJECT_DIR/frontend/web-dashboard/public/" \;
    
    if [[ "$NO_BUILD" != "true" ]]; then
        log "Building frontend..."
        if docker-compose build web-dashboard; then
            log "Frontend build completed successfully"
        else
            error "Frontend build failed"
            return 1
        fi
    fi
    
    if [[ "$NO_RESTART" != "true" ]]; then
        log "Starting frontend..."
        if docker-compose up -d web-dashboard; then
            log "Frontend started successfully"
        else
            error "Failed to start frontend"
            return 1
        fi
    fi
    
    log "Frontend deployed successfully"
}

deploy_backend() {
    log "Deploying backend (API)..."
    
    if [[ "$NO_BUILD" != "true" ]]; then
        log "Building backend API..."
        if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 docker-compose build api; then
            log "Backend build completed successfully"
        else
            error "Backend build failed"
            return 1
        fi
    fi
    
    if [[ "$NO_RESTART" != "true" ]]; then
        log "Starting backend API..."
        if docker-compose up -d api; then
            log "Backend started successfully"
        else
            error "Failed to start backend"
            return 1
        fi
    fi
    
    log "Backend deployed successfully"
}

deploy_admin() {
    log "Deploying admin panel..."
    
    if [[ "$NO_BUILD" != "true" ]]; then
        log "Building admin panel..."
        if docker-compose build admin-panel; then
            log "Admin panel build completed successfully"
        else
            error "Admin panel build failed"
            return 1
        fi
    fi
    
    if [[ "$NO_RESTART" != "true" ]]; then
        log "Starting admin panel..."
        if docker-compose up -d admin-panel; then
            log "Admin panel started successfully"
        else
            error "Failed to start admin panel"
            return 1
        fi
    fi
    
    log "Admin panel deployed successfully"
}

deploy_scraper() {
    log "Deploying job scraper..."
    
    if [[ "$NO_BUILD" != "true" ]]; then
        log "Building job scraper..."
        if docker-compose build job-scraper; then
            log "Job scraper build completed successfully"
        else
            error "Job scraper build failed"
            return 1
        fi
    fi
    
    if [[ "$NO_RESTART" != "true" ]]; then
        log "Starting job scraper..."
        if docker-compose up -d job-scraper; then
            log "Job scraper started successfully"
        else
            error "Failed to start job scraper"
            return 1
        fi
    fi
    
    log "Job scraper deployed successfully"
}

reload_nginx() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would reload nginx"
        return
    fi
    
    log "Reloading nginx configuration..."
    
    # Test nginx config first
    sudo nginx -t || {
        error "Nginx configuration test failed"
        exit 1
    }
    
    sudo systemctl reload nginx
    log "Nginx reloaded successfully"
}

# Health checks
run_health_checks() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would run health checks"
        return
    fi
    
    log "Running health checks..."
    
    # Wait a moment for services to start
    sleep 10
    
    # Check if containers are running
    FAILED_SERVICES=()
    
    for service in web-dashboard api admin-panel postgres redis; do
        if ! docker ps | grep -q "pipeline-$service"; then
            FAILED_SERVICES+=("$service")
        fi
    done
    
    if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
        error "The following services failed to start: ${FAILED_SERVICES[*]}"
        return 1
    fi
    
    # Test API endpoints
    if ! curl -s -f http://localhost:3000/api/jobs?limit=1 >/dev/null; then
        error "Frontend API health check failed"
        return 1
    fi
    
    # Test website
    if ! curl -s -f https://pipelineworkforce.com >/dev/null; then
        error "Website health check failed"
        return 1
    fi
    
    log "All health checks passed"
    return 0
}

# Rollback function
rollback_deployment() {
    if [[ ! -f "$BACKUP_DIR/latest_backup.txt" ]]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    BACKUP_PATH=$(cat "$BACKUP_DIR/latest_backup.txt")
    
    if [[ ! -d "$BACKUP_PATH" ]]; then
        error "Backup directory not found: $BACKUP_PATH"
        exit 1
    fi
    
    log "Rolling back to backup: $BACKUP_PATH"
    
    # Restore database
    if [[ -f "$BACKUP_PATH/database.sql" ]]; then
        log "Restoring database..."
        docker exec -i pipeline-postgres psql -U postgres -d pipeline_production_db < "$BACKUP_PATH/database.sql"
    fi
    
    # Restore nginx config
    if [[ -f "$BACKUP_PATH/nginx.conf" ]]; then
        log "Restoring nginx configuration..."
        sudo cp "$BACKUP_PATH/nginx.conf" "$NGINX_CONFIG"
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # Restore git commit
    if [[ -f "$BACKUP_PATH/git_commit.txt" ]]; then
        COMMIT=$(cat "$BACKUP_PATH/git_commit.txt")
        if [[ "$COMMIT" != "no-git" ]]; then
            log "Restoring git commit: $COMMIT"
            git checkout "$COMMIT"
        fi
    fi
    
    log "Rollback completed"
}

# Cleanup old backups (keep last 10)
cleanup_old_backups() {
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would cleanup old backups"
        return
    fi
    
    log "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t backup_* 2>/dev/null | tail -n +11 | xargs rm -rf 2>/dev/null || true
    log "Backup cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment script..."
    log "Component: $COMPONENT"
    log "Options: DRY_RUN=$DRY_RUN, NO_BUILD=$NO_BUILD, NO_RESTART=$NO_RESTART, ROLLBACK=$ROLLBACK"
    
    cd "$PROJECT_DIR"
    
    if [[ "$ROLLBACK" == "true" ]]; then
        rollback_deployment
        exit 0
    fi
    
    check_prerequisites
    create_backup
    
    if [[ "$COMPONENT" != "migrations" && "$COMPONENT" != "nginx" ]]; then
        update_code
    fi
    
    if [[ "$COMPONENT" == "migrations" ]]; then
        run_migrations
    elif [[ "$COMPONENT" == "nginx" ]]; then
        reload_nginx
    else
        # Run migrations first for backend/all deployments
        if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
            run_migrations
        fi
        
        deploy_component "$COMPONENT"
    fi
    
    if [[ "$DRY_RUN" != "true" ]]; then
        if ! run_health_checks; then
            error "Health checks failed. Consider rolling back."
            exit 1
        fi
    fi
    
    cleanup_old_backups
    
    log "Deployment completed successfully!"
    log "Visit: https://pipelineworkforce.com"
}

# Run main function
main "$@" 