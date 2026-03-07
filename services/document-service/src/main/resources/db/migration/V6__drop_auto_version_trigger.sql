-- ============================================================================
-- V6: Drop Auto-Version Trigger
-- The application handles version creation via JPA, so the trigger causes duplicates
-- ============================================================================

-- Drop the trigger that auto-creates the initial version
DROP TRIGGER IF EXISTS trg_create_initial_version ON documents;

-- Clean up any orphaned/duplicate versions from previous attempts
DELETE FROM document_versions dv1
WHERE EXISTS (
    SELECT 1 FROM document_versions dv2
    WHERE dv2.document_id = dv1.document_id
    AND dv2.version_number = dv1.version_number
    AND dv2.id < dv1.id
);
