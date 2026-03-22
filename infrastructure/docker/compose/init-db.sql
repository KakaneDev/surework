-- Initialize SureWork Database
-- This script runs on first container startup

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS config;

-- Grant permissions
GRANT ALL ON SCHEMA public TO surework;
GRANT ALL ON SCHEMA config TO surework;

-- Create tenant registry table in public schema
-- (Full Flyway migrations will handle the rest)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    schema_name VARCHAR(63) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create shared tax table in config schema (vendor-managed)
CREATE TABLE IF NOT EXISTS config.tax_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_year INTEGER NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    brackets JSONB NOT NULL,
    rebates JSONB NOT NULL,
    thresholds JSONB NOT NULL,
    uif_rate DECIMAL(5,4) NOT NULL,
    uif_ceiling DECIMAL(12,2) NOT NULL,
    sdl_rate DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tax_year, effective_from)
);

-- Insert initial 2026 tax year data (SA tax year: March 2025 - Feb 2026)
INSERT INTO config.tax_tables (
    tax_year, effective_from, effective_to,
    brackets, rebates, thresholds,
    uif_rate, uif_ceiling, sdl_rate
) VALUES (
    2026,
    '2025-03-01',
    '2026-02-28',
    '[
        {"min": 0, "max": 237100, "rate": 0.18, "base": 0},
        {"min": 237101, "max": 370500, "rate": 0.26, "base": 42678},
        {"min": 370501, "max": 512800, "rate": 0.31, "base": 77362},
        {"min": 512801, "max": 673000, "rate": 0.36, "base": 121475},
        {"min": 673001, "max": 857900, "rate": 0.39, "base": 179147},
        {"min": 857901, "max": 1817000, "rate": 0.41, "base": 251258},
        {"min": 1817001, "max": null, "rate": 0.45, "base": 644489}
    ]'::jsonb,
    '{
        "primary": 17235,
        "secondary": 9444,
        "tertiary": 3145
    }'::jsonb,
    '{
        "age_65": 165689,
        "age_75": 180557,
        "under_65": 95750
    }'::jsonb,
    0.01,
    17712.00,
    0.01
) ON CONFLICT DO NOTHING;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'SureWork database initialized successfully';
END $$;
