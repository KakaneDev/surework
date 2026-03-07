#!/bin/bash
# SureWork Health Check Script
# Checks the status of all services and infrastructure
#
# Usage: ./health-check.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_HOST="${API_HOST:-localhost}"
API_PORT="${API_PORT:-8080}"
EUREKA_PORT="${EUREKA_PORT:-8761}"

echo "=========================================="
echo "  SureWork Health Check"
echo "  $(date)"
echo "=========================================="
echo ""

# Function to check service health
check_health() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"

    printf "%-25s" "$name"

    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}[OK]${NC}"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} (HTTP $response)"
        return 1
    fi
}

# Function to check container status
check_container() {
    local name="$1"
    printf "%-25s" "$name"

    status=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || echo "not found")
    health=$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo "")

    if [ "$status" = "running" ]; then
        if [ "$health" = "healthy" ] || [ -z "$health" ]; then
            echo -e "${GREEN}[RUNNING]${NC}"
            return 0
        else
            echo -e "${YELLOW}[RUNNING - $health]${NC}"
            return 0
        fi
    else
        echo -e "${RED}[$status]${NC}"
        return 1
    fi
}

echo "=== Docker Containers ==="
echo ""
failed=0

check_container "surework-postgres" || ((failed++))
check_container "surework-redis" || ((failed++))
check_container "surework-zookeeper" || ((failed++))
check_container "surework-kafka" || ((failed++))
check_container "surework-minio" || ((failed++))
check_container "surework-eureka" || ((failed++))
check_container "surework-gateway" || ((failed++))
check_container "surework-admin" || ((failed++))
check_container "surework-employee" || ((failed++))
check_container "surework-leave" || ((failed++))
check_container "surework-payroll" || ((failed++))
check_container "surework-accounting" || ((failed++))
check_container "surework-recruitment" || ((failed++))
check_container "surework-time" || ((failed++))
check_container "surework-document" || ((failed++))
check_container "surework-reporting" || ((failed++))

echo ""
echo "=== Service Health Endpoints ==="
echo ""

check_health "API Gateway" "http://${API_HOST}:${API_PORT}/actuator/health" || ((failed++))
check_health "Eureka Server" "http://${API_HOST}:${EUREKA_PORT}/actuator/health" || ((failed++))
check_health "MinIO" "http://${API_HOST}:9000/minio/health/live" || ((failed++))

echo ""
echo "=== System Resources ==="
echo ""

# Memory usage
echo "Memory Usage:"
free -h | grep -E "Mem|Swap" | awk '{print "  " $0}'

echo ""

# Disk usage
echo "Disk Usage:"
df -h / | awk 'NR>1 {print "  Used: " $3 " / " $2 " (" $5 " used)"}'

echo ""

# Docker stats
echo "Top Container Resource Usage:"
docker stats --no-stream --format "  {{.Name}}: CPU {{.CPUPerc}}, Mem {{.MemUsage}}" 2>/dev/null | head -5

echo ""
echo "=========================================="
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
else
    echo -e "${RED}$failed check(s) failed${NC}"
fi
echo "=========================================="

exit $failed
