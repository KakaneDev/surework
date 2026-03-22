# HR Module E2E Test Report

**Generated:** 2026-01-27
**Test Framework:** Playwright
**Primary Test User:** Thabo Mokoena (HR Manager)

---

## Executive Summary

A comprehensive end-to-end test suite has been created for the SureWork ERP HR Module. The test suite covers all major HR workflows including employee management, leave administration, and organizational structure.

### Test Suite Statistics

| Metric | Count |
|--------|-------|
| Total Test Cases | 54 |
| Test Sections | 11 |
| Critical Priority | 10 |
| High Priority | 25 |
| Medium Priority | 15 |
| Low Priority | 4 |

---

## Test Users

| Name | Email | Role | Permissions |
|------|-------|------|-------------|
| Thabo Mokoena | thabo.mokoena@testcompany.co.za | HR Manager | EMPLOYEE_READ, EMPLOYEE_MANAGE, LEAVE_APPROVE, LEAVE_MANAGE, RECRUITMENT_MANAGE |
| Johan Meyer | johan.meyer@testcompany.co.za | Department Manager | EMPLOYEE_READ, LEAVE_APPROVE, TIME_APPROVE |
| Ayanda Nkosi | ayanda.nkosi@testcompany.co.za | Employee | SELF_READ, SELF_WRITE, LEAVE_REQUEST |

**Default Password:** `Admin@123!`

---

## Prerequisites

### Required Services

| Service | Port | Required | Purpose |
|---------|------|----------|---------|
| Angular Frontend | 4200 | Yes | UI application |
| Admin Service | 8088 | Yes | Authentication |
| HR Service | 8082 | Yes | Employee & Leave APIs |

### Starting Services

```bash
# Start frontend
cd frontend && npm start

# Start backend services
cd services/admin-service && mvn spring-boot:run
cd services/hr-service && mvn spring-boot:run
```

---

## Test Case Inventory

### TC-HR-ACCESS: Access Control Tests (5 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-HR-ACCESS-001 | HR Manager can access HR dashboard | Critical |
| TC-HR-ACCESS-002 | HR Manager can access employee management | Critical |
| TC-HR-ACCESS-003 | HR Manager can access leave admin | Critical |
| TC-HR-ACCESS-004 | Regular employee can access leave self-service | Critical |
| TC-HR-ACCESS-005 | Unauthenticated user redirected to login | Critical |

### TC-HR-DASH: HR Dashboard Tests (4 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-HR-DASH-001 | Dashboard displays quick stats cards | High |
| TC-HR-DASH-002 | Dashboard has navigation links to HR features | High |
| TC-HR-DASH-003 | Dashboard shows pending approvals indicator | Medium |
| TC-HR-DASH-004 | Can navigate to employees from dashboard | High |

### TC-EMP-LIST: Employee List Management (8 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-EMP-LIST-001 | Employee list page loads correctly | High |
| TC-EMP-LIST-002 | Employee table displays correct columns | High |
| TC-EMP-LIST-003 | Search filter works correctly | High |
| TC-EMP-LIST-004 | Status filter dropdown is functional | Medium |
| TC-EMP-LIST-005 | Department filter is functional | Medium |
| TC-EMP-LIST-006 | Add Employee button is visible for HR | High |
| TC-EMP-LIST-007 | Clicking employee name navigates to detail | High |
| TC-EMP-LIST-008 | Pagination controls are visible | Low |

### TC-EMP-DETAIL: Employee Detail View (4 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-EMP-DETAIL-001 | Navigate to employee detail and verify tabs | High |
| TC-EMP-DETAIL-002 | Employee profile shows personal information | High |
| TC-EMP-DETAIL-003 | Edit button navigates to edit form | High |
| TC-EMP-DETAIL-004 | Back button returns to employee list | Medium |

### TC-EMP-FORM: Employee Form (6 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-EMP-FORM-001 | Create employee form loads correctly | High |
| TC-EMP-FORM-002 | Form has multi-step navigation | Medium |
| TC-EMP-FORM-003 | Personal information fields are present | High |
| TC-EMP-FORM-004 | Required field validation works | Critical |
| TC-EMP-FORM-005 | Cancel button returns to list | Medium |
| TC-EMP-FORM-006 | Department dropdown shows options | Medium |

### TC-LEAVE-SELF: Leave Self-Service (8 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-LEAVE-SELF-001 | Leave dashboard loads for employee | High |
| TC-LEAVE-SELF-002 | Leave balance cards are displayed | High |
| TC-LEAVE-SELF-003 | Annual leave balance is visible | High |
| TC-LEAVE-SELF-004 | Sick leave balance is visible | High |
| TC-LEAVE-SELF-005 | Request Leave button is present | Critical |
| TC-LEAVE-SELF-006 | Leave request dialog opens | High |
| TC-LEAVE-SELF-007 | Leave history section is visible | Medium |
| TC-LEAVE-SELF-008 | Leave request shows status badges | Medium |

### TC-LEAVE-ADMIN: Leave Administration (7 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-LEAVE-ADMIN-001 | HR can access leave admin page | Critical |
| TC-LEAVE-ADMIN-002 | Pending approvals section is visible | High |
| TC-LEAVE-ADMIN-003 | Employee leave balances view is accessible | High |
| TC-LEAVE-ADMIN-004 | Year selector for leave balances | Medium |
| TC-LEAVE-ADMIN-005 | Search employees in leave admin | Medium |
| TC-LEAVE-ADMIN-006 | Approve/Reject buttons for pending requests | Critical |
| TC-LEAVE-ADMIN-007 | Adjust balance functionality | High |

### TC-ORG: Organization Chart (3 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-ORG-001 | HR Manager can access full organogram | High |
| TC-ORG-002 | Organization chart shows employee nodes | High |
| TC-ORG-003 | Employee can see their reporting chain | Medium |

### TC-HR-E2E: End-to-End Workflows (3 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-HR-E2E-001 | Complete HR navigation workflow | Critical |
| TC-HR-E2E-002 | View employee and check leave tab | High |
| TC-HR-E2E-003 | Employee self-service leave request flow | Critical |

### TC-HR-UI: UI Components (4 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-HR-UI-001 | Employee status badges display correctly | Medium |
| TC-HR-UI-002 | Leave type colors are consistent | Low |
| TC-HR-UI-003 | Responsive table scrolling on employees list | Low |
| TC-HR-UI-004 | Loading states are shown during data fetch | Low |

### TC-HR-ERR: Error Handling (2 tests)

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-HR-ERR-001 | Invalid employee ID handles gracefully | High |
| TC-HR-ERR-002 | Network error shows appropriate message | Medium |

---

## Running the Tests

### Full Test Suite

```bash
cd frontend
npx playwright test e2e/hr.spec.ts
```

### Specific Test Section

```bash
# Run access control tests
npx playwright test e2e/hr.spec.ts --grep "TC-HR-ACCESS"

# Run employee list tests
npx playwright test e2e/hr.spec.ts --grep "TC-EMP-LIST"

# Run leave self-service tests
npx playwright test e2e/hr.spec.ts --grep "TC-LEAVE-SELF"

# Run leave admin tests
npx playwright test e2e/hr.spec.ts --grep "TC-LEAVE-ADMIN"
```

### With UI Mode (Interactive Debugging)

```bash
npx playwright test e2e/hr.spec.ts --ui
```

### Generate HTML Report

```bash
npx playwright test e2e/hr.spec.ts --reporter=html
npx playwright show-report
```

---

## Test Data Dependencies

### Test Departments

| Code | Name |
|------|------|
| EXEC | Executive |
| HR | Human Resources |
| FIN | Finance |
| OPS | Operations |
| SALES | Sales |
| IT | Information Technology |

### Test Employees

| Employee # | Name | Department | Job Title | Status |
|------------|------|------------|-----------|--------|
| EMP-1001 | Sipho Dlamini | Executive | CEO | ACTIVE |
| EMP-1002 | Nomvula Mbeki | Finance | CFO | ACTIVE |
| EMP-1003 | Thabo Mokoena | Human Resources | HR Manager | ACTIVE |
| EMP-1004 | Lerato Ndlovu | Finance | Finance Manager | ACTIVE |
| EMP-1005 | Pieter van Wyk | IT | Senior Developer | ACTIVE |
| EMP-1006 | Fatima Patel | Finance | Accountant | ACTIVE |
| EMP-1007 | Johan Meyer | Sales | Sales Manager | ACTIVE |
| EMP-1008 | Ayanda Nkosi | IT | Developer | ACTIVE |
| EMP-1009 | David Botha | Sales | Sales Representative | ACTIVE |
| EMP-1010 | Lindiwe Sithole | Human Resources | HR Officer | ACTIVE |
| EMP-1011 | Zandile Khumalo | Human Resources | HR Officer | ON_LEAVE |

### Leave Balances (All Employees)

| Leave Type | Entitlement |
|------------|-------------|
| Annual Leave | 15 days |
| Sick Leave | 30 days |
| Family Responsibility | 3 days |

---

## Traceability Matrix

| User Story | Test Cases |
|------------|------------|
| As HR Manager, I can view HR dashboard | TC-HR-DASH-001 to 004 |
| As HR Manager, I can manage employees | TC-EMP-LIST-001 to 008 |
| As HR Manager, I can view employee details | TC-EMP-DETAIL-001 to 004 |
| As HR Manager, I can create/edit employees | TC-EMP-FORM-001 to 006 |
| As Employee, I can view my leave balances | TC-LEAVE-SELF-001 to 008 |
| As HR Manager, I can manage leave requests | TC-LEAVE-ADMIN-001 to 007 |
| As HR Manager, I can view organization chart | TC-ORG-001 to 003 |
| Role-based access control | TC-HR-ACCESS-001 to 005 |

---

## File Locations

| File | Path |
|------|------|
| Test Spec | `frontend/e2e/hr.spec.ts` |
| Playwright Config | `frontend/playwright.config.ts` |
| Test Results | `frontend/test-results/` |
| HTML Reports | `frontend/playwright-report/` |

---

## Notes

1. **Authentication**: Tests require the admin-service (port 8088) to be running for user authentication.

2. **Test Isolation**: Each test runs in isolation with a fresh browser context.

3. **Timeouts**: Tests use 60-second timeout by default with 1 retry on failure.

4. **Screenshots**: On failure, screenshots are captured automatically to `test-results/`.

5. **Login Retry**: The login helper function includes retry logic (2 attempts) to handle intermittent authentication delays.

---

*Report generated by Playwright UI Tester Skill*
