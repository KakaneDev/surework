-- Add browser and location columns to user_sessions table
-- These columns support the enhanced session management feature

ALTER TABLE user_sessions
    ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
    ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add index on password_reset_tokens for efficient token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
    ON password_reset_tokens(user_id);

-- Partial index for valid tokens - significantly improves findAllValidTokens query
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_valid
    ON password_reset_tokens(expires_at)
    WHERE used = FALSE;

-- Composite index for rate limiting check (hasRecentToken query)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_rate_limit
    ON password_reset_tokens(user_id, created_at, expires_at)
    WHERE used = FALSE;
