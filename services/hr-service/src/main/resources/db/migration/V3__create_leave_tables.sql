-- Leave Management tables
-- Implements User Story 2: Leave Management with BCEA compliance

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason VARCHAR(500),
    approver_id UUID,
    approval_date DATE,
    approver_comment VARCHAR(500),
    cancellation_date DATE,
    cancellation_reason VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_leave_type CHECK (leave_type IN ('ANNUAL', 'SICK', 'FAMILY_RESPONSIBILITY', 'MATERNITY', 'PARENTAL', 'UNPAID', 'STUDY')),
    CONSTRAINT chk_leave_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date) WHERE deleted = FALSE;

-- Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(30) NOT NULL,
    year INTEGER NOT NULL,
    cycle_start_date DATE, -- For sick leave 36-month cycle tracking
    entitlement DECIMAL(5,2) NOT NULL DEFAULT 0,
    used DECIMAL(5,2) NOT NULL DEFAULT 0,
    pending DECIMAL(5,2) NOT NULL DEFAULT 0,
    carried_over DECIMAL(5,2) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_leave_balance UNIQUE (employee_id, leave_type, year),
    CONSTRAINT chk_balance_leave_type CHECK (leave_type IN ('ANNUAL', 'SICK', 'FAMILY_RESPONSIBILITY', 'MATERNITY', 'PARENTAL', 'UNPAID', 'STUDY'))
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(employee_id, year) WHERE deleted = FALSE;

-- Triggers for updated_at
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
