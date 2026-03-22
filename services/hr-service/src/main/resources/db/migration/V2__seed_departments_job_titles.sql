-- Seed data for departments and job titles

-- Root departments
INSERT INTO departments (id, code, name, description) VALUES
    (gen_random_uuid(), 'EXEC', 'Executive', 'Executive leadership team'),
    (gen_random_uuid(), 'HR', 'Human Resources', 'HR and people management'),
    (gen_random_uuid(), 'FIN', 'Finance', 'Finance and accounting'),
    (gen_random_uuid(), 'OPS', 'Operations', 'Business operations'),
    (gen_random_uuid(), 'SALES', 'Sales', 'Sales and business development'),
    (gen_random_uuid(), 'IT', 'Information Technology', 'IT and systems')
ON CONFLICT (code) DO NOTHING;

-- Job titles
INSERT INTO job_titles (id, code, title, level, department_id) VALUES
    -- Executive
    (gen_random_uuid(), 'CEO', 'Chief Executive Officer', 'EXECUTIVE', (SELECT id FROM departments WHERE code = 'EXEC')),
    (gen_random_uuid(), 'CFO', 'Chief Financial Officer', 'EXECUTIVE', (SELECT id FROM departments WHERE code = 'FIN')),
    (gen_random_uuid(), 'COO', 'Chief Operating Officer', 'EXECUTIVE', (SELECT id FROM departments WHERE code = 'OPS')),

    -- HR
    (gen_random_uuid(), 'HR-MGR', 'HR Manager', 'MANAGER', (SELECT id FROM departments WHERE code = 'HR')),
    (gen_random_uuid(), 'HR-OFF', 'HR Officer', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'HR')),
    (gen_random_uuid(), 'RECRUIT', 'Recruiter', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'HR')),

    -- Finance
    (gen_random_uuid(), 'FIN-MGR', 'Finance Manager', 'MANAGER', (SELECT id FROM departments WHERE code = 'FIN')),
    (gen_random_uuid(), 'ACCT', 'Accountant', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'FIN')),
    (gen_random_uuid(), 'PAY-OFF', 'Payroll Officer', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'FIN')),

    -- Operations
    (gen_random_uuid(), 'OPS-MGR', 'Operations Manager', 'MANAGER', (SELECT id FROM departments WHERE code = 'OPS')),
    (gen_random_uuid(), 'OPS-SUP', 'Operations Supervisor', 'LEAD', (SELECT id FROM departments WHERE code = 'OPS')),
    (gen_random_uuid(), 'OPS-ASST', 'Operations Assistant', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'OPS')),

    -- Sales
    (gen_random_uuid(), 'SALES-MGR', 'Sales Manager', 'MANAGER', (SELECT id FROM departments WHERE code = 'SALES')),
    (gen_random_uuid(), 'SALES-REP', 'Sales Representative', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'SALES')),

    -- IT
    (gen_random_uuid(), 'IT-MGR', 'IT Manager', 'MANAGER', (SELECT id FROM departments WHERE code = 'IT')),
    (gen_random_uuid(), 'DEV-SNR', 'Senior Developer', 'SENIOR', (SELECT id FROM departments WHERE code = 'IT')),
    (gen_random_uuid(), 'DEV', 'Developer', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'IT')),
    (gen_random_uuid(), 'SYS-ADM', 'System Administrator', 'INDIVIDUAL_CONTRIBUTOR', (SELECT id FROM departments WHERE code = 'IT'))
ON CONFLICT (code) DO NOTHING;
