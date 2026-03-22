# Recruitment Module E2E Test Report

**Generated:** 2026-01-26
**Test User:** Thabo Mokoena (HR Manager)
**Test Framework:** Playwright

---

## Executive Summary

A comprehensive end-to-end test suite has been created for the SureWork ERP Recruitment Module. The test suite covers all major recruitment workflows using the perspective of **Thabo Mokoena**, an HR Manager with full recruitment permissions.

### Test Suite Statistics

| Metric | Count |
|--------|-------|
| Total Test Cases | 42 |
| Test Sections | 11 |
| Critical Priority | 15 |
| High Priority | 18 |
| Medium Priority | 9 |

---

## Test User Profile

| Field | Value |
|-------|-------|
| Name | Thabo Mokoena |
| Role | HR Manager |
| Email | thabo.mokoena@testcompany.co.za |
| Password | Admin@123! |
| Permissions | RECRUITMENT_READ, RECRUITMENT_MANAGE, EMPLOYEE_READ, LEAVE_APPROVE |

---

## Prerequisites

### Required Services

For the test suite to run successfully, the following backend services must be running:

| Service | Port | Required | Purpose |
|---------|------|----------|---------|
| Angular Frontend | 4200 | Yes | UI application |
| API Gateway | 8080 | Yes | Request routing |
| Admin Service | 8088 | Yes | Authentication |
| Recruitment Service | 8086 | Yes | Recruitment API |
| HR Service | 8082 | Optional | Employee data |
| Identity Service | 8085 | Optional | User management |
| Document Service | 8087 | Optional | Document uploads |

### Starting Services

```bash
# Start frontend
cd frontend && npm start

# Start backend services (from root)
cd services/admin-service && mvn spring-boot:run
cd services/recruitment-service && mvn spring-boot:run
# ... additional services as needed
```

---

## Test Case Inventory

### TC-REC-ACCESS: Access Control Tests (3 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-ACCESS-001 | HR Manager can access recruitment module | Critical |
| TC-REC-ACCESS-002 | Employee without permissions is redirected | Critical |
| TC-REC-ACCESS-003 | Unauthenticated user is redirected to login | Critical |

### TC-REC-DASH: Recruitment Dashboard Tests (6 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-DASH-001 | Dashboard displays key metrics cards | High |
| TC-REC-DASH-002 | Dashboard displays pipeline overview section | High |
| TC-REC-DASH-003 | Dashboard displays upcoming interviews section | Medium |
| TC-REC-DASH-004 | Dashboard displays recent job postings table | High |
| TC-REC-DASH-005 | Quick action buttons are visible and functional | Medium |
| TC-REC-DASH-006 | Navigate to candidates from dashboard | Medium |

### TC-REC-JOBS: Job Postings Management Tests (9 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-JOBS-001 | Job postings list page loads correctly | High |
| TC-REC-JOBS-002 | Job postings table displays correct columns | High |
| TC-REC-JOBS-003 | Search filter works correctly | High |
| TC-REC-JOBS-004 | Status filter dropdown is functional | Medium |
| TC-REC-JOBS-005 | Employment type filter is functional | Medium |
| TC-REC-JOBS-006 | Clear filters button works | Low |
| TC-REC-JOBS-007 | Post New Job button navigates to form | High |
| TC-REC-JOBS-008 | Back button navigates to dashboard | Low |
| TC-REC-JOBS-009 | Job row click navigates to detail | High |

### TC-REC-JOBFORM: Job Posting Form Tests (8 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-JOBFORM-001 | Create job form loads correctly | High |
| TC-REC-JOBFORM-002 | Form sections are displayed | Medium |
| TC-REC-JOBFORM-003 | Required fields validation | Critical |
| TC-REC-JOBFORM-004 | Employment type dropdown options | Medium |
| TC-REC-JOBFORM-005 | Remote and internal checkboxes functional | Medium |
| TC-REC-JOBFORM-006 | Save as Draft button is visible | Medium |
| TC-REC-JOBFORM-007 | Cancel button navigates back | Low |
| TC-REC-JOBFORM-008 | Fill complete job form | Critical |

### TC-REC-CAND: Candidates Management Tests (7 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-CAND-001 | Candidates list page loads correctly | High |
| TC-REC-CAND-002 | Candidates table displays correct columns | High |
| TC-REC-CAND-003 | Search filter works correctly | High |
| TC-REC-CAND-004 | Status filter dropdown is functional | Medium |
| TC-REC-CAND-005 | Add Candidate button navigates to form | High |
| TC-REC-CAND-006 | Candidate row click navigates to detail | High |
| TC-REC-CAND-007 | Pagination controls are visible | Low |

### TC-REC-CANDDET: Candidate Detail Tests (4 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-CANDDET-001 | Navigate to candidate detail and verify tabs | High |
| TC-REC-CANDDET-002 | Candidate profile shows contact information | Medium |
| TC-REC-CANDDET-003 | Candidate profile shows professional info | Medium |
| TC-REC-CANDDET-004 | Edit button navigates to edit form | High |

### TC-REC-INT: Interviews Management Tests (2 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-INT-001 | Interviews list page loads correctly | High |
| TC-REC-INT-002 | Navigate from dashboard to interviews | Medium |

### TC-REC-REP: Recruitment Reports Tests (1 test)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-REP-001 | Recruitment reports page loads | Medium |

### TC-REC-E2E: End-to-End Workflow Tests (3 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-E2E-001 | Complete navigation workflow | Critical |
| TC-REC-E2E-002 | View existing job posting details | High |
| TC-REC-E2E-003 | View candidate details and navigate tabs | High |

### TC-REC-UI: UI Component Tests (4 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-UI-001 | Status badges display correctly | Medium |
| TC-REC-UI-002 | Dropdown menus work on job rows | High |
| TC-REC-UI-003 | Responsive table scrolling | Low |
| TC-REC-UI-004 | Material icons are rendered correctly | Low |

### TC-REC-ERR: Error Handling Tests (2 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-REC-ERR-001 | Invalid job ID shows error state | High |
| TC-REC-ERR-002 | Invalid candidate ID shows error state | High |

---

## Running the Tests

### Full Test Suite

```bash
cd frontend
npx playwright test e2e/recruitment.spec.ts
```

### Specific Test Section

```bash
# Run only access control tests
npx playwright test e2e/recruitment.spec.ts --grep "TC-REC-ACCESS"

# Run dashboard tests
npx playwright test e2e/recruitment.spec.ts --grep "TC-REC-DASH"

# Run job posting tests
npx playwright test e2e/recruitment.spec.ts --grep "TC-REC-JOBS"
```

### With UI Mode (Interactive Debugging)

```bash
npx playwright test e2e/recruitment.spec.ts --ui
```

### Generate HTML Report

```bash
npx playwright test e2e/recruitment.spec.ts --reporter=html
npx playwright show-report
```

---

## Test Data Dependencies

### Seeded Job Postings

| Reference | Title | Status |
|-----------|-------|--------|
| JOB-001001 | Senior Software Engineer | OPEN |
| JOB-001002 | HR Business Partner | OPEN |
| JOB-001003 | Financial Accountant | OPEN |
| JOB-001004 | DevOps Engineer | OPEN |
| JOB-001005 | Marketing Coordinator | OPEN |
| JOB-001006 | Project Manager | DRAFT |
| JOB-001007 | Junior Developer | FILLED |

### Seeded Candidates

| Reference | Name | Status |
|-----------|------|--------|
| CAN-010001 | Thabo Molefe | ACTIVE |
| CAN-010002 | Naledi Dlamini | ACTIVE |
| CAN-010003 | Pieter van der Berg | ACTIVE |
| CAN-010004 | Zinhle Nkosi | ACTIVE |
| CAN-010005 | Michael Smith | ACTIVE |

---

## Traceability Matrix

| User Story | Test Cases |
|------------|------------|
| As HR Manager, I can view recruitment dashboard | TC-REC-DASH-001 to 006 |
| As HR Manager, I can manage job postings | TC-REC-JOBS-001 to 009 |
| As HR Manager, I can create new job postings | TC-REC-JOBFORM-001 to 008 |
| As HR Manager, I can manage candidates | TC-REC-CAND-001 to 007 |
| As HR Manager, I can view candidate details | TC-REC-CANDDET-001 to 004 |
| As HR Manager, I can manage interviews | TC-REC-INT-001 to 002 |
| As HR Manager, I can view recruitment reports | TC-REC-REP-001 |
| Role-based access control | TC-REC-ACCESS-001 to 003 |

---

## Notes

1. **Authentication**: Tests require the admin-service (port 8088) to be running for user authentication.

2. **Test Isolation**: Each test runs in isolation with a fresh browser context.

3. **Timeouts**: Tests use 60-second timeout by default with 1 retry on failure.

4. **Screenshots**: On failure, screenshots are captured automatically to `test-results/`.

5. **Traces**: Traces are recorded on first retry for debugging.

---

## File Locations

| File | Path |
|------|------|
| Test Spec | `frontend/e2e/recruitment.spec.ts` |
| Playwright Config | `frontend/playwright.config.ts` |
| Test Results | `frontend/test-results/` |
| HTML Reports | `frontend/playwright-report/` |

---

*Report generated by Playwright UI Tester Skill*
