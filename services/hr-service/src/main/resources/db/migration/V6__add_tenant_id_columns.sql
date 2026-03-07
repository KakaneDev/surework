-- Add tenant_id columns for defense-in-depth multitenancy
-- This provides a secondary safeguard alongside schema-per-tenant isolation
-- If schema routing fails, explicit tenant_id checks prevent cross-tenant data access

-- Add tenant_id to departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to job_titles
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to leave_requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to leave_balances
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create indexes for tenant_id columns (partial indexes on non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_job_titles_tenant ON job_titles(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leave_balances_tenant ON leave_balances(tenant_id) WHERE deleted = FALSE;

-- Note: tenant_id is nullable initially to support existing data
-- Future migrations can add NOT NULL constraint after data backfill
-- The schema-per-tenant isolation remains the primary defense
