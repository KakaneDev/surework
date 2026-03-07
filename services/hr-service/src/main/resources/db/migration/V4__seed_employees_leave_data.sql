-- Seed employees and leave data for development
-- Must match employee IDs from employee-service for integration

-- Insert test employees (matching employee-service IDs)
INSERT INTO employees (
    id, employee_number, first_name, last_name, email, phone, id_number,
    date_of_birth, gender, marital_status, hire_date, status, employment_type,
    basic_salary, pay_frequency, department_id, job_title_id
) VALUES
    -- Sipho Dlamini - CEO
    ('e0000001-0000-0000-0000-000000000001', 'EMP-1001', 'Sipho', 'Dlamini',
     'sipho.dlamini@testcompany.co.za', '+27823456789', '8501015800081',
     '1985-01-01', 'MALE', 'MARRIED', '2020-01-15', 'ACTIVE', 'PERMANENT',
     150000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'EXEC'),
     (SELECT id FROM job_titles WHERE code = 'CEO')),

    -- Nomvula Mbeki - CFO
    ('e0000001-0000-0000-0000-000000000002', 'EMP-1002', 'Nomvula', 'Mbeki',
     'nomvula.mbeki@testcompany.co.za', '+27834567890', '8702026500082',
     '1987-02-02', 'FEMALE', 'SINGLE', '2020-03-01', 'ACTIVE', 'PERMANENT',
     120000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'FIN'),
     (SELECT id FROM job_titles WHERE code = 'CFO')),

    -- Thabo Mokoena - HR Manager
    ('e0000001-0000-0000-0000-000000000003', 'EMP-1003', 'Thabo', 'Mokoena',
     'thabo.mokoena@testcompany.co.za', '+27845678901', '8903035800083',
     '1989-03-03', 'MALE', 'MARRIED', '2020-06-15', 'ACTIVE', 'PERMANENT',
     85000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'HR'),
     (SELECT id FROM job_titles WHERE code = 'HR-MGR')),

    -- Lerato Ndlovu - Finance Manager
    ('e0000001-0000-0000-0000-000000000004', 'EMP-1004', 'Lerato', 'Ndlovu',
     'lerato.ndlovu@testcompany.co.za', '+27856789012', '9004046500084',
     '1990-04-04', 'FEMALE', 'SINGLE', '2021-01-10', 'ACTIVE', 'PERMANENT',
     75000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'FIN'),
     (SELECT id FROM job_titles WHERE code = 'FIN-MGR')),

    -- Pieter van Wyk - Senior Developer
    ('e0000001-0000-0000-0000-000000000005', 'EMP-1005', 'Pieter', 'van Wyk',
     'pieter.vanwyk@testcompany.co.za', '+27867890123', '8805055800085',
     '1988-05-05', 'MALE', 'MARRIED', '2021-03-15', 'ACTIVE', 'PERMANENT',
     65000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'IT'),
     (SELECT id FROM job_titles WHERE code = 'DEV-SNR')),

    -- Fatima Patel - Accountant
    ('e0000001-0000-0000-0000-000000000006', 'EMP-1006', 'Fatima', 'Patel',
     'fatima.patel@testcompany.co.za', '+27878901234', '9206066500086',
     '1992-06-06', 'FEMALE', 'MARRIED', '2021-06-01', 'ACTIVE', 'PERMANENT',
     50000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'FIN'),
     (SELECT id FROM job_titles WHERE code = 'ACCT')),

    -- Johan Meyer - Sales Manager
    ('e0000001-0000-0000-0000-000000000007', 'EMP-1007', 'Johan', 'Meyer',
     'johan.meyer@testcompany.co.za', '+27889012345', '8507075800087',
     '1985-07-07', 'MALE', 'DIVORCED', '2021-09-01', 'ACTIVE', 'PERMANENT',
     70000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'SALES'),
     (SELECT id FROM job_titles WHERE code = 'SALES-MGR')),

    -- Ayanda Nkosi - Developer
    ('e0000001-0000-0000-0000-000000000008', 'EMP-1008', 'Ayanda', 'Nkosi',
     'ayanda.nkosi@testcompany.co.za', '+27890123456', '9508086500088',
     '1995-08-08', 'FEMALE', 'SINGLE', '2022-01-15', 'ACTIVE', 'PERMANENT',
     45000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'IT'),
     (SELECT id FROM job_titles WHERE code = 'DEV')),

    -- David Botha - Sales Rep
    ('e0000001-0000-0000-0000-000000000009', 'EMP-1009', 'David', 'Botha',
     'david.botha@testcompany.co.za', '+27901234567', '9309095800089',
     '1993-09-09', 'MALE', 'SINGLE', '2022-04-01', 'ACTIVE', 'PERMANENT',
     40000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'SALES'),
     (SELECT id FROM job_titles WHERE code = 'SALES-REP')),

    -- Lindiwe Sithole - HR Officer
    ('e0000001-0000-0000-0000-000000000010', 'EMP-1010', 'Lindiwe', 'Sithole',
     'lindiwe.sithole@testcompany.co.za', '+27812345678', '9410106500090',
     '1994-10-10', 'FEMALE', 'SINGLE', '2022-07-15', 'ACTIVE', 'PERMANENT',
     38000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'HR'),
     (SELECT id FROM job_titles WHERE code = 'HR-OFF')),

    -- Zandile Khumalo - HR Coordinator (ON LEAVE)
    ('e0000001-0000-0000-0000-000000000011', 'EMP-1011', 'Zandile', 'Khumalo',
     'zandile.khumalo@testcompany.co.za', '+27823451234', '9111115800091',
     '1991-11-11', 'FEMALE', 'MARRIED', '2023-01-10', 'ON_LEAVE', 'PERMANENT',
     42000.00, 'MONTHLY',
     (SELECT id FROM departments WHERE code = 'HR'),
     (SELECT id FROM job_titles WHERE code = 'HR-OFF'))
ON CONFLICT (id) DO NOTHING;

-- Leave Balances for 2026
-- Each employee gets standard BCEA entitlements
INSERT INTO leave_balances (employee_id, leave_type, year, entitlement, used, pending, carried_over)
SELECT e.id, 'ANNUAL', 2026, 15, 0, 0, 0 FROM employees e WHERE e.deleted = FALSE
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

INSERT INTO leave_balances (employee_id, leave_type, year, entitlement, used, pending, carried_over, cycle_start_date)
SELECT e.id, 'SICK', 2026, 30, 0, 0, 0, e.hire_date FROM employees e WHERE e.deleted = FALSE
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

INSERT INTO leave_balances (employee_id, leave_type, year, entitlement, used, pending, carried_over)
SELECT e.id, 'FAMILY_RESPONSIBILITY', 2026, 3, 0, 0, 0 FROM employees e WHERE e.deleted = FALSE
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

-- Update Zandile's leave balance to show some usage (she's ON_LEAVE)
UPDATE leave_balances
SET used = 5, pending = 5
WHERE employee_id = 'e0000001-0000-0000-0000-000000000011'
  AND leave_type = 'ANNUAL'
  AND year = 2026;

-- Create an approved leave request for Zandile (currently on leave)
INSERT INTO leave_requests (
    employee_id, leave_type, start_date, end_date, days, status, reason,
    approver_id, approval_date, approver_comment
) VALUES (
    'e0000001-0000-0000-0000-000000000011', -- Zandile
    'ANNUAL',
    '2026-01-20',
    '2026-01-24',
    5,
    'APPROVED',
    'Family vacation',
    'e0000001-0000-0000-0000-000000000003', -- Approved by Thabo (HR Manager)
    '2026-01-15',
    'Approved. Enjoy your vacation!'
) ON CONFLICT DO NOTHING;

-- Some historical leave requests for other employees
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, reason, approver_id, approval_date)
VALUES
    -- Sipho had some sick leave in December
    ('e0000001-0000-0000-0000-000000000001', 'SICK', '2025-12-10', '2025-12-11', 2, 'APPROVED', 'Flu', 'e0000001-0000-0000-0000-000000000003', '2025-12-10'),
    -- Nomvula's annual leave
    ('e0000001-0000-0000-0000-000000000002', 'ANNUAL', '2025-12-23', '2025-12-31', 7, 'APPROVED', 'Christmas holidays', 'e0000001-0000-0000-0000-000000000001', '2025-12-15')
ON CONFLICT DO NOTHING;
