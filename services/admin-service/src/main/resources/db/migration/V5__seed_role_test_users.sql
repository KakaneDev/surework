-- =====================================================
-- Seed Test Users for Different Roles
-- SureWork ERP Platform - Development Only
-- All passwords are: Admin@123!
-- =====================================================

-- BCrypt hash for 'Admin@123!' with cost factor 12
-- $2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO

-- HR Manager User (Thabo Mokoena)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000099',
    'hr.manager',
    'thabo.mokoena@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Thabo',
    'Mokoena',
    'Thabo Mokoena (HR Manager)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000003'
) ON CONFLICT (email) DO NOTHING;

-- Payroll Admin User (Nomvula Mbeki - CFO handles payroll)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000099',
    'payroll.admin',
    'nomvula.mbeki@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Nomvula',
    'Mbeki',
    'Nomvula Mbeki (CFO/Payroll)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000002'
) ON CONFLICT (email) DO NOTHING;

-- Finance Manager User (Lerato Ndlovu)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000099',
    'finance.manager',
    'lerato.ndlovu@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Lerato',
    'Ndlovu',
    'Lerato Ndlovu (Finance Manager)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000004'
) ON CONFLICT (email) DO NOTHING;

-- Department Manager User (Johan Meyer - Sales Manager)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000106',
    '00000000-0000-0000-0000-000000000099',
    'dept.manager',
    'johan.meyer@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Johan',
    'Meyer',
    'Johan Meyer (Sales Manager)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000007'
) ON CONFLICT (email) DO NOTHING;

-- Recruiter User (Lindiwe Sithole - HR Officer handles recruitment)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000107',
    '00000000-0000-0000-0000-000000000099',
    'recruiter',
    'lindiwe.sithole@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Lindiwe',
    'Sithole',
    'Lindiwe Sithole (Recruiter)',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000010'
) ON CONFLICT (email) DO NOTHING;

-- Employee User (Ayanda Nkosi - Developer)
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at, employee_id
) VALUES (
    '00000000-0000-0000-0000-000000000108',
    '00000000-0000-0000-0000-000000000099',
    'employee',
    'ayanda.nkosi@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'Ayanda',
    'Nkosi',
    'Ayanda Nkosi',
    'ACTIVE',
    true,
    false,
    CURRENT_TIMESTAMP,
    'e0000001-0000-0000-0000-000000000008'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ASSIGN ROLES TO USERS
-- =====================================================

-- HR Manager role to Thabo
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000003'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000103')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000103' AND role_id = '00000000-0000-0000-0000-000000000003');

-- Payroll Admin role to Nomvula
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000004'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000104')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000104' AND role_id = '00000000-0000-0000-0000-000000000004');

-- Finance Manager role to Lerato
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000005'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000105')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000105' AND role_id = '00000000-0000-0000-0000-000000000005');

-- Department Manager role to Johan
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000006'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000106')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000106' AND role_id = '00000000-0000-0000-0000-000000000006');

-- Recruiter role to Lindiwe
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000007'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000107')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000107' AND role_id = '00000000-0000-0000-0000-000000000007');

-- Employee role to Ayanda
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000008'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000108')
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000108' AND role_id = '00000000-0000-0000-0000-000000000008');
