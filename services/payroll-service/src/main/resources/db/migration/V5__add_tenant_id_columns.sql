-- Add tenant_id columns for defense-in-depth multitenancy
-- This provides a secondary safeguard alongside schema-per-tenant isolation
-- If schema routing fails, explicit tenant_id checks prevent cross-tenant data access

-- Add tenant_id to payroll_runs
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to payslips
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to payslip_lines
ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create indexes for tenant_id columns (partial indexes on non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON payroll_runs(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslips_tenant ON payslips(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslip_lines_tenant ON payslip_lines(tenant_id);

-- Note: tenant_id is nullable initially to support existing data
-- Future migrations can add NOT NULL constraint after data backfill
-- The schema-per-tenant isolation remains the primary defense
