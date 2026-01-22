#!/usr/bin/env bash
# SureWork Development Environment Setup Script
# Usage: ./tools/scripts/setup-dev.sh [--clean] [--skip-build]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
CLEAN=false
SKIP_BUILD=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean) CLEAN=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

cd "${PROJECT_ROOT}"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Java 21
    if ! command -v java &> /dev/null; then
        log_error "Java not found. Please install Java 21."
        exit 1
    fi

    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ "${JAVA_VERSION}" -lt 21 ]]; then
        log_error "Java 21+ required. Found: Java ${JAVA_VERSION}"
        exit 1
    fi
    log_info "Java ${JAVA_VERSION} found"

    # Maven
    if ! command -v mvn &> /dev/null; then
        log_error "Maven not found. Please install Maven 3.9+."
        exit 1
    fi
    log_info "Maven found"

    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    log_info "Docker found"

    # Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose not found. Please install Docker Compose v2."
        exit 1
    fi
    log_info "Docker Compose found"

    # Node.js (for frontend)
    if ! command -v node &> /dev/null; then
        log_warn "Node.js not found. Frontend development requires Node.js 20+."
    else
        log_info "Node.js found"
    fi
}

# Start infrastructure
start_infrastructure() {
    log_info "Starting infrastructure services..."

    cd "${PROJECT_ROOT}/infrastructure/docker/compose"

    if [[ "${CLEAN}" == "true" ]]; then
        log_info "Cleaning up existing containers and volumes..."
        docker compose down -v --remove-orphans
    fi

    docker compose up -d

    log_info "Waiting for services to be healthy..."
    sleep 10

    # Check PostgreSQL
    until docker compose exec -T postgres pg_isready -U surework -d surework > /dev/null 2>&1; do
        log_info "Waiting for PostgreSQL..."
        sleep 2
    done
    log_info "PostgreSQL is ready"

    # Check Redis
    until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        log_info "Waiting for Redis..."
        sleep 2
    done
    log_info "Redis is ready"

    # Check Kafka
    until docker compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; do
        log_info "Waiting for Kafka..."
        sleep 2
    done
    log_info "Kafka is ready"

    cd "${PROJECT_ROOT}"
}

# Build project
build_project() {
    if [[ "${SKIP_BUILD}" == "true" ]]; then
        log_info "Skipping Maven build (--skip-build flag)"
        return
    fi

    log_info "Building Maven project..."
    mvn clean install -DskipTests -T 1C
    log_info "Maven build complete"
}

# Run database migrations
run_migrations() {
    log_info "Running Flyway migrations..."

    # Migrations are handled by each service on startup
    # This is a placeholder for manual migration runs if needed
    log_info "Migrations will run on service startup"
}

# Print status
print_status() {
    log_info "Development environment is ready!"
    echo ""
    echo "Services:"
    echo "  PostgreSQL: localhost:5432 (user: surework, password: surework_dev)"
    echo "  Kafka: localhost:9092"
    echo "  Kafka UI: http://localhost:8090"
    echo "  Redis: localhost:6379"
    echo "  Mailhog: http://localhost:8025 (SMTP: localhost:1025)"
    echo ""
    echo "To start services:"
    echo "  cd services/<service-name>"
    echo "  mvn spring-boot:run"
    echo ""
    echo "To stop infrastructure:"
    echo "  cd infrastructure/docker/compose && docker compose down"
}

# Main
main() {
    log_info "Setting up SureWork development environment..."

    check_prerequisites
    start_infrastructure
    build_project
    run_migrations
    print_status
}

main
