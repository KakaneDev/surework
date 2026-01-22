# Tasks: SureWork - South African SME ERP Platform

**Input**: Design documents from `/specs/001-surework-sme-erp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Generated**: 2026-01-21 (Updated with Session 2026-01-21 clarifications)

**Tests**: Not explicitly requested - test tasks are NOT included. Add test phases if needed.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions (Microservices Monorepo)

- **Shared Libraries**: `libs/{library-name}/src/main/java/com/surework/{library}/`
- **Services**: `services/{service-name}/src/main/java/com/surework/{service}/`
- **Frontend**: `frontend/angular-app/src/app/`
- **Infrastructure**: `infrastructure/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, parent POM, and shared library scaffolding

- [x] T001 Create monorepo project structure per plan.md in project root
- [x] T002 Create parent pom.xml with Java 21, Spring Boot 4.0.1, and module definitions in pom.xml
- [x] T003 [P] Create libs/common-dto/pom.xml with shared DTO module configuration
- [x] T004 [P] Create libs/common-security/pom.xml with security library configuration
- [x] T005 [P] Create libs/common-messaging/pom.xml with Kafka messaging configuration
- [x] T006 [P] Create libs/common-web/pom.xml with ProblemDetail and pagination utilities
- [x] T007 [P] Create libs/common-testing/pom.xml with Testcontainers base configurations
- [x] T008 Create infrastructure/docker/compose/docker-compose.yml with PostgreSQL 16, Kafka 7.5.0, Redis 7
- [x] T009 [P] Create .github/workflows/ci.yml with build and test pipeline
- [x] T010 [P] Create tools/scripts/setup-dev.sh for local development startup
- [x] T011 [P] Create tools/scripts/db-migrate.sh for Flyway migration execution

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Shared Libraries

- [ ] T012 Create BaseEntity in libs/common-dto/src/main/java/com/surework/common/dto/BaseEntity.java
- [ ] T013 [P] Create ProblemDetail utilities in libs/common-web/src/main/java/com/surework/common/web/ProblemDetailFactory.java
- [ ] T014 [P] Create PageResponse record in libs/common-web/src/main/java/com/surework/common/web/PageResponse.java
- [ ] T015 [P] Create BaseException hierarchy in libs/common-web/src/main/java/com/surework/common/web/exception/
- [ ] T016 [P] Create GlobalExceptionHandler in libs/common-web/src/main/java/com/surework/common/web/GlobalExceptionHandler.java
- [ ] T017 Create JwtTokenProvider in libs/common-security/src/main/java/com/surework/common/security/JwtTokenProvider.java
- [ ] T018 [P] Create TenantContext for schema-per-tenant routing in libs/common-security/src/main/java/com/surework/common/security/TenantContext.java
- [ ] T019 [P] Create AbstractRoutingDataSource impl in libs/common-security/src/main/java/com/surework/common/security/TenantRoutingDataSource.java
- [ ] T020 Create DomainEvent sealed interfaces in libs/common-messaging/src/main/java/com/surework/common/messaging/event/
- [ ] T021 [P] Create KafkaProducerConfig in libs/common-messaging/src/main/java/com/surework/common/messaging/KafkaProducerConfig.java
- [ ] T022 [P] Create TestcontainersConfig base in libs/common-testing/src/main/java/com/surework/common/testing/TestcontainersConfig.java
- [ ] T023 [P] Create AuditLog entity in libs/common-dto/src/main/java/com/surework/common/dto/AuditLog.java with fields: userId, timestamp, oldValue, newValue, ipAddress, entityType, entityId, fieldName
- [ ] T024 [P] Create AuditLogService interface in libs/common-security/src/main/java/com/surework/common/security/audit/AuditLogService.java
- [ ] T025 Create AuditLogServiceImpl in libs/common-security/src/main/java/com/surework/common/security/audit/AuditLogServiceImpl.java
- [ ] T026 [P] Create AuditableEntityListener (JPA EntityListener) in libs/common-security/src/main/java/com/surework/common/security/audit/AuditableEntityListener.java for Employee/Financial record changes

### 2.2 Config Server

- [ ] T027 Create config-server service scaffold in services/config-server/
- [ ] T028 Create ConfigServerApplication in services/config-server/src/main/java/com/surework/configserver/ConfigServerApplication.java
- [ ] T029 Create application.yml with Git-backed config in services/config-server/src/main/resources/application.yml

### 2.3 API Gateway

- [ ] T030 Create api-gateway service scaffold in services/api-gateway/
- [ ] T031 Create ApiGatewayApplication in services/api-gateway/src/main/java/com/surework/gateway/ApiGatewayApplication.java
- [ ] T032 Create route configuration in services/api-gateway/src/main/resources/application.yml
- [ ] T033 [P] Create JwtAuthenticationFilter in services/api-gateway/src/main/java/com/surework/gateway/filter/JwtAuthenticationFilter.java

### 2.4 Tenant Service (Multi-Tenancy Foundation)

- [ ] T034 Create tenant-service scaffold in services/tenant-service/
- [ ] T035 Create Tenant entity in services/tenant-service/src/main/java/com/surework/tenant/domain/entity/Tenant.java
- [ ] T036 Create TenantRepository in services/tenant-service/src/main/java/com/surework/tenant/repository/TenantRepository.java
- [ ] T037 Create TenantQueryService interface in services/tenant-service/src/main/java/com/surework/tenant/service/interfaces/TenantQueryService.java
- [ ] T038 Create TenantCommandService interface in services/tenant-service/src/main/java/com/surework/tenant/service/interfaces/TenantCommandService.java
- [ ] T039 Create TenantServiceImpl in services/tenant-service/src/main/java/com/surework/tenant/service/impl/TenantServiceImpl.java
- [ ] T040 Create tenant schema provisioning logic in services/tenant-service/src/main/java/com/surework/tenant/service/impl/SchemaProvisioningService.java
- [ ] T041 Create TenantController in services/tenant-service/src/main/java/com/surework/tenant/controller/api/v1/TenantController.java
- [ ] T042 Create Flyway migrations for public schema in services/tenant-service/src/main/resources/db/migration/

### 2.5 Identity Service (Authentication Foundation)

- [ ] T043 Create identity-service scaffold in services/identity-service/
- [ ] T044 Create User entity in services/identity-service/src/main/java/com/surework/identity/domain/entity/User.java
- [ ] T045 [P] Create Role entity in services/identity-service/src/main/java/com/surework/identity/domain/entity/Role.java
- [ ] T046 [P] Create RolePermissionOverride entity in services/identity-service/src/main/java/com/surework/identity/domain/entity/RolePermissionOverride.java
- [ ] T047 Create UserRepository in services/identity-service/src/main/java/com/surework/identity/repository/UserRepository.java
- [ ] T048 [P] Create RoleRepository in services/identity-service/src/main/java/com/surework/identity/repository/RoleRepository.java
- [ ] T049 Create AuthenticationService with MFA in services/identity-service/src/main/java/com/surework/identity/service/impl/AuthenticationServiceImpl.java
- [ ] T050 [P] Create MfaService (SMS OTP + TOTP) in services/identity-service/src/main/java/com/surework/identity/service/impl/MfaServiceImpl.java
- [ ] T051 Create UserQueryService in services/identity-service/src/main/java/com/surework/identity/service/impl/UserQueryServiceImpl.java
- [ ] T052 Create UserCommandService with last-owner protection (FR-E13: prevent self-demotion of last Owner) in services/identity-service/src/main/java/com/surework/identity/service/impl/UserCommandServiceImpl.java
- [ ] T053 Create AuthController (login, MFA verify, refresh) in services/identity-service/src/main/java/com/surework/identity/controller/api/v1/AuthController.java
- [ ] T054 Create UserController in services/identity-service/src/main/java/com/surework/identity/controller/api/v1/UserController.java
- [ ] T055 Create RoleController with owner role validation in services/identity-service/src/main/java/com/surework/identity/controller/api/v1/RoleController.java
- [ ] T056 Create SecurityConfig in services/identity-service/src/main/java/com/surework/identity/config/SecurityConfig.java
- [ ] T057 Create Flyway migrations for identity tables in services/identity-service/src/main/resources/db/migration/

### 2.6 Notification Service (Cross-Cutting)

- [ ] T058 Create notification-service scaffold in services/notification-service/
- [ ] T059 Create NotificationServiceApplication in services/notification-service/src/main/java/com/surework/notification/NotificationServiceApplication.java
- [ ] T060 Create SmsService for MFA OTP in services/notification-service/src/main/java/com/surework/notification/service/impl/SmsServiceImpl.java
- [ ] T061 [P] Create EmailService in services/notification-service/src/main/java/com/surework/notification/service/impl/EmailServiceImpl.java
- [ ] T062 Create RetryQueueProcessor for failed API calls (max 5 attempts over 24 hours with exponential backoff) in services/notification-service/src/main/java/com/surework/notification/service/impl/RetryQueueProcessor.java
- [ ] T063 Create Kafka consumers for notification-commands topic in services/notification-service/src/main/java/com/surework/notification/messaging/

### 2.7 Frontend Foundation

- [ ] T064 Create Angular 18 project in frontend/angular-app/
- [ ] T065 Create core module structure in frontend/angular-app/src/app/core/
- [ ] T066 Create AuthService in frontend/angular-app/src/app/core/services/auth.service.ts
- [ ] T067 [P] Create ApiService in frontend/angular-app/src/app/core/services/api.service.ts
- [ ] T068 Create JwtInterceptor in frontend/angular-app/src/app/core/interceptors/jwt.interceptor.ts
- [ ] T069 [P] Create AuthGuard in frontend/angular-app/src/app/core/guards/auth.guard.ts
- [ ] T070 Create shared module structure in frontend/angular-app/src/app/shared/
- [ ] T071 Create app.routes.ts with lazy loading in frontend/angular-app/src/app/app.routes.ts
- [ ] T072 Configure PWA with service worker in frontend/angular-app/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Payroll Processing with Automatic Journaling (Priority: P1)

**Goal**: Process monthly payroll and automatically create accounting journal entries (No-Touch Journal Rule)

**Independent Test**: Run complete payroll cycle for test employees, verify journal entries appear in GL within 30 seconds without manual intervention

### HR Service Prerequisites for US1

- [ ] T073 Create hr-service scaffold in services/hr-service/
- [ ] T074 [US1] Create Employee entity with @EntityListeners(AuditableEntityListener.class) in services/hr-service/src/main/java/com/surework/hr/domain/entity/Employee.java
- [ ] T075 [P] [US1] Create EmployeeRepository in services/hr-service/src/main/java/com/surework/hr/repository/EmployeeRepository.java
- [ ] T076 [US1] Create EmployeeQueryService in services/hr-service/src/main/java/com/surework/hr/service/impl/EmployeeQueryServiceImpl.java
- [ ] T077 [P] [US1] Create EmployeeMapper in services/hr-service/src/main/java/com/surework/hr/mapper/EmployeeMapper.java
- [ ] T078 [US1] Create EmployeeController (basic CRUD) in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/EmployeeController.java
- [ ] T079 [US1] Create Flyway migrations for employee table with audit_log table in services/hr-service/src/main/resources/db/migration/

### Payroll Service for US1

- [ ] T080 Create payroll-service scaffold in services/payroll-service/
- [ ] T081 [US1] Create PayrollRun entity in services/payroll-service/src/main/java/com/surework/payroll/domain/entity/PayrollRun.java
- [ ] T082 [P] [US1] Create PayrollLineItem entity with payslipPdf field in services/payroll-service/src/main/java/com/surework/payroll/domain/entity/PayrollLineItem.java
- [ ] T083 [P] [US1] Create TaxTable entity (config schema) in services/payroll-service/src/main/java/com/surework/payroll/domain/entity/TaxTable.java
- [ ] T084 [US1] Create PayrollRunRepository in services/payroll-service/src/main/java/com/surework/payroll/repository/PayrollRunRepository.java
- [ ] T085 [P] [US1] Create PayrollLineItemRepository in services/payroll-service/src/main/java/com/surework/payroll/repository/PayrollLineItemRepository.java
- [ ] T086 [US1] Create PayrollCalculationService (PAYE, UIF, SDL calculations) in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollCalculationServiceImpl.java
- [ ] T087 [US1] Create PayrollCommandService in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollCommandServiceImpl.java
- [ ] T088 [US1] Create PayrollQueryService in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollQueryServiceImpl.java
- [ ] T089 [US1] Create PayrollRollbackService that creates reversal journal entries (equal-and-opposite posting) in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollRollbackServiceImpl.java
- [ ] T090 [US1] Create PayslipGenerationService with PDF template in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayslipGenerationServiceImpl.java
- [ ] T091 [US1] Create PayrollRunFinalizedEvent domain event in services/payroll-service/src/main/java/com/surework/payroll/domain/event/PayrollRunFinalizedEvent.java
- [ ] T092 [P] [US1] Create PayrollRunRolledBackEvent domain event in services/payroll-service/src/main/java/com/surework/payroll/domain/event/PayrollRunRolledBackEvent.java
- [ ] T093 [US1] Create PayrollController with rollback endpoint in services/payroll-service/src/main/java/com/surework/payroll/controller/api/v1/PayrollRunController.java
- [ ] T094 [US1] Create Flyway migrations for payroll tables in services/payroll-service/src/main/resources/db/migration/

### Accounting Service for US1

- [ ] T095 Create accounting-service scaffold in services/accounting-service/
- [ ] T096 [US1] Create Account entity with @EntityListeners(AuditableEntityListener.class) in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/Account.java
- [ ] T097 [P] [US1] Create JournalEntry entity with reversalOfId, reversedById fields for audit trail in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/JournalEntry.java
- [ ] T098 [P] [US1] Create JournalLineItem entity in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/JournalLineItem.java
- [ ] T099 [US1] Create AccountRepository in services/accounting-service/src/main/java/com/surework/accounting/repository/AccountRepository.java
- [ ] T100 [P] [US1] Create JournalEntryRepository in services/accounting-service/src/main/java/com/surework/accounting/repository/JournalEntryRepository.java
- [ ] T101 [US1] Create JournalEntryCommandService with reversal journal creation support in services/accounting-service/src/main/java/com/surework/accounting/service/impl/JournalEntryCommandServiceImpl.java
- [ ] T102 [US1] Create PayrollJournalCreator (listens to PayrollRunFinalizedEvent, PayrollRunRolledBackEvent) in services/accounting-service/src/main/java/com/surework/accounting/messaging/PayrollJournalCreator.java
- [ ] T103 [US1] Create JournalEntryController in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/JournalEntryController.java
- [ ] T104 [US1] Create Flyway migrations for accounting tables with audit_log table in services/accounting-service/src/main/resources/db/migration/

### Frontend for US1

- [ ] T105 [US1] Create payroll feature module in frontend/angular-app/src/app/features/payroll/
- [ ] T106 [P] [US1] Create PayrollService in frontend/angular-app/src/app/features/payroll/services/payroll.service.ts
- [ ] T107 [US1] Create payroll-run-list component in frontend/angular-app/src/app/features/payroll/components/payroll-run-list/
- [ ] T108 [P] [US1] Create payroll-run-detail component with rollback button in frontend/angular-app/src/app/features/payroll/components/payroll-run-detail/
- [ ] T109 [US1] Create payroll-finalize component in frontend/angular-app/src/app/features/payroll/components/payroll-finalize/
- [ ] T110 [US1] Create payroll-rollback component with reversal journal preview in frontend/angular-app/src/app/features/payroll/components/payroll-rollback/

**Checkpoint**: User Story 1 complete - payroll processing with automatic journal creation and rollback functional

---

## Phase 4: User Story 2 - Employee Onboarding with POPIA Compliance (Priority: P1)

**Goal**: Onboard employees with digital contract signing, auto-extract SA ID data (or manual entry for international IDs), and capture EE fields

**Independent Test**: Onboard new employee with SA ID (verify auto-extraction) and international ID (verify manual entry fallback), sign contract digitally, verify EE fields captured and employee appears payroll-ready

### HR Service Extensions for US2

- [ ] T111 [US2] Create EmploymentContract entity in services/hr-service/src/main/java/com/surework/hr/domain/entity/EmploymentContract.java
- [ ] T112 [P] [US2] Create EmploymentContractRepository in services/hr-service/src/main/java/com/surework/hr/repository/EmploymentContractRepository.java
- [ ] T113 [US2] Create SaIdParserService that handles SA ID extraction and returns requiresManualEntry flag for international/invalid IDs in services/hr-service/src/main/java/com/surework/hr/service/impl/SaIdParserServiceImpl.java
- [ ] T114 [US2] Create ContractSigningService (eSign per ECT Act) in services/hr-service/src/main/java/com/surework/hr/service/impl/ContractSigningServiceImpl.java
- [ ] T115 [US2] Create EmployeeCommandService (onboarding flow with SA/international ID handling) in services/hr-service/src/main/java/com/surework/hr/service/impl/EmployeeCommandServiceImpl.java
- [ ] T116 [US2] Create EmployeeCreatedEvent domain event in services/hr-service/src/main/java/com/surework/hr/domain/event/EmployeeCreatedEvent.java
- [ ] T117 [US2] Add contract endpoints to EmployeeController in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/EmployeeController.java
- [ ] T118 [US2] Create UtilsController for SA ID parsing with requiresManualEntry response in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/UtilsController.java
- [ ] T119 [US2] Add Flyway migration for employment_contracts table in services/hr-service/src/main/resources/db/migration/

### Frontend for US2

- [ ] T120 [US2] Create hr feature module in frontend/angular-app/src/app/features/hr/
- [ ] T121 [P] [US2] Create EmployeeService in frontend/angular-app/src/app/features/hr/services/employee.service.ts
- [ ] T122 [US2] Create employee-onboarding component with SA/international ID flow in frontend/angular-app/src/app/features/hr/components/employee-onboarding/
- [ ] T123 [P] [US2] Create id-input component (SA ID auto-extract with manual DOB/Gender fallback for international) in frontend/angular-app/src/app/shared/components/id-input/
- [ ] T124 [US2] Create contract-signing component in frontend/angular-app/src/app/features/hr/components/contract-signing/
- [ ] T125 [US2] Create employee-list component in frontend/angular-app/src/app/features/hr/components/employee-list/

**Checkpoint**: User Story 2 complete - employee onboarding with POPIA compliance and international ID support functional

---

## Phase 5: User Story 3 - SARS Tax Compliance and Reporting (Priority: P1)

**Goal**: Automatic PAYE/UIF/SDL/ETI calculations per SARS tables (vendor pre-loaded), EMP201/501 report generation

**Independent Test**: Process payroll, verify calculations match SARS tables, generate EMP201/501 reports

### Payroll Service Extensions for US3

- [ ] T126 [US3] Create TaxTableRepository in services/payroll-service/src/main/java/com/surework/payroll/repository/TaxTableRepository.java
- [ ] T127 [US3] Create TaxTableService (loads from config schema, handles tax year effective dates) in services/payroll-service/src/main/java/com/surework/payroll/service/impl/TaxTableServiceImpl.java
- [ ] T128 [US3] Enhance PayrollCalculationService with ETI logic in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollCalculationServiceImpl.java
- [ ] T129 [US3] Create Emp201ReportService in services/payroll-service/src/main/java/com/surework/payroll/service/impl/Emp201ReportServiceImpl.java
- [ ] T130 [P] [US3] Create Emp501ReportService in services/payroll-service/src/main/java/com/surework/payroll/service/impl/Emp501ReportServiceImpl.java
- [ ] T131 [US3] Create TaxReportController in services/payroll-service/src/main/java/com/surework/payroll/controller/api/v1/TaxReportController.java
- [ ] T132 [US3] Seed initial TaxTable data (vendor pre-loaded) via Flyway in config schema in services/payroll-service/src/main/resources/db/migration/

### Frontend for US3

- [ ] T133 [US3] Create tax-reports component in frontend/angular-app/src/app/features/payroll/components/tax-reports/
- [ ] T134 [P] [US3] Create emp201-report component in frontend/angular-app/src/app/features/payroll/components/emp201-report/
- [ ] T135 [P] [US3] Create emp501-report component in frontend/angular-app/src/app/features/payroll/components/emp501-report/

**Checkpoint**: User Story 3 complete - SARS tax compliance with vendor-managed tax tables functional

---

## Phase 6: User Story 4 - Two-Pot Retirement Withdrawal Management (Priority: P2)

**Goal**: Employee self-service Two-Pot simulation and withdrawal requests with tax implications

**Independent Test**: Employee simulates withdrawal, sees tax impact, submits request, tracks to payout

### Payroll Service Extensions for US4

- [ ] T136 [US4] Create TwoPotRecord entity in services/payroll-service/src/main/java/com/surework/payroll/domain/entity/TwoPotRecord.java
- [ ] T137 [P] [US4] Create TwoPotWithdrawalRequest entity in services/payroll-service/src/main/java/com/surework/payroll/domain/entity/TwoPotWithdrawalRequest.java
- [ ] T138 [US4] Create TwoPotRecordRepository in services/payroll-service/src/main/java/com/surework/payroll/repository/TwoPotRecordRepository.java
- [ ] T139 [P] [US4] Create TwoPotWithdrawalRequestRepository in services/payroll-service/src/main/java/com/surework/payroll/repository/TwoPotWithdrawalRequestRepository.java
- [ ] T140 [US4] Create TwoPotSimulationService (3-second response target) in services/payroll-service/src/main/java/com/surework/payroll/service/impl/TwoPotSimulationServiceImpl.java
- [ ] T141 [US4] Create TwoPotWithdrawalService with balance validation in services/payroll-service/src/main/java/com/surework/payroll/service/impl/TwoPotWithdrawalServiceImpl.java
- [ ] T142 [US4] Create TwoPotController in services/payroll-service/src/main/java/com/surework/payroll/controller/api/v1/TwoPotController.java
- [ ] T143 [US4] Add Flyway migration for two_pot tables in services/payroll-service/src/main/resources/db/migration/

### Frontend ESS for US4

- [ ] T144 [US4] Create ess feature module in frontend/angular-app/src/app/features/ess/
- [ ] T145 [P] [US4] Create TwoPotService in frontend/angular-app/src/app/features/ess/services/two-pot.service.ts
- [ ] T146 [US4] Create two-pot-simulator component in frontend/angular-app/src/app/features/ess/components/two-pot-simulator/
- [ ] T147 [P] [US4] Create two-pot-withdrawal-request component in frontend/angular-app/src/app/features/ess/components/two-pot-withdrawal-request/
- [ ] T148 [US4] Create two-pot-status component in frontend/angular-app/src/app/features/ess/components/two-pot-status/

**Checkpoint**: User Story 4 complete - Two-Pot self-service functional

---

## Phase 7: User Story 5 - Leave Management with BCEA Compliance (Priority: P2)

**Goal**: BCEA-compliant leave accruals (1 day/17 worked), sick leave cycles (30 days/36 months with cycle boundary enforcement), unpaid leave deductions

**Independent Test**: Set up employees with different hire dates, verify accruals match BCEA formula, verify sick leave cycle boundaries

### HR Service Extensions for US5

- [ ] T149 [US5] Create LeaveBalance entity with cycleStartDate/cycleEndDate in services/hr-service/src/main/java/com/surework/hr/domain/entity/LeaveBalance.java
- [ ] T150 [P] [US5] Create LeaveRequest entity in services/hr-service/src/main/java/com/surework/hr/domain/entity/LeaveRequest.java
- [ ] T151 [US5] Create LeaveBalanceRepository in services/hr-service/src/main/java/com/surework/hr/repository/LeaveBalanceRepository.java
- [ ] T152 [P] [US5] Create LeaveRequestRepository in services/hr-service/src/main/java/com/surework/hr/repository/LeaveRequestRepository.java
- [ ] T153 [US5] Create LeaveAccrualService (BCEA formula with 36-month cycle boundary enforcement for sick leave) in services/hr-service/src/main/java/com/surework/hr/service/impl/LeaveAccrualServiceImpl.java
- [ ] T154 [US5] Create LeaveRequestService in services/hr-service/src/main/java/com/surework/hr/service/impl/LeaveRequestServiceImpl.java
- [ ] T155 [US5] Create LeaveRequestApprovedEvent in services/hr-service/src/main/java/com/surework/hr/domain/event/LeaveRequestApprovedEvent.java
- [ ] T156 [US5] Create LeaveController in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/LeaveController.java
- [ ] T157 [US5] Add Flyway migration for leave tables in services/hr-service/src/main/resources/db/migration/

### Payroll Integration for US5

- [ ] T158 [US5] Create UnpaidLeaveDeductionListener in services/payroll-service/src/main/java/com/surework/payroll/messaging/UnpaidLeaveDeductionListener.java

### Frontend for US5

- [ ] T159 [US5] Create leave-balance component in frontend/angular-app/src/app/features/hr/components/leave-balance/
- [ ] T160 [P] [US5] Create leave-request-form component in frontend/angular-app/src/app/features/hr/components/leave-request-form/
- [ ] T161 [P] [US5] Create leave-approval component in frontend/angular-app/src/app/features/hr/components/leave-approval/
- [ ] T162 [US5] Create ess-leave-request component in frontend/angular-app/src/app/features/ess/components/leave-request/

**Checkpoint**: User Story 5 complete - BCEA leave management functional

---

## Phase 8: User Story 6 - Real-Time Labour Cost Dashboard (Priority: P2)

**Goal**: Real-time dashboard showing total labour costs (Salary, UIF, SDL, Tools of Trade)

**Independent Test**: View dashboard with multiple employees, verify cost components aggregated correctly, changes reflect within 5 seconds

### HR Service Extensions for US6 (EmployeeAsset)

- [ ] T163 [US6] Create EmployeeAsset entity in services/hr-service/src/main/java/com/surework/hr/domain/entity/EmployeeAsset.java
- [ ] T164 [P] [US6] Create EmployeeAssetRepository in services/hr-service/src/main/java/com/surework/hr/repository/EmployeeAssetRepository.java
- [ ] T165 [US6] Create EmployeeAssetService in services/hr-service/src/main/java/com/surework/hr/service/impl/EmployeeAssetServiceImpl.java
- [ ] T166 [US6] Add EmployeeAsset endpoints to EmployeeController in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/EmployeeController.java
- [ ] T167 [US6] Add Flyway migration for employee_assets table in services/hr-service/src/main/resources/db/migration/

### Accounting Service Extensions for US6

- [ ] T168 [US6] Create LabourCostDashboardService in services/accounting-service/src/main/java/com/surework/accounting/service/impl/LabourCostDashboardServiceImpl.java
- [ ] T169 [US6] Create DashboardController in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/DashboardController.java
- [ ] T170 [US6] Add Redis caching for dashboard aggregations (5-second TTL) in services/accounting-service/src/main/java/com/surework/accounting/config/CacheConfig.java

### Frontend for US6

- [ ] T171 [US6] Create dashboard feature module in frontend/angular-app/src/app/features/dashboard/
- [ ] T172 [P] [US6] Create DashboardService in frontend/angular-app/src/app/features/dashboard/services/dashboard.service.ts
- [ ] T173 [US6] Create labour-cost-dashboard component in frontend/angular-app/src/app/features/dashboard/components/labour-cost-dashboard/
- [ ] T174 [P] [US6] Create cost-breakdown-chart component in frontend/angular-app/src/app/features/dashboard/components/cost-breakdown-chart/
- [ ] T175 [P] [US6] Create department-cost-table component in frontend/angular-app/src/app/features/dashboard/components/department-cost-table/
- [ ] T176 [US6] Create employee-assets component in frontend/angular-app/src/app/features/hr/components/employee-assets/

**Checkpoint**: User Story 6 complete - real-time labour cost dashboard with Tools of Trade functional

---

## Phase 9: User Story 7 - Automated Bank Reconciliation (Priority: P2)

**Goal**: Open Banking bank feeds with automated transaction matching

**Independent Test**: Connect bank account, import transactions, verify automatic matching with recorded entries

### Accounting Service Extensions for US7

- [ ] T177 [US7] Create BankAccount entity in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/BankAccount.java
- [ ] T178 [P] [US7] Create BankTransaction entity in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/BankTransaction.java
- [ ] T179 [US7] Create BankAccountRepository in services/accounting-service/src/main/java/com/surework/accounting/repository/BankAccountRepository.java
- [ ] T180 [P] [US7] Create BankTransactionRepository in services/accounting-service/src/main/java/com/surework/accounting/repository/BankTransactionRepository.java
- [ ] T181 [US7] Create OpenBankingClient (Stitch/Revio integration) with graceful degradation in services/accounting-service/src/main/java/com/surework/accounting/client/OpenBankingClient.java
- [ ] T182 [US7] Create BankFeedSyncService with retry queue integration in services/accounting-service/src/main/java/com/surework/accounting/service/impl/BankFeedSyncServiceImpl.java
- [ ] T183 [US7] Create TransactionMatchingService (95% auto-match target) in services/accounting-service/src/main/java/com/surework/accounting/service/impl/TransactionMatchingServiceImpl.java
- [ ] T184 [US7] Create BankAccountController in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/BankAccountController.java
- [ ] T185 [P] [US7] Create BankTransactionController in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/BankTransactionController.java
- [ ] T186 [US7] Add Flyway migration for bank tables in services/accounting-service/src/main/resources/db/migration/

### Frontend for US7

- [ ] T187 [US7] Create accounting feature module in frontend/angular-app/src/app/features/accounting/
- [ ] T188 [P] [US7] Create BankAccountService in frontend/angular-app/src/app/features/accounting/services/bank-account.service.ts
- [ ] T189 [US7] Create bank-accounts component with "Bank sync pending" status display in frontend/angular-app/src/app/features/accounting/components/bank-accounts/
- [ ] T190 [P] [US7] Create bank-reconciliation component in frontend/angular-app/src/app/features/accounting/components/bank-reconciliation/
- [ ] T191 [US7] Create transaction-matching component in frontend/angular-app/src/app/features/accounting/components/transaction-matching/

**Checkpoint**: User Story 7 complete - automated bank reconciliation functional

---

## Phase 10: User Story 8 - Recruitment to HR Seamless Transition (Priority: P3)

**Goal**: Hired candidates flow directly to HR module without re-typing data, with job board integration

**Independent Test**: Move candidate through ATS to "Hired", verify data pre-populates in HR onboarding

### Recruitment Service for US8

- [ ] T192 Create recruitment-service scaffold in services/recruitment-service/
- [ ] T193 [US8] Create JobPosting entity with externalPostings JSON field in services/recruitment-service/src/main/java/com/surework/recruitment/domain/entity/JobPosting.java
- [ ] T194 [P] [US8] Create Candidate entity with dataRetentionConsent fields (expiresAt, renewalNotificationSent) in services/recruitment-service/src/main/java/com/surework/recruitment/domain/entity/Candidate.java
- [ ] T195 [P] [US8] Create BackgroundCheck entity in services/recruitment-service/src/main/java/com/surework/recruitment/domain/entity/BackgroundCheck.java
- [ ] T196 [P] [US8] Create Interview entity in services/recruitment-service/src/main/java/com/surework/recruitment/domain/entity/Interview.java
- [ ] T197 [US8] Create JobPostingRepository in services/recruitment-service/src/main/java/com/surework/recruitment/repository/JobPostingRepository.java
- [ ] T198 [P] [US8] Create CandidateRepository in services/recruitment-service/src/main/java/com/surework/recruitment/repository/CandidateRepository.java
- [ ] T199 [US8] Create JobPostingService in services/recruitment-service/src/main/java/com/surework/recruitment/service/impl/JobPostingServiceImpl.java
- [ ] T200 [US8] Create CandidateService with SA ID parsing (same logic as Employee) in services/recruitment-service/src/main/java/com/surework/recruitment/service/impl/CandidateServiceImpl.java
- [ ] T201 [US8] Create BackgroundCheckClient (MIE/LexisNexis) with graceful degradation in services/recruitment-service/src/main/java/com/surework/recruitment/client/BackgroundCheckClient.java
- [ ] T202 [US8] Create JobBoardClient interface in services/recruitment-service/src/main/java/com/surework/recruitment/client/JobBoardClient.java
- [ ] T203 [P] [US8] Create LinkedInJobBoardAdapter in services/recruitment-service/src/main/java/com/surework/recruitment/client/impl/LinkedInJobBoardAdapter.java
- [ ] T204 [P] [US8] Create IndeedJobBoardAdapter in services/recruitment-service/src/main/java/com/surework/recruitment/client/impl/IndeedJobBoardAdapter.java
- [ ] T205 [US8] Create CandidateHiredEvent domain event in services/recruitment-service/src/main/java/com/surework/recruitment/domain/event/CandidateHiredEvent.java
- [ ] T206 [US8] Create JobPostingController with external posting endpoints in services/recruitment-service/src/main/java/com/surework/recruitment/controller/api/v1/JobPostingController.java
- [ ] T207 [P] [US8] Create CandidateController in services/recruitment-service/src/main/java/com/surework/recruitment/controller/api/v1/CandidateController.java
- [ ] T208 [US8] Create Flyway migrations for recruitment tables in services/recruitment-service/src/main/resources/db/migration/

### HR Integration for US8

- [ ] T209 [US8] Create CandidateHiredListener in services/hr-service/src/main/java/com/surework/hr/messaging/CandidateHiredListener.java

### Frontend for US8

- [ ] T210 [US8] Create recruitment feature module in frontend/angular-app/src/app/features/recruitment/
- [ ] T211 [P] [US8] Create RecruitmentService in frontend/angular-app/src/app/features/recruitment/services/recruitment.service.ts
- [ ] T212 [US8] Create job-postings component with external posting controls in frontend/angular-app/src/app/features/recruitment/components/job-postings/
- [ ] T213 [P] [US8] Create candidate-pipeline component in frontend/angular-app/src/app/features/recruitment/components/candidate-pipeline/
- [ ] T214 [US8] Create candidate-to-employee component in frontend/angular-app/src/app/features/recruitment/components/candidate-to-employee/

**Checkpoint**: User Story 8 complete - recruitment to HR transition with job board integration functional

---

## Phase 11: User Story 9 - VAT201 Report Generation (Priority: P3)

**Goal**: Automatic VAT201 report generation based on transaction tags

**Independent Test**: Tag transactions as Standard/Zero-rated, generate VAT201, verify calculations correct

### Accounting Service Extensions for US9

- [ ] T215 [US9] Create Invoice entity with vatType field in services/accounting-service/src/main/java/com/surework/accounting/domain/entity/Invoice.java
- [ ] T216 [P] [US9] Create InvoiceRepository in services/accounting-service/src/main/java/com/surework/accounting/repository/InvoiceRepository.java
- [ ] T217 [US9] Create InvoiceService in services/accounting-service/src/main/java/com/surework/accounting/service/impl/InvoiceServiceImpl.java
- [ ] T218 [US9] Create Vat201ReportService in services/accounting-service/src/main/java/com/surework/accounting/service/impl/Vat201ReportServiceImpl.java
- [ ] T219 [US9] Create InvoiceController in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/InvoiceController.java
- [ ] T220 [US9] Create ReportController (VAT201) in services/accounting-service/src/main/java/com/surework/accounting/controller/api/v1/ReportController.java
- [ ] T221 [US9] Add Flyway migration for invoice table in services/accounting-service/src/main/resources/db/migration/

### Frontend for US9

- [ ] T222 [US9] Create invoices component in frontend/angular-app/src/app/features/accounting/components/invoices/
- [ ] T223 [P] [US9] Create vat201-report component in frontend/angular-app/src/app/features/accounting/components/vat201-report/

**Checkpoint**: User Story 9 complete - VAT201 report generation functional

---

## Phase 12: User Story 10 - Employee Termination with Ghost Employee Prevention (Priority: P3)

**Goal**: Employee terminations immediately stop payroll (Ghost Employee prevention) with calendar days proration

**Independent Test**: Terminate employee in HR, verify immediately excluded from next payroll run, verify mid-cycle termination proration uses calendar days method

### HR Service Extensions for US10

- [ ] T224 [US10] Create EmployeeTerminatedEvent domain event in services/hr-service/src/main/java/com/surework/hr/domain/event/EmployeeTerminatedEvent.java
- [ ] T225 [US10] Add termination endpoint to EmployeeController in services/hr-service/src/main/java/com/surework/hr/controller/api/v1/EmployeeController.java
- [ ] T226 [US10] Update EmployeeCommandService with termination logic in services/hr-service/src/main/java/com/surework/hr/service/impl/EmployeeCommandServiceImpl.java

### Payroll Integration for US10

- [ ] T227 [US10] Create EmployeeTerminationListener in services/payroll-service/src/main/java/com/surework/payroll/messaging/EmployeeTerminationListener.java
- [ ] T228 [US10] Update PayrollCalculationService to exclude terminated employees and apply calendar days proration: (Days worked / Total calendar days in month) × Monthly salary in services/payroll-service/src/main/java/com/surework/payroll/service/impl/PayrollCalculationServiceImpl.java

### Frontend for US10

- [ ] T229 [US10] Create employee-termination component in frontend/angular-app/src/app/features/hr/components/employee-termination/
- [ ] T230 [US10] Add termination alert with proration preview to payroll-run-detail in frontend/angular-app/src/app/features/payroll/components/payroll-run-detail/

**Checkpoint**: User Story 10 complete - Ghost Employee prevention with calendar days proration functional

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### POPIA Data Retention Automation

- [ ] T231 [P] Create DataRetentionService (handles employee 3-year post-termination anonymization) in services/hr-service/src/main/java/com/surework/hr/service/impl/DataRetentionServiceImpl.java
- [ ] T232 [P] Create ConsentRenewalScheduler (sends email notification 30 days before expiry) in services/recruitment-service/src/main/java/com/surework/recruitment/scheduler/ConsentRenewalScheduler.java
- [ ] T233 Create DataRetentionScheduler (auto-deletes candidate data 12 months after consent if not renewed) in services/recruitment-service/src/main/java/com/surework/recruitment/scheduler/DataRetentionScheduler.java

### Kubernetes Deployment

- [ ] T234 [P] Create Dockerfile for each service in services/{service}/Dockerfile
- [ ] T235 [P] Create Kubernetes base manifests in infrastructure/kubernetes/base/
- [ ] T236 [P] Create dev overlay in infrastructure/kubernetes/overlays/dev/
- [ ] T237 Create prod overlay in infrastructure/kubernetes/overlays/prod/

### Observability

- [ ] T238 [P] Add Prometheus metrics configuration to all services
- [ ] T239 [P] Add structured JSON logging with traceId
- [ ] T240 Add health probes (liveness/readiness) to all services

### Documentation

- [ ] T241 [P] Update quickstart.md with actual setup commands
- [ ] T242 [P] Create architecture documentation in docs/architecture/
- [ ] T243 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-12)**: All depend on Foundational completion
  - P1 stories (US1, US2, US3) can run in parallel after Foundational
  - P2 stories (US4, US5, US6, US7) can run in parallel after Foundational
  - P3 stories (US8, US9, US10) can run in parallel after Foundational
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Service Dependencies |
|-------|------------|---------------------|
| US1 (P1) | Foundational only | hr-service (basic), payroll-service, accounting-service |
| US2 (P1) | Foundational only | hr-service, identity-service |
| US3 (P1) | Foundational only | payroll-service |
| US4 (P2) | Foundational only | payroll-service, hr-service |
| US5 (P2) | Foundational only | hr-service, payroll-service (integration) |
| US6 (P2) | Foundational only | hr-service (assets), accounting-service |
| US7 (P2) | Foundational only | accounting-service |
| US8 (P3) | Foundational only | recruitment-service, hr-service (integration) |
| US9 (P3) | Foundational only | accounting-service |
| US10 (P3) | US1 (payroll context) | hr-service, payroll-service (integration) |

### Within Each User Story

- Models before services
- Services before controllers
- Backend before frontend
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational shared library tasks marked [P] can run in parallel
- After Foundational: All P1 stories (US1, US2, US3) can start in parallel
- After Foundational: All P2 stories (US4, US5, US6, US7) can start in parallel
- After Foundational: All P3 stories (US8, US9, US10) can start in parallel
- Within each story: Tasks marked [P] can run in parallel

---

## Parallel Example: P1 Stories After Foundational

```bash
# With 3 developers after Foundational phase:

Developer A: User Story 1 (Payroll + Journaling + Rollback)
  - T073-T110 (payroll-service, accounting-service, frontend/payroll)

Developer B: User Story 2 (Employee Onboarding with SA/International ID)
  - T111-T125 (hr-service extensions, frontend/hr)

Developer C: User Story 3 (SARS Tax Compliance)
  - T126-T135 (payroll-service tax features, frontend reports)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Payroll + Journaling + Rollback)
4. **STOP and VALIDATE**: Test payroll processing with auto-journaling and rollback reversal
5. Complete Phase 4: User Story 2 (Employee Onboarding with international ID support)
6. Complete Phase 5: User Story 3 (SARS Compliance with vendor-managed tax tables)
7. **MVP COMPLETE**: Deploy/demo core payroll functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 + US3 → **MVP Release** (Core payroll, onboarding, tax compliance)
3. US4 + US5 + US6 → **Release 2** (Two-Pot, leave, dashboard with Tools of Trade)
4. US7 + US8 + US9 + US10 → **Release 3** (Bank recon, recruitment with job boards, VAT, termination with proration)
5. Polish → **Release 4** (POPIA consent renewal automation, observability, documentation)

---

## Clarifications Applied (Session 2026-01-21)

1. **International ID Support** (T113, T115, T123): SA ID parsing returns requiresManualEntry flag; frontend shows DOB/Gender fields for manual entry when needed
2. **Payroll Rollback** (T089, T092, T102): Creates reversal journal entries (equal-and-opposite posting) to maintain audit trail
3. **Tax Table Management** (T127, T132): Vendor pre-loads tax tables into config schema; loaded by tax year effective date
4. **Mid-Cycle Termination Proration** (T228): Calendar days method: (Days worked / Total calendar days in month) × Monthly salary
5. **POPIA Consent Renewal** (T232, T233): Email notification 30 days before expiry; auto-delete if no response

## Gap Fixes Applied (Analysis 2026-01-21)

1. **Audit Logging** (T023-T026): AuditLog entity, service, and EntityListener for Employee/Financial records
2. **EmployeeAsset** (T163-T167, T176): Full CRUD for Tools of Trade
3. **PayslipGenerationService** (T090): PDF generation for payslips
4. **Owner Role Protection** (T052): Last-owner validation in UserCommandService
5. **Job Board Integration** (T202-T204): JobBoardClient interface with LinkedIn/Indeed adapters

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Service scaffolds include: Application class, pom.xml, application.yml, package structure
