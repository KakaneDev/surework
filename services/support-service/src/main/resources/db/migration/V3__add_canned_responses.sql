-- V3__add_canned_responses.sql
-- Create canned_responses table for support ticket template responses

CREATE TABLE canned_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    created_by UUID,
    created_by_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX idx_canned_responses_category ON canned_responses(category);
CREATE INDEX idx_canned_responses_created_by ON canned_responses(created_by);
CREATE INDEX idx_canned_responses_deleted ON canned_responses(deleted);
CREATE INDEX idx_canned_responses_title ON canned_responses(title);

-- Trigger for automatic updated_at
CREATE TRIGGER update_canned_responses_updated_at
    BEFORE UPDATE ON canned_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default canned responses
INSERT INTO canned_responses (title, category, content) VALUES
('Greeting - General', 'Greetings', 'Hello,

Thank you for contacting SureWork Support. I''m here to help you with your inquiry.

Please provide any additional details that might help me assist you better.

Best regards,
SureWork Support Team'),

('Greeting - Technical Issue', 'Greetings', 'Hello,

Thank you for reporting this technical issue. I understand how frustrating this can be and I''m here to help resolve it.

To assist you better, could you please provide:
1. What were you trying to do when the issue occurred?
2. Any error messages you saw
3. Your browser and device type

Best regards,
SureWork Support Team'),

('Request More Information', 'Follow-up', 'Hello,

Thank you for your message. To help resolve your issue, I need some additional information:

[SPECIFY WHAT INFORMATION IS NEEDED]

Once I have this information, I''ll be able to assist you further.

Best regards,
SureWork Support Team'),

('Issue Resolved', 'Closing', 'Hello,

I''m pleased to let you know that your issue has been resolved.

[DESCRIBE THE RESOLUTION]

If you have any further questions or concerns, please don''t hesitate to reach out.

Best regards,
SureWork Support Team'),

('Escalation Notice', 'Status Updates', 'Hello,

I wanted to let you know that your ticket has been escalated to our specialist team for further investigation.

We''ll keep you updated on the progress. Thank you for your patience.

Best regards,
SureWork Support Team'),

('Password Reset Instructions', 'Common Issues', 'Hello,

To reset your password, please follow these steps:

1. Go to the login page
2. Click on "Forgot Password"
3. Enter your registered email address
4. Check your email for the reset link
5. Click the link and create a new password

If you don''t receive the email within a few minutes, please check your spam folder.

Best regards,
SureWork Support Team'),

('Leave Request Help', 'HR Support', 'Hello,

To submit a leave request:

1. Navigate to "My Leave" in the menu
2. Click "Request Leave"
3. Select the leave type
4. Choose your dates
5. Add any notes if required
6. Submit for approval

Your manager will receive a notification to approve your request.

Best regards,
SureWork Support Team');

COMMENT ON TABLE canned_responses IS 'Pre-written template responses for support agents';
COMMENT ON COLUMN canned_responses.category IS 'Category for organizing canned responses (e.g., Greetings, Closing, Common Issues)';
