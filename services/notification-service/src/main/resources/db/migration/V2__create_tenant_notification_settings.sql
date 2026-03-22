-- Tenant notification channel settings
-- Controls which delivery channels are enabled for each notification type at the tenant level
CREATE TABLE tenant_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tenant_notification_type UNIQUE (tenant_id, notification_type)
);

-- Index for tenant queries
CREATE INDEX idx_tenant_notification_settings_tenant ON tenant_notification_settings(tenant_id);

-- Comments
COMMENT ON TABLE tenant_notification_settings IS 'Per-tenant notification channel settings for each notification type';
COMMENT ON COLUMN tenant_notification_settings.notification_type IS 'Type of notification: LEAVE_SUBMITTED, PAYSLIP_READY, etc.';
COMMENT ON COLUMN tenant_notification_settings.is_mandatory IS 'If true, users cannot disable this notification type';

-- Seed default settings for tenant (using placeholder UUID - real implementation uses current tenant)
-- These will be created on tenant onboarding in production
-- Mandatory notifications (users cannot disable)
-- PASSWORD_CHANGED, ACCOUNT_UPDATED, SYSTEM_ANNOUNCEMENT
