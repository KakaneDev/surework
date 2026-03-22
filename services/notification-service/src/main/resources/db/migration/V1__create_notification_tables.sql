-- Notification table for storing user notifications
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,

    -- Recipient
    user_id UUID NOT NULL,

    -- Content
    type VARCHAR(50) NOT NULL,  -- LEAVE_APPROVED, PAYSLIP_READY, DOCUMENT_UPLOADED, TICKET_UPDATED, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Reference to source entity
    reference_type VARCHAR(50),  -- LEAVE_REQUEST, PAYSLIP, DOCUMENT, SUPPORT_TICKET
    reference_id UUID,

    -- State
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- Index for fetching unread notifications for a user
CREATE INDEX idx_notification_user_unread ON notification(user_id, read) WHERE deleted = FALSE;

-- Index for fetching notifications ordered by creation date
CREATE INDEX idx_notification_user_created ON notification(user_id, created_at DESC) WHERE deleted = FALSE;

-- Index for notification type queries
CREATE INDEX idx_notification_type ON notification(type) WHERE deleted = FALSE;

-- Comment on table
COMMENT ON TABLE notification IS 'User notifications for the SureWork ERP system';
COMMENT ON COLUMN notification.type IS 'Type of notification: LEAVE_APPROVED, PAYSLIP_READY, etc.';
COMMENT ON COLUMN notification.reference_type IS 'Type of referenced entity: LEAVE_REQUEST, PAYSLIP, DOCUMENT, etc.';
COMMENT ON COLUMN notification.reference_id IS 'ID of the referenced entity for navigation';
