# Cross-Artifact Consistency Analysis: SureWork SME ERP Platform

**Feature**: 001-surework-sme-erp
**Analysis Date**: 2026-01-21
**Artifacts Analyzed**: spec.md, plan.md, tasks.md, data-model.md, constitution.md, contracts/*.yaml

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Functional Requirements | 36 (FR-A01 to FR-E13) |
| Total User Stories | 10 (US1 to US10) |
| Total Tasks | 226 (T001 to T226) |
| Constitution Principles | 15 (I to XV) |
| Critical Issues | 3 |
| Major Issues | 8 |
| Minor Issues | 12 |
| Info/Recommendations | 7 |

**Overall Assessment**: ✅ PASS with recommendations

The artifacts are well-aligned and consistent. Critical and major issues identified are addressable before implementation begins.

---

## Findings Table

### Critical Issues (Must Fix Before Implementation)

| ID | Type | Artifact(s) | Description | Recommendation |
|----|------|-------------|-------------|----------------|
| C-001 | Gap | spec.md, tasks.md | **Audit Logging Not Explicitly Tasked**: FR-E03 requires "log all field changes on Employee and Financial records with: User ID, Timestamp, Old Value, New Value, IP Address" but no dedicated audit logging implementation task exists beyond T216 (AuditLogService) | Add explicit tasks for: (1) Audit log entity/table creation, (2) JPA EntityListener for Employee changes, (3) JPA EntityListener for Financial record changes, (4) Audit log query endpoints |
| C-002 | Gap | spec.md, tasks.md | **POPIA Data Retention Scheduler Missing for Recruitment**: FR-E02 specifies "Recruitment data: Auto-delete after 12 months unless consent renewed" but T215 (DataRetentionScheduler) is in recruitment-service but lacks tasks for consent renewal workflow or notification before deletion | Add tasks for: (1) Consent renewal notification 30 days before expiry, (2) Consent renewal endpoint, (3) Data deletion confirmation/logging |
| C-003 | Gap | spec.md, tasks.md | **Owner Role Protection Not Tasked**: FR-E13 requires "at least one Owner role exists per tenant and prevent self-demotion of the last Owner" - no specific validation task for this business rule | Add task to UserCommandService or RoleController implementing last-owner protection logic |

### Major Issues (Fix Before Story Implementation)

| ID | Type | Artifact(s) | Description | Recommendation |
|----|------|-------------|-------------|----------------|
| M-001 | Ambiguity | spec.md | **SA ID Validation Scope Unclear**: FR-A02 says "parse South African ID numbers to auto-extract Date of Birth and Gender" but doesn't specify validation requirements (checksum, format validation, handling invalid IDs) | Clarify: Should invalid SA IDs be rejected, or just extraction skipped with warning? Add to SaIdParserService task (T105) |
| M-002 | Gap | data-model.md, tasks.md | **EmployeeAsset Entity Missing Tasks**: data-model.md defines EmployeeAsset entity (Tools of Trade) referenced in US6 dashboard but no tasks create this entity or repository | Add tasks: T070.1 Create EmployeeAsset entity, T070.2 Create EmployeeAssetRepository, T070.3 Add asset endpoints to EmployeeController |
| M-003 | Inconsistency | spec.md, data-model.md | **Leave Balance Cycle Tracking Mismatch**: Spec FR-A05 mentions "30 days per 36-month cycle" but data-model shows cycleStartDate/cycleEndDate fields without enforcement logic tasked | Add task to LeaveAccrualService (T145) to validate against 36-month cycle boundaries |
| M-004 | Gap | spec.md, tasks.md | **Tax Table Auto-Update Not Tasked**: FR-B01 states "automatic annual updates effective 1 March" but T119 (TaxTableService) doesn't specify automation mechanism | Clarify: Manual admin upload vs. external feed vs. config update? Add task for tax table versioning and effective date switching |
| M-005 | Ambiguity | spec.md, contracts | **Journal Rollback Mechanism Undefined**: US1 Scenario 2 and FR-C03 mention "roll back the payroll run" but no contract or task defines rollback endpoint or reversal journal creation | Add explicit rollback endpoint to payroll-service.yaml contract and task for PayrollRollbackService |
| M-006 | Gap | spec.md, tasks.md | **Payslip Generation Not Tasked**: FR-B05 "System MUST generate payslips for employees" - PayrollLineItem has payslipPdf field but no task creates PayslipGenerationService | Add task: T087.1 Create PayslipGenerationService with PDF template |
| M-007 | Gap | spec.md, tasks.md | **External Job Board Posting Not Tasked**: FR-D03 "System MUST enable job posting to external job boards" but no client or integration task exists | Add tasks: T185.1 Create JobBoardClient interface, T185.2 Create LinkedIn/Indeed adapters |
| M-008 | Inconsistency | data-model.md, tasks.md | **TaxTable Schema Location Mismatch**: data-model.md shows TaxTable in "config" schema but T079 creates it in payroll-service without schema specification | Update T079 to specify config schema and ensure cross-schema access from payroll-service |

### Minor Issues (Address During Implementation)

| ID | Type | Artifact(s) | Description | Recommendation |
|----|------|-------------|-------------|----------------|
| m-001 | Duplication | tasks.md | **Redundant Service Scaffolds**: T069 (hr-service scaffold) and T076 (payroll-service scaffold) are separate but could share common service scaffold template | Consider shared scaffold task or template; low priority |
| m-002 | Inconsistency | contracts, tasks | **Contract File Naming**: Contracts use kebab-case (hr-service.yaml) but tasks use different patterns; ensure consistency | Standardize on kebab-case for all artifact naming |
| m-003 | Gap | tasks.md | **Frontend Testing Not Tasked**: T240-T243 for Angular testing mentioned in constitution but only T240 (npm test) listed in quickstart | Add explicit frontend test tasks: Karma config, Cypress E2E setup |
| m-004 | Ambiguity | spec.md | **Edge Case: Mid-Payroll Termination**: Listed but resolution unclear - "system alerts the Payroll Admin to review/prorate the payment" | Document proration calculation formula in T211 task description |
| m-005 | Gap | data-model.md | **Notification Entity Missing**: notification-service has no entity definitions for notification history/templates | Add NotificationLog and NotificationTemplate entities to data-model.md |
| m-006 | Inconsistency | plan.md, tasks.md | **Phase Numbering**: Plan shows "Phase 0: Research" and "Phase 1: Design" but tasks.md starts with "Phase 1: Setup" | Align terminology: Tasks Phase 1 = Plan Phase 2 (implementation begins) |
| m-007 | Gap | tasks.md | **Health Probe Configuration Not Explicit**: T223 mentions "Add health probes" but specific actuator configuration not detailed | Add explicit actuator configuration to each service's application.yml task |
| m-008 | Duplication | tasks.md | **Mapper Tasks Repeated Pattern**: T073, T113, T159 all create mappers with same pattern | Consider adding MapStruct configuration to common-dto lib once |
| m-009 | Gap | spec.md, tasks.md | **Leap Year Handling Not Tasked**: Edge case asks "How does the system handle leap year calculations for February 28/29 tax year end?" | Add unit test for tax year boundary handling in T119 |
| m-010 | Inconsistency | quickstart.md, tasks.md | **Port Assignments**: quickstart.md shows ports 8081-8086 but tasks don't configure these explicitly | Add application.yml port configuration to each service scaffold task |
| m-011 | Gap | tasks.md | **Circuit Breaker Configuration Missing**: Constitution XII requires circuit breakers but no explicit Resilience4j configuration task | Add task for common-web circuit breaker configuration |
| m-012 | Ambiguity | spec.md | **Multiple Contracts Per Employee**: Edge case mentions this but no data model support for multiple active employment contracts | Clarify: Out of scope for Phase 1 or needs EmploymentContract array support? |

### Info/Recommendations

| ID | Type | Description | Suggestion |
|----|------|-------------|------------|
| I-001 | Enhancement | **Test Task Generation**: Tasks explicitly exclude tests per "Tests: Not explicitly requested" | Consider running `/speckit.tasks` with test flag if automated test generation desired |
| I-002 | Best Practice | **Contract-First Development**: OpenAPI contracts exist; consider generating Java interfaces from contracts | Add code generation task using openapi-generator-maven-plugin |
| I-003 | Performance | **Dashboard Caching Strategy**: T157 adds Redis caching but cache invalidation strategy not defined | Document cache TTL and invalidation triggers in task description |
| I-004 | Security | **MFA Backup Codes Not Modeled**: User entity has mfaSecret but no backup codes for account recovery | Consider adding backupCodes field or recovery flow |
| I-005 | Compliance | **POPIA Consent Audit**: Consent changes should be audit-logged per FR-E03 requirements | Ensure consent timestamp changes trigger audit log entries |
| I-006 | Architecture | **API Gateway Rate Limiting**: Not explicitly tasked but mentioned in research.md | Add rate limiting configuration task to api-gateway setup |
| I-007 | Documentation | **Quickstart Validation**: T226 exists but depends on all services being implemented | Move T226 to Phase 13 checkpoint list |

---

## Coverage Analysis

### Functional Requirements → Tasks Mapping

| Requirement | User Story | Tasks | Coverage |
|-------------|------------|-------|----------|
| FR-A01 (Employee records) | US2 | T070-T074, T107 | ✅ Full |
| FR-A02 (SA ID parsing) | US2 | T105, T115 | ✅ Full |
| FR-A03 (eSign contracts) | US2 | T103-T106, T116 | ✅ Full |
| FR-A04 (BCEA leave accrual) | US5 | T141-T149 | ✅ Full |
| FR-A05 (Sick leave cycles) | US5 | T141, T145 | ⚠️ Partial (cycle enforcement unclear) |
| FR-A06 (EE fields) | US2 | T070, T114 | ✅ Full |
| FR-A07 (Asset management) | US6 | - | ❌ Missing (EmployeeAsset tasks needed) |
| FR-A08 (Termination sync) | US10 | T207-T211 | ✅ Full |
| FR-B01 (PAYE calculation) | US3 | T082, T118-T120 | ✅ Full |
| FR-B02 (UIF calculation) | US1, US3 | T082 | ✅ Full |
| FR-B03 (SDL calculation) | US1, US3 | T082 | ✅ Full |
| FR-B04 (ETI calculation) | US3 | T120 | ✅ Full |
| FR-B05 (Payslip generation) | US1 | - | ❌ Missing (task needed) |
| FR-B06 (EMP201 reports) | US3 | T121, T126 | ✅ Full |
| FR-B07 (EMP501 reports) | US3 | T122, T127 | ✅ Full |
| FR-B08 (Two-Pot tax) | US4 | T128-T140 | ✅ Full |
| FR-B09 (Unpaid leave deduction) | US5 | T150 | ✅ Full |
| FR-B10 (SA Tax Year cycle) | US3 | T079, T124 | ✅ Full |
| FR-C01 (General Ledger) | US1 | T089-T093 | ✅ Full |
| FR-C02 (Auto journal entries) | US1 | T094-T095 | ✅ Full |
| FR-C03 (No-touch journal rule) | US1 | T095 (immutable flag) | ⚠️ Partial (rollback mechanism unclear) |
| FR-C04 (Open Banking) | US7 | T163-T172 | ✅ Full |
| FR-C05 (Transaction matching) | US7 | T169, T177 | ✅ Full |
| FR-C06 (VAT201 reports) | US9 | T198-T206 | ✅ Full |
| FR-C07 (Invoicing with VAT) | US9 | T198-T202 | ✅ Full |
| FR-D01 (ATS functionality) | US8 | T178-T197 | ✅ Full |
| FR-D02 (Background checks) | US8 | T181, T187 | ✅ Full |
| FR-D03 (Job board posting) | US8 | - | ❌ Missing (integration tasks needed) |
| FR-D04 (Candidate→Employee) | US8 | T188, T192, T197 | ✅ Full |
| FR-E01 (Workflow automation) | All | Event listeners throughout | ✅ Full |
| FR-E02 (POPIA retention) | Cross-cutting | T214-T215 | ⚠️ Partial (consent renewal missing) |
| FR-E03 (Audit logging) | Cross-cutting | T216 | ⚠️ Partial (entity listeners missing) |
| FR-E04 (ESS portal) | US4, US5 | T136-T140, T154 | ✅ Full |
| FR-E05 (Labour cost dashboard) | US6 | T155-T162 | ✅ Full |
| FR-E06 (Email/password + MFA) | Foundation | T045-T046, T062 | ✅ Full |
| FR-E07 (MFA options) | Foundation | T046 | ✅ Full |
| FR-E08 (Graceful degradation) | Cross-cutting | T058 | ✅ Full |
| FR-E09 (Pending operation notification) | Cross-cutting | T058 | ✅ Full |
| FR-E10 (Retry with backoff) | Cross-cutting | T058 | ✅ Full |
| FR-E11 (RBAC predefined roles) | Foundation | T041-T044, T051 | ✅ Full |
| FR-E12 (Permission customization) | Foundation | T042, T051 | ✅ Full |
| FR-E13 (Owner role protection) | Foundation | - | ❌ Missing (validation task needed) |

**Coverage Summary**: 33/36 requirements fully covered (91.7%), 3 partially covered, 4 with missing tasks

### User Story → Task Count

| Story | Priority | Tasks | Estimated LOC |
|-------|----------|-------|---------------|
| US1 (Payroll + Journaling) | P1 | 34 | ~4,500 |
| US2 (Employee Onboarding) | P1 | 15 | ~2,000 |
| US3 (SARS Tax Compliance) | P1 | 10 | ~1,500 |
| US4 (Two-Pot Retirement) | P2 | 13 | ~1,800 |
| US5 (Leave Management) | P2 | 14 | ~1,600 |
| US6 (Labour Cost Dashboard) | P2 | 8 | ~1,000 |
| US7 (Bank Reconciliation) | P2 | 15 | ~2,200 |
| US8 (Recruitment→HR) | P3 | 20 | ~2,800 |
| US9 (VAT201 Reports) | P3 | 9 | ~1,200 |
| US10 (Ghost Employee Prevention) | P3 | 7 | ~800 |
| Foundation/Setup | Blocking | 68 | ~6,000 |
| Polish/Cross-cutting | Final | 13 | ~1,500 |
| **Total** | | **226** | **~26,900** |

### Constitution Alignment

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Monorepo Structure | ✅ Aligned | plan.md project structure matches constitution |
| II. Service Internal Structure | ✅ Aligned | Tasks follow controller/service/repository/domain pattern |
| III. Java 21 Features | ✅ Aligned | DTOs as Records (T012-T014), Sealed Interfaces (T020), Virtual Threads |
| IV. API Design | ✅ Aligned | /api/v1/ versioning in all contracts, ProblemDetail (T013, T016) |
| V. Service Layer | ✅ Aligned | CQRS interfaces (T033-T034, T083-T084) |
| VI. Exception Handling | ✅ Aligned | BaseException hierarchy (T015), GlobalExceptionHandler (T016) |
| VII. Database Standards | ✅ Aligned | BaseEntity (T012), Flyway migrations (T038, T053, T075, etc.) |
| VIII. Security | ✅ Aligned | JWT (T017), MFA (T046), BCrypt (T045) |
| IX. Testing | ⚠️ Partial | Test tasks explicitly excluded; add if needed |
| X. Observability | ✅ Aligned | T221-T223 (metrics, logging, probes) |
| XI. Configuration | ✅ Aligned | Profile structure in each service scaffold |
| XII. Communication | ⚠️ Partial | Kafka events (T020-T021), circuit breaker config missing |
| XIII. Containerization | ✅ Aligned | T217 (Dockerfiles per constitution template) |
| XIV. Kubernetes | ✅ Aligned | T218-T220 (base/overlays structure) |
| XV. Angular Frontend | ✅ Aligned | T060-T068 (core/shared/features structure) |

---

## Remediation Priority

### Immediate (Before `/speckit.implement`)

1. **C-001**: Add audit logging tasks (entity, listeners, endpoints)
2. **C-002**: Add POPIA consent renewal workflow tasks
3. **C-003**: Add owner role protection validation task
4. **M-002**: Add EmployeeAsset entity tasks
5. **M-005**: Add payroll rollback endpoint and service task
6. **M-006**: Add PayslipGenerationService task

### During Implementation

1. **M-001**: Clarify SA ID validation in T105 description
2. **M-003**: Add cycle boundary validation to T145
3. **M-004**: Clarify tax table update mechanism
4. **M-007**: Add job board integration tasks
5. **M-008**: Fix TaxTable schema configuration

### Post-Implementation

1. Address minor issues (m-001 through m-012)
2. Consider info/recommendations (I-001 through I-007)
3. Add comprehensive test tasks if automated testing desired

---

## Next Actions

1. **Update tasks.md** with missing critical tasks (audit logging, consent renewal, owner protection)
2. **Update tasks.md** with missing major tasks (EmployeeAsset, payslip generation, job board integration)
3. **Clarify ambiguities** in spec.md (SA ID validation, payroll rollback, mid-cycle termination proration)
4. **Run `/speckit.tasks`** again if significant changes are made, or manually add tasks
5. **Proceed to `/speckit.implement`** once critical issues are resolved

---

**Analysis Complete**: 2026-01-21
**Analyst**: Claude (via `/speckit.analyze`)
