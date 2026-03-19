-- V4__add_missing_tenant_columns.sql
-- Add columns expected by the Tenant JPA entity but missing from the tenants table.
-- All new columns are nullable so existing rows are unaffected.

ALTER TABLE public.tenants
    -- Company details
    ADD COLUMN IF NOT EXISTS trading_name       VARCHAR(200),
    ADD COLUMN IF NOT EXISTS tax_number         VARCHAR(50),
    ADD COLUMN IF NOT EXISTS uif_reference      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sdl_number         VARCHAR(50),
    ADD COLUMN IF NOT EXISTS paye_reference     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS company_type       VARCHAR(30),
    ADD COLUMN IF NOT EXISTS industry_sector    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sic_code           VARCHAR(20),

    -- Physical address (granular fields)
    ADD COLUMN IF NOT EXISTS address_line1      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line2      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS city               VARCHAR(100),
    ADD COLUMN IF NOT EXISTS province           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS country            VARCHAR(100) DEFAULT 'South Africa',

    -- Postal address (granular fields)
    ADD COLUMN IF NOT EXISTS postal_line1       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS postal_line2       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS postal_city        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_province    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code_value  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS postal_country     VARCHAR(100),

    -- Contact
    ADD COLUMN IF NOT EXISTS website            VARCHAR(255),

    -- Subscription / licensing
    ADD COLUMN IF NOT EXISTS license_key        VARCHAR(255),

    -- Status lifecycle timestamps
    ADD COLUMN IF NOT EXISTS activated_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspension_reason  TEXT,
    ADD COLUMN IF NOT EXISTS terminated_at      TIMESTAMPTZ,

    -- Branding
    ADD COLUMN IF NOT EXISTS logo_url           VARCHAR(500),
    ADD COLUMN IF NOT EXISTS primary_color      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS secondary_color    VARCHAR(20),

    -- Localization
    ADD COLUMN IF NOT EXISTS timezone           VARCHAR(50)  DEFAULT 'Africa/Johannesburg',
    ADD COLUMN IF NOT EXISTS date_format        VARCHAR(20)  DEFAULT 'dd/MM/yyyy',
    ADD COLUMN IF NOT EXISTS currency_code      VARCHAR(10)  DEFAULT 'ZAR',
    ADD COLUMN IF NOT EXISTS language_code      VARCHAR(10)  DEFAULT 'en-ZA',

    -- Feature flags
    ADD COLUMN IF NOT EXISTS features           TEXT[],

    -- Audit
    ADD COLUMN IF NOT EXISTS created_by         UUID,
    ADD COLUMN IF NOT EXISTS updated_by         UUID;

-- Update the status CHECK constraint to include the additional statuses used by the entity
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE public.tenants ADD CONSTRAINT chk_status CHECK (
    status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'TRIAL', 'EXPIRED', 'TERMINATED')
);

-- Update the subscription_tier CHECK constraint to include all tiers used by the entity
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS chk_subscription_tier;
ALTER TABLE public.tenants ADD CONSTRAINT chk_subscription_tier CHECK (
    subscription_tier IN ('FREE', 'TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'UNLIMITED')
);
