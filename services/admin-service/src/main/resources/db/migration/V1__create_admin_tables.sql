-- =====================================================
-- System Administration Service Database Schema
-- SureWork ERP Platform
-- Multi-tenant Management, RBAC, Audit Logging
-- =====================================================

-- Tenants table - company/organization records
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),

    -- South African Company Details
    registration_number VARCHAR(50),  -- CIPC registration
    tax_number VARCHAR(20),           -- SARS tax number
    vat_number VARCHAR(20),
    uif_reference VARCHAR(20),        -- UIF employer reference
    sdl_number VARCHAR(20),           -- Skills Development Levy
    paye_reference VARCHAR(20),       -- PAYE employer reference

    -- Company Classification
    company_type VARCHAR(30),
    industry_sector VARCHAR(50),
    sic_code VARCHAR(10),

    -- Physical Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'South Africa',

    -- Postal Address
    postal_line1 VARCHAR(255),
    postal_line2 VARCHAR(255),
    postal_city VARCHAR(100),
    postal_province VARCHAR(50),
    postal_code_value VARCHAR(10),
    postal_country VARCHAR(100),

    -- Contact
    phone_number VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Database Schema
    db_schema VARCHAR(100) NOT NULL,

    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'FREE',
    license_key VARCHAR(255),
    max_users INT DEFAULT 5,
    subscription_start DATE,
    subscription_end DATE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    activated_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(10),
    secondary_color VARCHAR(10),

    -- Settings
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy',
    currency_code VARCHAR(3) DEFAULT 'ZAR',
    language_code VARCHAR(10) DEFAULT 'en-ZA',
    features TEXT[],

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,

    CONSTRAINT chk_company_type CHECK (company_type IN (
        'SOLE_PROPRIETOR', 'PARTNERSHIP', 'PRIVATE_COMPANY', 'PUBLIC_COMPANY',
        'NON_PROFIT', 'COOPERATIVE', 'TRUST', 'CLOSE_CORPORATION',
        'STATE_OWNED', 'FOREIGN_COMPANY'
    )),
    CONSTRAINT chk_subscription_tier CHECK (subscription_tier IN (
        'FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'UNLIMITED'
    )),
    CONSTRAINT chk_tenant_status CHECK (status IN (
        'PENDING', 'ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'TERMINATED'
    ))
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_permission_category CHECK (category IN (
        'SYSTEM', 'TENANT', 'USER', 'EMPLOYEE', 'LEAVE', 'PAYROLL',
        'TIME', 'RECRUITMENT', 'DOCUMENT', 'REPORT', 'FINANCE', 'ACCOUNTING', 'SUPPORT'
    )),
    CONSTRAINT chk_permission_action CHECK (action IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'PROCESS',
        'EXPORT', 'IMPORT', 'MANAGE', 'ALL'
    ))
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id),
    active BOOLEAN DEFAULT TRUE,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,

    CONSTRAINT uk_role_code_tenant UNIQUE (tenant_id, code)
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    phone_number VARCHAR(20),
    mobile_number VARCHAR(20),
    avatar_url VARCHAR(500),
    employee_id UUID,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified BOOLEAN DEFAULT FALSE,

    -- Authentication
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    password_expires_at TIMESTAMP WITH TIME ZONE,
    must_change_password BOOLEAN DEFAULT FALSE,

    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[],
    password_history TEXT[],

    -- Preferences
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    language VARCHAR(10) DEFAULT 'en-ZA',
    date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy',
    notify_email BOOLEAN DEFAULT TRUE,
    notify_sms BOOLEAN DEFAULT FALSE,
    notify_push BOOLEAN DEFAULT TRUE,

    -- System flags
    is_system_user BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID,

    CONSTRAINT chk_user_status CHECK (status IN (
        'PENDING', 'ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'TERMINATED'
    ))
);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,

    -- Event
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL,
    event_action VARCHAR(100) NOT NULL,

    -- Resource
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    resource_name VARCHAR(255),

    -- Actor
    user_id UUID,
    username VARCHAR(100),
    user_email VARCHAR(255),
    actor_type VARCHAR(20) DEFAULT 'USER',

    -- Request
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_id VARCHAR(50),

    -- Changes
    old_value JSONB,
    new_value JSONB,
    changes JSONB,

    -- Status
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_code VARCHAR(50),

    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms BIGINT,

    -- Context
    context JSONB
);

-- API Keys for integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,  -- First 8 chars for identification
    scopes TEXT[],
    rate_limit INT DEFAULT 1000,  -- Requests per minute
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_api_key_prefix UNIQUE (tenant_id, key_prefix)
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(255)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),  -- NULL for system-wide
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'STRING',  -- STRING, NUMBER, BOOLEAN, JSON
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_config_key_tenant UNIQUE (tenant_id, config_key)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Tenants
CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subscription ON tenants(subscription_tier, subscription_end);

-- Permissions
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_category ON permissions(category);

-- Roles
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_system ON roles(is_system_role);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_employee ON users(employee_id);

-- Audit logs (partition-friendly indexes)
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_type, event_category);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- API Keys
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE revoked = FALSE;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_update_tenant_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_timestamp();

CREATE TRIGGER trg_update_role_timestamp
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_timestamp();

CREATE TRIGGER trg_update_user_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_timestamp();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR (revoked = TRUE AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '7 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE timestamp < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
