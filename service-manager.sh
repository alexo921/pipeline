#!/bin/bash

# Pipeline Service Manager
# Provides comprehensive service management for Docker-based pipeline services
# Usage: ./service-manager.sh [COMMAND] [SERVICE]

set -e

PROJECT_DIR="/home/ubuntu/pipeline"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Available services
SERVICES=("postgres" "redis" "api" "web-dashboard" "admin-panel" "job-scraper")
ALL_SERVICES=("postgres" "redis" "api" "web-dashboard" "admin-panel" "job-scraper")

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Pipeline Service Manager

Usage: ./service-manager.sh [COMMAND] [SERVICE]

COMMANDS:
    start       Start service(s)
    stop        Stop service(s)
    restart     Restart service(s)
    status      Show service status
    logs        Show service logs
    health      Check service health
    ps          List all containers
    clean       Remove stopped containers and unused images
    backup      Create database backup
    restore     Restore database from backup
    shell       Open shell in service container
    exec        Execute command in service container

SERVICES:
    all         All services
    postgres    PostgreSQL database
    redis       Redis cache
    api         Backend API
    frontend    Web dashboard (alias for web-dashboard)
    web-dashboard Web dashboard
    admin       Admin panel (alias for admin-panel)
    admin-panel Admin panel
    scraper     Job scraper (alias for job-scraper)
    job-scraper Job scraper

EXAMPLES:
    ./service-manager.sh start all              # Start all services
    ./service-manager.sh stop api               # Stop API service
    ./service-manager.sh restart frontend       # Restart frontend
    ./service-manager.sh status                 # Show all service status
    ./service-manager.sh logs api               # Show API logs
    ./service-manager.sh health                 # Check all service health
    ./service-manager.sh shell postgres         # Open shell in postgres
    ./service-manager.sh exec api "npm test"    # Run test in API container
    ./service-manager.sh backup                 # Create database backup
    ./service-manager.sh clean                  # Clean up Docker resources

EOF
}

# Normalize service names
normalize_service() {
    local service=$1
    case $service in
        frontend)
            echo "web-dashboard"
            ;;
        admin)
            echo "admin-panel"
            ;;
        scraper)
            echo "job-scraper"
            ;;
        *)
            echo "$service"
            ;;
    esac
}

# Get container name for service
get_container_name() {
    local service=$1
    case $service in
        postgres)
            echo "pipeline-postgres"
            ;;
        redis)
            echo "pipeline-redis"
            ;;
        api)
            echo "pipeline-api"
            ;;
        web-dashboard)
            echo "pipeline-web"
            ;;
        admin-panel)
            echo "pipeline-admin"
            ;;
        job-scraper)
            echo "pipeline-scraper"
            ;;
        *)
            echo "pipeline-$service"
            ;;
    esac
}

# Check if service exists
service_exists() {
    local service=$1
    for s in "${SERVICES[@]}"; do
        if [[ "$s" == "$service" ]]; then
            return 0
        fi
    done
    return 1
}

# Start service
start_service() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    log "Starting $service..."
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        info "$service is already running"
        return 0
    fi
    
    if docker ps -aq -f name="$container_name" | grep -q .; then
        info "Starting existing $service container..."
        if docker start "$container_name"; then
            success "$service started successfully"
        else
            error "Failed to start $service"
            return 1
        fi
    else
        info "Creating and starting $service container..."
        if docker-compose up -d "$service"; then
            success "$service started successfully"
        else
            error "Failed to start $service"
            return 1
        fi
    fi
}

# Stop service
stop_service() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    log "Stopping $service..."
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        if docker stop "$container_name"; then
            success "$service stopped successfully"
        else
            error "Failed to stop $service"
            return 1
        fi
    else
        info "$service is not running"
    fi
}

# Restart service
restart_service() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    log "Restarting $service..."
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        if docker restart "$container_name"; then
            success "$service restarted successfully"
        else
            error "Failed to restart $service"
            return 1
        fi
    else
        info "$service is not running, starting it..."
        start_service "$service"
    fi
}

# Show service status
show_status() {
    local service=$1
    
    if [[ "$service" == "all" ]]; then
        log "Service Status Overview"
        echo "======================"
        echo ""
        
        # Show all containers
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep pipeline || echo "No pipeline services running"
        
        echo ""
        echo "Stopped Services:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep pipeline | grep -v Up || echo "No stopped pipeline services"
        
        return 0
    fi
    
    local container_name=$(get_container_name "$service")
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        echo "✅ $service is running"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "$container_name"
    else
        if docker ps -aq -f name="$container_name" | grep -q .; then
            echo "⏸️  $service is stopped"
            docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep "$container_name"
        else
            echo "❌ $service container does not exist"
        fi
    fi
}

# Show service logs
show_logs() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        log "Showing logs for $service..."
        docker logs -f "$container_name"
    else
        if docker ps -aq -f name="$container_name" | grep -q .; then
            log "Showing logs for stopped $service container..."
            docker logs "$container_name"
        else
            error "$service container does not exist"
            return 1
        fi
    fi
}

# Check service health
check_health() {
    local service=$1
    
    if [[ "$service" == "all" ]]; then
        log "Health Check Overview"
        echo "===================="
        echo ""
        
        for s in "${SERVICES[@]}"; do
            check_health "$s"
            echo ""
        done
        return 0
    fi
    
    local container_name=$(get_container_name "$service")
    
    if ! docker ps -q -f name="$container_name" | grep -q .; then
        echo "❌ $service: Container not running"
        return 1
    fi
    
    case $service in
        postgres)
            if docker exec "$container_name" pg_isready -U pipeline_admin -d pipeline_production_db >/dev/null 2>&1; then
                echo "✅ $service: Database ready"
            else
                echo "❌ $service: Database not ready"
                return 1
            fi
            ;;
        redis)
            if docker exec "$container_name" redis-cli ping >/dev/null 2>&1; then
                echo "✅ $service: Redis responding"
            else
                echo "❌ $service: Redis not responding"
                return 1
            fi
            ;;
        api)
            if curl -s -f http://localhost:3001/api/job?limit=1 >/dev/null 2>&1; then
                echo "✅ $service: API responding"
            else
                echo "❌ $service: API not responding"
                return 1
            fi
            ;;
        web-dashboard)
            if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
                echo "✅ $service: Web dashboard responding"
            else
                echo "❌ $service: Web dashboard not responding"
                return 1
            fi
            ;;
        admin-panel)
            if curl -s -f http://localhost:3002 >/dev/null 2>&1; then
                echo "✅ $service: Admin panel responding"
            else
                echo "❌ $service: Admin panel not responding"
                return 1
            fi
            ;;
        job-scraper)
            echo "ℹ️  $service: Job scraper (manual execution)"
            ;;
        *)
            echo "ℹ️  $service: Health check not implemented"
            ;;
    esac
}

# List all containers
list_containers() {
    log "Pipeline Containers"
    echo "=================="
    echo ""
    
    echo "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep pipeline || echo "No pipeline containers running"
    
    echo ""
    echo "All Containers:"
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | head -1
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep pipeline || echo "No pipeline containers found"
}

# Clean up Docker resources
clean_docker() {
    log "Cleaning up Docker resources..."
    
    echo "Removing stopped containers..."
    docker container prune -f
    
    echo "Removing unused images..."
    docker image prune -f
    
    echo "Removing unused networks..."
    docker network prune -f
    
    echo "Removing unused volumes..."
    docker volume prune -f
    
    success "Docker cleanup completed"
}

# Create database backup
create_backup() {
    local backup_dir="$PROJECT_DIR/backups"
    mkdir -p "$backup_dir"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/backup_$timestamp.sql"
    
    log "Creating database backup..."
    
    if docker ps | grep -q pipeline-postgres; then
        if docker exec pipeline-postgres pg_dump -U pipeline_admin pipeline_production_db > "$backup_file" 2>/dev/null; then
            success "Database backup created: $backup_file"
        else
            error "Database backup failed"
            return 1
        fi
    else
        error "PostgreSQL container is not running"
        return 1
    fi
}

# Restore database from backup
restore_backup() {
    local backup_file=$1
    
    if [[ -z "$backup_file" ]]; then
        error "Please specify a backup file"
        echo "Usage: ./service-manager.sh restore <backup_file>"
        echo "Available backups:"
        ls -la "$PROJECT_DIR/backups/"*.sql 2>/dev/null || echo "No backups found"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Restoring database from backup: $backup_file"
    
    if docker ps | grep -q pipeline-postgres; then
        if docker exec -i pipeline-postgres psql -U pipeline_admin -d pipeline_production_db < "$backup_file"; then
            success "Database restored successfully"
        else
            error "Database restore failed"
            return 1
        fi
    else
        error "PostgreSQL container is not running"
        return 1
    fi
}

# Open shell in service container
open_shell() {
    local service=$1
    local container_name=$(get_container_name "$service")
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        log "Opening shell in $service container..."
        docker exec -it "$container_name" /bin/bash
    else
        error "$service container is not running"
        return 1
    fi
}

# Execute command in service container
execute_command() {
    local service=$1
    local command=$2
    local container_name=$(get_container_name "$service")
    
    if [[ -z "$command" ]]; then
        error "Please specify a command to execute"
        echo "Usage: ./service-manager.sh exec <service> <command>"
        return 1
    fi
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        log "Executing command in $service container: $command"
        docker exec -it "$container_name" $command
    else
        error "$service container is not running"
        return 1
    fi
}

# Main command handler
main() {
    local command=$1
    local service=$2
    
    # Default to "all" if no service specified
    if [[ -z "$service" ]]; then
        service="all"
    fi
    
    # Normalize service name
    service=$(normalize_service "$service")
    
    # Validate service
    if [[ "$service" != "all" ]] && ! service_exists "$service"; then
        error "Unknown service: $service"
        echo "Available services: ${SERVICES[*]}"
        return 1
    fi
    
    case $command in
        start)
            if [[ "$service" == "all" ]]; then
                for s in "${SERVICES[@]}"; do
                    start_service "$s"
                done
            else
                start_service "$service"
            fi
            ;;
        stop)
            if [[ "$service" == "all" ]]; then
                for s in "${SERVICES[@]}"; do
                    stop_service "$s"
                done
            else
                stop_service "$service"
            fi
            ;;
        restart)
            if [[ "$service" == "all" ]]; then
                for s in "${SERVICES[@]}"; do
                    restart_service "$s"
                done
            else
                restart_service "$service"
            fi
            ;;
        status)
            show_status "$service"
            ;;
        logs)
            if [[ "$service" == "all" ]]; then
                error "Cannot show logs for all services at once. Please specify a service."
                return 1
            fi
            show_logs "$service"
            ;;
        health)
            check_health "$service"
            ;;
        ps)
            list_containers
            ;;
        clean)
            clean_docker
            ;;
        backup)
            create_backup
            ;;
        restore)
            restore_backup "$service"
            ;;
        shell)
            if [[ "$service" == "all" ]]; then
                error "Cannot open shell for all services. Please specify a service."
                return 1
            fi
            open_shell "$service"
            ;;
        exec)
            if [[ "$service" == "all" ]]; then
                error "Cannot execute command for all services. Please specify a service."
                return 1
            fi
            execute_command "$service" "${@:3}"
            ;;
        --help|help)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            return 1
            ;;
    esac
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error "Docker is not running"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]]; then
    error "docker-compose.yml not found. Please run from project directory."
    exit 1
fi

# Run main function
main "$@" 