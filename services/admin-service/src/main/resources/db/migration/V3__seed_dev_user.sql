-- =====================================================
-- Seed Development Test Tenant and Admin User
-- SureWork ERP Platform - Development Only
-- =====================================================

-- Development Test Tenant
INSERT INTO tenants (
    id, code, name, db_schema, status, subscription_tier, max_users, activated_at
) VALUES (
    '00000000-0000-0000-0000-000000000099',
    'TESTCO',
    'Test Company (Development)',
    'testco',
    'ACTIVE',
    'ENTERPRISE',
    100,
    CURRENT_TIMESTAMP
) ON CONFLICT (code) DO NOTHING;

-- Development Admin User (Password: Admin@123!)
-- BCrypt hash with cost factor 12
INSERT INTO users (
    id, tenant_id, username, email, password_hash,
    first_name, last_name, display_name,
    status, email_verified, is_super_admin,
    password_changed_at
) VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000099',
    'admin',
    'admin@testcompany.co.za',
    '$2a$12$rzLQgWoex12fSUCjZqd5V.4lKM2PWEZAx0TNIxXihzao5Pe4DHKZO',
    'System',
    'Administrator',
    'System Admin',
    'ACTIVE',
    true,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Assign SUPER_ADMIN role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001'
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000100')
AND NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000100'
    AND role_id = '00000000-0000-0000-0000-000000000001'
);
