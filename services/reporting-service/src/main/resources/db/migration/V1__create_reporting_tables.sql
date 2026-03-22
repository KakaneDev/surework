-- =====================================================
-- Reporting & Analytics Service Database Schema
-- SureWork ERP Platform
-- South African SME Business Intelligence
-- =====================================================

-- Reports table - generated report metadata
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,

    -- Report identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    report_type VARCHAR(50) NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- Parameters
    parameters JSONB DEFAULT '{}',

    -- Date range
    date_from TIMESTAMP WITH TIME ZONE,
    date_to TIMESTAMP WITH TIME ZONE,

    -- Output format
    output_format VARCHAR(10) NOT NULL DEFAULT 'PDF',

    -- File storage
    file_path VARCHAR(500),
    file_size BIGINT,
    content_type VARCHAR(100),

    -- Generation timing
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    generation_time_ms BIGINT,

    -- Record counts
    row_count INT,
    page_count INT,

    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0,

    -- Scheduling
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_id UUID,

    -- Access control
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_report_category CHECK (category IN (
        'HR', 'PAYROLL', 'LEAVE', 'TIME_ATTENDANCE', 'RECRUITMENT',
        'STATUTORY', 'FINANCIAL', 'COMPLIANCE', 'CUSTOM'
    )),
    CONSTRAINT chk_report_status CHECK (status IN (
        'PENDING', 'QUEUED', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'
    )),
    CONSTRAINT chk_output_format CHECK (output_format IN ('PDF', 'EXCEL', 'CSV', 'JSON', 'HTML')),
    CONSTRAINT chk_visibility CHECK (visibility IN ('PRIVATE', 'DEPARTMENT', 'COMPANY', 'PUBLIC'))
);

-- Report schedules table - recurring report configuration
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Report configuration
    report_type VARCHAR(50) NOT NULL,
    output_format VARCHAR(10) NOT NULL DEFAULT 'PDF',
    parameters JSONB DEFAULT '{}',

    -- Schedule configuration
    frequency VARCHAR(20) NOT NULL,
    run_time TIME,
    day_of_week INT,  -- 1=Monday, 7=Sunday
    day_of_month INT,
    cron_expression VARCHAR(100),
    date_range_type VARCHAR(30) NOT NULL DEFAULT 'PREVIOUS_PERIOD',

    -- Execution tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(20),
    run_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,

    -- Distribution
    email_recipients TEXT[],
    email_subject VARCHAR(255),
    email_body TEXT,
    attach_report BOOLEAN DEFAULT TRUE,
    include_download_link BOOLEAN DEFAULT TRUE,

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_schedule_frequency CHECK (frequency IN (
        'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM'
    )),
    CONSTRAINT chk_date_range_type CHECK (date_range_type IN (
        'PREVIOUS_DAY', 'PREVIOUS_WEEK', 'PREVIOUS_MONTH', 'PREVIOUS_QUARTER',
        'PREVIOUS_YEAR', 'MONTH_TO_DATE', 'QUARTER_TO_DATE', 'YEAR_TO_DATE',
        'PREVIOUS_PERIOD', 'CUSTOM'
    ))
);

-- Add foreign key for schedule reference
ALTER TABLE reports
ADD CONSTRAINT fk_reports_schedule
FOREIGN KEY (schedule_id) REFERENCES report_schedules(id) ON DELETE SET NULL;

-- Dashboards table - dashboard configurations
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(30) NOT NULL,

    -- Layout configuration
    layout JSONB DEFAULT '{}',

    -- Access control
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with_roles TEXT[],

    -- Refresh settings
    auto_refresh BOOLEAN DEFAULT FALSE,
    refresh_interval_seconds INT DEFAULT 300,

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_dashboard_type CHECK (dashboard_type IN (
        'HR_OVERVIEW', 'PAYROLL_SUMMARY', 'LEAVE_MANAGEMENT', 'TIME_ATTENDANCE',
        'RECRUITMENT', 'EXECUTIVE', 'DEPARTMENT', 'EMPLOYEE_SELF_SERVICE',
        'COMPLIANCE', 'CUSTOM'
    ))
);

-- Dashboard widgets table
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description VARCHAR(500),

    widget_type VARCHAR(30) NOT NULL,
    data_source VARCHAR(50) NOT NULL,

    -- Widget configuration
    config JSONB DEFAULT '{}',

    -- Layout position
    position INT DEFAULT 0,
    grid_x INT DEFAULT 0,
    grid_y INT DEFAULT 0,
    grid_width INT DEFAULT 4,
    grid_height INT DEFAULT 3,

    -- Data filtering
    filters JSONB DEFAULT '{}',

    -- Cache settings
    cache_ttl_seconds INT DEFAULT 300,
    last_data_refresh TIMESTAMP WITH TIME ZONE,

    -- Display settings
    show_title BOOLEAN DEFAULT TRUE,
    show_border BOOLEAN DEFAULT TRUE,
    background_color VARCHAR(20),
    text_color VARCHAR(20),

    -- Status
    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Report templates table - predefined report configurations
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- NULL for system templates

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    report_type VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,

    -- Default configuration
    default_parameters JSONB DEFAULT '{}',
    default_output_format VARCHAR(10) DEFAULT 'PDF',
    default_date_range_type VARCHAR(30) DEFAULT 'PREVIOUS_MONTH',

    -- Template content (for HTML templates)
    template_content TEXT,
    template_path VARCHAR(500),

    -- Status
    active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_report_template_code UNIQUE (tenant_id, code)
);

-- Report access log - audit trail for report access
CREATE TABLE report_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

    user_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,  -- VIEW, DOWNLOAD, SHARE, DELETE
    action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ip_address VARCHAR(45),
    user_agent TEXT,

    CONSTRAINT chk_access_action CHECK (action IN ('VIEW', 'DOWNLOAD', 'SHARE', 'DELETE', 'GENERATE'))
);

-- Saved filters table - user-saved filter configurations
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    report_type VARCHAR(50) NOT NULL,
    filter_config JSONB NOT NULL,

    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Reports indexes
CREATE INDEX idx_reports_tenant ON reports(tenant_id);
CREATE INDEX idx_reports_reference ON reports(reference);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_schedule ON reports(schedule_id);
CREATE INDEX idx_reports_expires ON reports(expires_at) WHERE expires_at IS NOT NULL;

-- Report schedules indexes
CREATE INDEX idx_schedules_tenant ON report_schedules(tenant_id);
CREATE INDEX idx_schedules_active ON report_schedules(active);
CREATE INDEX idx_schedules_next_run ON report_schedules(next_run_at) WHERE active = TRUE;
CREATE INDEX idx_schedules_type ON report_schedules(report_type);

-- Dashboards indexes
CREATE INDEX idx_dashboards_tenant ON dashboards(tenant_id);
CREATE INDEX idx_dashboards_type ON dashboards(dashboard_type);
CREATE INDEX idx_dashboards_default ON dashboards(tenant_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);

-- Dashboard widgets indexes
CREATE INDEX idx_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_widgets_data_source ON dashboard_widgets(data_source);

-- Report templates indexes
CREATE INDEX idx_templates_tenant ON report_templates(tenant_id);
CREATE INDEX idx_templates_code ON report_templates(code);
CREATE INDEX idx_templates_type ON report_templates(report_type);
CREATE INDEX idx_templates_system ON report_templates(is_system);

-- Report access logs indexes
CREATE INDEX idx_access_logs_report ON report_access_logs(report_id);
CREATE INDEX idx_access_logs_user ON report_access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON report_access_logs(action_timestamp DESC);

-- Saved filters indexes
CREATE INDEX idx_saved_filters_tenant ON saved_filters(tenant_id);
CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_type ON saved_filters(report_type);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate report reference number
CREATE OR REPLACE FUNCTION generate_report_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    sequence_num INT;
    new_reference VARCHAR(50);
BEGIN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(reference FROM 'RPT-' || year_prefix || '-(\d+)') AS INT)
    ), 0) + 1
    INTO sequence_num
    FROM reports
    WHERE tenant_id = NEW.tenant_id
    AND reference LIKE 'RPT-' || year_prefix || '-%';

    new_reference := 'RPT-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    NEW.reference := new_reference;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for report reference generation
CREATE TRIGGER trg_generate_report_reference
    BEFORE INSERT ON reports
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_report_reference();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_reporting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timestamp triggers
CREATE TRIGGER trg_update_reports_timestamp
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER trg_update_schedules_timestamp
    BEFORE UPDATE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER trg_update_dashboards_timestamp
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER trg_update_widgets_timestamp
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_reporting_timestamp();

-- Function to clean up expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE reports
    SET status = 'EXPIRED'
    WHERE status = 'COMPLETED'
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for pending scheduled reports
CREATE OR REPLACE VIEW v_due_schedules AS
SELECT
    s.*,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.next_run_at)) / 60 as minutes_overdue
FROM report_schedules s
WHERE s.active = TRUE
AND s.next_run_at IS NOT NULL
AND s.next_run_at <= CURRENT_TIMESTAMP
ORDER BY s.next_run_at;

-- View for report statistics by tenant
CREATE OR REPLACE VIEW v_report_stats AS
SELECT
    tenant_id,
    category,
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_reports,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_reports,
    AVG(generation_time_ms) FILTER (WHERE status = 'COMPLETED') as avg_generation_time_ms,
    SUM(file_size) FILTER (WHERE status = 'COMPLETED') as total_file_size,
    MAX(created_at) as last_report_at
FROM reports
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, category;

-- View for dashboard usage
CREATE OR REPLACE VIEW v_dashboard_usage AS
SELECT
    d.id as dashboard_id,
    d.name,
    d.dashboard_type,
    d.tenant_id,
    COUNT(w.id) as widget_count,
    d.is_default,
    d.is_shared,
    d.created_at,
    d.updated_at
FROM dashboards d
LEFT JOIN dashboard_widgets w ON w.dashboard_id = d.id AND w.active = TRUE
GROUP BY d.id;
