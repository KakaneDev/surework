-- ============================================================================
-- Employee Service Database Schema
-- ============================================================================

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    id_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    street_address VARCHAR(255),
    suburb VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    hire_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    employment_type VARCHAR(30),
    department_id UUID REFERENCES departments(id),
    job_title VARCHAR(100),
    manager_id UUID REFERENCES employees(id),
    basic_salary DECIMAL(15, 2),
    pay_frequency VARCHAR(20),
    tax_number VARCHAR(20),
    tax_status VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch_code VARCHAR(20),
    bank_account_type VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED'))
);

-- Indexes
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_name ON employees(last_name, first_name);

-- Sequence for employee numbers
CREATE SEQUENCE employee_number_seq START WITH 1001;
