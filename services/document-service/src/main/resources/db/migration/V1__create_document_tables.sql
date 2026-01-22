-- =====================================================
-- Document Management Service Database Schema
-- SureWork ERP Platform
-- South African SME Compliance
-- =====================================================

-- Documents table - main document metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,

    -- Document identification
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT NOT NULL,

    -- Classification
    category VARCHAR(50) NOT NULL,
    document_type VARCHAR(100),

    -- Ownership
    owner_type VARCHAR(50) NOT NULL,
    owner_id UUID NOT NULL,

    -- Storage
    storage_path VARCHAR(500) NOT NULL,
    storage_type VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    checksum VARCHAR(64),

    -- Versioning
    current_version INT NOT NULL DEFAULT 1,

    -- Status and visibility
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    visibility VARCHAR(30) NOT NULL DEFAULT 'PRIVATE',

    -- Compliance
    retention_years INT,
    retention_until DATE,
    requires_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE,

    -- Expiration tracking (for certificates, licenses, etc.)
    valid_from DATE,
    valid_until DATE,
    expiry_notification_days INT DEFAULT 30,

    -- Metadata
    title VARCHAR(255),
    description TEXT,
    tags TEXT[], -- PostgreSQL array for tags
    custom_metadata JSONB,

    -- Audit fields
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Soft delete
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,

    CONSTRAINT chk_document_category CHECK (category IN (
        'EMPLOYMENT_CONTRACT', 'ID_DOCUMENT', 'TAX_NUMBER', 'BANK_CONFIRMATION',
        'QUALIFICATION', 'CERTIFICATE', 'LICENSE', 'MEDICAL_CERTIFICATE',
        'DISCIPLINARY', 'PERFORMANCE_REVIEW', 'TRAINING', 'POLICY',
        'PAYSLIP', 'IRP5', 'UIF_DECLARATION', 'LEAVE_FORM',
        'RESIGNATION', 'TERMINATION', 'WARNING_LETTER', 'CORRESPONDENCE',
        'RECRUITMENT', 'ONBOARDING', 'COMPLIANCE', 'OTHER'
    )),
    CONSTRAINT chk_document_owner_type CHECK (owner_type IN (
        'EMPLOYEE', 'CANDIDATE', 'COMPANY', 'DEPARTMENT', 'PROJECT', 'CLIENT'
    )),
    CONSTRAINT chk_document_status CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ARCHIVED', 'EXPIRED', 'DELETED'
    )),
    CONSTRAINT chk_document_visibility CHECK (visibility IN (
        'PRIVATE', 'OWNER_ONLY', 'DEPARTMENT', 'COMPANY', 'PUBLIC'
    )),
    CONSTRAINT chk_document_storage_type CHECK (storage_type IN ('LOCAL', 'S3', 'MINIO'))
);

-- Document versions table - version history
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Version info
    version_number INT NOT NULL,

    -- File details
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(64),

    -- Change tracking
    change_notes TEXT,

    -- Audit
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_document_version UNIQUE (document_id, version_number)
);

-- Document templates table - reusable document templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Template identification
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    template_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Content
    content_template TEXT, -- For text-based templates (HTML, Markdown)
    file_path VARCHAR(500), -- For file-based templates
    content_type VARCHAR(100),

    -- Template variables/placeholders
    variables JSONB, -- List of variable names and descriptions

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Versioning
    version INT NOT NULL DEFAULT 1,

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_template_code_tenant UNIQUE (tenant_id, code),
    CONSTRAINT chk_template_type CHECK (template_type IN (
        'EMPLOYMENT_CONTRACT_PERMANENT', 'EMPLOYMENT_CONTRACT_FIXED_TERM',
        'EMPLOYMENT_CONTRACT_PART_TIME', 'OFFER_LETTER',
        'WARNING_LETTER_VERBAL', 'WARNING_LETTER_WRITTEN', 'WARNING_LETTER_FINAL',
        'TERMINATION_LETTER', 'RESIGNATION_ACKNOWLEDGMENT',
        'LEAVE_APPLICATION', 'LEAVE_APPROVAL', 'LEAVE_REJECTION',
        'PAYSLIP_TEMPLATE', 'SALARY_INCREASE_LETTER',
        'TRAINING_CERTIFICATE', 'PERFORMANCE_REVIEW_FORM',
        'ONBOARDING_CHECKLIST', 'EXIT_INTERVIEW_FORM',
        'POLICY_DOCUMENT', 'PROCEDURE_DOCUMENT',
        'NDA', 'RESTRAINT_OF_TRADE', 'OTHER'
    )),
    CONSTRAINT chk_template_category CHECK (category IN (
        'EMPLOYMENT_CONTRACT', 'ID_DOCUMENT', 'TAX_NUMBER', 'BANK_CONFIRMATION',
        'QUALIFICATION', 'CERTIFICATE', 'LICENSE', 'MEDICAL_CERTIFICATE',
        'DISCIPLINARY', 'PERFORMANCE_REVIEW', 'TRAINING', 'POLICY',
        'PAYSLIP', 'IRP5', 'UIF_DECLARATION', 'LEAVE_FORM',
        'RESIGNATION', 'TERMINATION', 'WARNING_LETTER', 'CORRESPONDENCE',
        'RECRUITMENT', 'ONBOARDING', 'COMPLIANCE', 'OTHER'
    ))
);

-- Document acknowledgments table - track who has acknowledged documents
CREATE TABLE document_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Who acknowledged
    user_id UUID NOT NULL,
    employee_id UUID,

    -- Acknowledgment details
    acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Digital signature (optional)
    signature_data TEXT,
    signature_type VARCHAR(20), -- 'ELECTRONIC', 'DIGITAL', 'TYPED'

    CONSTRAINT uk_document_acknowledgment UNIQUE (document_id, user_id)
);

-- Document access log table - audit trail
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT,

    -- Access details
    user_id UUID NOT NULL,
    action VARCHAR(30) NOT NULL,
    action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Request info
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Additional context
    details JSONB,

    CONSTRAINT chk_access_action CHECK (action IN (
        'VIEW', 'DOWNLOAD', 'UPLOAD', 'UPDATE', 'DELETE', 'ARCHIVE',
        'RESTORE', 'SHARE', 'ACKNOWLEDGE', 'GENERATE', 'PREVIEW'
    ))
);

-- Document shares table - sharing with users/groups
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Share target
    share_type VARCHAR(20) NOT NULL, -- 'USER', 'DEPARTMENT', 'ROLE', 'PUBLIC_LINK'
    target_id UUID, -- User, Department, or Role ID (null for public links)

    -- Permissions
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_download BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,

    -- For public links
    share_token VARCHAR(64),
    password_hash VARCHAR(255),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    max_downloads INT,
    download_count INT NOT NULL DEFAULT 0,

    -- Audit
    shared_by UUID NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,

    CONSTRAINT chk_share_type CHECK (share_type IN ('USER', 'DEPARTMENT', 'ROLE', 'PUBLIC_LINK'))
);

-- Document retention policies table
CREATE TABLE document_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Policy identification
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Retention rules
    retention_years INT, -- -1 for indefinite
    auto_archive BOOLEAN NOT NULL DEFAULT FALSE,
    auto_delete BOOLEAN NOT NULL DEFAULT FALSE,

    -- Notification settings
    notify_before_expiry_days INT DEFAULT 30,
    notify_before_deletion_days INT DEFAULT 90,

    -- South African compliance references
    legal_basis TEXT, -- e.g., "BCEA Section 31", "Tax Act"

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_retention_policy_category UNIQUE (tenant_id, category)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Documents indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_reference ON documents(reference);
CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX idx_documents_valid_until ON documents(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX idx_documents_retention_until ON documents(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_documents_deleted ON documents(deleted);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_custom_metadata ON documents USING GIN(custom_metadata);

-- Full-text search index on document metadata
CREATE INDEX idx_documents_search ON documents USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || file_name)
);

-- Document versions indexes
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_uploaded_at ON document_versions(uploaded_at);

-- Document templates indexes
CREATE INDEX idx_document_templates_tenant ON document_templates(tenant_id);
CREATE INDEX idx_document_templates_code ON document_templates(code);
CREATE INDEX idx_document_templates_type ON document_templates(template_type);
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_active ON document_templates(active);

-- Document acknowledgments indexes
CREATE INDEX idx_document_acks_document ON document_acknowledgments(document_id);
CREATE INDEX idx_document_acks_user ON document_acknowledgments(user_id);
CREATE INDEX idx_document_acks_employee ON document_acknowledgments(employee_id);

-- Document access logs indexes
CREATE INDEX idx_document_access_document ON document_access_logs(document_id);
CREATE INDEX idx_document_access_user ON document_access_logs(user_id);
CREATE INDEX idx_document_access_action ON document_access_logs(action);
CREATE INDEX idx_document_access_timestamp ON document_access_logs(action_timestamp);

-- Document shares indexes
CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_target ON document_shares(share_type, target_id);
CREATE INDEX idx_document_shares_token ON document_shares(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_document_shares_active ON document_shares(active);

-- Retention policies indexes
CREATE INDEX idx_retention_policies_tenant ON document_retention_policies(tenant_id);
CREATE INDEX idx_retention_policies_category ON document_retention_policies(category);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate document reference number
CREATE OR REPLACE FUNCTION generate_document_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    sequence_num INT;
    new_reference VARCHAR(50);
BEGIN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Get next sequence number for this year and tenant
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(reference FROM 'DOC-' || year_prefix || '-(\d+)') AS INT)
    ), 0) + 1
    INTO sequence_num
    FROM documents
    WHERE tenant_id = NEW.tenant_id
    AND reference LIKE 'DOC-' || year_prefix || '-%';

    new_reference := 'DOC-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    NEW.reference := new_reference;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document reference generation
CREATE TRIGGER trg_generate_document_reference
    BEFORE INSERT ON documents
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_document_reference();

-- Function to update document timestamps
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document timestamp updates
CREATE TRIGGER trg_update_document_timestamp
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Trigger for template timestamp updates
CREATE TRIGGER trg_update_template_timestamp
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Function to create initial version when document is created
CREATE OR REPLACE FUNCTION create_initial_document_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO document_versions (
        document_id,
        version_number,
        file_name,
        content_type,
        file_size,
        storage_path,
        checksum,
        change_notes,
        uploaded_by,
        uploaded_at
    ) VALUES (
        NEW.id,
        1,
        NEW.file_name,
        NEW.content_type,
        NEW.file_size,
        NEW.storage_path,
        NEW.checksum,
        'Initial upload',
        NEW.uploaded_by,
        NEW.uploaded_at
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create initial version
CREATE TRIGGER trg_create_initial_version
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_document_version();

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_version_number INT,
    p_user_id UUID,
    p_action VARCHAR(30),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO document_access_logs (
        document_id, version_number, user_id, action,
        ip_address, user_agent, details
    ) VALUES (
        p_document_id, p_version_number, p_user_id, p_action,
        p_ip_address, p_user_agent, p_details
    )
    RETURNING id INTO log_id;

    -- Update last accessed info on document
    UPDATE documents
    SET last_accessed_at = CURRENT_TIMESTAMP,
        last_accessed_by = p_user_id
    WHERE id = p_document_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for documents with version count
CREATE OR REPLACE VIEW v_documents_with_versions AS
SELECT
    d.*,
    COUNT(dv.id) as version_count,
    MAX(dv.uploaded_at) as last_version_at
FROM documents d
LEFT JOIN document_versions dv ON dv.document_id = d.id
WHERE d.deleted = FALSE
GROUP BY d.id;

-- View for expiring documents (within 30 days)
CREATE OR REPLACE VIEW v_expiring_documents AS
SELECT
    d.*,
    d.valid_until - CURRENT_DATE as days_until_expiry
FROM documents d
WHERE d.deleted = FALSE
AND d.status = 'ACTIVE'
AND d.valid_until IS NOT NULL
AND d.valid_until <= CURRENT_DATE + INTERVAL '30 days'
AND d.valid_until > CURRENT_DATE
ORDER BY d.valid_until;

-- View for expired documents
CREATE OR REPLACE VIEW v_expired_documents AS
SELECT
    d.*,
    CURRENT_DATE - d.valid_until as days_expired
FROM documents d
WHERE d.deleted = FALSE
AND d.valid_until IS NOT NULL
AND d.valid_until < CURRENT_DATE
ORDER BY d.valid_until DESC;

-- View for documents pending acknowledgment
CREATE OR REPLACE VIEW v_pending_acknowledgments AS
SELECT
    d.*,
    e.employee_id,
    e.first_name || ' ' || e.last_name as employee_name
FROM documents d
CROSS JOIN (
    -- This would join with employee table in production
    SELECT
        id as employee_id,
        'Employee' as first_name,
        'Name' as last_name
    FROM (VALUES (gen_random_uuid())) as t(id)
    WHERE FALSE -- Placeholder, remove in production
) e
WHERE d.deleted = FALSE
AND d.requires_acknowledgment = TRUE
AND d.status = 'ACTIVE'
AND NOT EXISTS (
    SELECT 1 FROM document_acknowledgments da
    WHERE da.document_id = d.id
    AND da.employee_id = e.employee_id
);

-- View for document statistics by category
CREATE OR REPLACE VIEW v_document_stats_by_category AS
SELECT
    tenant_id,
    category,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_documents,
    COUNT(*) FILTER (WHERE status = 'ARCHIVED') as archived_documents,
    COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_documents,
    SUM(file_size) as total_size_bytes,
    AVG(current_version) as avg_versions
FROM documents
WHERE deleted = FALSE
GROUP BY tenant_id, category;

-- =====================================================
-- SEED RETENTION POLICIES
-- =====================================================

-- Note: These will be inserted per-tenant during onboarding
-- This is a reference for default South African compliance policies

COMMENT ON TABLE document_retention_policies IS 'Default retention periods per South African law:
- Employment contracts: 5 years after termination (BCEA)
- Payroll records: 5 years (Tax Act)
- IRP5 certificates: 5 years (Tax Act)
- UIF declarations: 5 years (UIF Act)
- Leave records: 3 years (BCEA)
- Time and attendance: 3 years (BCEA)
- Medical certificates: 3 years
- Disciplinary records: Duration of employment + 3 years
- ID documents: Duration of employment
- Training records: Duration of employment + 3 years
- Health and safety records: 40 years (OHS Act)';
