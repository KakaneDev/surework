-- User notification preferences
-- Allows users to opt-out of optional notifications (cannot opt-out of mandatory ones)
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    email_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    sms_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    in_app_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_notification_type UNIQUE (user_id, notification_type)
);

-- Index for user queries
CREATE INDEX idx_user_notification_preferences_user ON user_notification_preferences(user_id);

-- Comments
COMMENT ON TABLE user_notification_preferences IS 'User-level notification preferences to opt-out of optional notifications';
COMMENT ON COLUMN user_notification_preferences.notification_type IS 'Type of notification to configure';
COMMENT ON COLUMN user_notification_preferences.email_disabled IS 'If true, user has opted out of email for this type (only applies if tenant has email enabled and notification is not mandatory)';
