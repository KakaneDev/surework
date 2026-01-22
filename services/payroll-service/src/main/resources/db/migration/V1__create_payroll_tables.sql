-- Payroll Service Database Schema
-- Implements User Story 3: Payroll Processing with South African PAYE compliance

-- Helper function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tax Tables
CREATE TABLE IF NOT EXISTS tax_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_year VARCHAR(20) NOT NULL UNIQUE,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    primary_rebate DECIMAL(12,2) NOT NULL,
    secondary_rebate DECIMAL(12,2) NOT NULL,
    tertiary_rebate DECIMAL(12,2) NOT NULL,
    threshold_under_65 DECIMAL(12,2) NOT NULL,
    threshold_65_to_74 DECIMAL(12,2) NOT NULL,
    threshold_75_and_over DECIMAL(12,2) NOT NULL,
    medical_credit_main_member DECIMAL(10,2) NOT NULL,
    medical_credit_first_dependant DECIMAL(10,2) NOT NULL,
    medical_credit_additional DECIMAL(10,2) NOT NULL,
    uif_monthly_ceiling DECIMAL(12,2) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tax_tables_year ON tax_tables(start_year) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tax_tables_active ON tax_tables(is_active, effective_from) WHERE deleted = FALSE;

-- Tax Brackets
CREATE TABLE IF NOT EXISTS tax_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_table_id UUID NOT NULL REFERENCES tax_tables(id),
    min_income DECIMAL(15,2) NOT NULL,
    max_income DECIMAL(15,2),
    rate DECIMAL(5,4) NOT NULL,
    base_tax DECIMAL(15,2) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tax_brackets_table ON tax_brackets(tax_table_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tax_brackets_income ON tax_brackets(min_income) WHERE deleted = FALSE;

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_number VARCHAR(50) NOT NULL UNIQUE,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_paye DECIMAL(15,2) DEFAULT 0,
    total_uif_employee DECIMAL(15,2) DEFAULT 0,
    total_uif_employer DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    total_employer_cost DECIMAL(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_payroll_run_status CHECK (status IN ('DRAFT', 'PROCESSING', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_year, period_month) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payroll_runs_payment_date ON payroll_runs(payment_date) WHERE deleted = FALSE;

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id),
    payslip_number VARCHAR(50) NOT NULL UNIQUE,
    employee_id UUID NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    id_number VARCHAR(20),
    tax_number VARCHAR(20),
    department VARCHAR(100),
    job_title VARCHAR(100),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    gross_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
    paye DECIMAL(12,2) NOT NULL DEFAULT 0,
    uif_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
    uif_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
    pension_fund DECIMAL(12,2) DEFAULT 0,
    medical_aid DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
    employer_pension DECIMAL(12,2) DEFAULT 0,
    employer_medical DECIMAL(12,2) DEFAULT 0,
    sdl DECIMAL(12,2) DEFAULT 0,
    total_employer_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    ytd_gross DECIMAL(15,2) DEFAULT 0,
    ytd_paye DECIMAL(15,2) DEFAULT 0,
    ytd_uif DECIMAL(15,2) DEFAULT 0,
    ytd_net DECIMAL(15,2) DEFAULT 0,
    taxable_income DECIMAL(12,2) DEFAULT 0,
    annual_equivalent DECIMAL(15,2) DEFAULT 0,
    tax_rebate DECIMAL(12,2) DEFAULT 0,
    medical_tax_credit DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    bank_account VARCHAR(30),
    bank_name VARCHAR(100),
    branch_code VARCHAR(10),
    notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_payslip_status CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'EXCLUDED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS idx_payslips_payroll_run ON payslips(payroll_run_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_year, period_month) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status) WHERE deleted = FALSE;

-- Payslip Lines
CREATE TABLE IF NOT EXISTS payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    line_type VARCHAR(30) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2),
    rate DECIMAL(12,2),
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    ytd_amount DECIMAL(15,2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_pensionable BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    notes VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_line_type CHECK (line_type IN (
        'EARNING', 'ALLOWANCE', 'BONUS', 'OVERTIME', 'COMMISSION',
        'STATUTORY_DEDUCTION', 'VOLUNTARY_DEDUCTION', 'LOAN_DEDUCTION', 'OTHER_DEDUCTION',
        'EMPLOYER_CONTRIBUTION', 'REIMBURSEMENT', 'BENEFIT_IN_KIND'
    ))
);

CREATE INDEX IF NOT EXISTS idx_payslip_lines_payslip ON payslip_lines(payslip_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payslip_lines_type ON payslip_lines(line_type) WHERE deleted = FALSE;

-- Triggers for updated_at
CREATE TRIGGER update_tax_tables_updated_at
    BEFORE UPDATE ON tax_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_brackets_updated_at
    BEFORE UPDATE ON tax_brackets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at
    BEFORE UPDATE ON payroll_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslip_lines_updated_at
    BEFORE UPDATE ON payslip_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
