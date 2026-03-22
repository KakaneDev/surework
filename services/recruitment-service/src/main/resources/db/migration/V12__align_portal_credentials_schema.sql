-- V12__align_portal_credentials_schema.sql
-- Align platform_portal_credentials table with entity model

-- Add missing columns
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'NOT_CONFIGURED';
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS last_successful_post_at TIMESTAMP;
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS total_posts_count INT DEFAULT 0;
ALTER TABLE platform_portal_credentials ADD COLUMN IF NOT EXISTS failed_posts_count INT DEFAULT 0;

-- Change encrypted columns from BYTEA to TEXT (entity uses Base64 encoded strings)
ALTER TABLE platform_portal_credentials ALTER COLUMN username_encrypted TYPE TEXT USING username_encrypted::TEXT;
ALTER TABLE platform_portal_credentials ALTER COLUMN password_encrypted TYPE TEXT USING password_encrypted::TEXT;
ALTER TABLE platform_portal_credentials ALTER COLUMN additional_config_encrypted TYPE TEXT USING additional_config_encrypted::TEXT;

-- Allow null for encrypted fields (empty credentials on initial setup)
ALTER TABLE platform_portal_credentials ALTER COLUMN username_encrypted DROP NOT NULL;
ALTER TABLE platform_portal_credentials ALTER COLUMN password_encrypted DROP NOT NULL;
