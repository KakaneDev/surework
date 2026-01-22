-- ============================================================================
-- Time and Attendance Service Database Schema
-- Compliant with South African BCEA Regulations
-- ============================================================================

-- Time Entries Table (Clock In/Out Records)
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_number VARCHAR(20),
    employee_name VARCHAR(100),
    work_date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    scheduled_start TIME,
    scheduled_end TIME,
    entry_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Hours calculations (BCEA compliant)
    total_hours DECIMAL(5, 2),
    regular_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2),
    night_hours DECIMAL(5, 2),      -- BCEA 18:00-06:00
    sunday_hours DECIMAL(5, 2),
    public_holiday_hours DECIMAL(5, 2),

    -- Break tracking (BCEA Section 14)
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    break_duration_minutes INTEGER,
    unpaid_break_minutes INTEGER,

    -- Location tracking
    clock_in_latitude DECIMAL(10, 7),
    clock_in_longitude DECIMAL(10, 7),
    clock_in_location VARCHAR(200),
    clock_out_latitude DECIMAL(10, 7),
    clock_out_longitude DECIMAL(10, 7),
    clock_out_location VARCHAR(200),

    -- Device/method
    clock_method VARCHAR(20) DEFAULT 'WEB',
    device_id VARCHAR(100),
    ip_address VARCHAR(45),

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Notes
    notes TEXT,
    manager_notes TEXT,

    -- Flags
    is_late BOOLEAN DEFAULT false,
    late_minutes INTEGER,
    is_early_departure BOOLEAN DEFAULT false,
    early_departure_minutes INTEGER,
    is_public_holiday BOOLEAN DEFAULT false,
    public_holiday_name VARCHAR(100),
    is_edited BOOLEAN DEFAULT false,
    edited_by UUID,
    edit_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_entry_type CHECK (entry_type IN (
        'REGULAR', 'OVERTIME', 'WEEKEND', 'PUBLIC_HOLIDAY',
        'STANDBY', 'CALL_OUT', 'TRAINING', 'TRAVEL'
    )),
    CONSTRAINT chk_entry_status CHECK (status IN (
        'ACTIVE', 'COMPLETED', 'PENDING_APPROVAL', 'APPROVED',
        'REJECTED', 'EDITED', 'CANCELLED'
    )),
    CONSTRAINT chk_clock_method CHECK (clock_method IN (
        'WEB', 'MOBILE_APP', 'BIOMETRIC', 'RFID', 'MANUAL', 'KIOSK'
    ))
);

-- Timesheets Table (Period Summaries)
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_reference VARCHAR(30) NOT NULL UNIQUE,
    employee_id UUID NOT NULL,
    employee_number VARCHAR(20),
    employee_name VARCHAR(100),
    department_id UUID,
    department_name VARCHAR(100),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    period_week INTEGER,

    -- Hour totals
    total_hours DECIMAL(7, 2) DEFAULT 0,
    regular_hours DECIMAL(7, 2) DEFAULT 0,
    overtime_hours DECIMAL(7, 2) DEFAULT 0,
    night_hours DECIMAL(7, 2) DEFAULT 0,
    sunday_hours DECIMAL(7, 2) DEFAULT 0,
    public_holiday_hours DECIMAL(7, 2) DEFAULT 0,

    -- Leave hours
    annual_leave_hours DECIMAL(7, 2) DEFAULT 0,
    sick_leave_hours DECIMAL(7, 2) DEFAULT 0,
    family_leave_hours DECIMAL(7, 2) DEFAULT 0,
    unpaid_leave_hours DECIMAL(7, 2) DEFAULT 0,

    -- Day counts
    days_worked INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    early_departures INTEGER DEFAULT 0,
    working_days_in_period INTEGER,

    -- Status and workflow
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Payroll integration
    payroll_processed BOOLEAN DEFAULT false,
    payroll_run_id UUID,
    payroll_processed_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    employee_notes TEXT,
    manager_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_period_type CHECK (period_type IN ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY')),
    CONSTRAINT chk_timesheet_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED',
        'REJECTED', 'PROCESSED', 'LOCKED'
    ))
);

-- Work Schedules Table
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_number VARCHAR(20),
    employee_name VARCHAR(100),
    shift_id UUID,
    shift_name VARCHAR(100),
    schedule_type VARCHAR(20) NOT NULL,

    -- Standard hours (BCEA compliant: 9hrs/day, 45hrs/week max)
    standard_start_time TIME,
    standard_end_time TIME,
    hours_per_day INTEGER DEFAULT 9,
    hours_per_week INTEGER DEFAULT 45,

    -- Working days
    works_monday BOOLEAN DEFAULT true,
    works_tuesday BOOLEAN DEFAULT true,
    works_wednesday BOOLEAN DEFAULT true,
    works_thursday BOOLEAN DEFAULT true,
    works_friday BOOLEAN DEFAULT true,
    works_saturday BOOLEAN DEFAULT false,
    works_sunday BOOLEAN DEFAULT false,

    -- Flexible hours
    is_flexible BOOLEAN DEFAULT false,
    flex_start_earliest TIME,
    flex_start_latest TIME,
    core_hours_start TIME,
    core_hours_end TIME,

    -- Break rules (BCEA Section 14)
    lunch_break_start TIME,
    lunch_break_duration_minutes INTEGER DEFAULT 60,
    lunch_break_paid BOOLEAN DEFAULT false,

    -- Validity
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_schedule_type CHECK (schedule_type IN (
        'STANDARD', 'SHIFT', 'FLEXIBLE', 'COMPRESSED', 'PART_TIME', 'REMOTE', 'HYBRID'
    ))
);

-- Public Holidays Table (South African)
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    year INTEGER NOT NULL,
    holiday_type VARCHAR(20) NOT NULL,
    description TEXT,
    is_substitute BOOLEAN DEFAULT false,
    original_date DATE,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_holiday_type CHECK (holiday_type IN ('FIXED', 'CALCULATED', 'SPECIAL'))
);

-- Create indexes
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id) WHERE deleted = false;
CREATE INDEX idx_time_entries_date ON time_entries(work_date) WHERE deleted = false;
CREATE INDEX idx_time_entries_status ON time_entries(status) WHERE deleted = false;
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, work_date) WHERE deleted = false;

CREATE INDEX idx_timesheets_employee ON timesheets(employee_id) WHERE deleted = false;
CREATE INDEX idx_timesheets_period ON timesheets(period_start, period_end) WHERE deleted = false;
CREATE INDEX idx_timesheets_status ON timesheets(status) WHERE deleted = false;
CREATE INDEX idx_timesheets_month ON timesheets(period_year, period_month) WHERE deleted = false;

CREATE INDEX idx_work_schedules_employee ON work_schedules(employee_id) WHERE deleted = false;
CREATE INDEX idx_work_schedules_active ON work_schedules(employee_id, is_active) WHERE deleted = false;

CREATE INDEX idx_public_holidays_date ON public_holidays(holiday_date) WHERE is_active = true;
CREATE INDEX idx_public_holidays_year ON public_holidays(year) WHERE is_active = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_time_entries_updated
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_timesheets_updated
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_work_schedules_updated
    BEFORE UPDATE ON work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE time_entries IS 'Individual clock in/out records for employees';
COMMENT ON TABLE timesheets IS 'Aggregated time summaries for payroll periods';
COMMENT ON TABLE work_schedules IS 'Employee work schedule definitions (BCEA compliant)';
COMMENT ON TABLE public_holidays IS 'South African public holidays per Public Holidays Act';
