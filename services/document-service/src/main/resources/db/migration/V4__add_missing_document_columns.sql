-- ============================================================================
-- V4: Add Missing Document Columns
-- Aligns schema with Document entity for JPA compatibility
-- ============================================================================

-- Add acknowledgment columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS acknowledged_by UUID;

-- Add can_be_deleted column for retention policy
ALTER TABLE documents ADD COLUMN IF NOT EXISTS can_be_deleted BOOLEAN NOT NULL DEFAULT true;

-- Add version column for JPA optimistic locking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- The entity uses String for tags (comma-separated), but DB has TEXT[] array.
-- Rename the array column and create a new varchar column for the entity.
ALTER TABLE documents RENAME COLUMN tags TO tags_array;
ALTER TABLE documents ADD COLUMN tags VARCHAR(500);

-- Migrate existing array tags to comma-separated string
UPDATE documents
SET tags = array_to_string(tags_array, ',')
WHERE tags_array IS NOT NULL;

-- Drop the old array index and create new one for varchar
DROP INDEX IF EXISTS idx_documents_tags;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents(tags) WHERE tags IS NOT NULL;

-- Add version column to document_versions for JPA optimistic locking
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- Add version column to document_templates for JPA optimistic locking
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
