# UI/UX Audit Report: Full Localization Gap Analysis

**Generated:** 2026-01-27
**Scope:** Complete frontend i18n coverage audit
**Languages:** English (en), Afrikaans (af), isiZulu (zu)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 8 |
| Medium | 12 |
| Low | 5 |

**Overall Assessment:** The i18n infrastructure is correctly set up with ngx-translate, but **only ~15% of the UI is actually translated**. The shell/navigation, login, settings appearance, and 404 pages use translations correctly. However, **all major feature modules still have hardcoded English strings**, resulting in a mixed-language experience for Afrikaans and Zulu users.

---

## Critical Finding

### [CRIT-001] Majority of Application Not Translated

**Impact:** Users selecting Afrikaans or isiZulu see 85% English text mixed with translated navigation, creating a poor and confusing user experience.

**Affected Features (ordered by user impact):**
1. Dashboard - Primary landing page
2. Employees - Core HR functionality
3. Leave Management - Self-service feature
4. Payroll - Financial data
5. Accounting - Financial management
6. Recruitment - ATS functionality
7. Settings (most sections)
8. Documents
9. Support
10. Reports

---

## High Severity Findings

### [HIGH-001] Dashboard Component - 30+ Hardcoded Strings
**File:** `src/app/features/dashboard/dashboard-content.component.ts`

| Line | Hardcoded String | Required Key |
|------|------------------|--------------|
| 39 | `Dashboard` | `dashboard.title` |
| 40 | `Welcome back! Here's an overview...` | `dashboard.subtitle` |
| 45 | `Add Employee` | `dashboard.actions.addEmployee` |
| 49 | `Post Job` | `dashboard.actions.postJob` |
| 120 | `My Leave Requests` | `dashboard.widgets.myLeaveRequests` |
| 154 | `Request Leave` | `dashboard.actions.requestLeave` |
| 166 | `My Payslips` | `dashboard.widgets.myPayslips` |
| 199 | `View All Payslips` | `dashboard.actions.viewAllPayslips` |
| 219 | `Employees` | `dashboard.stats.employees` |
| 239 | `Leave Requests` | `dashboard.stats.leaveRequests` |
| 255 | `Payroll` | `dashboard.stats.payroll` |
| 275 | `Open Positions` | `dashboard.stats.openPositions` |
| 294 | `Upcoming Interviews` | `dashboard.widgets.upcomingInterviews` |

---

### [HIGH-002] Employee Module - 50+ Hardcoded Strings
**Files:**
- `src/app/features/employees/employees-list/employees-list.component.ts`
- `src/app/features/employees/employee-form/employee-form.component.ts`
- `src/app/features/employees/employee-detail/employee-detail.component.ts`
- `src/app/features/employees/employees-organogram/employees-organogram.component.ts`

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| employees-list:28 | `Employees` | `employees.title` |
| employees-list:53 | `Add Employee` | `employees.actions.add` |
| employees-list:69 | `Search by name, email...` | `employees.search.placeholder` |
| employees-list:80-84 | Status dropdowns | `employees.status.*` |
| employees-list:112-119 | Table headers | `employees.table.*` |
| employee-form:58 | `Personal Information` | `employees.form.sections.personal` |
| employee-form:61-99 | Form labels | `employees.form.labels.*` |
| employee-form:109-122 | Gender/Marital options | `employees.form.options.*` |
| organogram:47 | `No hierarchy data available` | `employees.organogram.noData` |

---

### [HIGH-003] Leave Module - 40+ Hardcoded Strings
**Files:**
- `src/app/features/leave/leave-list/leave-list.component.ts`
- `src/app/features/leave/leave-dashboard/leave-dashboard.component.ts`
- `src/app/features/leave/pending-approvals/pending-approvals.component.ts`

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| leave-list:25-31 | Leave type labels | `leave.types.*` |
| leave-list:56 | `Employee Leave Balances` | `leave.admin.balances.title` |
| leave-list:62 | `Tax Year` | `leave.taxYear` |
| leave-list:90 | `Search employee...` | `leave.search.placeholder` |
| leave-list:105 | `Loading employee leave data...` | `leave.loading` |
| leave-list:113-129 | Table headers | `leave.table.*` |

---

### [HIGH-004] Accounting Module - 80+ Hardcoded Strings
**Files:**
- `src/app/features/accounting/accounting-dashboard/accounting-dashboard.component.ts`
- `src/app/features/accounting/chart-of-accounts/chart-of-accounts.component.ts`
- `src/app/features/accounting/chart-of-accounts/account-dialog.component.ts`
- `src/app/features/accounting/journal-entries/journal-entries-list.component.ts`
- `src/app/features/accounting/invoicing/*.component.ts`
- `src/app/features/accounting/banking/*.component.ts`
- `src/app/features/accounting/vat/*.component.ts`

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| accounting-dashboard:29 | `Accounting` | `accounting.title` |
| accounting-dashboard:50-53 | Financial metrics | `accounting.metrics.*` |
| chart-of-accounts:51 | `Chart of Accounts` | `accounting.chartOfAccounts.title` |
| chart-of-accounts:125-132 | Table headers | `accounting.chartOfAccounts.table.*` |
| account-dialog:30-108 | Form labels/errors | `accounting.accountForm.*` |
| journal-entries:63 | Search placeholder | `accounting.journals.search.placeholder` |

---

### [HIGH-005] Payroll Module - 35+ Hardcoded Strings
**Files:**
- `src/app/features/payroll/payroll-dashboard/payroll-dashboard.component.ts`
- `src/app/features/payroll/payroll-run-list/payroll-run-list.component.ts`
- `src/app/features/payroll/payroll-run-detail/payroll-run-detail.component.ts`

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| payroll-dashboard:32 | `Payroll` | `payroll.title` |
| payroll-dashboard:43 | `Create Payroll Run` | `payroll.actions.createRun` |
| payroll-dashboard:73 | `No Current Run` | `payroll.noCurrentRun` |
| payroll-dashboard:89-134 | Statistics labels | `payroll.stats.*` |
| payroll-dashboard:142 | `Recent Payroll Runs` | `payroll.recentRuns` |

---

### [HIGH-006] Recruitment Module - 45+ Hardcoded Strings
**Files:**
- `src/app/features/recruitment/candidates-list/candidates-list.component.ts`
- `src/app/features/recruitment/job-postings-list/job-postings-list.component.ts`
- `src/app/features/recruitment/interviews-list/interviews-list.component.ts`
- All recruitment dialogs

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| candidates-list:35 | `Candidates` | `recruitment.candidates.title` |
| candidates-list:41 | `Add Candidate` | `recruitment.candidates.actions.add` |
| candidates-list:79-88 | Empty state messages | `recruitment.candidates.empty.*` |
| candidates-list:98-104 | Table headers | `recruitment.candidates.table.*` |
| candidates-list:137-144 | Action menu items | `recruitment.candidates.actions.*` |

---

### [HIGH-007] Settings Module - 25+ Hardcoded Strings
**Files:**
- `src/app/features/settings/company-profile/company-profile.component.ts`
- `src/app/features/settings/account-security/account-security.component.ts`
- `src/app/features/settings/leave-policies/leave-policies.component.ts`
- `src/app/features/settings/user-management/user-management.component.ts`
- `src/app/features/settings/notification-channels/notification-channels.component.ts`

**Sample Findings:**

| Location | String | Required Key |
|----------|--------|--------------|
| company-profile:134 | `Email Address` | `settings.company.emailAddress` |
| company-profile:159-164 | Address fields | `settings.company.address.*` |
| account-security:99 | MFA description | `settings.security.mfa.description` |
| leave-policies:38 | `Add Leave Type` | `settings.leave.actions.addType` |

---

### [HIGH-008] Support Module - 20+ Hardcoded Strings
**Files:**
- `src/app/features/support/support-list/support-list.component.ts`
- `src/app/features/support/ticket-detail/ticket-detail.component.ts`
- `src/app/features/support/support-admin/support-admin.component.ts`

---

## Medium Severity Findings

### [MED-001] Finance Dashboard
**File:** `src/app/features/finance/finance-dashboard/finance-dashboard.component.ts`
- 15+ hardcoded strings for dashboard cards and navigation

### [MED-002] Documents Module
**Files:** `src/app/features/documents/*.component.ts`
- Page titles, empty states, action buttons

### [MED-003] Reports Module
**Files:** `src/app/features/reports/*.component.ts`
- Report titles, filter labels, export buttons

### [MED-004] Profile Page
**File:** `src/app/features/profile/profile.component.ts`
- Section headings, form labels

### [MED-005] Payslips Module
**Files:** `src/app/features/payslips/*.component.ts`
- List headers, detail labels

### [MED-006] HR Module
**Files:** `src/app/features/hr/*.component.ts`
- Dashboard cards, navigation labels

### [MED-007 - MED-012] Various Shared Components
- Dialogs, dropdowns, form components with hardcoded labels
- Toast messages
- Confirmation dialogs
- Error boundaries

---

## Low Severity Findings

### [LOW-001] Placeholder Text
- Email placeholder `you@company.com` (acceptable for universal format)
- Phone number format examples

### [LOW-002] Preview/Sample Data
- "John Doe" in settings preview
- Sample data in components

### [LOW-003] Technical Labels
- Form validation patterns
- Date format strings

### [LOW-004] Development Placeholders
- "Coming Soon" messages
- "Under Development" text

### [LOW-005] Console Messages
- Debug logs (not user-facing)

---

## Translation Keys Required

### Estimated New Keys Needed by Feature:

| Feature | New Keys | Priority |
|---------|----------|----------|
| Dashboard | 35 | P1 - Critical Path |
| Employees | 55 | P1 - Core HR |
| Leave | 45 | P1 - Self-Service |
| Payroll | 40 | P2 - Financial |
| Accounting | 90 | P2 - Financial |
| Recruitment | 50 | P2 - ATS |
| Settings | 30 | P3 - Configuration |
| Support | 25 | P3 - Support |
| Documents | 20 | P3 - Documents |
| Reports | 30 | P3 - Analytics |
| Common/Shared | 40 | P1 - Reusable |
| **TOTAL** | **~460** | |

---

## Recommended Implementation Plan

### Phase 1: Critical Path (Week 1)
1. Add ~120 keys to translation files for:
   - Dashboard component
   - Common/shared components
   - Employee list/form basics
   - Leave self-service basics

### Phase 2: Core Features (Week 2)
1. Add ~150 keys for:
   - Complete employees module
   - Complete leave module
   - Payroll dashboard
   - Basic payslips

### Phase 3: Financial Features (Week 3)
1. Add ~130 keys for:
   - Complete accounting module
   - Complete payroll module
   - Financial reports

### Phase 4: Remaining Features (Week 4)
1. Add ~60 keys for:
   - Recruitment module
   - Settings pages
   - Support module
   - Documents module

---

## Implementation Pattern

For each component, follow this pattern:

### 1. Add TranslateModule Import
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, TranslateModule, ...],
})
```

### 2. Replace Hardcoded Strings in Template
```html
<!-- Before -->
<h1>Dashboard</h1>

<!-- After -->
<h1>{{ 'dashboard.title' | translate }}</h1>
```

### 3. For Dynamic Strings in TypeScript
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

// Use instant() for synchronous access
this.translate.instant('dashboard.title')

// Or use get() for Observable
this.translate.get('dashboard.title').subscribe(text => ...)
```

### 4. For Interpolated Values
```html
{{ 'dashboard.employeeCount' | translate : { count: employeeCount } }}
```

---

## Validation Checklist

After implementing translations:

- [ ] All page titles translated
- [ ] All button labels translated
- [ ] All form labels translated
- [ ] All table headers translated
- [ ] All dropdown options translated
- [ ] All empty state messages translated
- [ ] All error messages translated
- [ ] All toast/notification messages translated
- [ ] All dialog titles and content translated
- [ ] All tooltips translated
- [ ] Test switching between en/af/zu - no English visible in af/zu modes

---

## Conclusion

The i18n infrastructure is solid, but implementation coverage is critically low. Users switching to Afrikaans or isiZulu currently experience a broken, mixed-language interface. A systematic rollout across all feature modules is required to deliver a proper multilingual experience.

**Estimated Effort:** 4 developer-weeks to achieve full translation coverage.
