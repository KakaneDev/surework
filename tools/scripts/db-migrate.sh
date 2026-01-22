#!/usr/bin/env bash
# SureWork Flyway Migration Script
# Usage: ./tools/scripts/db-migrate.sh <service> [--clean] [--info]
#
# Examples:
#   ./tools/scripts/db-migrate.sh tenant-service
#   ./tools/scripts/db-migrate.sh identity-service --clean
#   ./tools/scripts/db-migrate.sh hr-service --info

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

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-surework}"
DB_USER="${DB_USER:-surework}"
DB_PASSWORD="${DB_PASSWORD:-surework_dev}"

# Parse arguments
SERVICE=""
FLYWAY_CMD="migrate"
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean) FLYWAY_CMD="clean"; shift ;;
        --info) FLYWAY_CMD="info"; shift ;;
        --repair) FLYWAY_CMD="repair"; shift ;;
        --validate) FLYWAY_CMD="validate"; shift ;;
        -*) log_error "Unknown option: $1"; exit 1 ;;
        *) SERVICE="$1"; shift ;;
    esac
done

if [[ -z "${SERVICE}" ]]; then
    log_error "Service name required"
    echo "Usage: $0 <service> [--clean|--info|--repair|--validate]"
    echo ""
    echo "Available services:"
    ls -1 "${PROJECT_ROOT}/services" | grep -v "^$"
    exit 1
fi

SERVICE_DIR="${PROJECT_ROOT}/services/${SERVICE}"
MIGRATIONS_DIR="${SERVICE_DIR}/src/main/resources/db/migration"

if [[ ! -d "${SERVICE_DIR}" ]]; then
    log_error "Service not found: ${SERVICE}"
    exit 1
fi

if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
    log_warn "No migrations directory found for ${SERVICE}"
    log_info "Expected: ${MIGRATIONS_DIR}"
    exit 0
fi

cd "${SERVICE_DIR}"

log_info "Running Flyway ${FLYWAY_CMD} for ${SERVICE}..."

# Run Flyway via Maven
mvn flyway:${FLYWAY_CMD} \
    -Dflyway.url="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    -Dflyway.user="${DB_USER}" \
    -Dflyway.password="${DB_PASSWORD}" \
    -Dflyway.locations="filesystem:${MIGRATIONS_DIR}" \
    -Dflyway.cleanDisabled=false

log_info "Flyway ${FLYWAY_CMD} completed for ${SERVICE}"
