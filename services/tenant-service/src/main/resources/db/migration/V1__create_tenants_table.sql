-- Create tenants table in public schema
-- This table stores metadata about all tenants (companies)

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL UNIQUE,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL,
    vat_number VARCHAR(50),
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(20) NOT NULL,
    physical_address TEXT NOT NULL,
    postal_address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    max_employees INTEGER,
    max_users INTEGER,
    settings JSONB DEFAULT '{}',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    CONSTRAINT chk_subscription_tier CHECK (subscription_tier IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON public.tenants(schema_name);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
