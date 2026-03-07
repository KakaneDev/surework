-- =====================================================
-- Add Support Roles and Permissions
-- SureWork ERP Platform
-- All test user passwords are: Admin@123!
-- =====================================================

-- =====================================================
-- SUPPORT PERMISSIONS
-- =====================================================

INSERT INTO permissions (code, name, description, category, resource, action) VALUES
('SUPPORT_READ', 'View Support Tickets', 'View support ticket information', 'SUPPORT', 'support', 'READ'),
('SUPPORT_CREATE', 'Create Support Tickets', 'Create new support tickets', 'SUPPORT', 'support', 'CREATE'),
('SUPPORT_UPDATE', 'Update Support Tickets', 'Modify ticket details', 'SUPPORT', 'support', 'UPDATE'),
('SUPPORT_ASSIGN', 'Assign Support Tickets', 'Assign tickets to agents', 'SUPPORT', 'support', 'MANAGE'),
('SUPPORT_RESOLVE', 'Resolve Support Tickets', 'Resolve and close tickets', 'SUPPORT', 'support', 'APPROVE'),
('SUPPORT_MANAGE', 'Manage Support', 'Full support management', 'SUPPORT', 'support', 'MANAGE');

-- =====================================================
-- SUPPORT ROLES
-- =====================================================

INSERT INTO roles (id, tenant_id, code, name, description, is_system_role, is_default) VALUES
('00000000-0000-0000-0000-000000000009', NULL, 'SUPPORT_ADMIN', 'Support Administrator', 'Manage all support operations', TRUE, FALSE),
('00000000-0000-0000-0000-000000000010', NULL, 'SUPPORT_AGENT', 'Support Agent', 'Handle assigned support tickets', TRUE, FALSE);

-- =====================================================
-- ROLE PERMISSIONS MAPPING
-- =====================================================

-- Support Admin - Full support management + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000009', id FROM permissions
WHERE code IN ('SUPPORT_MANAGE', 'SUPPORT_READ', 'SUPPORT_CREATE', 'SUPPORT_UPDATE', 'SUPPORT_ASSIGN', 'SUPPORT_RESOLVE', 'REPORT_VIEW');

-- Support Agent - Basic ticket handling
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', id FROM permissions
WHERE code IN ('SUPPORT_READ', 'SUPPORT_UPDATE', 'SUPPORT_RESOLVE');

-- =====================================================
-- TEST USERS FOR SUPPORT ROLES
-- BCrypt hash for 'Admin@123!' with cost factor 12
-- =====================================================

-- Support Admin User (Sipho Dlamini)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000109',
    '00000000-0000-0000-0000-000000000099',
    'support.admin',
    'support.admin@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Sipho',
    'Dlamini',
    'Sipho Dlamini (Support Admin)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Support Agent User (Zanele Khumalo)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000110',
    '00000000-0000-0000-0000-000000000099',
    'support.agent',
    'support.agent@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Zanele',
    'Khumalo',
    'Zanele Khumalo (Support Agent)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ASSIGN ROLES TO SUPPORT USERS
-- =====================================================

-- Support Admin role to Sipho
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000009'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000109')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000109' AND role_id = '00000000-0000-0000-0000-000000000009');

-- Support Agent role to Zanele
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000010'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000110')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000110' AND role_id = '00000000-0000-0000-0000-000000000010');
