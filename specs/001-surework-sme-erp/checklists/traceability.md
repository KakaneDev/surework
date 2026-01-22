# Task-to-Spec Traceability Checklist: SureWork SME ERP Platform

**Purpose**: Validate that all implementation tasks trace back to documented requirements
**Created**: 2026-01-21
**Audience**: Spec Author / Technical Lead (pre-implementation review)
**Focus**: Task-to-requirement mapping completeness and consistency
**Depth**: Comprehensive
**Last Validated**: 2026-01-21

---

## User Story Coverage

*Validates each user story has complete task coverage*

- [x] CHK001 - Does US1 (Payroll + Journaling) have tasks covering all 3 acceptance scenarios? [Coverage, Spec §US1] → T080-T110
- [x] CHK002 - Does US2 (Employee Onboarding) have tasks covering all 4 acceptance scenarios including SA ID auto-extraction? [Coverage, Spec §US2] → T111-T125
- [x] CHK003 - Does US3 (SARS Tax Compliance) have tasks covering all 4 acceptance scenarios including tax year cycle? [Coverage, Spec §US3] → T126-T135
- [x] CHK004 - Does US4 (Two-Pot) have tasks covering all 3 acceptance scenarios including tax directive calculation? [Coverage, Spec §US4] → T136-T148
- [x] CHK005 - Does US5 (Leave Management) have tasks covering all 3 acceptance scenarios including BCEA formula? [Coverage, Spec §US5] → T149-T162
- [x] CHK006 - Does US6 (Dashboard) have tasks covering all 2 acceptance scenarios including 5-second refresh? [Coverage, Spec §US6] → T163-T176
- [x] CHK007 - Does US7 (Bank Reconciliation) have tasks covering all 3 acceptance scenarios including payroll-to-bank matching? [Coverage, Spec §US7] → T177-T191
- [x] CHK008 - Does US8 (Recruitment→HR) have tasks covering all 3 acceptance scenarios including background check integration? [Coverage, Spec §US8] → T192-T214
- [x] CHK009 - Does US9 (VAT201) have tasks covering all 2 acceptance scenarios including SARS submission format? [Coverage, Spec §US9] → T215-T223
- [x] CHK010 - Does US10 (Termination) have tasks covering all 2 acceptance scenarios including mid-cycle proration? [Coverage, Spec §US10] → T224-T230

---

## Functional Requirements Traceability (Module A: Core HR)

- [x] CHK011 - Is FR-A01 (employee records) traced to specific tasks for Employee entity and CRUD endpoints? [Traceability, Spec §FR-A01] → T074-T079
- [x] CHK012 - Is FR-A02 (SA ID parsing + international fallback) traced to SaIdParserService and id-input component tasks? [Traceability, Spec §FR-A02] → T113, T123
- [x] CHK013 - Is FR-A03 (eSign contracts) traced to ContractSigningService and contract-signing component tasks? [Traceability, Spec §FR-A03] → T114, T124
- [x] CHK014 - Is FR-A04 (BCEA leave accrual) traced to LeaveAccrualService tasks with formula reference? [Traceability, Spec §FR-A04] → T153
- [x] CHK015 - Is FR-A05 (sick leave cycles) traced to tasks specifying 36-month cycle boundary enforcement? [Traceability, Spec §FR-A05] → T153
- [x] CHK016 - Is FR-A06 (EE fields) traced to Employee entity tasks with all occupational levels? [Traceability, Spec §FR-A06] → T074
- [x] CHK017 - Is FR-A07 (asset management) traced to EmployeeAsset entity, service, and component tasks? [Traceability, Spec §FR-A07] → T163-T167, T176
- [x] CHK018 - Is FR-A08 (termination sync) traced to EmployeeTerminatedEvent and listener tasks? [Traceability, Spec §FR-A08] → T224-T227

---

## Functional Requirements Traceability (Module B: Payroll)

- [x] CHK019 - Is FR-B01 (PAYE calculation) traced to PayrollCalculationService and TaxTableService tasks? [Traceability, Spec §FR-B01] → T086, T127
- [x] CHK020 - Is FR-B01 vendor pre-load mechanism traced to TaxTable seeding task in config schema? [Traceability, Spec §FR-B01, Clarification] → T132
- [x] CHK021 - Is FR-B02 (UIF calculation) traced to PayrollCalculationService task with employer/employee portions? [Traceability, Spec §FR-B02] → T086
- [x] CHK022 - Is FR-B03 (SDL calculation) traced to PayrollCalculationService task? [Traceability, Spec §FR-B03] → T086
- [x] CHK023 - Is FR-B04 (ETI calculation) traced to PayrollCalculationService enhancement task? [Traceability, Spec §FR-B04] → T128
- [x] CHK024 - Is FR-B05 (payslip generation) traced to PayslipGenerationService task with PDF template? [Traceability, Spec §FR-B05] → T090
- [x] CHK025 - Is FR-B06 (EMP201 reports) traced to Emp201ReportService task? [Traceability, Spec §FR-B06] → T129
- [x] CHK026 - Is FR-B07 (EMP501 reports) traced to Emp501ReportService task? [Traceability, Spec §FR-B07] → T130
- [x] CHK027 - Is FR-B08 (Two-Pot tax directives) traced to TwoPotWithdrawalService tasks? [Traceability, Spec §FR-B08] → T140-T141
- [x] CHK028 - Is FR-B09 (unpaid leave deduction) traced to UnpaidLeaveDeductionListener task? [Traceability, Spec §FR-B09] → T158
- [x] CHK029 - Is FR-B10 (SA Tax Year cycle) traced to tasks referencing 1 March cycle? [Traceability, Spec §FR-B10] → T127

---

## Functional Requirements Traceability (Module C: Accounting)

- [x] CHK030 - Is FR-C01 (General Ledger) traced to Account entity and JournalEntry tasks? [Traceability, Spec §FR-C01] → T096-T098
- [x] CHK031 - Is FR-C02 (No-Touch Journal Rule) traced to PayrollJournalCreator task listening to PayrollRunFinalizedEvent? [Traceability, Spec §FR-C02] → T102
- [x] CHK032 - Is FR-C03 (payroll rollback) traced to PayrollRollbackService and reversal journal tasks? [Traceability, Spec §FR-C03, Clarification] → T089, T092, T102
- [x] CHK033 - Is FR-C03 immutability flag traced to JournalEntry entity task? [Traceability, Spec §FR-C03] → T097
- [x] CHK034 - Is FR-C04 (Open Banking) traced to OpenBankingClient task with graceful degradation? [Traceability, Spec §FR-C04] → T181
- [x] CHK035 - Is FR-C05 (transaction matching) traced to TransactionMatchingService task with 95% target? [Traceability, Spec §FR-C05] → T183
- [x] CHK036 - Is FR-C06 (VAT201) traced to Vat201ReportService task? [Traceability, Spec §FR-C06] → T218
- [x] CHK037 - Is FR-C07 (invoicing with VAT) traced to Invoice entity and InvoiceService tasks? [Traceability, Spec §FR-C07] → T215-T217

---

## Functional Requirements Traceability (Module D: Recruitment)

- [x] CHK038 - Is FR-D01 (ATS) traced to JobPosting, Candidate, Interview entity and service tasks? [Traceability, Spec §FR-D01] → T193-T196, T199-T200
- [x] CHK039 - Is FR-D02 (background checks) traced to BackgroundCheckClient task with MIE/LexisNexis reference? [Traceability, Spec §FR-D02] → T201
- [x] CHK040 - Is FR-D03 (job board posting) traced to JobBoardClient and LinkedIn/Indeed adapter tasks? [Traceability, Spec §FR-D03] → T202-T204
- [x] CHK041 - Is FR-D04 (candidate→employee) traced to CandidateHiredEvent and CandidateHiredListener tasks? [Traceability, Spec §FR-D04] → T205, T209

---

## Functional Requirements Traceability (Module E: Integration & Compliance)

- [x] CHK042 - Is FR-E01 (workflow automation) traced to domain event and listener tasks across modules? [Traceability, Spec §FR-E01] → T020, T102, T209, T227
- [x] CHK043 - Is FR-E02 (POPIA retention - recruitment 12 months) traced to DataRetentionScheduler task? [Traceability, Spec §FR-E02] → T233
- [x] CHK044 - Is FR-E02 (consent renewal 30 days) traced to ConsentRenewalScheduler task? [Traceability, Spec §FR-E02, Clarification] → T232
- [x] CHK045 - Is FR-E02 (employee 3-year anonymization) traced to DataRetentionService task? [Traceability, Spec §FR-E02] → T231
- [x] CHK046 - Is FR-E03 (audit logging) traced to AuditLog entity, AuditLogService, and AuditableEntityListener tasks? [Traceability, Spec §FR-E03] → T023-T026
- [x] CHK047 - Is FR-E04 (ESS portal) traced to ess feature module and component tasks? [Traceability, Spec §FR-E04] → T144-T148
- [x] CHK048 - Is FR-E05 (labour cost dashboard) traced to LabourCostDashboardService and dashboard component tasks? [Traceability, Spec §FR-E05] → T168-T175
- [x] CHK049 - Is FR-E06 (email/password + MFA) traced to AuthenticationService and MfaService tasks? [Traceability, Spec §FR-E06] → T049-T050
- [x] CHK050 - Is FR-E07 (MFA options) traced to MfaService task supporting SMS OTP and TOTP? [Traceability, Spec §FR-E07] → T050
- [x] CHK051 - Is FR-E08 (graceful degradation) traced to client tasks with graceful degradation in description? [Traceability, Spec §FR-E08] → T181, T201
- [x] CHK052 - Is FR-E09 (pending operation notification) traced to UI component tasks with status display? [Traceability, Spec §FR-E09] → T189
- [x] CHK053 - Is FR-E10 (retry with backoff) traced to RetryQueueProcessor task with "max 5 attempts over 24 hours"? [Traceability, Spec §FR-E10] → T062
- [x] CHK054 - Is FR-E11 (predefined roles) traced to Role entity and RoleController tasks? [Traceability, Spec §FR-E11] → T045, T055
- [x] CHK055 - Is FR-E12 (permission customization) traced to RolePermissionOverride entity tasks? [Traceability, Spec §FR-E12] → T046
- [x] CHK056 - Is FR-E13 (owner role protection) traced to UserCommandService task with last-owner protection? [Traceability, Spec §FR-E13] → T052

---

## Clarification Traceability (Session 2026-01-21)

- [x] CHK057 - Is "international ID with manual DOB/Gender fallback" clarification traced to SaIdParserService and id-input component tasks? [Traceability, Clarification §1] → T113, T123
- [x] CHK058 - Is "reversal journal entry" clarification traced to PayrollRollbackService, PayrollRunRolledBackEvent, and PayrollJournalCreator tasks? [Traceability, Clarification §2] → T089, T092, T102
- [x] CHK059 - Is "vendor pre-loaded tax tables in config schema" clarification traced to TaxTable seeding and TaxTableService tasks? [Traceability, Clarification §3] → T127, T132
- [x] CHK060 - Is "calendar days proration method" clarification traced to PayrollCalculationService task for termination proration? [Traceability, Clarification §4] → T228
- [x] CHK061 - Is "30-day consent renewal notification" clarification traced to ConsentRenewalScheduler and DataRetentionScheduler tasks? [Traceability, Clarification §5] → T232, T233

---

## Success Criteria Traceability

- [x] CHK062 - Is SC-001 (15 min payroll for 25 employees) addressable by PayrollCommandService and UI tasks? [Traceability, Spec §SC-001] → T087, T105-T110
- [x] CHK063 - Is SC-002 (30 sec journal creation) addressable by PayrollJournalCreator task? [Traceability, Spec §SC-002] → T102
- [x] CHK064 - Is SC-003 (10 min onboarding) addressable by employee-onboarding component tasks? [Traceability, Spec §SC-003] → T122-T125
- [x] CHK065 - Is SC-004 (95% auto-match) traceable to TransactionMatchingService task description? [Traceability, Spec §SC-004] → T183
- [x] CHK066 - Is SC-005 (5 sec dashboard refresh) traceable to Redis caching task with 5-second TTL? [Traceability, Spec §SC-005] → T170
- [x] CHK067 - Is SC-006 (10,000 concurrent users) addressable by infrastructure/Kubernetes tasks? [Traceability, Spec §SC-006] → T235-T237
- [x] CHK068 - Is SC-007 (3 sec Two-Pot simulation) traceable to TwoPotSimulationService task? [Traceability, Spec §SC-007] → T140
- [x] CHK069 - Is SC-008 (1 min report generation) addressable by report service tasks? [Traceability, Spec §SC-008] → T129, T130, T218
- [x] CHK070 - Is SC-009 (5 sec Ghost Employee exclusion) traceable to EmployeeTerminationListener task? [Traceability, Spec §SC-009] → T227
- [x] CHK071 - Is SC-010 (100% audit coverage) traceable to AuditableEntityListener task for Employee/Financial records? [Traceability, Spec §SC-010] → T026
- [x] CHK072 - Is SC-011 (95% POPIA automation) traceable to DataRetentionScheduler and ConsentRenewalScheduler tasks? [Traceability, Spec §SC-011] → T232, T233
- [x] CHK073 - Is SC-012 (5 sec on 1Mbps) addressable by PWA configuration task? [Traceability, Spec §SC-012] → T072

---

## Entity-to-Task Traceability

- [x] CHK074 - Is Tenant entity (spec) traced to Tenant entity task in tenant-service? [Traceability, Spec §Entities] → T035
- [x] CHK075 - Is User entity (spec) traced to User entity task in identity-service? [Traceability, Spec §Entities] → T044
- [x] CHK076 - Is Role entity (spec) traced to Role entity task in identity-service? [Traceability, Spec §Entities] → T045
- [x] CHK077 - Is Employee entity (spec) traced to Employee entity task in hr-service? [Traceability, Spec §Entities] → T074
- [x] CHK078 - Is Payroll Run entity (spec) traced to PayrollRun entity task in payroll-service? [Traceability, Spec §Entities] → T081
- [x] CHK079 - Is Journal Entry entity (spec) traced to JournalEntry entity task with reversal fields? [Traceability, Spec §Entities] → T097
- [x] CHK080 - Is Leave Balance entity (spec) traced to LeaveBalance entity task in hr-service? [Traceability, Spec §Entities] → T149
- [x] CHK081 - Is Candidate entity (spec) traced to Candidate entity task with consent fields in recruitment-service? [Traceability, Spec §Entities] → T194
- [x] CHK082 - Is Bank Transaction entity (spec) traced to BankTransaction entity task in accounting-service? [Traceability, Spec §Entities] → T178
- [x] CHK083 - Is Tax Table entity (spec) traced to TaxTable entity task with config schema annotation? [Traceability, Spec §Entities] → T083
- [x] CHK084 - Is Two-Pot Record entity (spec) traced to TwoPotRecord entity task in payroll-service? [Traceability, Spec §Entities] → T136

---

## Constitution Principle Traceability

- [x] CHK085 - Is Principle I (Monorepo Structure) traced to T001 project structure task? [Traceability, Constitution §I] → T001
- [x] CHK086 - Is Principle II (Service Structure) traced to service scaffold tasks with standard package layout? [Traceability, Constitution §II] → T034, T043, T073, T080, T095, T192
- [x] CHK087 - Is Principle III (Java 21 Features) traced to domain event sealed interface tasks? [Traceability, Constitution §III] → T020
- [x] CHK088 - Is Principle IV (API Design) traced to controller tasks with /api/v1/ versioning? [Traceability, Constitution §IV] → T041, T053-T055, T078, T093, T103
- [x] CHK089 - Is Principle V (Service Layer) traced to QueryService/CommandService interface pattern in tasks? [Traceability, Constitution §V] → T037-T039, T051-T052, T076-T077, T087-T088
- [x] CHK090 - Is Principle VI (Exception Handling) traced to BaseException and GlobalExceptionHandler tasks? [Traceability, Constitution §VI] → T015-T016
- [x] CHK091 - Is Principle VII (Database Standards) traced to BaseEntity and Flyway migration tasks? [Traceability, Constitution §VII] → T012, T042, T057, T079, T094, T104
- [x] CHK092 - Is Principle VIII (Security) traced to JwtTokenProvider, MfaService, and SecurityConfig tasks? [Traceability, Constitution §VIII] → T017, T050, T056
- [x] CHK093 - Is Principle X (Observability) traced to Prometheus metrics and structured logging tasks? [Traceability, Constitution §X] → T238-T240
- [x] CHK094 - Is Principle XII (Communication) traced to Kafka producer/consumer and domain event tasks? [Traceability, Constitution §XII] → T020-T021, T063, T102
- [x] CHK095 - Is Principle XIII (Containers) traced to Dockerfile tasks? [Traceability, Constitution §XIII] → T234
- [x] CHK096 - Is Principle XIV (Kubernetes) traced to base/overlay manifest tasks? [Traceability, Constitution §XIV] → T235-T237
- [x] CHK097 - Is Principle XV (Frontend) traced to Angular core/shared/features structure tasks? [Traceability, Constitution §XV] → T064-T072

---

## Edge Case Traceability

- [x] CHK098 - Is "same-period start and leave" edge case traced to PayrollCalculationService proration task? [Traceability, Spec §Edge Cases] → T228
- [x] CHK099 - Is "bank feed failure" edge case traced to BankFeedSyncService with retry queue integration? [Traceability, Spec §Edge Cases] → T182
- [x] CHK100 - Is "mid-payroll termination" edge case traced to calendar days proration in PayrollCalculationService task? [Traceability, Spec §Edge Cases] → T228

---

## Orphan Task Detection

*Validates no tasks exist without spec backing*

- [x] CHK101 - Do all Setup phase (T001-T011) tasks trace to constitution principles or spec constraints? [Traceability] → Constitution I, XIV
- [x] CHK102 - Do all Foundational phase tasks (T012-T072) trace to spec entities, requirements, or constitution? [Traceability] → Verified
- [x] CHK103 - Are all [US1] labeled tasks (T073-T110) traceable to US1 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK104 - Are all [US2] labeled tasks (T111-T125) traceable to US2 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK105 - Are all [US3] labeled tasks (T126-T135) traceable to US3 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK106 - Are all [US4] labeled tasks (T136-T148) traceable to US4 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK107 - Are all [US5] labeled tasks (T149-T162) traceable to US5 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK108 - Are all [US6] labeled tasks (T163-T176) traceable to US6 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK109 - Are all [US7] labeled tasks (T177-T191) traceable to US7 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK110 - Are all [US8] labeled tasks (T192-T214) traceable to US8 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK111 - Are all [US9] labeled tasks (T215-T223) traceable to US9 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK112 - Are all [US10] labeled tasks (T224-T230) traceable to US10 acceptance scenarios or supporting FRs? [Traceability] → Verified
- [x] CHK113 - Do all Polish phase tasks (T231-T243) trace to cross-cutting requirements (FR-E02, NFRs, Constitution)? [Traceability] → Verified

---

## Bidirectional Traceability Completeness

- [x] CHK114 - Are there any functional requirements (FR-*) without corresponding implementation tasks? [Gap Detection] → All FRs have tasks
- [x] CHK115 - Are there any success criteria (SC-*) without tasks that would achieve them? [Gap Detection] → All SCs addressable
- [x] CHK116 - Are there any spec entities without corresponding entity creation tasks? [Gap Detection] → All entities covered
- [x] CHK117 - Are there any clarifications from Session 2026-01-21 not reflected in task descriptions? [Gap Detection] → All clarifications in tasks
- [x] CHK118 - Are there any edge cases listed in spec without corresponding handling tasks? [Gap Detection] → Documented edge cases addressed
- [x] CHK119 - Are there any constitution principles not traceable to implementation tasks? [Gap Detection] → All principles covered
- [x] CHK120 - Are there any dependencies (DEP-*) without tasks ensuring their integration? [Gap Detection] → Integration tasks exist

---

## Summary

| Category | Items | Status |
|----------|-------|--------|
| User Story Coverage | CHK001-CHK010 | ✓ Complete |
| Module A (HR) FRs | CHK011-CHK018 | ✓ Complete |
| Module B (Payroll) FRs | CHK019-CHK029 | ✓ Complete |
| Module C (Accounting) FRs | CHK030-CHK037 | ✓ Complete |
| Module D (Recruitment) FRs | CHK038-CHK041 | ✓ Complete |
| Module E (Integration) FRs | CHK042-CHK056 | ✓ Complete |
| Clarification Traceability | CHK057-CHK061 | ✓ Complete |
| Success Criteria | CHK062-CHK073 | ✓ Complete |
| Entity Traceability | CHK074-CHK084 | ✓ Complete |
| Constitution Principles | CHK085-CHK097 | ✓ Complete |
| Edge Cases | CHK098-CHK100 | ✓ Complete |
| Orphan Detection | CHK101-CHK113 | ✓ Complete |
| Bidirectional Completeness | CHK114-CHK120 | ✓ Complete |

**Total Items**: 120
**Completed**: 120 (100%)
**Remaining**: 0

---

**Validation Complete**: All implementation tasks trace to documented requirements. Task-to-spec mapping is complete and bidirectional.

