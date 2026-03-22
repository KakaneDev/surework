-- Fix RLS policies to enforce strict tenant isolation (fail-closed security)
-- CRITICAL SECURITY FIX: Remove NULL tenant_id allowance that created escape hatch

-- IMPORTANT: Drop policies FIRST before dropping the function they depend on
DROP POLICY IF EXISTS tenant_isolation_payroll_runs ON payroll_runs;
DROP POLICY IF EXISTS tenant_isolation_payslips ON payslips;
DROP POLICY IF EXISTS tenant_isolation_payslip_lines ON payslip_lines;

-- Drop the old fail-open function and create a strict fail-closed version
DROP FUNCTION IF EXISTS current_tenant_id();

-- Create strict tenant ID function that raises an exception if not set
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

-- Nullable version for specific use cases
CREATE OR REPLACE FUNCTION current_tenant_id_nullable() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create strict tenant isolation policies (fail-closed)
CREATE POLICY tenant_isolation_payroll_runs ON payroll_runs
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_payslips ON payslips
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

CREATE POLICY tenant_isolation_payslip_lines ON payslip_lines
    USING (tenant_id = require_tenant_id())
    WITH CHECK (tenant_id = require_tenant_id());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION require_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id_nullable() TO PUBLIC;

COMMENT ON FUNCTION require_tenant_id() IS
    'Returns the current tenant ID from session variable. RAISES EXCEPTION if not set.';
COMMENT ON FUNCTION current_tenant_id_nullable() IS
    'Returns the current tenant ID or NULL if not set. Use sparingly.';
