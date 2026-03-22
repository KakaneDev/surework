-- Fix RLS policies to enforce strict tenant isolation (fail-closed security)
-- CRITICAL SECURITY FIX: Remove NULL tenant_id allowance that created escape hatch
--
-- Previous policies allowed: tenant_id IS NULL OR tenant_id = current_tenant_id()
-- This created a fail-open security model where missing tenant context allowed access to all NULL records
--
-- New policies enforce: tenant_id = require_tenant_id()
-- This is fail-closed: missing tenant context blocks ALL access
--
-- Also fixes external_job_postings which used wrong session variable (app.current_tenant vs app.current_tenant_id)

-- FIRST: Drop all existing policies
DROP POLICY IF EXISTS tenant_isolation_job_postings ON job_postings;
DROP POLICY IF EXISTS tenant_isolation_candidates ON candidates;
DROP POLICY IF EXISTS tenant_isolation_applications ON applications;
DROP POLICY IF EXISTS tenant_isolation_interviews ON interviews;
DROP POLICY IF EXISTS external_job_postings_tenant_isolation ON external_job_postings;
DROP POLICY IF EXISTS tenant_isolation_clients ON clients;

-- Drop the old fail-open function
DROP FUNCTION IF EXISTS current_tenant_id();

-- Create strict tenant ID function that raises an exception if not set
-- This ensures queries fail rather than returning wrong data
CREATE OR REPLACE FUNCTION require_tenant_id() RETURNS UUID AS $$
DECLARE
    tenant_id_str TEXT;
    tenant_id UUID;
BEGIN
    tenant_id_str := current_setting('app.current_tenant_id', TRUE);

    IF tenant_id_str IS NULL OR tenant_id_str = '' THEN
        RAISE EXCEPTION 'TENANT_CONTEXT_REQUIRED: Tenant context not set. '
            'Application must SET LOCAL app.current_tenant_id before database operations.'
            USING ERRCODE = 'P0001';
    END IF;

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

-- Also create a nullable version for specific use cases
CREATE OR REPLACE FUNCTION current_tenant_id_nullable() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create strict tenant isolation policies (fail-closed)

CREATE POLICY tenant_isolation_job_postings ON job_postings
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_candidates ON candidates
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_applications ON applications
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_interviews ON interviews
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_external_job_postings ON external_job_postings
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_clients ON clients
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION require_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id_nullable() TO PUBLIC;

COMMENT ON FUNCTION require_tenant_id() IS
    'Returns the current tenant ID from session variable. RAISES EXCEPTION if not set. '
    'Use this in RLS policies for strict tenant isolation.';

COMMENT ON FUNCTION current_tenant_id_nullable() IS
    'Returns the current tenant ID or NULL if not set. '
    'Use sparingly - only where NULL is explicitly acceptable.';
