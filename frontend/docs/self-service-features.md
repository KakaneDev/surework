# Employee Self-Service Features

**Date:** 2026-01-24
**Status:** Implemented
**Version:** 1.0

---

## Overview

The Employee Self-Service module provides authenticated employees with access to their personal HR data without requiring elevated permissions. This allows regular employees to:

1. **View and manage their leave** - Check balances, submit requests, view history
2. **Access their payslips** - View pay details, download PDF payslips

---

## Features

### 1. My Leave (`/leave`)

The Leave page provides employees with self-service access to their leave management.

#### Capabilities
- **View Leave Balances**: See available days for each leave type (Annual, Sick, Family Responsibility, etc.)
- **Submit Leave Requests**: Create new leave requests with date selection and reason
- **View Request History**: See all past and pending leave requests
- **Cancel Pending Requests**: Cancel requests that haven't been approved yet

#### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/leave/balances` | GET | Fetch user's leave balances by year |
| `/api/v1/leave/my-requests` | GET | Fetch user's leave request history |
| `/api/v1/leave/requests` | POST | Submit a new leave request |
| `/api/v1/leave/requests/{id}/cancel` | POST | Cancel a pending request |

#### Permission Requirements
- Route access: `LEAVE_REQUEST` permission
- All employees should have this permission by default

#### Key Components
- `LeaveService.getMyBalances()` - Self-service balance fetch
- `LeaveService.getMyRequests()` - Self-service request history
- `LeaveService.createMyLeaveRequest()` - Self-service request creation
- `LeaveDashboardComponent` - Main leave management UI

---

### 2. My Payslips (`/my-payslips`)

A dedicated page for employees to view and download their payslips.

#### Capabilities
- **View Payslip List**: See all payslips with period, gross, deductions, net pay
- **View Payslip Details**: Click to see full breakdown of earnings and deductions
- **Download PDF**: Download individual payslips as PDF documents

#### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/payroll/my-payslips` | GET | Fetch paginated list of user's payslips |
| `/api/v1/payroll/my-payslips/{id}` | GET | Fetch detailed payslip information |
| `/api/v1/payroll/my-payslips/{id}/download` | GET | Download payslip as PDF blob |

#### Permission Requirements
- Route access: None (any authenticated user)
- Backend verifies JWT token to ensure user only sees their own payslips

#### Key Components
- `PayrollService.getMyPayslips()` - Fetch payslip list
- `PayrollService.getMyPayslip()` - Fetch payslip details
- `PayrollService.downloadMyPayslip()` - Download PDF
- `MyPayslipsComponent` - Payslips list and detail UI

---

## Navigation

### Sidebar Structure

The sidebar now includes a **Self-Service** group visible to employees:

```
Overview
  - Dashboard

Self-Service
  - My Leave (requires LEAVE_REQUEST)
  - My Payslips (any authenticated user)
  - My Documents (any authenticated user) ← NEW
  - Support Tickets (any authenticated user) ← NEW

HR (expandable, visible to HR roles)
  ├ Overview
  ├ Employees
  ├ Leave Management
  └ Documents

Finance (expandable, visible to Finance/Payroll roles)
  ├ Overview
  ├ Payroll
  ├ Payroll Runs
  ├ Accounting
  └ Reports
...
```

**Note:** The navigation now uses expandable sub-menus. See `navigation-menu-system.md` for full details.

### Route Configuration

```typescript
// app.routes.ts
{
  path: 'leave',
  canActivate: [permissionGuard(['LEAVE_REQUEST', 'LEAVE_APPROVE', 'LEAVE_MANAGE'])],
  loadChildren: () => import('./features/leave/leave.routes')
},
{
  path: 'my-payslips',
  // Any authenticated user - no permission guard
  loadComponent: () => import('./features/payslips/my-payslips.component')
}
```

---

## Technical Implementation

### Self-Service vs Admin Endpoints

The key architectural change is using **self-service endpoints** that identify the user from the JWT token, rather than admin endpoints that require explicit employee IDs.

| Feature | Admin Endpoint | Self-Service Endpoint |
|---------|---------------|----------------------|
| Leave Balances | `/employees/{id}/balances` | `/balances` |
| Leave Requests | `/employees/{id}/requests` | `/my-requests` |
| Payslips | `/employees/{id}/payslips` | `/my-payslips` |

### Authentication Flow

1. User logs in and receives JWT token with user claims
2. Frontend calls self-service endpoints with JWT in Authorization header
3. Backend extracts user identity from JWT token
4. Backend looks up associated employee record
5. Backend returns only that employee's data

### Error Handling

- **No Employee Profile**: If authenticated user has no linked employee record, endpoints return empty data (not error)
- **Expired Token**: 401 redirects to login
- **Backend Down**: UI shows error toast and graceful degradation

---

## Testing

### E2E Tests

Located in `frontend/e2e/self-service.spec.ts`:

1. **Navigation Tests**
   - Employee sees My Leave in sidebar
   - Employee sees My Payslips in sidebar
   - HR Manager sees both self-service and admin items

2. **Leave Self-Service Tests**
   - Employee can access /leave page
   - Employee sees leave balance cards
   - Employee sees Request Leave button (enabled)
   - Employee can open leave request dialog
   - Employee sees leave requests table
   - Employee does NOT see admin sections

3. **Payslips Self-Service Tests**
   - Employee can access /my-payslips page
   - Payslips page shows correct structure
   - Employee can navigate via sidebar
   - Employee cannot access admin /payroll

4. **Route Protection Tests**
   - Unauthenticated users redirected to login
   - Employee can navigate between self-service pages

### Running Tests

```bash
# Run all tests
npx playwright test

# Run only self-service tests
npx playwright test self-service

# Run with UI
npx playwright test --ui
```

---

## File Structure

```
frontend/src/app/
├── core/
│   └── services/
│       ├── leave.service.ts      # Added: getMyBalances, getMyRequests, createMyLeaveRequest
│       └── payroll.service.ts    # Added: getMyPayslips, getMyPayslip, downloadMyPayslip
├── features/
│   ├── leave/
│   │   ├── leave-dashboard/
│   │   │   └── leave-dashboard.component.ts  # Updated: uses self-service endpoints
│   │   └── leave-request-dialog/
│   │       └── leave-request-dialog.component.ts  # Updated: uses createMyLeaveRequest
│   └── payslips/
│       └── my-payslips.component.ts  # NEW: self-service payslips page
└── app.routes.ts  # Updated: added /my-payslips route

frontend/e2e/
└── self-service.spec.ts  # NEW: E2E tests for self-service features
```

---

---

### 3. My Documents (`/my-documents`) - NEW

A dedicated page for employees to manage their personal documents.

#### Capabilities
- **View Document List**: See all personal documents
- **Upload Documents**: Upload new personal documents
- **Search Documents**: Search through uploaded files

#### Permission Requirements
- Route access: None (any authenticated user)

#### Key Components
- `MyDocumentsComponent` - Personal documents UI

---

### 4. Support Tickets (`/support`) - NEW

A self-service helpdesk system for submitting support requests.

#### Capabilities
- **View My Tickets**: See all submitted support tickets
- **Create Tickets**: Submit new support requests with categories
- **Track Status**: Monitor ticket progress through workflow
- **Add Comments**: Communicate with support team

#### Ticket Categories
- HR Requests
- Payroll & Benefits
- Leave & Attendance
- IT Support
- Facilities
- Finance
- Other

#### Permission Requirements
- Route access: None (any authenticated user)

#### Key Components
- `SupportDashboardComponent` - My tickets list
- `TicketCreateComponent` - New ticket form
- `TicketDetailComponent` - Ticket detail view
- `SupportService` - API service

**See:** `support-tickets-helpdesk.md` for full documentation.

---

## Future Enhancements

1. **Leave Calendar View**: Add calendar visualization of leave days
2. **Payslip Comparison**: Compare payslips between periods
3. **Leave Balance Alerts**: Notify when balance is low
4. **Bulk Payslip Download**: Download all payslips for a year
5. **Mobile Optimization**: Improve mobile experience for self-service pages
6. **Document Categories**: Organize personal documents by type
7. **Support Ticket Attachments**: Upload files with support tickets
8. **Ticket Notifications**: Email/push notifications for ticket updates
