# Feature Specification: SureWork - South African SME ERP Platform

**Feature Branch**: `001-surework-sme-erp`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "Business Requirement Document for SureWork, a unified ERP platform for South African SMEs integrating HR, Payroll, Accounting, and Recruitment modules with full SARS, POPIA, BCEA, and Two-Pot retirement system compliance."

## Overview

SureWork addresses the "SME Silo Crisis" where South African small-to-medium enterprises must use 3-4 disconnected software systems (HRIS, Payroll, Accounting, Recruitment) that don't integrate natively. This causes:
- Manual data re-entry between systems leading to overpayments and errors
- POPIA compliance risks from transferring data via CSV/email
- "Ghost Employee" fraud from disconnected termination processes
- Inability to handle Two-Pot retirement complexity compliantly

The platform provides a unified solution with automatic data flow between modules, eliminating manual reconciliation and ensuring South African regulatory compliance.

## Clarifications

### Session 2026-01-20

- Q: What multi-tenant data isolation strategy should be used for SME tenants? → A: Schema-per-tenant (each SME gets isolated database schema within shared infrastructure)
- Q: What user authentication model should the system use? → A: Email/password with mandatory multi-factor authentication (MFA)
- Q: How should the system handle external API failures (Open Banking, background checks)? → A: Graceful degradation with queued retry (workflows continue, failed calls queued for automatic retry)
- Q: What role-based access control model should be used? → A: Predefined roles with limited customization (default permission sets per role, with ability to grant/revoke specific permissions)

### Session 2026-01-21

- Q: How should the system handle non-SA or invalid ID numbers? → A: Allow international ID numbers; if SA ID extraction fails (non-SA format or invalid), require manual entry of Date of Birth and Gender
- Q: What mechanism should be used for payroll rollback when journal corrections are needed? → A: Create reversal journal entry (equal-and-opposite posting) to maintain complete audit trail, then allow new corrected payroll run
- Q: How should SARS tax tables be updated annually? → A: Platform vendor (SureWork team) pre-loads tax tables into shared config schema; all tenants receive updates automatically
- Q: How should mid-cycle termination salary be prorated? → A: Calendar days method: (Days worked / Total calendar days in month) × Monthly salary
- Q: What is the POPIA consent renewal workflow for recruitment data? → A: Email notification 30 days before expiry with renewal link; auto-delete candidate data if no response received

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Payroll Processing with Automatic Journaling (Priority: P1)

As a Payroll Administrator, I need to process monthly payroll and have it automatically create accounting journal entries, so that financial records accurately reflect payroll reality without manual data entry.

**Why this priority**: This addresses the core value proposition - eliminating the manual Payroll-to-Finance reconciliation that costs SMEs ~15 admin hours monthly and introduces errors. The "No-Touch Journal Rule" is the key differentiator.

**Independent Test**: Can be fully tested by running a complete payroll cycle for test employees and verifying that journal entries appear correctly in the General Ledger without manual intervention.

**Acceptance Scenarios**:

1. **Given** a payroll run with salary, UIF, and SDL calculations is ready, **When** the Payroll Admin marks the run as "Finalized", **Then** the system automatically creates Credit/Debit entries in the General Ledger within 30 seconds.

2. **Given** a finalized payroll journal entry exists, **When** an error is discovered, **Then** the user cannot edit the journal directly but must roll back the payroll run to maintain audit trail integrity.

3. **Given** an employee took unpaid leave recorded in HR, **When** payroll is calculated, **Then** the unpaid leave days are automatically deducted from salary without manual re-entry.

---

### User Story 2 - Employee Onboarding with POPIA Compliance (Priority: P1)

As an HR Manager, I need to onboard new employees with digital contract signing and automatic Employment Equity categorization, so that we are compliant with BCEA and EEA2 requirements from day one.

**Why this priority**: Onboarding is the entry point for all employee data. Getting this right ensures data integrity across all modules and establishes POPIA compliance from the start.

**Independent Test**: Can be fully tested by onboarding a new employee, signing contracts digitally, and verifying all required EE fields are captured and employee appears in payroll-ready state.

**Acceptance Scenarios**:

1. **Given** a new hire needs onboarding, **When** the HR Manager enters the SA ID number, **Then** the system auto-extracts Date of Birth and Gender from the ID.

2. **Given** an employee is being onboarded, **When** the mandatory fields are presented, **Then** Race, Gender, and Occupational Level (Top Management, Senior, Skilled, Semi-Skilled, Unskilled) are required before completion.

3. **Given** an employment contract is ready, **When** sent to the employee, **Then** they can digitally sign (eSign) without printing or scanning.

4. **Given** an employee is fully onboarded, **When** the process completes, **Then** they automatically appear in the Payroll module ready for the next pay run.

---

### User Story 3 - SARS Tax Compliance and Reporting (Priority: P1)

As a Payroll Administrator, I need the system to automatically calculate PAYE, UIF, SDL, and ETI according to current SARS tax tables, so that all statutory obligations are met without manual tax table updates.

**Why this priority**: Tax miscalculations result in SARS penalties and employee dissatisfaction. This is non-negotiable for any SA payroll system.

**Independent Test**: Can be fully tested by processing payroll and verifying calculations match SARS tax tables, then generating EMP201/501 reports.

**Acceptance Scenarios**:

1. **Given** it is 1 March of any year, **When** new tax tables are effective, **Then** the system uses updated Rebates/Thresholds automatically without admin intervention.

2. **Given** an employee qualifies for ETI (Employment Tax Incentive), **When** payroll is processed, **Then** ETI is calculated and applied correctly per SARS rules.

3. **Given** a tax year has ended, **When** the administrator requests reports, **Then** EMP201 (monthly) and EMP501 (annual reconciliation) reports are generated in SARS-compliant format.

4. **Given** the tax year cycle is 1 March to 28/29 February, **When** leave balances and tax certificates are managed, **Then** they reset/rollover strictly on 1 March, not calendar year-end.

---

### User Story 4 - Two-Pot Retirement Withdrawal Management (Priority: P2)

As an Employee, I need to simulate and request withdrawals from my Two-Pot retirement savings component through self-service, so that I can access emergency funds while understanding the tax implications.

**Why this priority**: The Two-Pot system (effective September 2024) is complex and requires tight integration between HR, Payroll, and Finance. Manual spreadsheets cannot handle this compliantly.

**Independent Test**: Can be fully tested by an employee simulating a withdrawal, seeing tax impact, submitting a request, and tracking it through to payout.

**Acceptance Scenarios**:

1. **Given** an employee has a Two-Pot retirement fund, **When** they access self-service, **Then** they can simulate withdrawal amounts and see estimated tax implications before committing.

2. **Given** an employee submits a withdrawal request, **When** processed, **Then** the tax directive is calculated and the Finance module records the payout correctly.

3. **Given** a Two-Pot withdrawal is processed, **When** the next payroll runs, **Then** the tax implications are automatically reflected in the employee's payslip.

---

### User Story 5 - Leave Management with BCEA Compliance (Priority: P2)

As an HR Manager, I need to manage employee leave accruals and sick leave cycles according to BCEA rules, so that employees receive their statutory entitlements and company remains compliant.

**Why this priority**: Leave management directly impacts payroll (unpaid leave) and is a common compliance audit point. BCEA-compliant leave calculation is a core HR function.

**Independent Test**: Can be fully tested by setting up employees with different hire dates and verifying leave accruals match BCEA formula (1 day per 17 days worked).

**Acceptance Scenarios**:

1. **Given** an employee has worked 17 days, **When** leave accrual is calculated, **Then** 1 day of annual leave is credited per BCEA formula.

2. **Given** an employee's sick leave cycle (36 months), **When** they have taken sick days, **Then** the system tracks against the 30-day entitlement and shows remaining balance.

3. **Given** an employee requests unpaid leave, **When** approved in HR, **Then** the Payroll module automatically deducts those days from the next salary calculation.

---

### User Story 6 - Real-Time Labour Cost Dashboard (Priority: P2)

As an SME Owner, I need a real-time dashboard showing total labour costs including Salary, UIF, Levies (SDL), and Tools of Trade, so that I understand my true employment costs at any moment.

**Why this priority**: SME owners cite "not knowing total labour cost" as a key pain point. This visibility is essential for business planning and budget management.

**Independent Test**: Can be fully tested by viewing the dashboard with multiple employees across different salary bands and verifying all cost components are aggregated correctly.

**Acceptance Scenarios**:

1. **Given** multiple employees exist with salaries and benefits, **When** the owner views the dashboard, **Then** they see aggregated costs broken down by: Base Salary, UIF (employer portion), SDL, and any allocated Tools of Trade.

2. **Given** a new employee is added or salary changes, **When** the dashboard is refreshed, **Then** the updated costs reflect within 5 seconds.

---

### User Story 7 - Automated Bank Reconciliation (Priority: P2)

As an Accountant, I need direct bank feeds and automated matching of transactions, so that I spend less time on manual reconciliation.

**Why this priority**: Accountants cite "days spent reconciling the bank" as a major pain point. Automated bank feeds via Open Banking dramatically reduce this effort.

**Independent Test**: Can be fully tested by connecting a bank account, importing transactions, and verifying automatic matching with recorded entries.

**Acceptance Scenarios**:

1. **Given** a South African bank account is connected via Open Banking API, **When** transactions occur, **Then** they appear in the system within 24 hours.

2. **Given** bank transactions are imported, **When** they match recorded invoices or payments, **Then** automatic matching suggestions are presented.

3. **Given** payroll payments are made, **When** they clear the bank, **Then** the reconciliation links them to the payroll journal entries automatically.

---

### User Story 8 - Recruitment to HR Seamless Transition (Priority: P3)

As an HR Manager, I need hired candidates to flow directly into the HR module without re-typing data, so that we eliminate POPIA risks from manual data handling and reduce onboarding time.

**Why this priority**: This addresses the Recruitment-to-HR data gap where candidate data is often manually re-typed, creating POPIA compliance risks and data entry errors.

**Independent Test**: Can be fully tested by moving a candidate through the ATS pipeline to "Hired" and verifying their data pre-populates in the HR onboarding workflow.

**Acceptance Scenarios**:

1. **Given** a candidate has applied via the ATS, **When** their SA ID number is captured, **Then** Date of Birth and Gender are auto-extracted.

2. **Given** a candidate is marked as "Hired", **When** HR initiates onboarding, **Then** all captured candidate data pre-populates the employee record.

3. **Given** a candidate provided consent for a background check, **When** initiated, **Then** the system integrates with verification services (MIE/LexisNexis) for criminal record checks.

---

### User Story 9 - VAT201 Report Generation (Priority: P3)

As an Accountant, I need automatic VAT201 report generation based on transaction tags, so that VAT submissions are accurate and efficient.

**Why this priority**: VAT compliance is mandatory for VAT-registered businesses. Automatic categorization reduces errors and speeds up submissions.

**Independent Test**: Can be fully tested by tagging transactions as Standard or Zero-rated and generating a VAT201 report for a period.

**Acceptance Scenarios**:

1. **Given** transactions are tagged as Standard-rated or Zero-rated during entry, **When** VAT201 report is requested for a period, **Then** the report calculates Input VAT, Output VAT, and Net VAT correctly.

2. **Given** a VAT201 report is generated, **When** exported, **Then** it is in a format suitable for SARS submission.

---

### User Story 10 - Employee Termination with Ghost Employee Prevention (Priority: P3)

As an HR Manager, I need employee terminations to immediately stop payroll, so that "Ghost Employees" cannot continue receiving salary after departure.

**Why this priority**: Ghost Employee fraud is a significant risk in disconnected systems. Immediate synchronization between HR and Payroll prevents this fraud vector.

**Independent Test**: Can be fully tested by terminating an employee in HR and verifying they are immediately excluded from the next payroll run.

**Acceptance Scenarios**:

1. **Given** an employee is terminated in HR, **When** the termination is processed, **Then** they are immediately flagged as inactive in Payroll and excluded from future pay runs.

2. **Given** a payroll run is in progress, **When** an employee is terminated mid-cycle, **Then** the system alerts the Payroll Admin to review/prorate the payment using calendar days method: (Days worked / Total calendar days in month) × Monthly salary.

---

### Edge Cases

- What happens when an employee transfers between departments mid-payroll cycle?
- **Same-period start and leave**: Employee is prorated for actual days worked using calendar days method: (Days worked / Total calendar days in month) × Monthly salary.
- **Bank feed failure**: System queues failed imports for automatic retry with exponential backoff; users see "Bank sync pending" status; reconciliation proceeds with available data; admin alerted after 24 hours of failures.
- How does the system handle retroactive salary adjustments across previous tax years?
- What happens when SARS tax tables are updated mid-pay-period?
- How does the system handle an employee with multiple employment contracts (e.g., part-time roles)?
- What happens when a Two-Pot withdrawal request exceeds the available savings component balance?
- How does the system handle leap year calculations for the February 28/29 tax year end?

## Requirements *(mandatory)*

### Functional Requirements

**Module A: Core HR**

- **FR-A01**: System MUST store and manage complete employee records including personal details, employment contracts, and organizational assignments.
- **FR-A02**: System MUST parse South African ID numbers to auto-extract Date of Birth and Gender. For international ID numbers or when extraction fails, the system MUST require manual entry of Date of Birth and Gender fields.
- **FR-A03**: System MUST support digital contract signing (eSign) for employment contracts.
- **FR-A04**: System MUST track leave accruals per BCEA (1 day per 17 days worked).
- **FR-A05**: System MUST track sick leave cycles (30 days per 36-month cycle). At cycle end, unused sick leave does NOT carry over; a new 30-day entitlement begins for the next 36-month cycle.
- **FR-A06**: System MUST capture mandatory Employment Equity fields: Race, Gender, Occupational Level (Top Management, Senior, Skilled, Semi-Skilled, Unskilled).
- **FR-A07**: System MUST manage company asset assignment to employees (Tools of Trade).
- **FR-A08**: System MUST immediately flag terminated employees as inactive across all modules.

**Module B: Payroll**

- **FR-B01**: System MUST calculate PAYE according to current SARS tax tables with automatic annual updates effective 1 March. Tax tables are pre-loaded by platform vendor into shared config schema and distributed to all tenants automatically.
- **FR-B02**: System MUST calculate UIF contributions (employer and employee portions).
- **FR-B03**: System MUST calculate SDL (Skills Development Levy) contributions.
- **FR-B04**: System MUST calculate ETI (Employment Tax Incentive) for qualifying employees.
- **FR-B05**: System MUST generate payslips for employees in PDF format containing: Employee name, ID number (masked), pay period, gross earnings breakdown (basic salary, overtime, bonuses), deductions breakdown (PAYE, UIF, pension), employer contributions (UIF, SDL), and net pay.
- **FR-B06**: System MUST generate SARS EMP201 (monthly) reports.
- **FR-B07**: System MUST generate SARS EMP501 (annual reconciliation) reports.
- **FR-B08**: System MUST handle Two-Pot retirement withdrawal tax directives.
- **FR-B09**: System MUST automatically deduct unpaid leave days from salary when recorded in HR.
- **FR-B10**: System MUST operate on the SA Tax Year cycle (1 March - 28/29 February).

**Module C: Accounting**

- **FR-C01**: System MUST maintain a General Ledger with standard double-entry bookkeeping.
- **FR-C02**: System MUST automatically create journal entries when payroll is finalized (No-Touch Journal Rule).
- **FR-C03**: System MUST prevent manual editing of payroll-generated journal entries; corrections require payroll rollback. Rollback MUST create a reversal journal entry (equal-and-opposite posting) to maintain audit trail, then allow a new corrected payroll run.
- **FR-C04**: System MUST connect to South African banks via Open Banking API for direct bank feeds.
- **FR-C05**: System MUST automatically suggest transaction matches during bank reconciliation.
- **FR-C06**: System MUST generate VAT201 reports based on transaction tagging (Standard vs Zero-rated).
- **FR-C07**: System MUST support invoicing with VAT calculation.

**Module D: Recruitment**

- **FR-D01**: System MUST provide Applicant Tracking System (ATS) functionality for job postings and candidate management.
- **FR-D02**: System MUST integrate with background check providers (MIE/LexisNexis) for criminal record verification with consent.
- **FR-D03**: System MUST enable job posting to external job boards.
- **FR-D04**: System MUST transfer hired candidate data directly to HR module without re-entry.

**Module E: Integration & Compliance**

- **FR-E01**: System MUST provide workflow automation between all modules (HR, Payroll, Accounting, Recruitment).
- **FR-E02**: System MUST enforce POPIA data retention policies:
  - Recruitment data: Auto-delete after 12 months unless consent renewed. System sends email notification with renewal link 30 days before expiry; auto-deletes if no response.
  - Financial data: Retain 5 years (SARS requirement)
  - Employee data: Retain 3 years post-termination (BCEA), then anonymize
  - Data deletion MUST be logged for compliance audit: deletion timestamp, data category, triggering rule, and confirmation status.
- **FR-E03**: System MUST log all field changes on Employee and Financial records with: User ID, Timestamp, Old Value, New Value, IP Address. Audit logs MUST be queryable by compliance officers via API with filtering by entity type, entity ID, user ID, and date range. Audit logs are immutable (append-only).
- **FR-E04**: System MUST provide Employee Self-Service (ESS) portal for leave requests, payslips, and Two-Pot simulations.
- **FR-E05**: System MUST provide real-time labour cost dashboard for business owners.
- **FR-E06**: System MUST authenticate users via email/password with mandatory multi-factor authentication (MFA) for all user roles. Password hashing MUST use BCrypt with cost factor 12. JWT access tokens expire in 15 minutes; refresh tokens enable session continuation.
- **FR-E07**: System MUST support MFA via SMS OTP or authenticator app to accommodate varying user device capabilities. MFA challenges expire after 5 minutes. Rate limit: max 5 failed login attempts per 15 minutes before temporary account lockout.
- **FR-E08**: System MUST implement graceful degradation for external API failures: workflows continue with failed external calls queued for automatic retry.
- **FR-E09**: System MUST notify users of pending external operations (e.g., "Bank sync pending - will retry automatically") without blocking core functionality.
- **FR-E10**: System MUST retry failed external API calls with exponential backoff (max 5 attempts over 24 hours) before alerting administrators.
- **FR-E11**: System MUST implement role-based access control with predefined roles: Owner, HR Manager, Payroll Administrator, Accountant, Employee.
- **FR-E12**: System MUST allow tenant admins to customize permissions within predefined roles (grant/revoke specific permissions) while maintaining audit trail of changes.
- **FR-E13**: System MUST enforce that at least one Owner role exists per tenant and prevent self-demotion of the last Owner.

### Key Entities

- **Tenant (Organization)**: Represents an SME customer of the platform. Each tenant has an isolated database schema containing all their data (employees, payroll, accounting, recruitment). Tenant isolation ensures POPIA compliance and prevents cross-tenant data leakage.

- **User**: Represents an authenticated system user. Contains credentials (email, hashed password), MFA settings, assigned role (Owner, HR Manager, Payroll Administrator, Accountant, Employee), custom permission overrides, and link to Employee record (for staff users). Users authenticate via email/password + MFA.

- **Role**: Predefined permission set (Owner, HR Manager, Payroll Administrator, Accountant, Employee) with default access rights. Each role has customizable permissions that tenant admins can grant/revoke. Permission changes are audit-logged.

- **Employee**: Central entity representing a person employed by the organization. Contains personal information (ID number - SA or international, contact), employment details (hire date, termination date, contract type), EE categorization (race, gender, occupational level), and links to leave balances, assets, and payroll records. DOB and Gender are auto-extracted from valid SA IDs or manually entered for international employees.

- **Payroll Run**: Represents a single payroll processing cycle (typically monthly). Contains period dates, status (Draft, Processing, Finalized, Rolled Back), employee payment details, tax calculations, and linked journal entries.

- **Journal Entry**: Represents a double-entry accounting record in the General Ledger. Contains debit/credit accounts, amounts, posting date, source reference (e.g., payroll run), immutability flag for payroll-generated entries, and reversal links (reversalOfId, reversedById) for payroll rollback audit trail.

- **Leave Balance**: Tracks employee leave entitlements and usage. Contains leave type (Annual, Sick, Unpaid), accrued days, used days, cycle dates (for sick leave 36-month tracking), and link to employee.

- **Candidate**: Represents a job applicant in the recruitment pipeline. Contains personal information, application history, background check consent/results, data retention consent (with expiry date and renewal notification tracking), and status (Applied, Screening, Interview, Offer, Hired, Rejected).

- **Bank Transaction**: Represents an imported transaction from bank feeds. Contains date, amount, description, matched status, and link to reconciled journal entries.

- **Tax Table**: Configuration entity in shared config schema (not tenant-specific) containing SARS tax brackets, rebates, and thresholds by tax year. Pre-loaded by platform vendor and used for PAYE calculations across all tenants.

- **Two-Pot Record**: Tracks employee retirement fund balances across Savings and Retirement components. Contains current balances, withdrawal requests, and tax directive history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full payroll run (calculation through finalization) in under 15 minutes for up to 25 employees.
- **SC-002**: Automatic journal entries appear in the General Ledger within 30 seconds of payroll finalization.
- **SC-003**: Employee onboarding (from data entry to payroll-ready) completes in under 10 minutes per employee.
- **SC-004**: 95% of bank transactions are automatically matched during reconciliation.
- **SC-005**: Labour cost dashboard reflects changes within 5 seconds of data updates.
- **SC-006**: System supports 10,000 concurrent users across all SME tenants without performance degradation.
- **SC-007**: Two-Pot withdrawal simulations return results in under 3 seconds.
- **SC-008**: SARS reports (EMP201, EMP501, VAT201) generate in under 1 minute for standard SME sizes.
- **SC-009**: Zero Ghost Employee incidents: terminated employees are excluded from payroll within 5 seconds of HR termination.
- **SC-010**: 100% audit trail coverage: every Employee and Financial record change is logged with required metadata.
- **SC-011**: Data retention automation: 95% of POPIA-governed data is automatically handled per retention rules without manual intervention.
- **SC-012**: ESS portal loads and operates effectively on 3G mobile networks (page loads under 5 seconds on 1Mbps connection).

## Constraints

### Regulatory Constraints

- **RC-001**: All data must be stored within South African borders (Azure SA North region) to comply with POPIA cross-border transfer regulations.
- **RC-002**: Tax calculations must use the SARS-published tax tables, updated by 1 March annually.
- **RC-003**: Leave calculations must follow BCEA minimum standards.
- **RC-004**: EE categorization must match Department of Labour EEA2 form requirements.

### Business Constraints

- **BC-001**: Pricing must remain competitive (~55% below current market alternatives).
- **BC-002**: Must support tiered pricing: Micro (1-5 users), Growth (6-25 users), Scale (26+ users).

### Technical Constraints

- **TC-001**: ESS must function as a Progressive Web App (PWA) optimized for low-bandwidth conditions.
- **TC-002**: Bank integration must use South African Open Banking providers (Stitch/Revio or equivalent).

## Out of Scope (Phase 1)

- Complex Manufacturing Inventory (Bill of Materials)
- Point of Sale (POS) hardware integration
- Time & Attendance Hardware (Biometric clocks) - software integration only
- Multi-currency support (ZAR only for Phase 1)
- International tax jurisdictions

## Assumptions

- SA-001: Tax table updates will be published by SARS before 1 March each year, allowing timely system updates.
- SA-002: Open Banking API providers (Stitch/Revio) will maintain service availability for the major SA banks.
- SA-003: Background check providers (MIE/LexisNexis) offer API integration capabilities.
- SA-004: SMEs have at least intermittent internet connectivity; offline-first is not required.
- SA-005: Digital signatures via eSign are legally binding for employment contracts under ECT Act.
- SA-006: Employees have access to smartphones or computers to use ESS (even if on 3G networks).

## Dependencies

- **DEP-001**: SARS tax table publication schedule
- **DEP-002**: South African Open Banking provider APIs (Stitch, Revio, or equivalent)
- **DEP-003**: Background verification service APIs (MIE, LexisNexis)
- **DEP-004**: Azure SA North region availability for data sovereignty compliance
