-- Accounting Service Database Schema
-- Implements double-entry bookkeeping with South African VAT compliance

-- Helper function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'FUTURE',
    is_adjustment_period BOOLEAN DEFAULT FALSE,
    is_year_end BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMPTZ,
    closed_by UUID,
    reopened_at TIMESTAMPTZ,
    reopened_by UUID,
    notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_fiscal_period UNIQUE (fiscal_year, period_number),
    CONSTRAINT chk_period_status CHECK (status IN ('FUTURE', 'OPEN', 'CLOSED', 'LOCKED'))
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year ON fiscal_periods(fiscal_year) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_dates ON fiscal_periods(start_date, end_date) WHERE deleted = FALSE;

-- Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    account_type VARCHAR(20) NOT NULL,
    account_subtype VARCHAR(50),
    normal_balance VARCHAR(10) NOT NULL,
    parent_id UUID REFERENCES accounts(id),
    is_header BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    current_balance DECIMAL(15,2) DEFAULT 0,
    ytd_debit DECIMAL(15,2) DEFAULT 0,
    ytd_credit DECIMAL(15,2) DEFAULT 0,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    vat_category VARCHAR(20),
    vat_rate DECIMAL(5,4),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(30),
    bank_branch_code VARCHAR(10),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_account_type CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    CONSTRAINT chk_normal_balance CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_vat_category CHECK (vat_category IS NULL OR vat_category IN (
        'STANDARD', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE', 'INPUT_VAT', 'OUTPUT_VAT'
    ))
);

CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(account_code) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id) WHERE deleted = FALSE;

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    posting_date DATE,
    description VARCHAR(500) NOT NULL,
    reference VARCHAR(100),
    entry_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    fiscal_period_id UUID REFERENCES fiscal_periods(id),
    source_document VARCHAR(50),
    source_id UUID,
    posted_by UUID,
    posted_at TIMESTAMPTZ,
    reversed_by UUID,
    reversed_at TIMESTAMPTZ,
    reversal_entry_id UUID REFERENCES journal_entries(id),
    notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_entry_type CHECK (entry_type IN (
        'MANUAL', 'SYSTEM', 'PAYROLL', 'INVOICE', 'BILL', 'PAYMENT',
        'RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'CLOSING', 'OPENING', 'REVERSAL'
    )),
    CONSTRAINT chk_entry_status CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON journal_entries(entry_number) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(transaction_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_entries_period ON journal_entries(fiscal_period_id) WHERE deleted = FALSE;

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    description VARCHAR(200),
    debit_amount DECIMAL(15,2),
    credit_amount DECIMAL(15,2),
    cost_center VARCHAR(50),
    department VARCHAR(50),
    project VARCHAR(50),
    vat_amount DECIMAL(15,2),
    vat_category VARCHAR(20),
    net_amount DECIMAL(15,2),
    reference VARCHAR(100),
    external_reference VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(journal_entry_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id) WHERE deleted = FALSE;

-- Triggers for updated_at
CREATE TRIGGER update_fiscal_periods_updated_at
    BEFORE UPDATE ON fiscal_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entry_lines_updated_at
    BEFORE UPDATE ON journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
