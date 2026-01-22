# Implementation Plan: SureWork - South African SME ERP Platform

**Branch**: `001-surework-sme-erp` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-surework-sme-erp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

SureWork is a unified ERP platform for South African SMEs that integrates HR, Payroll, Accounting, and Recruitment modules with full SARS, POPIA, BCEA, and Two-Pot retirement system compliance. The platform eliminates the "SME Silo Crisis" through automatic data flow between modules, featuring a "No-Touch Journal Rule" for payroll-to-accounting integration, schema-per-tenant multi-tenancy for POPIA compliance, and graceful degradation for external API failures.

## Technical Context

**Language/Version**: Java 21 (Records, Sealed Interfaces, Pattern Matching, Virtual Threads)
**Primary Dependencies**: Spring Boot 4.0.1, Spring Cloud 2024.0.0, Angular 18+
**Storage**: PostgreSQL 16 (schema-per-tenant), Redis 7 (caching), Kafka 7.5.0 (events)
**Testing**: JUnit 5, Mockito, Testcontainers, ArchUnit
**Target Platform**: Kubernetes (Azure SA North for POPIA data sovereignty)
**Project Type**: Microservices Monorepo (web application with Angular PWA frontend)
**Performance Goals**: 10,000 concurrent users, <30s journal creation, <5s dashboard refresh, <3s Two-Pot simulation
**Constraints**: Data residency in SA (Azure SA North), POPIA compliance, BCEA-compliant leave, SARS tax tables, PWA on 3G (1Mbps)
**Scale/Scope**: Multi-tenant SaaS, 5 core modules, 10 user stories, 40+ functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| Check | Principle | Status | Notes |
|-------|-----------|--------|-------|
| Monorepo Structure | I | [x] | libs/, services/, frontend/, infrastructure/ layout per constitution |
| Service Structure | II | [x] | Standard package layout: config/, controller/, service/, repository/, domain/, dto/, mapper/, exception/, client/ |
| Java 21 Features | III | [x] | DTOs as Records, Domain Events as Sealed Interfaces, Pattern Matching for event handling, Virtual Threads enabled |
| API Design | IV | [x] | /api/v1/[resource], ProblemDetail (RFC 7807), Pageable, OpenAPI annotations |
| Service Layer | V | [x] | CQRS interfaces (QueryService/CommandService), @Transactional boundaries, Domain events via Kafka |
| Exception Handling | VI | [x] | BaseException hierarchy, @RestControllerAdvice global handler, 400/404/422/500 mapping |
| Database Standards | VII | [x] | BaseEntity (UUID, version, timestamps, soft delete), Flyway migrations, schema-per-tenant |
| Security | VIII | [x] | JWT stateless auth, mandatory MFA (SMS OTP/authenticator), BCrypt cost 12, RBAC with predefined roles |
| Testing Strategy | IX | [x] | JUnit 5 + Mockito unit, Testcontainers integration, ArchUnit architecture tests |
| Observability | X | [x] | Spring Actuator health probes, Prometheus metrics, structured JSON logging with traceId |
| Configuration | XI | [x] | application.yml + application-{dev,prod}.yml, externalized secrets via env vars |
| Communication | XII | [x] | Spring HTTP Interface for sync REST, Kafka for async events ({aggregate}-events topics) |
| Containers | XIII | [x] | Multi-stage Dockerfile, eclipse-temurin:21-jre-alpine, non-root user, ZGC |
| Kubernetes | XIV | [x] | Deployment (3+ replicas), Service (ClusterIP), HPA (70% CPU), health probes |
| Frontend | XV | [x] | Angular 18+ PWA, core/shared/features structure, inject() DI, functional interceptors, lazy loading |

**Gate Status**: ✅ PASS - All 15 principles verified. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-surework-sme-erp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── identity-service.yaml
│   ├── hr-service.yaml
│   ├── payroll-service.yaml
│   ├── accounting-service.yaml
│   └── recruitment-service.yaml
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
project-root/
├── .github/workflows/               # CI/CD pipelines
│   ├── ci.yml
│   └── cd.yml
├── infrastructure/
│   ├── docker/
│   │   ├── base-images/
│   │   └── compose/
│   │       └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── base/
│   │   │   ├── namespace.yaml
│   │   │   └── configmap.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   └── terraform/
│       └── azure/                   # Azure SA North deployment
├── libs/                            # Shared libraries
│   ├── common-dto/                  # Shared DTOs (Java Records)
│   ├── common-security/             # JWT, MFA, RBAC utilities
│   ├── common-messaging/            # Kafka event infrastructure
│   ├── common-web/                  # ProblemDetail, pagination
│   └── common-testing/              # Testcontainers base configs
├── services/                        # Microservices
│   ├── api-gateway/                 # Kong/Spring Cloud Gateway
│   ├── config-server/               # Centralized configuration
│   ├── tenant-service/              # Multi-tenant management, schema provisioning
│   ├── identity-service/            # Authentication, MFA, User/Role management
│   ├── hr-service/                  # Employee, Leave, Assets (Module A)
│   ├── payroll-service/             # Payroll runs, SARS tax, Two-Pot (Module B)
│   ├── accounting-service/          # GL, Journal entries, Bank recon, VAT (Module C)
│   ├── recruitment-service/         # ATS, Candidates, Background checks (Module D)
│   └── notification-service/        # Email, SMS (MFA OTP), retry queue
├── frontend/
│   └── angular-app/                 # Angular 18+ PWA
│       └── src/app/
│           ├── core/                # Auth interceptors, guards, API service
│           ├── shared/              # Reusable components, pipes, directives
│           └── features/            # Lazy-loaded feature modules
│               ├── dashboard/       # Labour cost dashboard
│               ├── hr/              # Employee management, onboarding
│               ├── payroll/         # Payroll processing
│               ├── accounting/      # GL, reconciliation
│               ├── recruitment/     # ATS
│               └── ess/             # Employee Self-Service portal
├── tools/scripts/
│   ├── setup-dev.sh
│   └── db-migrate.sh
├── docs/
│   └── architecture/
├── pom.xml                          # Parent POM (Maven multi-module)
└── README.md
```

**Structure Decision**: Microservices Monorepo (Option 2 + extensions) selected per Constitution Principle I. Nine microservices align with domain boundaries: tenant-service (multi-tenancy), identity-service (auth/RBAC), and five domain services mapping to spec modules (HR, Payroll, Accounting, Recruitment) plus notification-service for cross-cutting concerns. Angular PWA frontend with feature modules for each business domain.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | All 15 constitution principles are satisfied without deviation |

**Note**: The architecture follows constitution principles exactly. Nine microservices are justified by the five distinct domain modules (HR, Payroll, Accounting, Recruitment, Integration) plus essential infrastructure services (api-gateway, config-server, tenant-service, identity-service, notification-service).

## Phase Outputs Summary

### Phase 0: Research (Complete)

| Artifact | Status | Description |
|----------|--------|-------------|
| [research.md](./research.md) | ✅ | Technical research, clarification resolutions, dependency analysis |

### Phase 1: Design (Complete)

| Artifact | Status | Description |
|----------|--------|-------------|
| [data-model.md](./data-model.md) | ✅ | Entity definitions, relationships, Kafka topics, Flyway migrations |
| [quickstart.md](./quickstart.md) | ✅ | Local development setup, API examples, troubleshooting |
| [contracts/identity-service.yaml](./contracts/identity-service.yaml) | ✅ | Authentication, MFA, User/Role management API |
| [contracts/hr-service.yaml](./contracts/hr-service.yaml) | ✅ | Employee, Leave, Assets, Contracts API |
| [contracts/payroll-service.yaml](./contracts/payroll-service.yaml) | ✅ | Payroll runs, Tax, Two-Pot API |
| [contracts/accounting-service.yaml](./contracts/accounting-service.yaml) | ✅ | GL, Journal entries, Bank reconciliation, VAT API |
| [contracts/recruitment-service.yaml](./contracts/recruitment-service.yaml) | ✅ | ATS, Candidates, Background checks API |

### Phase 2: Tasks (Pending)

Run `/speckit.tasks` to generate implementation tasks based on this plan.

## Next Steps

1. **Review this plan** - Ensure all design decisions align with requirements
2. **Run `/speckit.tasks`** - Generate actionable implementation tasks
3. **Begin implementation** - Start with infrastructure and shared libraries
4. **Constitution re-check** - Re-verify all 15 principles after implementation

---

**Plan Status**: ✅ COMPLETE
**Generated**: 2026-01-21
**Ready for**: `/speckit.tasks`
