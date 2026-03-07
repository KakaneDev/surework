#!/bin/bash
# =============================================================================
# SureWork ERP - Master Deployment Script
# Builds all services and deploys via Docker Compose
# Usage: bash deploy.sh [--skip-build] [--skip-frontend]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$SCRIPT_DIR"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.production"

SKIP_BUILD=false
SKIP_FRONTEND=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --skip-frontend) SKIP_FRONTEND=true ;;
    esac
done

echo "============================================"
echo "  SureWork ERP - Deployment"
echo "  $(date)"
echo "============================================"

# --- Verify prerequisites ---
echo "[0/6] Verifying prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not installed. Run vm-setup.sh first."; exit 1; }
command -v java >/dev/null 2>&1 || { echo "ERROR: Java not installed. Run vm-setup.sh first."; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "ERROR: Maven not installed. Run vm-setup.sh first."; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env.production not found at $ENV_FILE"
    exit 1
fi

# --- Step 1: Build Maven modules ---
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "[1/6] Building Maven modules (this may take 10-15 minutes)..."
    cd "$PROJECT_ROOT"

    # Build shared libraries first
    echo "  Building shared libraries..."
    mvn clean install -pl libs/common-dto,libs/common-messaging,libs/common-security,libs/common-web,libs/common-testing -am -DskipTests -q

    # Build all services
    echo "  Building all services..."
    mvn clean package -DskipTests -q

    echo "  Maven build complete."
else
    echo "[1/6] Skipping Maven build (--skip-build)"
fi

# --- Step 2: Ensure Dockerfiles exist for all services ---
echo ""
echo "[2/6] Checking Dockerfiles..."

SERVICES=(
    "accounting-service"
    "admin-service"
    "analytics-service"
    "api-gateway"
    "billing-service"
    "document-service"
    "employee-service"
    "eureka-server"
    "hr-service"
    "identity-service"
    "leave-service"
    "notification-service"
    "payroll-service"
    "recruitment-service"
    "reporting-service"
    "support-service"
    "tenant-service"
    "time-attendance-service"
)

for svc in "${SERVICES[@]}"; do
    SVC_DIR="$PROJECT_ROOT/services/$svc"
    if [ ! -f "$SVC_DIR/Dockerfile" ]; then
        echo "  Creating Dockerfile for $svc..."
        cp "$DEPLOY_DIR/Dockerfile.service" "$SVC_DIR/Dockerfile"
    fi
done

echo "  All Dockerfiles verified."

# --- Step 3: Build Docker images ---
echo ""
echo "[3/6] Building Docker images..."
cd "$DEPLOY_DIR"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel

echo "  Docker images built."

# --- Step 4: Build Frontend ---
if [ "$SKIP_FRONTEND" = false ]; then
    echo ""
    echo "[4/6] Building frontend..."

    # Main frontend
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        cd "$PROJECT_ROOT/frontend"
        if [ -f "package.json" ]; then
            npm ci --silent 2>/dev/null || npm install --silent
            npx ng build --configuration=production 2>/dev/null || npm run build -- --configuration=production
            echo "  Main frontend built."

            # Copy to serve directory
            mkdir -p /opt/surework/frontend/dist
            cp -r dist/* /opt/surework/frontend/dist/ 2>/dev/null || \
            cp -r dist/frontend/* /opt/surework/frontend/dist/ 2>/dev/null || true
        fi
    fi

    # Admin frontend
    if [ -d "$PROJECT_ROOT/frontend-admin" ]; then
        cd "$PROJECT_ROOT/frontend-admin"
        if [ -f "package.json" ]; then
            npm ci --silent 2>/dev/null || npm install --silent
            npx ng build --configuration=production 2>/dev/null || npm run build -- --configuration=production
            echo "  Admin frontend built."

            mkdir -p /opt/surework/frontend-admin/dist
            cp -r dist/* /opt/surework/frontend-admin/dist/ 2>/dev/null || \
            cp -r dist/frontend-admin/* /opt/surework/frontend-admin/dist/ 2>/dev/null || true
        fi
    fi
else
    echo "[4/6] Skipping frontend build (--skip-frontend)"
fi

# --- Step 5: Configure Nginx ---
echo ""
echo "[5/6] Configuring Nginx..."
sudo cp "$DEPLOY_DIR/nginx/surework.conf" /etc/nginx/sites-available/surework.conf
sudo ln -sf /etc/nginx/sites-available/surework.conf /etc/nginx/sites-enabled/surework.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "  Nginx configured."

# --- Step 6: Deploy with Docker Compose ---
echo ""
echo "[6/6] Deploying services..."
cd "$DEPLOY_DIR"

# Stop existing containers gracefully
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30 2>/dev/null || true

# Start infrastructure first
echo "  Starting infrastructure (PostgreSQL, Kafka, Zookeeper)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres zookeeper kafka
echo "  Waiting for infrastructure to be ready..."
sleep 15

# Start Eureka
echo "  Starting Eureka service discovery..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d eureka-server
echo "  Waiting for Eureka to be ready..."
sleep 20

# Start API Gateway
echo "  Starting API Gateway..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api-gateway
sleep 10

# Start all remaining services
echo "  Starting all business services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
sleep 5

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  Services starting up (may take 2-5 minutes for all services to register)..."
echo ""
echo "  Check status:  docker compose -f $COMPOSE_FILE ps"
echo "  View logs:     docker compose -f $COMPOSE_FILE logs -f <service>"
echo "  Eureka:        http://$(grep VM_EXTERNAL_IP $ENV_FILE | cut -d= -f2):8761"
echo "  API Health:    http://$(grep VM_EXTERNAL_IP $ENV_FILE | cut -d= -f2)/health"
echo "  Frontend:      http://$(grep VM_EXTERNAL_IP $ENV_FILE | cut -d= -f2)/"
echo ""

# --- Health check loop ---
echo "Running initial health checks..."
MAX_RETRIES=12
RETRY_INTERVAL=15

for i in $(seq 1 $MAX_RETRIES); do
    echo "  Health check attempt $i/$MAX_RETRIES..."
    RUNNING=$(docker compose -f "$COMPOSE_FILE" ps --status running -q 2>/dev/null | wc -l)
    TOTAL=$(docker compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)
    echo "  Running: $RUNNING/$TOTAL containers"

    if [ "$RUNNING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
        echo ""
        echo "  All $TOTAL containers are running!"
        break
    fi

    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo ""
        echo "  WARNING: Not all containers are healthy after $(($MAX_RETRIES * $RETRY_INTERVAL))s"
        echo "  Check logs: docker compose -f $COMPOSE_FILE logs"
    fi

    sleep $RETRY_INTERVAL
done

echo ""
echo "  Deployment finished at $(date)"
echo "============================================"
