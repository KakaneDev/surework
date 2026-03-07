-- V2__add_tenant_activity.sql
-- Create tenant_activities table for tracking tenant engagement and onboarding progress

CREATE TABLE tenant_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    activity_type VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    metadata TEXT,
    user_id UUID,
    user_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_tenant_activities_tenant ON tenant_activities(tenant_id);
CREATE INDEX idx_tenant_activities_type ON tenant_activities(activity_type);
CREATE INDEX idx_tenant_activities_created ON tenant_activities(created_at DESC);
CREATE INDEX idx_tenant_activities_tenant_created ON tenant_activities(tenant_id, created_at DESC);

-- Add constraints
ALTER TABLE tenant_activities
ADD CONSTRAINT chk_activity_type CHECK (
    activity_type IN (
        'TENANT_CREATED',
        'ADMIN_USER_CREATED',
        'FIRST_LOGIN',
        'FIRST_EMPLOYEE_ADDED',
        'ONBOARDING_COMPLETED',
        'USER_LOGIN',
        'USER_INVITED',
        'USER_ACTIVATED',
        'LEAVE_REQUEST_SUBMITTED',
        'LEAVE_REQUEST_APPROVED',
        'PAYROLL_RUN',
        'DOCUMENT_UPLOADED',
        'EMPLOYEE_ADDED',
        'SETTINGS_UPDATED',
        'INTEGRATION_CONNECTED',
        'SUBSCRIPTION_CHANGED',
        'PAYMENT_RECEIVED',
        'SUPPORT_TICKET_CREATED',
        'SUPPORT_HELP_SENT',
        'IMPERSONATION_STARTED',
        'IMPERSONATION_ENDED'
    )
);

COMMENT ON TABLE tenant_activities IS 'Tracks tenant activities for engagement monitoring and onboarding progress';
COMMENT ON COLUMN tenant_activities.activity_type IS 'Type of activity (e.g., FIRST_LOGIN, EMPLOYEE_ADDED)';
COMMENT ON COLUMN tenant_activities.metadata IS 'JSON metadata for additional activity details';
