-- Payroll Accounting Integration Tables
-- Implements Phase 6: Payroll Integration (Automated Journaling)

-- Payroll Account Mapping Configuration
CREATE TABLE IF NOT EXISTS payroll_account_mappings (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    mapping_type VARCHAR(50) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    department_id UUID,
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    version BIGINT DEFAULT 0,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    CONSTRAINT uk_payroll_mapping_type_dept UNIQUE (tenant_id, mapping_type, department_id, deleted)
);

-- Valid mapping types:
-- SALARY_EXPENSE: Gross salaries expense account (debit)
-- PAYE_LIABILITY: PAYE payable to SARS (credit)
-- UIF_EMPLOYEE_LIABILITY: UIF employee portion payable (credit)
-- UIF_EMPLOYER_EXPENSE: UIF employer portion expense (debit)
-- UIF_EMPLOYER_LIABILITY: UIF employer portion payable (credit)
-- SDL_EXPENSE: Skills Development Levy expense (debit)
-- SDL_LIABILITY: Skills Development Levy payable (credit)
-- PENSION_EMPLOYEE_LIABILITY: Pension fund employee deductions payable (credit)
-- PENSION_EMPLOYER_EXPENSE: Pension fund employer contribution expense (debit)
-- PENSION_EMPLOYER_LIABILITY: Pension fund employer contribution payable (credit)
-- MEDICAL_EMPLOYEE_LIABILITY: Medical aid employee deductions payable (credit)
-- MEDICAL_EMPLOYER_EXPENSE: Medical aid employer contribution expense (debit)
-- MEDICAL_EMPLOYER_LIABILITY: Medical aid employer contribution payable (credit)
-- OTHER_DEDUCTIONS_LIABILITY: Other deductions payable (credit)
-- NET_PAY_LIABILITY: Net salaries payable to employees (credit)
-- BANK_ACCOUNT: Bank account for payment (debit when paid)

COMMENT ON TABLE payroll_account_mappings IS 'Maps payroll components to GL accounts for auto-journaling';

CREATE INDEX IF NOT EXISTS idx_payroll_mappings_type ON payroll_account_mappings(mapping_type) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_payroll_mappings_tenant ON payroll_account_mappings(tenant_id) WHERE deleted = false;

-- Payroll Journal Entries Log (for idempotency and audit)
CREATE TABLE IF NOT EXISTS payroll_journal_entries (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    payroll_run_id UUID NOT NULL,
    payroll_run_number VARCHAR(50) NOT NULL,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    total_gross DECIMAL(15, 2) NOT NULL,
    total_paye DECIMAL(15, 2) NOT NULL,
    total_uif DECIMAL(15, 2) NOT NULL,
    total_sdl DECIMAL(15, 2),
    total_pension DECIMAL(15, 2),
    total_medical DECIMAL(15, 2),
    total_net DECIMAL(15, 2) NOT NULL,
    total_employer_cost DECIMAL(15, 2) NOT NULL,
    employee_count INT NOT NULL,
    status VARCHAR(20) DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    version BIGINT DEFAULT 0,
    CONSTRAINT uk_payroll_journal_run UNIQUE (payroll_run_id)
);

COMMENT ON TABLE payroll_journal_entries IS 'Tracks payroll runs that have been journaled for idempotency';

CREATE INDEX IF NOT EXISTS idx_payroll_journal_period ON payroll_journal_entries(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_journal_tenant ON payroll_journal_entries(tenant_id);

-- Payroll Integration Settings
CREATE TABLE IF NOT EXISTS payroll_integration_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE,
    auto_journal_enabled BOOLEAN DEFAULT true,
    journal_on_approval BOOLEAN DEFAULT true,
    create_payment_entry BOOLEAN DEFAULT false,
    default_expense_account_id UUID REFERENCES accounts(id),
    default_liability_account_id UUID REFERENCES accounts(id),
    default_bank_account_id UUID REFERENCES accounts(id),
    journal_description_template VARCHAR(500) DEFAULT 'Payroll for {period} - {runNumber}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    version BIGINT DEFAULT 0
);

COMMENT ON TABLE payroll_integration_settings IS 'Tenant-specific settings for payroll accounting integration';

-- Insert default account mappings using existing chart of accounts
-- These use the SA Standard Chart of Accounts codes seeded in V2
INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'SALARY_EXPENSE',
    id,
    true,
    true
FROM accounts WHERE account_code = '5010' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'PAYE_LIABILITY',
    id,
    true,
    true
FROM accounts WHERE account_code = '2110' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'UIF_EMPLOYEE_LIABILITY',
    id,
    true,
    true
FROM accounts WHERE account_code = '2120' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'UIF_EMPLOYER_EXPENSE',
    id,
    true,
    true
FROM accounts WHERE account_code = '5020' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'UIF_EMPLOYER_LIABILITY',
    id,
    true,
    true
FROM accounts WHERE account_code = '2120' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'SDL_EXPENSE',
    id,
    true,
    true
FROM accounts WHERE account_code = '5030' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'SDL_LIABILITY',
    id,
    true,
    true
FROM accounts WHERE account_code = '2130' AND deleted = false
ON CONFLICT DO NOTHING;

INSERT INTO payroll_account_mappings (id, tenant_id, mapping_type, account_id, is_default, active)
SELECT
    gen_random_uuid(),
    NULL,
    'NET_PAY_LIABILITY',
    id,
    true,
    true
FROM accounts WHERE account_code = '2100' AND deleted = false
ON CONFLICT DO NOTHING;
