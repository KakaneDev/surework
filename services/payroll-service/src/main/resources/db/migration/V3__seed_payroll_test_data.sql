-- Seed payroll test data for development
-- Creates historical payroll runs with payslips for testing

-- Clean up existing test data (in case of re-run)
DELETE FROM payslip_lines WHERE payslip_id IN (SELECT id FROM payslips WHERE notes LIKE '%TEST DATA%');
DELETE FROM payslips WHERE notes LIKE '%TEST DATA%';
DELETE FROM payroll_runs WHERE notes LIKE '%TEST DATA%';

-- ===== PAYROLL RUN 1: November 2025 - PAID =====
INSERT INTO payroll_runs (id, run_number, period_year, period_month, payment_date, status,
    total_gross, total_paye, total_uif_employee, total_uif_employer, total_net, total_employer_cost,
    employee_count, processed_by, processed_at, approved_by, approved_at, notes)
VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'PR-2025-11-001',
    2025, 11, '2025-11-25', 'PAID',
    385000.00, 89250.00, 3850.00, 3850.00, 291900.00, 392700.00,
    11,
    '00000000-0000-0000-0000-000000000100', '2025-11-20 10:00:00+02',
    '00000000-0000-0000-0000-000000000100', '2025-11-22 14:00:00+02',
    'TEST DATA - November 2025 Payroll'
);

-- ===== PAYROLL RUN 2: December 2025 - PAID =====
INSERT INTO payroll_runs (id, run_number, period_year, period_month, payment_date, status,
    total_gross, total_paye, total_uif_employee, total_uif_employer, total_net, total_employer_cost,
    employee_count, processed_by, processed_at, approved_by, approved_at, notes)
VALUES (
    'a0000001-0000-0000-0000-000000000002',
    'PR-2025-12-001',
    2025, 12, '2025-12-20', 'PAID',
    485000.00, 112750.00, 4850.00, 4850.00, 367400.00, 494700.00,
    11,
    '00000000-0000-0000-0000-000000000100', '2025-12-15 10:00:00+02',
    '00000000-0000-0000-0000-000000000100', '2025-12-17 14:00:00+02',
    'TEST DATA - December 2025 Payroll (13th cheque included)'
);

-- ===== PAYROLL RUN 3: January 2026 - APPROVED =====
INSERT INTO payroll_runs (id, run_number, period_year, period_month, payment_date, status,
    total_gross, total_paye, total_uif_employee, total_uif_employer, total_net, total_employer_cost,
    employee_count, processed_by, processed_at, approved_by, approved_at, notes)
VALUES (
    'a0000001-0000-0000-0000-000000000003',
    'PR-2026-01-001',
    2026, 1, '2026-01-31', 'APPROVED',
    395000.00, 91750.00, 3950.00, 3950.00, 299300.00, 402900.00,
    11,
    '00000000-0000-0000-0000-000000000100', '2026-01-20 10:00:00+02',
    '00000000-0000-0000-0000-000000000100', '2026-01-22 14:00:00+02',
    'TEST DATA - January 2026 Payroll'
);

-- ===== PAYROLL RUN 4: February 2026 - DRAFT =====
INSERT INTO payroll_runs (id, run_number, period_year, period_month, payment_date, status,
    total_gross, total_paye, total_uif_employee, total_uif_employer, total_net, total_employer_cost,
    employee_count, notes)
VALUES (
    'a0000001-0000-0000-0000-000000000004',
    'PR-2026-02-001',
    2026, 2, '2026-02-28', 'DRAFT',
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0,
    'TEST DATA - February 2026 Payroll (Draft)'
);

-- ===== PAYSLIPS FOR NOVEMBER 2025 =====

-- Employee 1: Sipho Dlamini - CEO (R150,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-001',
    'e0000001-0000-0000-0000-000000000001', 'EMP-1001', 'Sipho Dlamini',
    '8501015800081', '1234567890', 'Executive', 'CEO',
    2025, 11, '2025-11-25',
    150000.00, 150000.00, 52500.00, 1500.00, 1500.00, 11250.00, 4500.00,
    69750.00, 80250.00, 11250.00, 1500.00, 164250.00, 'PAID',
    'TEST DATA'
);

-- Employee 2: Nomvula Mbeki - CFO (R120,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100002-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-002',
    'e0000001-0000-0000-0000-000000000002', 'EMP-1002', 'Nomvula Mbeki',
    '8702026500082', '2345678901', 'Finance', 'CFO',
    2025, 11, '2025-11-25',
    120000.00, 120000.00, 40200.00, 1200.00, 1200.00, 9000.00, 4000.00,
    54400.00, 65600.00, 9000.00, 1200.00, 131400.00, 'PAID',
    'TEST DATA'
);

-- Employee 3: Thabo Mokoena - HR Manager (R85,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100003-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-003',
    'e0000001-0000-0000-0000-000000000003', 'EMP-1003', 'Thabo Mokoena',
    '8903035800083', '3456789012', 'Human Resources', 'HR Manager',
    2025, 11, '2025-11-25',
    85000.00, 85000.00, 25925.00, 850.00, 850.00, 6375.00, 3500.00,
    36650.00, 48350.00, 6375.00, 850.00, 93075.00, 'PAID',
    'TEST DATA'
);

-- Employee 4: Lerato Ndlovu - Finance Manager (R75,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100004-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-004',
    'e0000001-0000-0000-0000-000000000004', 'EMP-1004', 'Lerato Ndlovu',
    '9004046500084', '4567890123', 'Finance', 'Finance Manager',
    2025, 11, '2025-11-25',
    75000.00, 75000.00, 21825.00, 750.00, 750.00, 5625.00, 3200.00,
    31400.00, 43600.00, 5625.00, 750.00, 82125.00, 'PAID',
    'TEST DATA'
);

-- Employee 5: Pieter van Wyk - Senior Developer (R65,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100005-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-005',
    'e0000001-0000-0000-0000-000000000005', 'EMP-1005', 'Pieter van Wyk',
    '8805055800085', '5678901234', 'IT', 'Senior Developer',
    2025, 11, '2025-11-25',
    65000.00, 65000.00, 17725.00, 650.00, 650.00, 4875.00, 2800.00,
    26050.00, 38950.00, 4875.00, 650.00, 71175.00, 'PAID',
    'TEST DATA'
);

-- Employee 6: Fatima Patel - Accountant (R50,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100006-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-006',
    'e0000001-0000-0000-0000-000000000006', 'EMP-1006', 'Fatima Patel',
    '9206066500086', '6789012345', 'Finance', 'Accountant',
    2025, 11, '2025-11-25',
    50000.00, 50000.00, 12325.00, 500.00, 500.00, 3750.00, 2500.00,
    19075.00, 30925.00, 3750.00, 500.00, 54750.00, 'PAID',
    'TEST DATA'
);

-- Employee 7: Johan Meyer - Sales Manager (R70,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100007-0000-0000-0000-000000000007',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-007',
    'e0000001-0000-0000-0000-000000000007', 'EMP-1007', 'Johan Meyer',
    '8507075800087', '7890123456', 'Sales', 'Sales Manager',
    2025, 11, '2025-11-25',
    70000.00, 70000.00, 19775.00, 700.00, 700.00, 5250.00, 3000.00,
    28725.00, 41275.00, 5250.00, 700.00, 76650.00, 'PAID',
    'TEST DATA'
);

-- Employee 8: Ayanda Nkosi - Developer (R45,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100008-0000-0000-0000-000000000008',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-008',
    'e0000001-0000-0000-0000-000000000008', 'EMP-1008', 'Ayanda Nkosi',
    '9508086500088', '8901234567', 'IT', 'Developer',
    2025, 11, '2025-11-25',
    45000.00, 45000.00, 10350.00, 450.00, 450.00, 3375.00, 2500.00,
    16675.00, 28325.00, 3375.00, 450.00, 49275.00, 'PAID',
    'TEST DATA'
);

-- Employee 9: David Botha - Sales Rep (R40,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100009-0000-0000-0000-000000000009',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-009',
    'e0000001-0000-0000-0000-000000000009', 'EMP-1009', 'David Botha',
    '9309095800089', '9012345678', 'Sales', 'Sales Rep',
    2025, 11, '2025-11-25',
    40000.00, 40000.00, 8770.00, 400.00, 400.00, 3000.00, 2000.00,
    14170.00, 25830.00, 3000.00, 400.00, 43800.00, 'PAID',
    'TEST DATA'
);

-- Employee 10: Lindiwe Sithole - HR Officer (R38,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100010-0000-0000-0000-000000000010',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-010',
    'e0000001-0000-0000-0000-000000000010', 'EMP-1010', 'Lindiwe Sithole',
    '9410106500090', '0123456789', 'Human Resources', 'HR Officer',
    2025, 11, '2025-11-25',
    38000.00, 38000.00, 7980.00, 380.00, 380.00, 2850.00, 2000.00,
    13210.00, 24790.00, 2850.00, 380.00, 41610.00, 'PAID',
    'TEST DATA'
);

-- Employee 11: Zandile Khumalo - HR Coordinator (R42,000)
INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES (
    'b1100011-0000-0000-0000-000000000011',
    'a0000001-0000-0000-0000-000000000001',
    'PS-2025-11-011',
    'e0000001-0000-0000-0000-000000000011', 'EMP-1011', 'Zandile Khumalo',
    '9111115800091', '1234509876', 'Human Resources', 'HR Coordinator',
    2025, 11, '2025-11-25',
    42000.00, 42000.00, 9560.00, 420.00, 420.00, 3150.00, 2200.00,
    15330.00, 26670.00, 3150.00, 420.00, 45990.00, 'PAID',
    'TEST DATA'
);

-- ===== PAYSLIPS FOR DECEMBER 2025 (with 13th cheque) =====

INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES
    ('b1200001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-001',
     'e0000001-0000-0000-0000-000000000001', 'EMP-1001', 'Sipho Dlamini',
     '8501015800081', '1234567890', 'Executive', 'CEO', 2025, 12, '2025-12-20',
     150000.00, 225000.00, 85500.00, 2250.00, 2250.00, 16875.00, 4500.00, 109125.00, 115875.00, 16875.00, 2250.00, 246375.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-002',
     'e0000001-0000-0000-0000-000000000002', 'EMP-1002', 'Nomvula Mbeki',
     '8702026500082', '2345678901', 'Finance', 'CFO', 2025, 12, '2025-12-20',
     120000.00, 180000.00, 66600.00, 1800.00, 1800.00, 13500.00, 4000.00, 85900.00, 94100.00, 13500.00, 1800.00, 197100.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-003',
     'e0000001-0000-0000-0000-000000000003', 'EMP-1003', 'Thabo Mokoena',
     '8903035800083', '3456789012', 'Human Resources', 'HR Manager', 2025, 12, '2025-12-20',
     85000.00, 127500.00, 44625.00, 1275.00, 1275.00, 9562.50, 3500.00, 58962.50, 68537.50, 9562.50, 1275.00, 139612.50, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-004',
     'e0000001-0000-0000-0000-000000000004', 'EMP-1004', 'Lerato Ndlovu',
     '9004046500084', '4567890123', 'Finance', 'Finance Manager', 2025, 12, '2025-12-20',
     75000.00, 112500.00, 38250.00, 1125.00, 1125.00, 8437.50, 3200.00, 51012.50, 61487.50, 8437.50, 1125.00, 123187.50, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200005-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-005',
     'e0000001-0000-0000-0000-000000000005', 'EMP-1005', 'Pieter van Wyk',
     '8805055800085', '5678901234', 'IT', 'Senior Developer', 2025, 12, '2025-12-20',
     65000.00, 97500.00, 32175.00, 975.00, 975.00, 7312.50, 2800.00, 43262.50, 54237.50, 7312.50, 975.00, 106762.50, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200006-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-006',
     'e0000001-0000-0000-0000-000000000006', 'EMP-1006', 'Fatima Patel',
     '9206066500086', '6789012345', 'Finance', 'Accountant', 2025, 12, '2025-12-20',
     50000.00, 75000.00, 22237.50, 750.00, 750.00, 5625.00, 2500.00, 31112.50, 43887.50, 5625.00, 750.00, 82125.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200007-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-007',
     'e0000001-0000-0000-0000-000000000007', 'EMP-1007', 'Johan Meyer',
     '8507075800087', '7890123456', 'Sales', 'Sales Manager', 2025, 12, '2025-12-20',
     70000.00, 105000.00, 34650.00, 1050.00, 1050.00, 7875.00, 3000.00, 46575.00, 58425.00, 7875.00, 1050.00, 114975.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200008-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-008',
     'e0000001-0000-0000-0000-000000000008', 'EMP-1008', 'Ayanda Nkosi',
     '9508086500088', '8901234567', 'IT', 'Developer', 2025, 12, '2025-12-20',
     45000.00, 67500.00, 18900.00, 675.00, 675.00, 5062.50, 2500.00, 27137.50, 40362.50, 5062.50, 675.00, 73912.50, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200009-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-009',
     'e0000001-0000-0000-0000-000000000009', 'EMP-1009', 'David Botha',
     '9309095800089', '9012345678', 'Sales', 'Sales Rep', 2025, 12, '2025-12-20',
     40000.00, 60000.00, 15300.00, 600.00, 600.00, 4500.00, 2000.00, 22400.00, 37600.00, 4500.00, 600.00, 65700.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200010-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-010',
     'e0000001-0000-0000-0000-000000000010', 'EMP-1010', 'Lindiwe Sithole',
     '9410106500090', '0123456789', 'Human Resources', 'HR Officer', 2025, 12, '2025-12-20',
     38000.00, 57000.00, 14820.00, 570.00, 570.00, 4275.00, 2000.00, 21665.00, 35335.00, 4275.00, 570.00, 62415.00, 'PAID', 'TEST DATA - 13th cheque'),
    ('b1200011-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000002', 'PS-2025-12-011',
     'e0000001-0000-0000-0000-000000000011', 'EMP-1011', 'Zandile Khumalo',
     '9111115800091', '1234509876', 'Human Resources', 'HR Coordinator', 2025, 12, '2025-12-20',
     42000.00, 63000.00, 16695.00, 630.00, 630.00, 4725.00, 2200.00, 24250.00, 38750.00, 4725.00, 630.00, 68985.00, 'PAID', 'TEST DATA - 13th cheque');

-- ===== PAYSLIPS FOR JANUARY 2026 =====

INSERT INTO payslips (id, payroll_run_id, payslip_number, employee_id, employee_number, employee_name,
    id_number, tax_number, department, job_title, period_year, period_month, payment_date,
    basic_salary, gross_earnings, paye, uif_employee, uif_employer, pension_fund, medical_aid,
    total_deductions, net_pay, employer_pension, sdl, total_employer_cost, status, notes)
VALUES
    ('b1300001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-001',
     'e0000001-0000-0000-0000-000000000001', 'EMP-1001', 'Sipho Dlamini',
     '8501015800081', '1234567890', 'Executive', 'CEO', 2026, 1, '2026-01-31',
     150000.00, 150000.00, 52500.00, 1500.00, 1500.00, 11250.00, 4500.00, 69750.00, 80250.00, 11250.00, 1500.00, 164250.00, 'APPROVED', 'TEST DATA'),
    ('b1300002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-002',
     'e0000001-0000-0000-0000-000000000002', 'EMP-1002', 'Nomvula Mbeki',
     '8702026500082', '2345678901', 'Finance', 'CFO', 2026, 1, '2026-01-31',
     120000.00, 120000.00, 40200.00, 1200.00, 1200.00, 9000.00, 4000.00, 54400.00, 65600.00, 9000.00, 1200.00, 131400.00, 'APPROVED', 'TEST DATA'),
    ('b1300003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-003',
     'e0000001-0000-0000-0000-000000000003', 'EMP-1003', 'Thabo Mokoena',
     '8903035800083', '3456789012', 'Human Resources', 'HR Manager', 2026, 1, '2026-01-31',
     85000.00, 85000.00, 25925.00, 850.00, 850.00, 6375.00, 3500.00, 36650.00, 48350.00, 6375.00, 850.00, 93075.00, 'APPROVED', 'TEST DATA'),
    ('b1300004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-004',
     'e0000001-0000-0000-0000-000000000004', 'EMP-1004', 'Lerato Ndlovu',
     '9004046500084', '4567890123', 'Finance', 'Finance Manager', 2026, 1, '2026-01-31',
     75000.00, 75000.00, 21825.00, 750.00, 750.00, 5625.00, 3200.00, 31400.00, 43600.00, 5625.00, 750.00, 82125.00, 'APPROVED', 'TEST DATA'),
    ('b1300005-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-005',
     'e0000001-0000-0000-0000-000000000005', 'EMP-1005', 'Pieter van Wyk',
     '8805055800085', '5678901234', 'IT', 'Senior Developer', 2026, 1, '2026-01-31',
     65000.00, 65000.00, 17725.00, 650.00, 650.00, 4875.00, 2800.00, 26050.00, 38950.00, 4875.00, 650.00, 71175.00, 'APPROVED', 'TEST DATA'),
    ('b1300006-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-006',
     'e0000001-0000-0000-0000-000000000006', 'EMP-1006', 'Fatima Patel',
     '9206066500086', '6789012345', 'Finance', 'Accountant', 2026, 1, '2026-01-31',
     50000.00, 50000.00, 12325.00, 500.00, 500.00, 3750.00, 2500.00, 19075.00, 30925.00, 3750.00, 500.00, 54750.00, 'APPROVED', 'TEST DATA'),
    ('b1300007-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-007',
     'e0000001-0000-0000-0000-000000000007', 'EMP-1007', 'Johan Meyer',
     '8507075800087', '7890123456', 'Sales', 'Sales Manager', 2026, 1, '2026-01-31',
     70000.00, 70000.00, 19775.00, 700.00, 700.00, 5250.00, 3000.00, 28725.00, 41275.00, 5250.00, 700.00, 76650.00, 'APPROVED', 'TEST DATA'),
    ('b1300008-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-008',
     'e0000001-0000-0000-0000-000000000008', 'EMP-1008', 'Ayanda Nkosi',
     '9508086500088', '8901234567', 'IT', 'Developer', 2026, 1, '2026-01-31',
     45000.00, 45000.00, 10350.00, 450.00, 450.00, 3375.00, 2500.00, 16675.00, 28325.00, 3375.00, 450.00, 49275.00, 'APPROVED', 'TEST DATA'),
    ('b1300009-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-009',
     'e0000001-0000-0000-0000-000000000009', 'EMP-1009', 'David Botha',
     '9309095800089', '9012345678', 'Sales', 'Sales Rep', 2026, 1, '2026-01-31',
     40000.00, 40000.00, 8770.00, 400.00, 400.00, 3000.00, 2000.00, 14170.00, 25830.00, 3000.00, 400.00, 43800.00, 'APPROVED', 'TEST DATA'),
    ('b1300010-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-010',
     'e0000001-0000-0000-0000-000000000010', 'EMP-1010', 'Lindiwe Sithole',
     '9410106500090', '0123456789', 'Human Resources', 'HR Officer', 2026, 1, '2026-01-31',
     38000.00, 38000.00, 7980.00, 380.00, 380.00, 2850.00, 2000.00, 13210.00, 24790.00, 2850.00, 380.00, 41610.00, 'APPROVED', 'TEST DATA'),
    ('b1300011-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000003', 'PS-2026-01-011',
     'e0000001-0000-0000-0000-000000000011', 'EMP-1011', 'Zandile Khumalo',
     '9111115800091', '1234509876', 'Human Resources', 'HR Coordinator', 2026, 1, '2026-01-31',
     42000.00, 42000.00, 9560.00, 420.00, 420.00, 3150.00, 2200.00, 15330.00, 26670.00, 3150.00, 420.00, 45990.00, 'APPROVED', 'TEST DATA');

-- ===== PAYSLIP LINES FOR SAMPLE PAYSLIPS =====

-- Earnings lines for January 2026 - Sipho Dlamini (CEO)
INSERT INTO payslip_lines (payslip_id, line_type, code, description, amount, is_taxable, is_pensionable, sort_order)
VALUES
    ('b1300001-0000-0000-0000-000000000001', 'EARNING', 'BASIC', 'Basic Salary', 150000.00, true, true, 1);

-- Deduction lines for January 2026 - Sipho Dlamini (CEO)
INSERT INTO payslip_lines (payslip_id, line_type, code, description, amount, is_taxable, is_pensionable, sort_order)
VALUES
    ('b1300001-0000-0000-0000-000000000001', 'STATUTORY_DEDUCTION', 'PAYE', 'PAYE Tax', 52500.00, false, false, 10),
    ('b1300001-0000-0000-0000-000000000001', 'STATUTORY_DEDUCTION', 'UIF', 'UIF Contribution', 1500.00, false, false, 11),
    ('b1300001-0000-0000-0000-000000000001', 'VOLUNTARY_DEDUCTION', 'PENSION', 'Pension Fund', 11250.00, false, false, 20),
    ('b1300001-0000-0000-0000-000000000001', 'VOLUNTARY_DEDUCTION', 'MEDICAL', 'Medical Aid', 4500.00, false, false, 21);

-- Employer contributions for January 2026 - Sipho Dlamini (CEO)
INSERT INTO payslip_lines (payslip_id, line_type, code, description, amount, is_taxable, is_pensionable, sort_order)
VALUES
    ('b1300001-0000-0000-0000-000000000001', 'EMPLOYER_CONTRIBUTION', 'UIF_ER', 'UIF Employer', 1500.00, false, false, 30),
    ('b1300001-0000-0000-0000-000000000001', 'EMPLOYER_CONTRIBUTION', 'PENSION_ER', 'Pension Employer', 11250.00, false, false, 31),
    ('b1300001-0000-0000-0000-000000000001', 'EMPLOYER_CONTRIBUTION', 'SDL', 'Skills Development Levy', 1500.00, false, false, 32);
