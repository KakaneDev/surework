-- Fix RLS policies to enforce strict tenant isolation (fail-closed security)
-- CRITICAL SECURITY FIX: Remove NULL tenant_id allowance that created escape hatch
--
-- Previous policies allowed: tenant_id IS NULL OR tenant_id = current_tenant_id()
-- This created a fail-open security model where missing tenant context allowed access to all NULL records
--
-- New policies enforce: tenant_id = require_tenant_id()
-- This is fail-closed: missing tenant context blocks ALL access

-- IMPORTANT: Drop policies FIRST before dropping the function they depend on
DROP POLICY IF EXISTS tenant_isolation_employees ON employees;
DROP POLICY IF EXISTS tenant_isolation_departments ON departments;
DROP POLICY IF EXISTS tenant_isolation_job_titles ON job_titles;
DROP POLICY IF EXISTS tenant_isolation_leave_requests ON leave_requests;
DROP POLICY IF EXISTS tenant_isolation_leave_balances ON leave_balances;

-- Drop the old fail-open function and create a strict fail-closed version
DROP FUNCTION IF EXISTS current_tenant_id();

-- Create strict tenant ID function that raises an exception if not set
-- This ensures queries fail rather than returning wrong data
CREATE OR REPLACE FUNCTION require_tenant_id() RETURNS UUID AS $$
DECLARE
    tenant_id_str TEXT;
    tenant_id UUID;
BEGIN
    -- Get the setting, returning NULL if not set (second param = true means missing_ok)
    tenant_id_str := current_setting('app.current_tenant_id', TRUE);

    -- Fail if not set or empty
    IF tenant_id_str IS NULL OR tenant_id_str = '' THEN
        RAISE EXCEPTION 'TENANT_CONTEXT_REQUIRED: Tenant context not set. '
            'Application must SET LOCAL app.current_tenant_id before database operations.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Parse and validate UUID format
    BEGIN
        tenant_id := tenant_id_str::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'INVALID_TENANT_ID: Invalid tenant ID format: %', tenant_id_str
                USING ERRCODE = 'P0002';
    END;

    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Also create a version that returns NULL for specific use cases (like existence checks)
-- This should be used sparingly and only where NULL is explicitly acceptable
CREATE OR REPLACE FUNCTION current_tenant_id_nullable() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create strict tenant isolation policies (fail-closed)
-- These policies will cause queries to fail if tenant context is not set

CREATE POLICY tenant_isolation_employees ON employees
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_departments ON departments
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_job_titles ON job_titles
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_leave_requests ON leave_requests
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_leave_balances ON leave_balances
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION require_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id_nullable() TO PUBLIC;

-- Add helpful comments
COMMENT ON FUNCTION require_tenant_id() IS
    'Returns the current tenant ID from session variable. RAISES EXCEPTION if not set. '
    'Use this in RLS policies for strict tenant isolation.';

COMMENT ON FUNCTION current_tenant_id_nullable() IS
    'Returns the current tenant ID or NULL if not set. '
    'Use sparingly - only where NULL is explicitly acceptable.';
