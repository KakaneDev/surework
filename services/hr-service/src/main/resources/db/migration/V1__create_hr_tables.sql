-- HR Service tables
-- These tables are created in each tenant's schema

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_department_id UUID REFERENCES departments(id),
    manager_id UUID, -- Will reference employees after that table is created
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id) WHERE deleted = FALSE;

-- Job Titles table
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    department_id UUID REFERENCES departments(id),
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    level VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUAL_CONTRIBUTOR',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_job_level CHECK (level IN ('INTERN', 'JUNIOR', 'INDIVIDUAL_CONTRIBUTOR', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_job_titles_code ON job_titles(code) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_job_titles_department ON job_titles(department_id) WHERE deleted = FALSE;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    id_number VARCHAR(13) NOT NULL UNIQUE,
    passport_number VARCHAR(50),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    marital_status VARCHAR(30) NOT NULL DEFAULT 'SINGLE',

    -- Address
    street_address VARCHAR(255),
    suburb VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),

    -- Employment
    hire_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    employment_type VARCHAR(20) NOT NULL DEFAULT 'PERMANENT',
    department_id UUID REFERENCES departments(id),
    job_title_id UUID REFERENCES job_titles(id),
    manager_id UUID REFERENCES employees(id),

    -- Compensation
    basic_salary DECIMAL(12,2) NOT NULL,
    pay_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',

    -- Tax
    tax_number VARCHAR(20),
    tax_status VARCHAR(20) DEFAULT 'NORMAL',

    -- Banking
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(20),
    bank_branch_code VARCHAR(10),
    bank_account_type VARCHAR(20) DEFAULT 'SAVINGS',

    -- Emergency Contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),

    -- User link
    user_id UUID,

    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    CONSTRAINT chk_marital_status CHECK (marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'DOMESTIC_PARTNERSHIP')),
    CONSTRAINT chk_employment_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED')),
    CONSTRAINT chk_employment_type CHECK (employment_type IN ('PERMANENT', 'CONTRACT', 'TEMPORARY', 'PART_TIME', 'INTERN')),
    CONSTRAINT chk_pay_frequency CHECK (pay_frequency IN ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY')),
    CONSTRAINT chk_tax_status CHECK (tax_status IN ('NORMAL', 'DIRECTIVE')),
    CONSTRAINT chk_bank_account_type CHECK (bank_account_type IN ('SAVINGS', 'CHEQUE', 'TRANSMISSION'))
);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(employee_number) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_id_number ON employees(id_number) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name) WHERE deleted = FALSE;

-- Add foreign key for department manager (now that employees table exists)
ALTER TABLE departments ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_titles_updated_at
    BEFORE UPDATE ON job_titles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
