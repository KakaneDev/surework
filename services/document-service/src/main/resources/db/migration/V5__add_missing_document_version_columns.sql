-- ============================================================================
-- V5: Add Missing Columns to document_versions
-- DocumentVersion extends BaseEntity which requires these columns
-- ============================================================================

-- Add BaseEntity columns to document_versions
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing content_type column if not exists (for file type detection)
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);
