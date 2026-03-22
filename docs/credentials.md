# SureWork Test User Credentials

This document contains the test user credentials for development and testing purposes.

> **Warning:** These credentials are for development/testing only. Never use these in production environments.

---

## Test Tenant Information

- **Tenant Name:** Test Company (Development)
- **Tenant Code:** TESTCO
- **Subscription Tier:** ENTERPRISE
- **Max Users:** 100

---

## Available Test Users

**All passwords:** `Admin@123!`

| Role | Email | Employee Name | Username |
|------|-------|---------------|----------|
| **Super Admin** | `admin@testcompany.co.za` | System Administrator | admin |
| **HR Manager** | `thabo.mokoena@testcompany.co.za` | Thabo Mokoena | hr.manager |
| **Payroll Admin** | `nomvula.mbeki@testcompany.co.za` | Nomvula Mbeki (CFO) | payroll.admin |
| **Finance Manager** | `lerato.ndlovu@testcompany.co.za` | Lerato Ndlovu | finance.manager |
| **Department Manager** | `johan.meyer@testcompany.co.za` | Johan Meyer (Sales) | dept.manager |
| **Recruiter** | `lindiwe.sithole@testcompany.co.za` | Lindiwe Sithole | recruiter |
| **Support Admin** | `support.admin@testcompany.co.za` | Sipho Dlamini | support.admin |
| **Support Agent** | `support.agent@testcompany.co.za` | Zanele Khumalo | support.agent |
| **Employee** | `ayanda.nkosi@testcompany.co.za` | Ayanda Nkosi (Developer) | employee |

---

## Role Permissions Matrix

### Permission Codes by Role

| Permission | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Support Admin | Support Agent | Employee |
|------------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:-------------:|:-------------:|:--------:|
| **ALL** | X | | | | | | | | |
| **TENANT_ALL** | | | | | | | | | |
| **SYSTEM_ADMIN** | X | | | | | | | | |
| **EMPLOYEE_CREATE** | X | X | | | | | | | |
| **EMPLOYEE_READ** | X | X | X | | X | X | | | |
| **EMPLOYEE_UPDATE** | X | X | | | | | | | |
| **EMPLOYEE_DELETE** | X | X | | | | | | | |
| **EMPLOYEE_MANAGE** | X | X | | | | | | | |
| **LEAVE_REQUEST** | X | X | X | X | X | X | | | X |
| **LEAVE_READ** | X | X | X | | | | | | |
| **LEAVE_APPROVE** | X | X | | | X | | | | |
| **LEAVE_MANAGE** | X | X | | | | | | | |
| **PAYROLL_READ** | X | | X | X | | | | | |
| **PAYROLL_WRITE** | X | | X | | | | | | |
| **PAYROLL_PROCESS** | X | | X | | | | | | |
| **PAYROLL_APPROVE** | X | | X | | | | | | |
| **PAYROLL_MANAGE** | X | | X | | | | | | |
| **FINANCE_READ** | X | | | X | | | | | |
| **FINANCE_WRITE** | X | | | X | | | | | |
| **ACCOUNTING_READ** | X | | | X | | | | | |
| **ACCOUNTING_WRITE** | X | | | X | | | | | |
| **ACCOUNTING_APPROVE** | X | | | X | | | | | |
| **RECRUITMENT_READ** | X | X | | | | X | | | |
| **RECRUITMENT_WRITE** | X | X | | | | X | | | |
| **RECRUITMENT_MANAGE** | X | X | | | | X | | | |
| **DOCUMENT_READ** | X | X | | | | X | | | X |
| **DOCUMENT_UPLOAD** | X | X | | | | X | | | |
| **DOCUMENT_MANAGE** | X | X | | | | | | | |
| **TIME_ENTRY** | X | X | X | X | X | X | | | X |
| **TIME_READ** | X | X | X | | | | | | |
| **TIME_APPROVE** | X | X | | | X | | | | |
| **TIME_MANAGE** | X | | | | | | | | |
| **REPORT_VIEW** | X | X | X | X | X | | X | | |
| **REPORT_EXPORT** | X | | X | X | | | | | |
| **USER_READ** | X | X | | | | | | | |
| **SELF_READ** | X | X | X | X | X | X | | | X |
| **SELF_UPDATE** | X | X | X | X | X | X | | | X |
| **SUPPORT_READ** | X | | | | | | X | X | |
| **SUPPORT_CREATE** | X | | | | | | X | | |
| **SUPPORT_UPDATE** | X | | | | | | X | X | |
| **SUPPORT_ASSIGN** | X | | | | | | X | | |
| **SUPPORT_RESOLVE** | X | | | | | | X | X | |
| **SUPPORT_MANAGE** | X | | | | | | X | | |

---

## UI Visibility by Role

### Sidebar Menu Visibility

The sidebar is organized into groups with permission-based visibility:

#### Overview Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Dashboard | X | X | X | X | X | X | X |

#### Self-Service Group
These items are for employee self-service and visible to authenticated users with basic permissions.

| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| My Leave | X | X | | | X | | X |
| My Payslips | X | X | X | X | X | X | X |

> **Note:** "My Leave" requires `LEAVE_REQUEST` permission. "My Payslips" is available to all authenticated users.

#### HR Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Employees | X | X | X | | X | X | |
| Leave Admin | X | X | | | X | | |

> **Note:** "Leave Admin" requires `LEAVE_APPROVE` or `LEAVE_MANAGE` permission for approval workflows.

#### Finance Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Payroll | X | | X | X | | | |
| Accounting | X | | | X | | | |

#### Recruitment Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Jobs | X | X | | | | X | |
| Candidates | X | X | | | | X | |
| Interviews | X | X | | | | X | |

#### Support Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Support Admin | Support Agent | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:-------------:|:-------------:|:--------:|
| Tickets | X | | | | | | X | X | |
| Support Admin | X | | | | | | X | | |

> **Note:** Support Admin menu requires `SUPPORT_MANAGE` permission. Support Agents can view and manage their assigned tickets only.

#### System Group
| Menu Item | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|-----------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Settings | X | | | | | | |

### Dashboard Features Visibility

| Feature | Super Admin | HR Manager | Payroll Admin | Finance Manager | Dept Manager | Recruiter | Employee |
|---------|:-----------:|:----------:|:-------------:|:---------------:|:------------:|:---------:|:--------:|
| Add Employee Button | X | X | | | | | |
| Post Job Button | X | X | | | | X | |
| Employees Quick Link | X | X | X | | X | X | |
| Leave Quick Link | X | X | X | | X | X | X |
| Recruitment Quick Link | X | X | | | | X | |
| Payroll Quick Link | X | | X | X | | | |
| Employees Stats Card | X | X | X | | X | X | |
| Leave Requests Card | X | X | | | X | | |
| Payroll Card | X | | X | X | | | |
| Open Positions Card | X | X | | | | X | |
| Upcoming Interviews Widget | X | X | | | | X | |
| Recent Candidates Widget | X | X | | | | X | |
| Pending Leave Widget | X | X | | | X | | |
| Recruitment Pipeline Widget | X | X | | | | X | |

---

## Role Descriptions

### Super Admin (SUPER_ADMIN)
- Full system access across all modules
- Can manage system settings and all tenant data
- Has `ALL` permission which bypasses all permission checks

### HR Manager (HR_MANAGER)
- Manages all HR operations including employees, leave, and recruitment
- Can approve leave requests and timesheets
- Full document management capabilities
- Can view user information

### Payroll Admin (PAYROLL_ADMIN)
- Full payroll management including processing and approval
- Can view employee and leave data for payroll purposes
- Can view and export reports

### Finance Manager (FINANCE_MANAGER)
- Manages financial data and accounting entries
- Can approve journal entries
- Can view payroll data (read-only)
- Can view and export reports

### Department Manager (DEPARTMENT_MANAGER)
- Can view employees in their department
- Can approve leave requests for team members
- Can approve timesheets for team members
- Can view reports

### Recruiter (RECRUITER)
- Full recruitment management (jobs, candidates, interviews)
- Can view employee data for hiring purposes
- Can upload and view documents

### Support Admin (SUPPORT_ADMIN)
- Full support ticket management
- Can view, create, update, assign, and resolve tickets
- Can manage support operations and view reports
- Access to admin-level support endpoints

### Support Agent (SUPPORT_AGENT)
- Handle assigned support tickets
- Can view and update ticket details
- Can resolve and close tickets
- Limited to ticket handling (no assignment or management)

### Employee (EMPLOYEE)
- Self-service capabilities only
- Can view and update own profile
- Can submit leave requests via **My Leave** page
- Can view own leave balances and request history
- Can view and download own payslips via **My Payslips** page
- Can record time entries
- Can view (not upload) documents

---

## Technical Notes

1. **Password:** All users share the same password `Admin@123!` (BCrypt hashed)
2. **Database Migration:** Users created by `V5__seed_role_test_users.sql` in admin-service
3. **Roles Migration:** Roles and permissions defined in `V2__seed_permissions_roles.sql`
4. **Support Roles Migration:** Support roles and permissions added by `V6__add_support_roles.sql`
5. **Permission Logic:** UI uses "ANY" matching - user needs at least ONE of the required permissions
6. **Super Admin Bypass:** Users with `ALL`, `*`, or `TENANT_ALL` permissions bypass all permission checks
7. **Self-Service Endpoints:** Employee self-service uses dedicated endpoints that identify the user from the JWT token:
   - Leave: `/api/v1/leave/balances`, `/api/v1/leave/my-requests`, `/api/v1/leave/requests`
   - Payslips: `/api/v1/payroll/my-payslips`, `/api/v1/payroll/my-payslips/{id}/download`

---

## API Endpoints for Self-Service

### Leave Self-Service (hr-service)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/leave/balances` | GET | Get authenticated user's leave balances |
| `/api/v1/leave/my-requests` | GET | Get authenticated user's leave requests |
| `/api/v1/leave/requests` | POST | Create a leave request for authenticated user |
| `/api/v1/leave/sick-cycle` | GET | Get authenticated user's sick leave cycle info |

### Payslips Self-Service (payroll-service)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payroll/my-payslips` | GET | Get authenticated user's payslips |
| `/api/v1/payroll/my-payslips/{id}` | GET | Get specific payslip details |
| `/api/v1/payroll/my-payslips/{id}/download` | GET | Download payslip as PDF |

### Support (support-service)
| Endpoint | Method | Description | Required Permission |
|----------|--------|-------------|---------------------|
| `/api/support/tickets` | GET | List user's tickets | Authenticated |
| `/api/support/tickets` | POST | Create a new ticket | `SUPPORT_CREATE` |
| `/api/support/tickets/{id}` | GET | Get ticket details | `SUPPORT_READ` |
| `/api/support/tickets/{id}` | PUT | Update a ticket | `SUPPORT_UPDATE` |
| `/api/support/tickets/{id}/resolve` | POST | Resolve a ticket | `SUPPORT_RESOLVE` |
| `/api/support/admin/tickets` | GET | List all tickets (admin) | `SUPPORT_MANAGE` |
| `/api/support/admin/tickets/{id}/assign` | POST | Assign ticket to agent | `SUPPORT_ASSIGN` |
