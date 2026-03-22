# Quickstart Guide: SureWork - South African SME ERP Platform

**Feature**: 001-surework-sme-erp
**Date**: 2026-01-21
**Phase**: 1 (Design)

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Java | 21 (LTS) | Backend services |
| Maven | 3.9+ | Build management |
| Node.js | 20 LTS | Angular frontend |
| Docker | 24+ | Local development containers |
| Docker Compose | 2.20+ | Multi-container orchestration |
| kubectl | 1.28+ | Kubernetes deployment |

### Development Environment Setup

```bash
# Verify Java 21
java -version
# Expected: openjdk version "21.x.x"

# Verify Maven
mvn -version
# Expected: Apache Maven 3.9.x

# Verify Node.js
node -version
# Expected: v20.x.x

# Verify Docker
docker --version
docker compose version
```

## Local Development

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd surework

# Install frontend dependencies
cd frontend/angular-app
npm install
cd ../..
```

### 2. Start Infrastructure (Docker Compose)

```bash
# Start PostgreSQL, Kafka, Redis
docker compose -f infrastructure/docker/compose/docker-compose.yml up -d

# Verify services are running
docker compose -f infrastructure/docker/compose/docker-compose.yml ps
```

**docker-compose.yml** provides:
- PostgreSQL 16 on port 5432
- Kafka 7.5.0 on port 9092
- Redis 7 on port 6379
- Zookeeper on port 2181

### 3. Initialize Database

```bash
# Run Flyway migrations for shared schemas
./tools/scripts/db-migrate.sh --schema=public
./tools/scripts/db-migrate.sh --schema=config

# Create a test tenant (creates tenant_{uuid} schema)
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "tier": "MICRO",
    "ownerEmail": "admin@testcompany.co.za"
  }'
```

### 4. Build and Run Services

```bash
# Build all services
mvn clean package -DskipTests

# Run services individually (in separate terminals)
# Or use the dev script:
./tools/scripts/setup-dev.sh

# Alternative: Run specific service
cd services/identity-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Service Ports (dev profile)**:

| Service | Port |
|---------|------|
| api-gateway | 8080 |
| identity-service | 8081 |
| hr-service | 8082 |
| payroll-service | 8083 |
| accounting-service | 8084 |
| recruitment-service | 8085 |
| notification-service | 8086 |
| config-server | 8888 |

### 5. Run Frontend

```bash
cd frontend/angular-app
npm start
# Available at http://localhost:4200
```

## API Quick Reference

### Authentication

```bash
# Step 1: Login (get MFA challenge)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@testcompany.co.za", "password": "password123"}'

# Response: {"challengeId": "uuid", "mfaMethod": "SMS_OTP", ...}

# Step 2: Verify MFA
curl -X POST http://localhost:8080/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"challengeId": "uuid", "code": "123456"}'

# Response: {"accessToken": "jwt...", "refreshToken": "...", ...}

# Use access token for subsequent requests
export TOKEN="<accessToken>"
```

### Core Workflows

#### Employee Onboarding

```bash
# Create employee (auto-extracts DOB and gender from SA ID)
curl -X POST http://localhost:8080/api/v1/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "saIdNumber": "9001015009087",
    "firstName": "John",
    "lastName": "Doe",
    "race": "AFRICAN",
    "occupationalLevel": "SKILLED",
    "hireDate": "2026-02-01",
    "contractType": "PERMANENT",
    "monthlySalary": 35000.00
  }'
```

#### Payroll Processing

```bash
# Create payroll run
curl -X POST http://localhost:8080/api/v1/payroll-runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2026-02-01",
    "periodEnd": "2026-02-28",
    "payDate": "2026-02-25"
  }'

# Calculate payroll
curl -X POST http://localhost:8080/api/v1/payroll-runs/{id}/calculate \
  -H "Authorization: Bearer $TOKEN"

# Finalize (creates journal entry)
curl -X POST http://localhost:8080/api/v1/payroll-runs/{id}/finalize \
  -H "Authorization: Bearer $TOKEN"
```

#### Two-Pot Withdrawal Simulation

```bash
# Simulate withdrawal (ESS)
curl -X POST http://localhost:8080/api/v1/two-pot/simulate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "twoPotRecordId": "uuid",
    "withdrawalAmount": 10000.00
  }'

# Response includes estimated tax and net payout
```

## Testing

### Run Unit Tests

```bash
# All services
mvn test

# Specific service
cd services/hr-service
mvn test
```

### Run Integration Tests

```bash
# Requires Docker for Testcontainers
mvn verify -Pintegration

# Specific service
cd services/payroll-service
mvn verify -Pintegration
```

### Run Architecture Tests

```bash
# Validates constitution compliance (ArchUnit)
mvn test -Dtest=*ArchitectureTest
```

### Run Frontend Tests

```bash
cd frontend/angular-app
npm test           # Unit tests (Karma)
npm run e2e        # E2E tests (Cypress)
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_PASSWORD` | PostgreSQL password | (required) |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka brokers | localhost:9092 |
| `REDIS_HOST` | Redis host | localhost |
| `JWT_SECRET` | JWT signing secret | (required) |
| `MFA_SMS_PROVIDER_API_KEY` | SMS provider API key | (required) |
| `OPEN_BANKING_CLIENT_ID` | Stitch/Revio client ID | (required) |
| `OPEN_BANKING_CLIENT_SECRET` | Stitch/Revio secret | (required) |

### Profile Configuration

```yaml
# application-dev.yml
spring:
  threads:
    virtual:
      enabled: true
  datasource:
    url: jdbc:postgresql://localhost:5432/surework
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: ${TENANT_SCHEMA:public}
```

## Troubleshooting

### Common Issues

#### "Schema not found" Error

```bash
# Ensure tenant schema exists
psql -U postgres -d surework -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

# Re-run migrations if needed
./tools/scripts/db-migrate.sh --schema=tenant_{id}
```

#### Kafka Connection Refused

```bash
# Check Kafka is running
docker compose -f infrastructure/docker/compose/docker-compose.yml logs kafka

# Restart Kafka
docker compose -f infrastructure/docker/compose/docker-compose.yml restart kafka
```

#### JWT Token Expired

```bash
# Refresh token
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}'
```

### Useful Commands

```bash
# View service logs
docker compose -f infrastructure/docker/compose/docker-compose.yml logs -f

# Access PostgreSQL
docker exec -it surework-postgres psql -U postgres -d surework

# Access Redis CLI
docker exec -it surework-redis redis-cli

# Kafka topics list
docker exec -it surework-kafka kafka-topics --list --bootstrap-server localhost:9092
```

## OpenAPI Documentation

With services running, access Swagger UI:

| Service | URL |
|---------|-----|
| Identity | http://localhost:8081/swagger-ui.html |
| HR | http://localhost:8082/swagger-ui.html |
| Payroll | http://localhost:8083/swagger-ui.html |
| Accounting | http://localhost:8084/swagger-ui.html |
| Recruitment | http://localhost:8085/swagger-ui.html |

## Next Steps

1. **Run `/speckit.tasks`** to generate implementation tasks
2. **Review contracts/** for detailed API specifications
3. **Review data-model.md** for entity relationships
4. **Check constitution.md** for coding standards

## Related Documentation

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Notes](./research.md)
- [Data Model](./data-model.md)
- [Project Constitution](../../.specify/memory/constitution.md)
