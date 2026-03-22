# Navigation & Menu System

**Date:** 2026-01-24
**Status:** Implemented
**Version:** 2.0

---

## Overview

The navigation system provides a hierarchical, expandable sidebar menu that organizes features into logical groups. It supports:

1. **Expandable sub-menus** for modules with multiple sections
2. **Permission-based visibility** - menu items shown based on user roles
3. **Auto-expansion** - parent sections auto-expand when navigating to child routes
4. **Responsive design** - collapsible sidebar on mobile/tablet

---

## Navigation Structure

### Full Menu Hierarchy

```
OVERVIEW
└── Dashboard                    → /dashboard

SELF-SERVICE
├── My Leave                     → /leave
├── My Payslips                  → /my-payslips
├── My Documents                 → /my-documents
└── Support Tickets              → /support

HR (expandable)
├── Overview                     → /hr
├── Employees                    → /employees
├── Leave Management             → /leave/admin
└── Documents                    → /documents/hr

FINANCE (expandable)
├── Overview                     → /finance
├── Payroll                      → /payroll
├── Payroll Runs                 → /payroll/runs
├── Accounting                   → /accounting
└── Reports                      → /finance/reports

RECRUITMENT (expandable)
├── Dashboard                    → /recruitment
├── Jobs                         → /recruitment/jobs
├── Candidates                   → /recruitment/candidates
├── Interviews                   → /recruitment/interviews
└── Reports                      → /recruitment/reports

REPORTS (expandable)
├── Dashboard                    → /reports
├── HR Reports                   → /reports/hr
├── Financial Reports            → /reports/financial
└── Recruitment Reports          → /reports/recruitment

DOCUMENTS (expandable)
├── All Documents                → /documents
├── Templates                    → /documents/templates
└── Policies                     → /documents/policies

SYSTEM
└── Settings                     → /settings
```

---

## Visual Design

### Collapsed State
```
RECRUITMENT              ▸
```

### Expanded State
```
RECRUITMENT              ▾
  ├ Dashboard
  ├ Jobs
  ├ Candidates
  └ Interviews
```

### Active State Indicators
- Parent item highlighted when any child is active
- Active child has distinct background (`sw-nav-item-active` class)
- Chevron rotates 90° when expanded

---

## Interaction Behavior

| Action | Behavior |
|--------|----------|
| Click on parent with children | Toggle expand/collapse (don't navigate) |
| Click on parent without children | Navigate to route |
| Page load with nested active route | Auto-expand parent section |
| Collapse sidebar to icons | Sub-menus hidden, parent icons only |

---

## Permission Mapping

| Menu Section | Required Permissions |
|--------------|---------------------|
| Dashboard | Any authenticated user |
| My Leave | `LEAVE_REQUEST` |
| My Payslips | Any authenticated user |
| My Documents | Any authenticated user |
| Support Tickets | Any authenticated user |
| HR | `EMPLOYEE_READ`, `EMPLOYEE_MANAGE`, `LEAVE_APPROVE`, `LEAVE_MANAGE` |
| Finance | `PAYROLL_READ`, `PAYROLL_MANAGE`, `ACCOUNTING_READ`, `FINANCE_READ` |
| Recruitment | `RECRUITMENT_READ`, `RECRUITMENT_MANAGE` |
| Reports | `REPORTS_READ`, `HR_REPORTS`, `FINANCE_REPORTS`, `EMPLOYEE_READ`, `PAYROLL_READ` |
| Documents | `DOCUMENTS_READ`, `DOCUMENTS_MANAGE`, `EMPLOYEE_READ` |
| Settings | `SYSTEM_ADMIN`, `TENANT_ALL`, `ALL` |

**Note:** Super admin users (`ALL`, `*`, `TENANT_ALL` permissions) see all menu items.

---

## Technical Implementation

### NavItem Interface

```typescript
interface NavItem {
  label: string;
  route?: string;        // Optional if has children
  icon: string;
  permissions?: string[];
  children?: NavItem[];  // Sub-menu items
}

interface NavGroup {
  label: string;
  items: NavItem[];
}
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `toggleExpand(label)` | Toggle expand/collapse state for a menu section |
| `isExpanded(label)` | Check if a section is currently expanded |
| `autoExpandForRoute(url)` | Auto-expand parent sections based on current URL |
| `filteredNavGroups()` | Computed property that filters menu based on user permissions |

### CSS Animations

```css
.nav-children {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

.rotate-90 {
  transform: rotate(90deg);
}
```

---

## Files

| File | Purpose |
|------|---------|
| `core/layout/shell.component.ts` | Main navigation shell with expandable menu logic |
| `app.routes.ts` | Route definitions for all modules |

---

## Responsive Behavior

### Desktop (>= 1024px)
- Sidebar always visible
- Can collapse to icon-only mode via toggle button
- Expanded sections persist

### Tablet (768px - 1024px)
- Sidebar slides in/out via hamburger menu
- Full-width sidebar when open

### Mobile (< 768px)
- Sidebar hidden by default
- Opens via hamburger menu button
- Overlay backdrop when open
- Tapping menu item closes sidebar

---

## Route Structure

### New Routes Added

| Route | Component | Permissions |
|-------|-----------|-------------|
| `/my-documents` | `MyDocumentsComponent` | Any authenticated |
| `/support` | Support module routes | Any authenticated |
| `/support/new` | `TicketCreateComponent` | Any authenticated |
| `/support/:id` | `TicketDetailComponent` | Any authenticated |
| `/hr` | `HrDashboardComponent` | HR permissions |
| `/finance` | `FinanceDashboardComponent` | Finance permissions |
| `/finance/reports` | `FinanceReportsComponent` | Finance permissions |
| `/reports` | `ReportsDashboardComponent` | Reports permissions |
| `/reports/hr` | `HrReportsComponent` | Reports permissions |
| `/reports/financial` | `FinancialReportsComponent` | Reports permissions |
| `/reports/recruitment` | `RecruitmentReportsComponent` | Reports permissions |
| `/documents` | `DocumentsListComponent` | Documents permissions |
| `/documents/templates` | `TemplatesComponent` | Documents permissions |
| `/documents/policies` | `PoliciesComponent` | Documents permissions |
| `/documents/hr` | `HrDocumentsComponent` | Documents permissions |
| `/recruitment/reports` | `RecruitmentReportsComponent` | Recruitment permissions |
| `/leave/admin` | `LeaveListComponent` | Leave management permissions |

---

## Testing Checklist

- [ ] Navigate to app → verify expandable sections show chevron arrow
- [ ] Click HR section → verify it expands showing Overview, Employees, Leave Management, Documents
- [ ] Click HR Overview → verify navigates to `/hr`
- [ ] Click Employees → verify navigates to `/employees`
- [ ] Refresh on `/employees` → verify HR section is auto-expanded and Employees is highlighted
- [ ] Click Finance section → verify it expands with all sub-items
- [ ] Click Recruitment section → verify Dashboard, Jobs, Candidates, Interviews, Reports shown
- [ ] Click collapsed section again → verify it collapses
- [ ] Test all other expandable sections similarly
- [ ] Collapse sidebar (desktop) → verify only icons shown
- [ ] Mobile view → verify hamburger menu works
- [ ] Mobile view → verify tapping menu item closes sidebar
