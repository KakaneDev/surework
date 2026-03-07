#!/bin/bash
# SureWork Update and Redeploy Script
# Pulls latest code, rebuilds, and redeploys services
#
# Usage: ./update-deploy.sh [service-name]
#        ./update-deploy.sh              # Update all services
#        ./update-deploy.sh api-gateway  # Update only api-gateway

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE="${1:-}"
WORKING_DIR="${WORKING_DIR:-$HOME/surework/surework}"

echo "=========================================="
echo "  SureWork Update & Deploy"
echo "  $(date)"
echo "=========================================="
echo ""

cd "$WORKING_DIR"

echo "[1/5] Pulling latest code..."
git fetch
git pull

echo ""
echo "[2/5] Building Java services..."
if [ -n "$SERVICE" ]; then
    echo "      Building only: $SERVICE"
    mvn clean package -DskipTests -pl "services/$SERVICE" -am
else
    mvn clean package -DskipTests
fi

echo ""
echo "[3/5] Building Docker images..."
if [ -n "$SERVICE" ]; then
    docker compose build "$SERVICE"
else
    docker compose build
fi

echo ""
echo "[4/5] Restarting services..."
if [ -n "$SERVICE" ]; then
    echo "      Restarting: $SERVICE"
    docker compose up -d --force-recreate "$SERVICE"
else
    # Rolling restart to minimize downtime
    echo "      Performing rolling restart..."

    # Restart infrastructure first
    docker compose up -d --force-recreate postgres redis kafka zookeeper minio

    # Wait for infrastructure
    echo "      Waiting for infrastructure..."
    sleep 10

    # Restart discovery and gateway
    docker compose up -d --force-recreate eureka-server
    sleep 15
    docker compose up -d --force-recreate api-gateway
    sleep 10

    # Restart all other services
    docker compose up -d --force-recreate
fi

echo ""
echo "[5/5] Verifying deployment..."
sleep 5

# Quick health check
if curl -s http://localhost:8080/actuator/health | grep -q '"status":"UP"'; then
    echo -e "${GREEN}API Gateway is healthy!${NC}"
else
    echo -e "${YELLOW}API Gateway may still be starting...${NC}"
fi

echo ""
echo "=========================================="
echo "  Update Complete"
echo "=========================================="
echo ""
echo "Check status with:"
echo "  docker compose ps"
echo "  ./health-check.sh"
echo ""
