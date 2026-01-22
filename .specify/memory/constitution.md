<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 0.0.0 → 1.0.0 (MAJOR - Initial constitution establishment)

  Modified Principles: N/A (initial creation)

  Added Sections:
  - Project Identity
  - 15 Core Principles (Monorepo through Angular Frontend)
  - Governance (Amendment Procedure, Version Policy, Compliance Review)
  - Appendices (Tech Stack, Dependencies, Constitution Checks)

  Removed Sections: N/A (initial creation)

  Templates Requiring Updates:
  - .specify/templates/plan-template.md: ⚠ Pending (constitution checks section exists)
  - .specify/templates/spec-template.md: ✅ Aligned (structure compatible)
  - .specify/templates/tasks-template.md: ✅ Aligned (phase structure compatible)

  Follow-up TODOs: None
-->

# SureWork Constitution

## Project Identity

**Name**: SureWork
**Description**: South African SME ERP Platform - Unified HR, Payroll, Accounting, and Recruitment
**Stack**: Java 21, Spring Boot 4.0.1, Angular 18+, PostgreSQL 16, Kafka, Kubernetes
**Repository Structure**: Microservices Monorepo

## Core Principles

### I. Monorepo Structure

All code MUST reside in a unified monorepo with clearly separated concerns.

**Required Structure**:
```
project-root/
├── .github/workflows/           # CI/CD pipelines
├── infrastructure/
│   ├── docker/
│   │   ├── base-images/
│   │   └── compose/
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/            # dev, staging, prod
│   └── terraform/
├── libs/                        # Shared libraries
│   ├── common-dto/
│   ├── common-security/
│   ├── common-messaging/
│   ├── common-web/
│   └── common-testing/
├── services/                    # Microservices
│   ├── api-gateway/
│   ├── config-server/
│   └── [domain-service]/
├── frontend/
│   └── angular-app/
├── tools/scripts/
├── docs/
├── pom.xml                      # Parent POM
└── README.md
```

**Rationale**: Monorepo enables atomic commits across services, simplified dependency
management, and consistent tooling while maintaining service isolation.

---

### II. Service Internal Structure

Each microservice MUST follow a standardized internal package layout.

**Required Package Structure**:
```
service-name/
├── src/main/java/com/surework/servicename/
│   ├── ServiceNameApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── WebConfig.java
│   │   └── OpenApiConfig.java
│   ├── controller/api/v1/
│   ├── service/
│   │   ├── impl/
│   │   └── interfaces/
│   ├── repository/
│   ├── domain/
│   │   ├── entity/
│   │   ├── event/
│   │   └── valueobject/
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   ├── mapper/
│   ├── exception/
│   └── client/
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/
├── src/test/java/
│   ├── unit/
│   ├── integration/
│   └── architecture/
├── Dockerfile
└── pom.xml
```

**Rationale**: Consistent structure enables developers to navigate any service immediately
and enforces separation of concerns.

---

### III. Java 21 Language Features

All Java code MUST leverage Java 21 features for clarity and safety.

**Mandatory Patterns**:

1. **Records for DTOs**: All DTOs MUST be implemented as Java records
   ```java
   public record CreateOrderRequest(
       @NotBlank String customerId,
       @NotEmpty @Valid List<OrderItemRequest> items
   ) {}
   ```

2. **Sealed Interfaces for Domain Events**: All domain events MUST use sealed interfaces
   ```java
   public sealed interface DomainEvent permits OrderCreatedEvent, OrderCancelledEvent {
       String aggregateId();
       Instant occurredAt();
   }
   ```

3. **Pattern Matching**: Switch expressions MUST use pattern matching
   ```java
   return switch (event) {
       case OrderCreatedEvent e -> handleCreated(e);
       case OrderCancelledEvent e -> handleCancelled(e);
   };
   ```

4. **Text Blocks**: Multi-line strings (SQL, JSON) MUST use text blocks

5. **Virtual Threads**: MUST be enabled for I/O-bound operations
   ```yaml
   spring.threads.virtual.enabled: true
   ```

**Rationale**: Modern Java features reduce boilerplate, improve type safety, and enhance
readability while leveraging JVM performance improvements.

---

### IV. API Design Standards

All REST APIs MUST follow consistent design patterns.

**Mandatory Rules**:

1. **URL Versioning**: All endpoints MUST use `/api/v1/[resource]`

2. **HTTP Methods**: Use correct semantics (GET retrieval, POST creation with 201 + Location,
   PATCH partial update, DELETE removal)

3. **Response Format**: All responses MUST use DTOs (never expose entities)

4. **Error Responses**: All errors MUST use RFC 7807 ProblemDetail:
   ```java
   ProblemDetail problem = ProblemDetail.forStatusAndDetail(
       HttpStatus.NOT_FOUND, "Order not found: " + orderId);
   problem.setTitle("Resource Not Found");
   problem.setProperty("errorCode", "ORDER_NOT_FOUND");
   ```

5. **Pagination**: Collection endpoints MUST support `Pageable` and return `PageResponse<T>`

6. **OpenAPI Documentation**: All endpoints MUST have @Tag and @Operation annotations

**Rationale**: Consistent API design reduces integration friction and enables reliable
client code generation.

---

### V. Service Layer Architecture

Business logic MUST be organized using CQRS-inspired interfaces.

**Mandatory Pattern**:

1. **Separate Query and Command Interfaces**:
   ```java
   public interface OrderQueryService {
       OrderResponse getOrder(String orderId);
   }
   public interface OrderCommandService {
       OrderResponse createOrder(CreateOrderRequest request);
   }
   ```

2. **Transaction Boundaries**:
   - Class-level `@Transactional(readOnly = true)` for query services
   - Method-level `@Transactional` override for write operations

3. **Event Publishing**: State changes MUST publish domain events

**Rationale**: CQRS separation clarifies responsibilities, enables independent scaling.

---

### VI. Exception Handling

All exceptions MUST be handled via global exception handlers.

**Mandatory Structure**:

1. **Base Exception Hierarchy**:
   ```java
   public abstract class BaseException extends RuntimeException {
       private final String errorCode;
   }
   public class ResourceNotFoundException extends BaseException { }
   public class BusinessException extends BaseException { }
   ```

2. **Global Handler**: `@RestControllerAdvice` MUST handle all exceptions

3. **HTTP Status Codes**:
   - Validation errors → 400
   - Business rule violations → 422
   - Not found → 404
   - Server errors → 500

**Rationale**: Consistent error handling improves debugging and client error handling.

---

### VII. Database Standards

All database interactions MUST follow defined patterns.

**Mandatory Rules**:

1. **Entity Design**:
   - All entities MUST extend `BaseEntity` (id, version, createdAt, updatedAt, createdBy)
   - UUID strings (36 chars) for primary keys
   - Soft delete via `deleted` boolean

2. **Schema Management**: Flyway MUST manage all changes (`V{version}__{description}.sql`)

3. **JPA Configuration**:
   - `open-in-view: false`
   - `time_zone: UTC`
   - `ddl-auto: validate` in production

**Rationale**: Consistent database patterns ensure data integrity and auditability.

---

### VIII. Security Standards

All services MUST implement defense-in-depth security.

**Mandatory Configuration**:

1. **Authentication**: Stateless JWT with mandatory MFA
2. **Session**: `SessionCreationPolicy.STATELESS`
3. **Password**: BCrypt with cost factor 12 minimum
4. **CORS**: Explicit `CorsConfigurationSource` configuration
5. **Validation**: Bean Validation on all request DTOs

**Rationale**: Security must be built-in, not bolted-on.

---

### IX. Testing Strategy

All code MUST have appropriate test coverage.

**Mandatory Test Types**:

1. **Unit Tests**: MockitoExtension for isolated testing
2. **Integration Tests**: Testcontainers for PostgreSQL, Kafka, Redis
3. **Architecture Tests**: ArchUnit for structural validation

**Test Location**:
- `src/test/java/unit/`
- `src/test/java/integration/`
- `src/test/java/architecture/`

**Rationale**: Multi-layer testing catches different defect classes.

---

### X. Observability Standards

All services MUST be observable in production.

**Mandatory Components**:

1. **Health Probes**: Liveness and readiness via Spring Actuator
2. **Metrics**: Prometheus endpoint at `/actuator/prometheus`
3. **Logging**: Structured JSON with traceId/spanId
4. **Tracing**: Correlation IDs across service calls

**Rationale**: Observability is essential for production debugging and SLA compliance.

---

### XI. Configuration Management

All configuration MUST be externalized and environment-aware.

**Mandatory Rules**:

1. **Profile Structure**: application.yml, application-dev.yml, application-prod.yml
2. **Secrets**: Environment variables only (`${DB_PASSWORD}`)
3. **Timeouts**: Explicit timeouts on all external calls

**Rationale**: Externalized configuration enables deployment flexibility.

---

### XII. Inter-Service Communication

Services MUST communicate via defined patterns.

**Synchronous (REST)**:
- Spring HTTP Interface (`@GetExchange`, `@PostExchange`)
- Circuit breaker for resilience

**Asynchronous (Kafka)**:
- Topic naming: `{aggregate}-events`
- Partition by aggregate ID
- Dead letter queue for failures

**Rationale**: Clear patterns enable independent deployability and reliability.

---

### XIII. Containerization Standards

All services MUST be containerized following best practices.

**Dockerfile Requirements**:

1. **Multi-Stage Build**: Builder → Extractor → Runtime
2. **Base Image**: eclipse-temurin:21-jre-alpine for runtime
3. **Security**: Non-root user (appuser:appgroup)
4. **JVM**: `-XX:+UseZGC -XX:MaxRAMPercentage=75.0`
5. **Health Check**: Built-in HEALTHCHECK directive

**Rationale**: Optimized containers reduce attack surface and enable efficient orchestration.

---

### XIV. Kubernetes Deployment

All production deployments MUST use Kubernetes.

**Required Resources**:

1. **Deployment**: 3+ replicas, resource limits, probes, graceful shutdown
2. **Service**: ClusterIP for internal communication
3. **HorizontalPodAutoscaler**: CPU-based scaling (70% target)

**Probe Configuration**:
- Liveness: `/actuator/health/liveness` (60s initial delay)
- Readiness: `/actuator/health/readiness` (30s initial delay)

**Rationale**: Kubernetes provides reliability, scalability, and zero-downtime deployments.

---

### XV. Angular Frontend Standards

The Angular frontend MUST follow consistent patterns.

**Project Structure**:
```
frontend/angular-app/src/app/
├── core/           # Singleton services, interceptors, guards
├── shared/         # Reusable components, directives, pipes
├── features/       # Feature modules with lazy loading
├── app.config.ts
└── app.routes.ts
```

**Mandatory Patterns**:

1. Use `inject()` function for DI
2. Functional HTTP interceptors
3. Centralized API service
4. Environment-based configuration
5. Lazy loading for feature modules

**Rationale**: Consistent structure enables component reuse and team scalability.

---

## Governance

### Amendment Procedure

1. **Proposal**: Document change with rationale
2. **Review**: Technical lead review within 5 business days
3. **Approval**: 2+ senior developer sign-off required
4. **Implementation**: Update constitution and propagate to templates
5. **Communication**: Announce to all developers

### Version Policy

- **MAJOR**: Backward-incompatible changes or principle removals
- **MINOR**: New principles or material expansions
- **PATCH**: Clarifications and non-semantic refinements

### Compliance Review

- **New Services**: Constitution check before design approval
- **PR Reviews**: Verify compliance with relevant principles
- **Quarterly Audit**: Review all services against constitution

---

## Appendices

### Appendix A: Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 4.0.1 |
| Cloud | Spring Cloud | 2024.0.0 |
| Database | PostgreSQL | 16 |
| Message Broker | Kafka | 7.5.0 |
| Cache | Redis | 7 |
| Frontend | Angular | 18+ |
| Container | Docker | Latest |
| Orchestration | Kubernetes | Latest |

### Appendix B: Constitution Checks

| Check | Principle | Criteria |
|-------|-----------|----------|
| Structure | I, II | Monorepo + service package layout |
| Java Features | III | Records, sealed interfaces, pattern matching |
| API Design | IV | URL versioning, ProblemDetail errors |
| Service Layer | V | CQRS interfaces, transaction boundaries |
| Exceptions | VI | Base hierarchy, global handler |
| Database | VII | BaseEntity, Flyway migrations |
| Security | VIII | JWT auth, MFA, role-based access |
| Testing | IX | Unit, integration, architecture tests |
| Observability | X | Health probes, metrics, logging |
| Configuration | XI | Profile-based, externalized secrets |
| Communication | XII | REST clients, Kafka events |
| Containers | XIII | Multi-stage Dockerfile |
| Kubernetes | XIV | Deployment, Service, HPA |
| Frontend | XV | Angular structure, interceptors |

---

**Version**: 1.0.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-21

*Document maintained by: Project Technical Leadership*
