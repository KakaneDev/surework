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

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_employees ON employees
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on departments table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_departments ON departments
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on job_titles table
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_job_titles ON job_titles
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on leave_requests table
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_leave_requests ON leave_requests
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Enable RLS on leave_balances table
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_leave_balances ON leave_balances
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Grant execute permission on the tenant ID function
GRANT EXECUTE ON FUNCTION current_tenant_id() TO PUBLIC;

-- Note: The application must set the tenant ID before each transaction:
-- SET LOCAL app.current_tenant_id = 'tenant-uuid';
-- This is typically done in the connection pool or transaction interceptor

COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant ID from session variable for RLS policies';
