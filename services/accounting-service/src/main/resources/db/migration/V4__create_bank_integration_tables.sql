-- Bank Integration Tables
-- Implements Open Banking connectivity via Stitch API
-- Supports bank reconciliation and auto-categorization rules

-- Bank Accounts (linked via Open Banking)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    account_number_masked VARCHAR(20),
    institution_id VARCHAR(50) NOT NULL,
    institution_name VARCHAR(100) NOT NULL,
    institution_logo VARCHAR(500),
    currency VARCHAR(10) DEFAULT 'ZAR',
    account_type VARCHAR(50),

    -- Stitch integration fields
    stitch_account_id VARCHAR(100) NOT NULL UNIQUE,
    stitch_user_id VARCHAR(100),
    stitch_consent_id VARCHAR(100),

    -- Connection status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    sync_error_message VARCHAR(500),
    next_sync_at TIMESTAMPTZ,

    -- Link to Chart of Accounts
    gl_account_id UUID REFERENCES accounts(id),

    -- Balance tracking
    current_balance DECIMAL(15,2),
    available_balance DECIMAL(15,2),
    balance_updated_at TIMESTAMPTZ,

    -- Multi-tenant and audit
    tenant_id UUID,
    created_by UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_bank_account_status CHECK (status IN ('PENDING', 'ACTIVE', 'DISCONNECTED', 'ERROR', 'REAUTH_REQUIRED')),
    CONSTRAINT chk_bank_sync_status CHECK (last_sync_status IS NULL OR last_sync_status IN ('SUCCESS', 'PARTIAL', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_stitch_id ON bank_accounts(stitch_account_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_gl_account ON bank_accounts(gl_account_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts(tenant_id) WHERE deleted = FALSE;

-- Bank Transactions (imported from bank feeds)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),

    -- Transaction identifiers
    external_id VARCHAR(100) NOT NULL,
    reference VARCHAR(200),

    -- Transaction details
    transaction_date DATE NOT NULL,
    posted_date DATE,
    description VARCHAR(500) NOT NULL,
    payee_name VARCHAR(200),
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    running_balance DECIMAL(15,2),

    -- Categorization
    category VARCHAR(100),
    merchant_category_code VARCHAR(10),

    -- Reconciliation status
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'UNRECONCILED',
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID,

    -- Link to journal entry (when reconciled)
    journal_entry_id UUID REFERENCES journal_entries(id),
    matched_account_id UUID REFERENCES accounts(id),

    -- Suggested match (from auto-categorization or bank rules)
    suggested_account_id UUID REFERENCES accounts(id),
    suggestion_confidence DECIMAL(5,2),
    suggestion_source VARCHAR(50),

    -- Multi-tenant
    tenant_id UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_bank_transaction_external UNIQUE (bank_account_id, external_id),
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_reconciliation_status CHECK (reconciliation_status IN (
        'UNRECONCILED', 'SUGGESTED', 'MATCHED', 'RECONCILED', 'EXCLUDED'
    )),
    CONSTRAINT chk_suggestion_source CHECK (suggestion_source IS NULL OR suggestion_source IN (
        'BANK_RULE', 'ML_MODEL', 'HISTORICAL', 'PAYEE_MATCH'
    ))
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(reconciliation_status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_external ON bank_transactions(external_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant ON bank_transactions(tenant_id) WHERE deleted = FALSE;

-- Bank Rules (auto-categorization rules)
CREATE TABLE IF NOT EXISTS bank_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    -- Rule conditions
    condition_field VARCHAR(50) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL,
    condition_value VARCHAR(200) NOT NULL,
    condition_value_secondary VARCHAR(200),

    -- Rule actions
    target_account_id UUID NOT NULL REFERENCES accounts(id),
    payee_name_override VARCHAR(200),

    -- Rule settings
    is_active BOOLEAN DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 100,
    match_count INT DEFAULT 0,
    last_matched_at TIMESTAMPTZ,

    -- Scope
    bank_account_id UUID REFERENCES bank_accounts(id),

    -- Multi-tenant
    tenant_id UUID,
    created_by UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_condition_field CHECK (condition_field IN (
        'DESCRIPTION', 'PAYEE_NAME', 'AMOUNT', 'REFERENCE', 'CATEGORY', 'MCC'
    )),
    CONSTRAINT chk_condition_operator CHECK (condition_operator IN (
        'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'NOT_CONTAINS',
        'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'REGEX'
    ))
);

CREATE INDEX IF NOT EXISTS idx_bank_rules_active ON bank_rules(is_active, priority) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_rules_bank_account ON bank_rules(bank_account_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bank_rules_tenant ON bank_rules(tenant_id) WHERE deleted = FALSE;

-- Triggers for updated_at (drop if exists for idempotency)
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_transactions_updated_at ON bank_transactions;
CREATE TRIGGER update_bank_transactions_updated_at
    BEFORE UPDATE ON bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_rules_updated_at ON bank_rules;
CREATE TRIGGER update_bank_rules_updated_at
    BEFORE UPDATE ON bank_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
