-- =====================================================
-- Seed Default Permissions and System Roles
-- =====================================================

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- System Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('ALL', 'All Permissions', 'Full access to all system features', 'SYSTEM', 'system', 'ALL'),
('TENANT_ALL', 'Tenant All', 'Full access within tenant', 'TENANT', 'tenant', 'ALL'),
('SYSTEM_ADMIN', 'System Administration', 'Manage system settings', 'SYSTEM', 'system', 'MANAGE'),
('TENANT_MANAGE', 'Tenant Management', 'Manage tenant settings', 'TENANT', 'tenant', 'MANAGE');

-- User Management Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('USER_CREATE', 'Create Users', 'Create new users', 'USER', 'user', 'CREATE'),
('USER_READ', 'View Users', 'View user information', 'USER', 'user', 'READ'),
('USER_UPDATE', 'Update Users', 'Modify user information', 'USER', 'user', 'UPDATE'),
('USER_DELETE', 'Delete Users', 'Remove users', 'USER', 'user', 'DELETE'),
('USER_MANAGE', 'Manage Users', 'Full user management', 'USER', 'user', 'MANAGE'),
('ROLE_MANAGE', 'Manage Roles', 'Manage roles and permissions', 'USER', 'role', 'MANAGE'),
('AUDIT_VIEW', 'View Audit Logs', 'Access audit trail', 'SYSTEM', 'audit', 'READ');

-- Employee Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('EMPLOYEE_CREATE', 'Create Employee', 'Add new employees', 'EMPLOYEE', 'employee', 'CREATE'),
('EMPLOYEE_READ', 'View Employees', 'View employee information', 'EMPLOYEE', 'employee', 'READ'),
('EMPLOYEE_UPDATE', 'Update Employee', 'Modify employee information', 'EMPLOYEE', 'employee', 'UPDATE'),
('EMPLOYEE_DELETE', 'Delete Employee', 'Remove employees', 'EMPLOYEE', 'employee', 'DELETE'),
('EMPLOYEE_MANAGE', 'Manage Employees', 'Full employee management', 'EMPLOYEE', 'employee', 'MANAGE');

-- Leave Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('LEAVE_REQUEST', 'Request Leave', 'Submit leave requests', 'LEAVE', 'leave', 'CREATE'),
('LEAVE_READ', 'View Leave', 'View leave information', 'LEAVE', 'leave', 'READ'),
('LEAVE_APPROVE', 'Approve Leave', 'Approve/reject leave requests', 'LEAVE', 'leave', 'APPROVE'),
('LEAVE_MANAGE', 'Manage Leave', 'Full leave management', 'LEAVE', 'leave', 'MANAGE');

-- Payroll Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('PAYROLL_READ', 'View Payroll', 'View payroll information', 'PAYROLL', 'payroll', 'READ'),
('PAYROLL_WRITE', 'Edit Payroll', 'Modify payroll data', 'PAYROLL', 'payroll', 'UPDATE'),
('PAYROLL_PROCESS', 'Process Payroll', 'Run payroll processing', 'PAYROLL', 'payroll', 'PROCESS'),
('PAYROLL_APPROVE', 'Approve Payroll', 'Approve payroll runs', 'PAYROLL', 'payroll', 'APPROVE'),
('PAYROLL_MANAGE', 'Manage Payroll', 'Full payroll management', 'PAYROLL', 'payroll', 'MANAGE');

-- Time & Attendance Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('TIME_ENTRY', 'Time Entry', 'Record time entries', 'TIME', 'time', 'CREATE'),
('TIME_READ', 'View Time', 'View time records', 'TIME', 'time', 'READ'),
('TIME_APPROVE', 'Approve Time', 'Approve timesheets', 'TIME', 'time', 'APPROVE'),
('TIME_MANAGE', 'Manage Time', 'Full time management', 'TIME', 'time', 'MANAGE');

-- Recruitment Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('RECRUITMENT_READ', 'View Recruitment', 'View recruitment data', 'RECRUITMENT', 'recruitment', 'READ'),
('RECRUITMENT_WRITE', 'Edit Recruitment', 'Manage job postings and candidates', 'RECRUITMENT', 'recruitment', 'UPDATE'),
('RECRUITMENT_MANAGE', 'Manage Recruitment', 'Full recruitment management', 'RECRUITMENT', 'recruitment', 'MANAGE');

-- Document Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('DOCUMENT_READ', 'View Documents', 'Access documents', 'DOCUMENT', 'document', 'READ'),
('DOCUMENT_UPLOAD', 'Upload Documents', 'Upload new documents', 'DOCUMENT', 'document', 'CREATE'),
('DOCUMENT_MANAGE', 'Manage Documents', 'Full document management', 'DOCUMENT', 'document', 'MANAGE');

-- Report Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('REPORT_VIEW', 'View Reports', 'Access standard reports', 'REPORT', 'report', 'READ'),
('REPORT_EXPORT', 'Export Reports', 'Export report data', 'REPORT', 'report', 'EXPORT'),
('REPORT_MANAGE', 'Manage Reports', 'Create and manage reports', 'REPORT', 'report', 'MANAGE');

-- Finance/Accounting Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('FINANCE_READ', 'View Finance', 'View financial data', 'FINANCE', 'finance', 'READ'),
('FINANCE_WRITE', 'Edit Finance', 'Modify financial data', 'FINANCE', 'finance', 'UPDATE'),
('ACCOUNTING_READ', 'View Accounting', 'View accounting entries', 'ACCOUNTING', 'accounting', 'READ'),
('ACCOUNTING_WRITE', 'Edit Accounting', 'Create accounting entries', 'ACCOUNTING', 'accounting', 'UPDATE'),
('ACCOUNTING_APPROVE', 'Approve Accounting', 'Approve journal entries', 'ACCOUNTING', 'accounting', 'APPROVE');

-- Self-Service Permissions
INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('SELF_READ', 'View Own Profile', 'View own employee information', 'EMPLOYEE', 'self', 'READ'),
('SELF_UPDATE', 'Update Own Profile', 'Update own employee information', 'EMPLOYEE', 'self', 'UPDATE');

-- =====================================================
-- SYSTEM ROLES (No tenant_id - available to all)
-- =====================================================

INSERT INTO roles (id, tenant_id, code, name, description, is_system_role, is_default) VALUES
('00000000-0000-0000-0000-000000000001', NULL, 'SUPER_ADMIN', 'Super Administrator', 'Full system access', TRUE, FALSE),
('00000000-0000-0000-0000-000000000002', NULL, 'TENANT_ADMIN', 'Tenant Administrator', 'Full access within tenant', TRUE, FALSE),
('00000000-0000-0000-0000-000000000003', NULL, 'HR_MANAGER', 'HR Manager', 'Manage HR operations', TRUE, FALSE),
('00000000-0000-0000-0000-000000000004', NULL, 'PAYROLL_ADMIN', 'Payroll Administrator', 'Manage payroll operations', TRUE, FALSE),
('00000000-0000-0000-0000-000000000005', NULL, 'FINANCE_MANAGER', 'Finance Manager', 'Manage financial operations', TRUE, FALSE),
('00000000-0000-0000-0000-000000000006', NULL, 'DEPARTMENT_MANAGER', 'Department Manager', 'Manage department employees', TRUE, FALSE),
('00000000-0000-0000-0000-000000000007', NULL, 'RECRUITER', 'Recruiter', 'Manage recruitment', TRUE, FALSE),
('00000000-0000-0000-0000-000000000008', NULL, 'EMPLOYEE', 'Employee', 'Standard employee access', TRUE, TRUE);

-- =====================================================
-- ROLE PERMISSIONS MAPPING
-- =====================================================

-- Super Admin - All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions WHERE code = 'ALL';

-- Tenant Admin - All tenant permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions WHERE code = 'TENANT_ALL';

-- HR Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE code IN ('EMPLOYEE_MANAGE', 'LEAVE_MANAGE', 'DOCUMENT_MANAGE', 'TIME_READ', 'TIME_APPROVE',
               'RECRUITMENT_MANAGE', 'REPORT_VIEW', 'USER_READ');

-- Payroll Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE code IN ('PAYROLL_MANAGE', 'EMPLOYEE_READ', 'LEAVE_READ', 'TIME_READ', 'REPORT_VIEW', 'REPORT_EXPORT');

-- Finance Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
WHERE code IN ('FINANCE_READ', 'FINANCE_WRITE', 'ACCOUNTING_READ', 'ACCOUNTING_WRITE', 'ACCOUNTING_APPROVE',
               'PAYROLL_READ', 'REPORT_VIEW', 'REPORT_EXPORT');

-- Department Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM permissions
WHERE code IN ('EMPLOYEE_READ', 'LEAVE_APPROVE', 'TIME_APPROVE', 'REPORT_VIEW');

-- Recruiter
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM permissions
WHERE code IN ('RECRUITMENT_MANAGE', 'EMPLOYEE_READ', 'DOCUMENT_READ', 'DOCUMENT_UPLOAD');

-- Employee (Default)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000008', id FROM permissions
WHERE code IN ('SELF_READ', 'SELF_UPDATE', 'LEAVE_REQUEST', 'TIME_ENTRY', 'DOCUMENT_READ');

-- =====================================================
-- DEFAULT SYSTEM CONFIGURATION
-- =====================================================

INSERT INTO system_config (tenant_id, config_key, config_value, value_type, description) VALUES
(NULL, 'system.name', 'SureWork ERP', 'STRING', 'System display name'),
(NULL, 'system.version', '1.0.0', 'STRING', 'System version'),
(NULL, 'auth.password.min_length', '8', 'NUMBER', 'Minimum password length'),
(NULL, 'auth.password.require_uppercase', 'true', 'BOOLEAN', 'Require uppercase in password'),
(NULL, 'auth.password.require_lowercase', 'true', 'BOOLEAN', 'Require lowercase in password'),
(NULL, 'auth.password.require_digit', 'true', 'BOOLEAN', 'Require digit in password'),
(NULL, 'auth.password.require_special', 'true', 'BOOLEAN', 'Require special char in password'),
(NULL, 'auth.password.expiry_days', '90', 'NUMBER', 'Password expiry in days (0=never)'),
(NULL, 'auth.password.history_count', '5', 'NUMBER', 'Number of previous passwords to check'),
(NULL, 'auth.lockout.max_attempts', '5', 'NUMBER', 'Failed attempts before lockout'),
(NULL, 'auth.lockout.duration_minutes', '30', 'NUMBER', 'Lockout duration in minutes'),
(NULL, 'auth.session.idle_timeout_minutes', '30', 'NUMBER', 'Session idle timeout'),
(NULL, 'auth.session.max_concurrent', '3', 'NUMBER', 'Max concurrent sessions per user'),
(NULL, 'audit.retention_days', '365', 'NUMBER', 'Audit log retention in days'),
(NULL, 'locale.default_timezone', 'Africa/Johannesburg', 'STRING', 'Default timezone'),
(NULL, 'locale.default_currency', 'ZAR', 'STRING', 'Default currency'),
(NULL, 'locale.default_language', 'en-ZA', 'STRING', 'Default language'),
(NULL, 'compliance.popi_enabled', 'true', 'BOOLEAN', 'POPI Act compliance enabled');
