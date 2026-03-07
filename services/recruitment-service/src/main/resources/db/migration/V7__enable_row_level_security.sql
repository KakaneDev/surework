-- Enable Row-Level Security (RLS) for defense-in-depth multitenancy
-- This provides database-level enforcement of tenant isolation
-- Even if application code has bugs, RLS prevents cross-tenant data access

-- Create a function to get the current tenant ID from session variable
-- The application sets this via: SET app.current_tenant_id = 'tenant-uuid'
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on job_postings table
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_job_postings ON job_postings
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_candidates ON candidates
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_applications ON applications
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on interviews table
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_interviews ON interviews
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Grant execute permission on the tenant ID function
GRANT EXECUTE ON FUNCTION current_tenant_id() TO PUBLIC;

-- Note: The application must set the tenant ID before each transaction:
-- SET LOCAL app.current_tenant_id = 'tenant-uuid';
-- This is typically done in the connection pool or transaction interceptor

COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant ID from session variable for RLS policies';
