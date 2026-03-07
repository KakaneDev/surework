#!/bin/bash
# SureWork VM Setup Script
# Run this script after SSHing into the VM to complete setup
# Usage: ./vm-setup.sh [github-token]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    log_error "Please run as non-root user, not with sudo"
    exit 1
fi

echo ""
echo "=========================================="
echo "  SureWork VM Setup"
echo "=========================================="
echo ""

# Verify Docker is installed
log_info "Verifying Docker installation..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please wait for startup script to complete."
    exit 1
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    log_warn "You need to log out and back in for Docker group membership to take effect"
    log_info "Run: exit"
    log_info "Then: gcloud compute ssh surework-server --zone=europe-west1-b"
    exit 0
fi

# Clone repository
log_info "Cloning SureWork repository..."
cd ~

if [ -d "surework" ]; then
    log_warn "Repository already exists, pulling latest changes..."
    cd surework
    git pull
else
    GITHUB_TOKEN="${1:-}"
    if [ -n "$GITHUB_TOKEN" ]; then
        git clone "https://${GITHUB_TOKEN}@github.com/inmo/surework.git"
    else
        log_info "Cloning via HTTPS (you may need to authenticate)..."
        git clone https://github.com/inmo/surework.git
    fi
    cd surework
fi

cd surework

# Setup environment file
log_info "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.production .env

    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
    EUREKA_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')

    # Update .env file with generated secrets
    sed -i "s|CHANGE_ME_GENERATE_256_BIT_SECRET_KEY|${JWT_SECRET}|g" .env
    sed -i "s|CHANGE_ME_GENERATE_SECURE_PASSWORD|${POSTGRES_PASSWORD}|g" .env

    # Update MinIO password
    sed -i "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}|g" .env
    sed -i "s|S3_SECRET_KEY=.*|S3_SECRET_KEY=${MINIO_PASSWORD}|g" .env

    # Update Eureka password
    sed -i "s|EUREKA_PASSWORD=.*|EUREKA_PASSWORD=${EUREKA_PASSWORD}|g" .env

    log_info "Environment file created with generated secrets"
    log_warn "IMPORTANT: Review and update .env file before starting services!"
    echo ""
    echo "Generated secrets:"
    echo "  PostgreSQL Password: ${POSTGRES_PASSWORD}"
    echo "  MinIO Password: ${MINIO_PASSWORD}"
    echo "  Eureka Password: ${EUREKA_PASSWORD}"
    echo "  (JWT Secret is stored in .env file)"
    echo ""
else
    log_info "Environment file already exists"
fi

# Build services
log_info "Building Java services..."
mvn clean package -DskipTests

log_info "Building Docker images..."
docker compose build

echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Review and update environment file:"
echo "   nano .env"
echo ""
echo "2. Start infrastructure services:"
echo "   docker compose up -d postgres redis zookeeper kafka minio"
echo ""
echo "3. Wait for infrastructure to be healthy:"
echo "   docker compose logs -f postgres"
echo "   (Wait for 'database system is ready to accept connections')"
echo ""
echo "4. Start all services:"
echo "   docker compose up -d"
echo ""
echo "5. Check status:"
echo "   docker compose ps"
echo "   curl http://localhost:8080/actuator/health"
echo ""
