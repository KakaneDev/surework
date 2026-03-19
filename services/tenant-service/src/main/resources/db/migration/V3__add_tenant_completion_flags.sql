-- V3__add_tenant_completion_flags.sql
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS company_details_complete BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS compliance_details_complete BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tenants.company_details_complete IS 'True when admin has filled in registration number, address, contact info, industry sector';
COMMENT ON COLUMN tenants.compliance_details_complete IS 'True when admin has filled in tax number, UIF, SDL, PAYE reference';
