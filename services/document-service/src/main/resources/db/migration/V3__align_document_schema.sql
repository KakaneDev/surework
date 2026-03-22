-- ============================================================================
-- V3: Align Document Schema with Entity Model
-- Adds missing columns and renames for compatibility
-- ============================================================================

-- Rename 'reference' to 'document_reference' to match entity
ALTER TABLE documents RENAME COLUMN reference TO document_reference;

-- Add 'name' column (entity expects 'name', DB has 'title')
ALTER TABLE documents ADD COLUMN IF NOT EXISTS name VARCHAR(255);
UPDATE documents SET name = COALESCE(title, file_name) WHERE name IS NULL;
ALTER TABLE documents ALTER COLUMN name SET NOT NULL;

-- Add missing columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_expired BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_name VARCHAR(200);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_extension VARCHAR(20);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(200);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by_name VARCHAR(200);

-- Update indexes for renamed column
DROP INDEX IF EXISTS idx_documents_reference;
CREATE INDEX IF NOT EXISTS idx_documents_doc_reference ON documents(document_reference) WHERE deleted = false;

-- Update document_versions to add missing columns
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS uploaded_by_name VARCHAR(200);
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;

-- Update unique constraint name
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_reference_key;
ALTER TABLE documents ADD CONSTRAINT documents_document_reference_key UNIQUE (document_reference);

-- Drop old constraint and create new one with more categories
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_category;
ALTER TABLE documents ADD CONSTRAINT chk_document_category CHECK (category IN (
    'EMPLOYMENT_CONTRACT', 'OFFER_LETTER', 'TERMINATION_LETTER', 'RESIGNATION_LETTER',
    'IRP5', 'TAX_NUMBER', 'UIF_DECLARATION',
    'PAYSLIP', 'BANK_CONFIRMATION', 'SALARY_REVIEW',
    'ID_DOCUMENT', 'PASSPORT', 'WORK_PERMIT', 'PROOF_OF_ADDRESS',
    'QUALIFICATION', 'CERTIFICATION', 'TRAINING_CERTIFICATE', 'CV',
    'MEDICAL_CERTIFICATE', 'LEAVE_FORM', 'DISCIPLINARY', 'WARNING_LETTER',
    'PERFORMANCE_REVIEW', 'SKILLS_ASSESSMENT',
    'POLICY_DOCUMENT', 'PROCEDURE', 'TEMPLATE', 'COMPANY_REGISTRATION',
    'INVOICE', 'RECEIPT', 'QUOTATION', 'STATEMENT',
    'CERTIFICATE', 'LICENSE', 'TRAINING', 'POLICY', 'RESIGNATION',
    'TERMINATION', 'CORRESPONDENCE', 'RECRUITMENT', 'ONBOARDING', 'COMPLIANCE',
    'OTHER'
));

-- Update owner_type constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_owner_type;
ALTER TABLE documents ADD CONSTRAINT chk_document_owner_type CHECK (owner_type IN (
    'EMPLOYEE', 'CANDIDATE', 'COMPANY', 'DEPARTMENT', 'JOB_POSTING',
    'PAYROLL_RUN', 'LEAVE_REQUEST', 'CUSTOMER', 'SUPPLIER', 'PROJECT', 'CLIENT'
));

-- Update status constraint  
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_status;
ALTER TABLE documents ADD CONSTRAINT chk_document_status CHECK (status IN (
    'ACTIVE', 'ARCHIVED', 'SUPERSEDED', 'EXPIRED', 'PENDING_REVIEW', 'REJECTED', 'DELETED', 'DRAFT'
));

-- Update visibility constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_visibility;
ALTER TABLE documents ADD CONSTRAINT chk_document_visibility CHECK (visibility IN (
    'PRIVATE', 'RESTRICTED', 'DEPARTMENT', 'COMPANY', 'PUBLIC', 'OWNER_ONLY'
));
