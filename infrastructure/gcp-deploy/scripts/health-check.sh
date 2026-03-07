#!/bin/bash
# =============================================================================
# SureWork ERP - Health Check Script
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
ENV_FILE="$SCRIPT_DIR/.env.production"

echo "=== SureWork Health Check ==="
echo "Time: $(date)"
echo ""

# Container status
echo "--- Container Status ---"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "--- System Resources ---"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Swap:   $(free -h | grep Swap | awk '{print $3 "/" $2}')"
echo "Disk:   $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "Load:   $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "--- API Gateway Health ---"
curl -s http://localhost:8080/actuator/health 2>/dev/null | jq . 2>/dev/null || echo "API Gateway not responding"

echo ""
echo "--- Eureka Registered Services ---"
curl -s http://localhost:8761/eureka/apps 2>/dev/null | grep '<name>' | sed 's/.*<name>\(.*\)<\/name>/  - \1/' || echo "Eureka not responding"
