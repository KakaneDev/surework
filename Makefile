# SureWork ERP Platform - Makefile
# Provides convenient commands for development and deployment

.PHONY: help build clean start stop restart logs status test
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)SureWork ERP Platform - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(YELLOW)<target>$(NC)\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ==================== Infrastructure ====================

infra-start: ## Start infrastructure services (Postgres, Redis, Kafka, MinIO)
	@echo "$(BLUE)Starting infrastructure services...$(NC)"
	docker-compose up -d postgres redis zookeeper kafka minio
	@echo "$(GREEN)Infrastructure services started$(NC)"

infra-stop: ## Stop infrastructure services
	@echo "$(BLUE)Stopping infrastructure services...$(NC)"
	docker-compose stop postgres redis zookeeper kafka minio
	@echo "$(GREEN)Infrastructure services stopped$(NC)"

infra-logs: ## View infrastructure logs
	docker-compose logs -f postgres redis kafka minio

# ==================== Build ====================

build: ## Build all services
	@echo "$(BLUE)Building all services...$(NC)"
	./mvnw clean package -DskipTests
	@echo "$(GREEN)Build complete$(NC)"

build-docker: ## Build Docker images for all services
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build
	@echo "$(GREEN)Docker images built$(NC)"

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	./mvnw clean
	@echo "$(GREEN)Clean complete$(NC)"

# ==================== Development ====================

dev-start: infra-start ## Start development environment (infrastructure only)
	@echo "$(YELLOW)Infrastructure started. Run services individually with 'make run-<service>'$(NC)"

dev-stop: ## Stop all development services
	docker-compose down

run-eureka: ## Run Eureka server locally
	cd services/eureka-server && ../../mvnw spring-boot:run

run-gateway: ## Run API Gateway locally
	cd services/api-gateway && ../../mvnw spring-boot:run

run-admin: ## Run Admin service locally
	cd services/admin-service && ../../mvnw spring-boot:run

run-employee: ## Run Employee service locally
	cd services/employee-service && ../../mvnw spring-boot:run

run-leave: ## Run Leave service locally
	cd services/leave-service && ../../mvnw spring-boot:run

run-payroll: ## Run Payroll service locally
	cd services/payroll-service && ../../mvnw spring-boot:run

run-accounting: ## Run Accounting service locally
	cd services/accounting-service && ../../mvnw spring-boot:run

run-recruitment: ## Run Recruitment service locally
	cd services/recruitment-service && ../../mvnw spring-boot:run

run-time: ## Run Time & Attendance service locally
	cd services/time-attendance-service && ../../mvnw spring-boot:run

run-document: ## Run Document service locally
	cd services/document-service && ../../mvnw spring-boot:run

run-reporting: ## Run Reporting service locally
	cd services/reporting-service && ../../mvnw spring-boot:run

# ==================== Docker Compose ====================

start: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting all services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)All services started$(NC)"
	@echo ""
	@echo "Service URLs:"
	@echo "  API Gateway:     http://localhost:8080"
	@echo "  Eureka:          http://localhost:8761"
	@echo "  MinIO Console:   http://localhost:9001"
	@echo ""

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	docker-compose stop
	@echo "$(GREEN)All services stopped$(NC)"

restart: stop start ## Restart all services

down: ## Stop and remove all containers
	@echo "$(BLUE)Stopping and removing containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)Containers removed$(NC)"

down-clean: ## Stop and remove all containers, volumes, and images
	@echo "$(RED)Removing all containers, volumes, and images...$(NC)"
	docker-compose down -v --rmi local
	@echo "$(GREEN)Cleanup complete$(NC)"

logs: ## View all service logs
	docker-compose logs -f

logs-gateway: ## View API Gateway logs
	docker-compose logs -f api-gateway

logs-admin: ## View Admin service logs
	docker-compose logs -f admin-service

status: ## Show status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	docker-compose ps

# ==================== Database ====================

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U surework -d surework

db-migrate: ## Run database migrations (Flyway)
	./mvnw flyway:migrate

db-reset: ## Reset all databases (WARNING: destroys all data)
	@echo "$(RED)WARNING: This will destroy all data!$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose stop postgres
	docker-compose rm -f postgres
	docker volume rm surework_postgres_data || true
	docker-compose up -d postgres
	@echo "$(GREEN)Database reset complete$(NC)"

# ==================== Testing ====================

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	./mvnw test
	@echo "$(GREEN)Tests complete$(NC)"

test-unit: ## Run unit tests only
	./mvnw test -Dtest="*Test"

test-integration: ## Run integration tests
	./mvnw test -Dtest="*IT"

test-coverage: ## Run tests with coverage report
	./mvnw test jacoco:report
	@echo "$(GREEN)Coverage report generated in target/site/jacoco$(NC)"

# ==================== Quality ====================

lint: ## Run code style checks
	./mvnw checkstyle:check

format: ## Format code
	./mvnw spotless:apply

# ==================== Documentation ====================

docs: ## Generate API documentation
	./mvnw javadoc:aggregate

# ==================== Utilities ====================

kafka-topics: ## List Kafka topics
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

kafka-create-topics: ## Create required Kafka topics
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic employee-events --partitions 3 --replication-factor 1 || true
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic leave-events --partitions 3 --replication-factor 1 || true
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic payroll-events --partitions 3 --replication-factor 1 || true
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic document-events --partitions 3 --replication-factor 1 || true
	docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic audit-events --partitions 3 --replication-factor 1 || true
	@echo "$(GREEN)Kafka topics created$(NC)"

minio-init: ## Initialize MinIO buckets
	docker-compose exec minio mc alias set local http://localhost:9000 surework surework123
	docker-compose exec minio mc mb local/surework-documents || true
	docker-compose exec minio mc mb local/surework-reports || true
	docker-compose exec minio mc mb local/surework-backups || true
	@echo "$(GREEN)MinIO buckets created$(NC)"

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:8761/actuator/health | jq -r '.status' | xargs -I {} echo "Eureka: {}" || echo "Eureka: DOWN"
	@curl -s http://localhost:8080/actuator/health | jq -r '.status' | xargs -I {} echo "Gateway: {}" || echo "Gateway: DOWN"
	@curl -s http://localhost:8088/actuator/health | jq -r '.status' | xargs -I {} echo "Admin: {}" || echo "Admin: DOWN"
	@curl -s http://localhost:8081/actuator/health | jq -r '.status' | xargs -I {} echo "Employee: {}" || echo "Employee: DOWN"
	@curl -s http://localhost:8082/actuator/health | jq -r '.status' | xargs -I {} echo "Leave: {}" || echo "Leave: DOWN"
	@curl -s http://localhost:8083/actuator/health | jq -r '.status' | xargs -I {} echo "Payroll: {}" || echo "Payroll: DOWN"
	@curl -s http://localhost:8084/actuator/health | jq -r '.status' | xargs -I {} echo "Accounting: {}" || echo "Accounting: DOWN"
	@curl -s http://localhost:8085/actuator/health | jq -r '.status' | xargs -I {} echo "Recruitment: {}" || echo "Recruitment: DOWN"
	@curl -s http://localhost:8086/actuator/health | jq -r '.status' | xargs -I {} echo "Time: {}" || echo "Time: DOWN"
	@curl -s http://localhost:8087/actuator/health | jq -r '.status' | xargs -I {} echo "Reporting: {}" || echo "Reporting: DOWN"
	@curl -s http://localhost:8089/actuator/health | jq -r '.status' | xargs -I {} echo "Document: {}" || echo "Document: DOWN"
