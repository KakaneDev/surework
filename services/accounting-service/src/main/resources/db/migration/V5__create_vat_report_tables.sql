-- VAT Report Tables
-- Implements SARS VAT201 reporting for South African businesses
-- VAT Rate: 15% standard (as of 2018)

-- VAT Reports (VAT201 submissions)
CREATE TABLE IF NOT EXISTS vat_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Report period
    vat_period VARCHAR(10) NOT NULL,           -- e.g., "2024-01" for January 2024
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Report status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- VAT201 Box Values (SARS format)
    -- Section A: Output Tax (VAT charged on sales)
    box1_standard_rated_supplies DECIMAL(15,2) DEFAULT 0,    -- Standard rated supplies (excluding VAT)
    box1a_output_vat DECIMAL(15,2) DEFAULT 0,                -- Output VAT on standard rated (15%)
    box2_zero_rated_supplies DECIMAL(15,2) DEFAULT 0,        -- Zero-rated supplies
    box3_exempt_supplies DECIMAL(15,2) DEFAULT 0,            -- Exempt supplies
    box4_total_supplies DECIMAL(15,2) DEFAULT 0,             -- Total supplies (1+2+3)

    -- Section B: Input Tax (VAT paid on purchases)
    box5_capital_goods DECIMAL(15,2) DEFAULT 0,              -- Capital goods and services
    box5a_input_vat_capital DECIMAL(15,2) DEFAULT 0,         -- Input VAT on capital goods
    box6_other_goods DECIMAL(15,2) DEFAULT 0,                -- Other goods and services
    box6a_input_vat_other DECIMAL(15,2) DEFAULT 0,           -- Input VAT on other goods
    box7_total_input_vat DECIMAL(15,2) DEFAULT 0,            -- Total input VAT (5a+6a)

    -- Section C: Adjustments
    box8_change_in_use_increase DECIMAL(15,2) DEFAULT 0,     -- Change in use (output increase)
    box9_change_in_use_decrease DECIMAL(15,2) DEFAULT 0,     -- Change in use (input increase)
    box10_bad_debts_recovered DECIMAL(15,2) DEFAULT 0,       -- Bad debts recovered
    box11_bad_debts_written_off DECIMAL(15,2) DEFAULT 0,     -- Bad debts written off
    box12_other_adjustments DECIMAL(15,2) DEFAULT 0,         -- Other adjustments
    box13_total_adjustments DECIMAL(15,2) DEFAULT 0,         -- Total adjustments

    -- Section D: Calculation
    box14_output_vat_payable DECIMAL(15,2) DEFAULT 0,        -- Output VAT payable (1a + adjustments)
    box15_input_vat_deductible DECIMAL(15,2) DEFAULT 0,      -- Input VAT deductible (7 + adjustments)
    box16_vat_payable DECIMAL(15,2) DEFAULT 0,               -- VAT payable to SARS (14-15, if positive)
    box17_vat_refundable DECIMAL(15,2) DEFAULT 0,            -- VAT refundable (15-14, if positive)

    -- Section E: Diesel Refund (optional)
    box18_diesel_refund DECIMAL(15,2) DEFAULT 0,

    -- Payment details
    payment_due_date DATE,
    payment_reference VARCHAR(50),
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(15,2),

    -- Submission details
    submitted_at TIMESTAMPTZ,
    submitted_by UUID,
    sars_reference VARCHAR(50),
    acknowledgment_number VARCHAR(50),

    -- Generation details
    generated_at TIMESTAMPTZ,
    generated_by UUID,

    -- Notes
    notes VARCHAR(2000),

    -- Multi-tenant
    tenant_id UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_vat_report_period UNIQUE (tenant_id, vat_period),
    CONSTRAINT chk_vat_report_status CHECK (status IN ('DRAFT', 'PREVIEW', 'GENERATED', 'SUBMITTED', 'PAID', 'AMENDED'))
);

CREATE INDEX IF NOT EXISTS idx_vat_reports_period ON vat_reports(vat_period) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_vat_reports_status ON vat_reports(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_vat_reports_tenant ON vat_reports(tenant_id) WHERE deleted = FALSE;

-- VAT Report Line Items (detailed breakdown by account)
CREATE TABLE IF NOT EXISTS vat_report_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vat_report_id UUID NOT NULL REFERENCES vat_reports(id) ON DELETE CASCADE,

    -- Account reference
    account_id UUID REFERENCES accounts(id),
    account_code VARCHAR(20),
    account_name VARCHAR(200),

    -- VAT category
    vat_category VARCHAR(20) NOT NULL,

    -- Amounts
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Which box this contributes to
    vat_box VARCHAR(10) NOT NULL,

    -- Transaction count for this line
    transaction_count INT DEFAULT 0,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_vat_line_category CHECK (vat_category IN (
        'STANDARD', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE', 'INPUT_VAT', 'OUTPUT_VAT', 'CAPITAL_INPUT'
    ))
);

CREATE INDEX IF NOT EXISTS idx_vat_report_lines_report ON vat_report_lines(vat_report_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_vat_report_lines_account ON vat_report_lines(account_id) WHERE deleted = FALSE;

-- VAT Report Transactions (source journal entries)
CREATE TABLE IF NOT EXISTS vat_report_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vat_report_id UUID NOT NULL REFERENCES vat_reports(id) ON DELETE CASCADE,

    -- Journal entry reference
    journal_entry_id UUID REFERENCES journal_entries(id),
    journal_entry_number VARCHAR(50),
    transaction_date DATE NOT NULL,

    -- Account and VAT details
    account_id UUID REFERENCES accounts(id),
    account_code VARCHAR(20),
    vat_category VARCHAR(20) NOT NULL,

    -- Amounts
    net_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL,
    gross_amount DECIMAL(15,2) NOT NULL,

    -- Description
    description VARCHAR(500),
    reference VARCHAR(100),

    -- Which box this contributes to
    vat_box VARCHAR(10) NOT NULL,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vat_report_txns_report ON vat_report_transactions(vat_report_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_vat_report_txns_journal ON vat_report_transactions(journal_entry_id) WHERE deleted = FALSE;

-- Triggers for updated_at (drop if exists for idempotency)
DROP TRIGGER IF EXISTS update_vat_reports_updated_at ON vat_reports;
CREATE TRIGGER update_vat_reports_updated_at
    BEFORE UPDATE ON vat_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vat_report_lines_updated_at ON vat_report_lines;
CREATE TRIGGER update_vat_report_lines_updated_at
    BEFORE UPDATE ON vat_report_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vat_report_transactions_updated_at ON vat_report_transactions;
CREATE TRIGGER update_vat_report_transactions_updated_at
    BEFORE UPDATE ON vat_report_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
