-- =====================================================
-- Add columns required by identity-service entities
-- SureWork ERP Platform
-- =====================================================

-- Add soft delete support columns to users table
-- (BaseEntity expects both 'deleted' and 'deleted_at')
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Add soft delete support columns to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_roles_deleted ON roles(deleted) WHERE deleted = FALSE;
