-- Fix TENANT_ADMIN roles that were auto-created with empty permissions.
-- The tenant admin should have TENANT_ALL permission to access all features.
UPDATE roles
SET permissions = '["TENANT_ALL"]'::jsonb,
    is_system_role = true,
    updated_at = NOW()
WHERE code = 'TENANT_ADMIN'
  AND (permissions = '[]'::jsonb OR permissions IS NULL);
