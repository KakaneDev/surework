-- V1: Add soft delete columns to users table
-- These columns are required by the BaseEntity class for soft delete support

-- Add deleted column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at timestamp;
    END IF;
END $$;

-- Add version column if it doesn't exist (for optimistic locking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'version'
    ) THEN
        ALTER TABLE users ADD COLUMN version bigint NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted);
CREATE INDEX IF NOT EXISTS idx_users_email_deleted ON users(email, deleted);
