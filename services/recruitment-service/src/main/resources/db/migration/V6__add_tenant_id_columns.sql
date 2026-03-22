-- Add tenant_id columns for defense-in-depth multitenancy
-- This provides a secondary safeguard alongside schema-per-tenant isolation
-- If schema routing fails, explicit tenant_id checks prevent cross-tenant data access

-- Add tenant_id to job_postings
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add tenant_id to interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create indexes for tenant_id columns (partial indexes on non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_job_postings_tenant ON job_postings(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_candidates_tenant ON candidates(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_interviews_tenant ON interviews(tenant_id) WHERE deleted = FALSE;

-- Note: tenant_id is nullable initially to support existing data
-- Future migrations can add NOT NULL constraint after data backfill
-- The schema-per-tenant isolation remains the primary defense
