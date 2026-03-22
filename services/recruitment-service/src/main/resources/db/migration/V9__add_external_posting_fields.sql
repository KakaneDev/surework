-- V9__add_external_posting_fields.sql
-- Add fields for external job portal integration (Pnet, LinkedIn, Indeed, Careers24)

-- Add new location fields to job_postings table
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS province VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'ZA';

-- Add industry and education fields
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);

-- Add external posting configuration fields
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS contract_duration VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS publish_to_external BOOLEAN DEFAULT FALSE;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS external_portals TEXT; -- JSON array: ["PNET", "LINKEDIN", "INDEED", "CAREERS24"]
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS company_mention_preference VARCHAR(50) DEFAULT 'ANONYMOUS';
-- ANONYMOUS: "A leading company in [industry]..."
-- NAMED_BY_SUREWORK: "SureWork on behalf of [Tenant Name]..."
-- DIRECT_MENTION: Include tenant name directly in job description

-- Create external_job_postings table to track jobs posted to external portals
CREATE TABLE IF NOT EXISTS external_job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- PNET, LINKEDIN, INDEED, CAREERS24
    external_job_id VARCHAR(255), -- ID from the external portal
    external_url VARCHAR(500), -- URL to the job on the external portal
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, POSTING, POSTED, FAILED, EXPIRED, REMOVED
    error_message TEXT, -- Error message if posting failed
    retry_count INT DEFAULT 0,
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    UNIQUE(job_posting_id, portal)
);

-- Create indexes for external_job_postings
CREATE INDEX IF NOT EXISTS idx_external_postings_status ON external_job_postings(status);
CREATE INDEX IF NOT EXISTS idx_external_postings_tenant ON external_job_postings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_external_postings_job ON external_job_postings(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_external_postings_portal ON external_job_postings(portal);
CREATE INDEX IF NOT EXISTS idx_external_postings_pending ON external_job_postings(status, created_at) WHERE status = 'PENDING';

-- Create external_posting_queue table for rate limiting and retry management
CREATE TABLE IF NOT EXISTS external_posting_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_job_posting_id UUID NOT NULL REFERENCES external_job_postings(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL,
    priority INT DEFAULT 0, -- Higher = more urgent
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP, -- When to retry (after rate limit reset)
    processing_started_at TIMESTAMP, -- When processing began (for timeout detection)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(external_job_posting_id)
);

-- Create indexes for external_posting_queue
CREATE INDEX IF NOT EXISTS idx_posting_queue_scheduled ON external_posting_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posting_queue_portal ON external_posting_queue(portal);
CREATE INDEX IF NOT EXISTS idx_posting_queue_priority ON external_posting_queue(priority DESC, queued_at ASC);

-- Create platform_portal_credentials table (PLATFORM-LEVEL, not per-tenant)
-- This is managed by SureWork admin, not tenants
CREATE TABLE IF NOT EXISTS platform_portal_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal VARCHAR(50) NOT NULL UNIQUE, -- One credential per portal for entire platform
    username_encrypted BYTEA NOT NULL,
    password_encrypted BYTEA NOT NULL,
    additional_config_encrypted BYTEA, -- JSON for extra fields (company page ID, session cookies, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    daily_rate_limit INT DEFAULT 50,
    posts_today INT DEFAULT 0,
    rate_limit_reset_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    last_error TEXT,
    last_successful_post_at TIMESTAMP,
    total_posts_count INT DEFAULT 0,
    failed_posts_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Insert initial portal credential records (empty, to be configured by admin)
INSERT INTO platform_portal_credentials (portal, username_encrypted, password_encrypted, is_active)
VALUES
    ('PNET', '', '', FALSE),
    ('LINKEDIN', '', '', FALSE),
    ('INDEED', '', '', FALSE),
    ('CAREERS24', '', '', FALSE)
ON CONFLICT (portal) DO NOTHING;

-- Create external_posting_audit table for tracking all posting attempts
CREATE TABLE IF NOT EXISTS external_posting_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_job_posting_id UUID NOT NULL REFERENCES external_job_postings(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- CREATED, POSTING_STARTED, POSTED, FAILED, RETRIED, EXPIRED, REMOVED
    details TEXT, -- JSON with action details
    performed_by VARCHAR(255), -- System or admin user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posting_audit_external_posting ON external_posting_audit(external_job_posting_id);
CREATE INDEX IF NOT EXISTS idx_posting_audit_action ON external_posting_audit(action);
CREATE INDEX IF NOT EXISTS idx_posting_audit_created ON external_posting_audit(created_at);

-- Enable Row Level Security on external_job_postings
ALTER TABLE external_job_postings ENABLE ROW LEVEL SECURITY;

-- RLS policy for external_job_postings
DROP POLICY IF EXISTS external_job_postings_tenant_isolation ON external_job_postings;
CREATE POLICY external_job_postings_tenant_isolation ON external_job_postings
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Add comments for documentation
COMMENT ON TABLE external_job_postings IS 'Tracks job postings distributed to external portals (Pnet, LinkedIn, Indeed, Careers24)';
COMMENT ON TABLE external_posting_queue IS 'Queue for rate-limited external job posting operations';
COMMENT ON TABLE platform_portal_credentials IS 'Platform-level credentials for external job portals (SureWork admin managed)';
COMMENT ON TABLE external_posting_audit IS 'Audit trail for external posting operations';

COMMENT ON COLUMN job_postings.publish_to_external IS 'Flag to enable posting to external job portals';
COMMENT ON COLUMN job_postings.external_portals IS 'JSON array of portal names to post to: PNET, LINKEDIN, INDEED, CAREERS24';
COMMENT ON COLUMN job_postings.company_mention_preference IS 'How to reference the tenant company: ANONYMOUS, NAMED_BY_SUREWORK, DIRECT_MENTION';
