-- =====================================================
-- SECURITY FIX: Correct employee names in payslips
--
-- Issue: Payslip employee_name values did not match
-- the actual employee records in HR service, causing
-- users to see other employees' payslips in self-service.
--
-- This migration updates existing payslip records to
-- match the correct employee names from HR service.
-- =====================================================

-- Employee 1: e0000001-0000-0000-0000-000000000001
-- Was: Thabo Molefe (Senior Developer)
-- Should be: Sipho Dlamini (CEO)
UPDATE payslips SET
    employee_name = 'Sipho Dlamini',
    id_number = '8501015800081',
    department = 'Executive',
    job_title = 'CEO',
    basic_salary = 150000.00,
    gross_earnings = CASE
        WHEN period_month = 12 THEN 225000.00  -- 13th cheque
        ELSE 150000.00
    END,
    paye = CASE
        WHEN period_month = 12 THEN 85500.00
        ELSE 52500.00
    END,
    uif_employee = CASE WHEN period_month = 12 THEN 2250.00 ELSE 1500.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 2250.00 ELSE 1500.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 16875.00 ELSE 11250.00 END,
    medical_aid = 4500.00,
    total_deductions = CASE WHEN period_month = 12 THEN 109125.00 ELSE 69750.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 115875.00 ELSE 80250.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 16875.00 ELSE 11250.00 END,
    sdl = CASE WHEN period_month = 12 THEN 2250.00 ELSE 1500.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 246375.00 ELSE 164250.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000001';

-- Employee 2: e0000001-0000-0000-0000-000000000002
-- Was: Nomvula Dlamini (HR Manager)
-- Should be: Nomvula Mbeki (CFO)
UPDATE payslips SET
    employee_name = 'Nomvula Mbeki',
    id_number = '8702026500082',
    department = 'Finance',
    job_title = 'CFO',
    basic_salary = 120000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 180000.00 ELSE 120000.00 END,
    paye = CASE WHEN period_month = 12 THEN 66600.00 ELSE 40200.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 1800.00 ELSE 1200.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 1800.00 ELSE 1200.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 13500.00 ELSE 9000.00 END,
    medical_aid = 4000.00,
    total_deductions = CASE WHEN period_month = 12 THEN 85900.00 ELSE 54400.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 94100.00 ELSE 65600.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 13500.00 ELSE 9000.00 END,
    sdl = CASE WHEN period_month = 12 THEN 1800.00 ELSE 1200.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 197100.00 ELSE 131400.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000002';

-- Employee 3: e0000001-0000-0000-0000-000000000003
-- Was: Pieter van der Merwe (Finance Lead)
-- Should be: Thabo Mokoena (HR Manager)
UPDATE payslips SET
    employee_name = 'Thabo Mokoena',
    id_number = '8903035800083',
    department = 'Human Resources',
    job_title = 'HR Manager',
    basic_salary = 85000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 127500.00 ELSE 85000.00 END,
    paye = CASE WHEN period_month = 12 THEN 44625.00 ELSE 25925.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 1275.00 ELSE 850.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 1275.00 ELSE 850.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 9562.50 ELSE 6375.00 END,
    medical_aid = 3500.00,
    total_deductions = CASE WHEN period_month = 12 THEN 58962.50 ELSE 36650.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 68537.50 ELSE 48350.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 9562.50 ELSE 6375.00 END,
    sdl = CASE WHEN period_month = 12 THEN 1275.00 ELSE 850.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 139612.50 ELSE 93075.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000003';

-- Employee 4: e0000001-0000-0000-0000-000000000004
-- Was: Sipho Ndlovu (Developer)
-- Should be: Lerato Ndlovu (Finance Manager)
UPDATE payslips SET
    employee_name = 'Lerato Ndlovu',
    id_number = '9004046500084',
    department = 'Finance',
    job_title = 'Finance Manager',
    basic_salary = 75000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 112500.00 ELSE 75000.00 END,
    paye = CASE WHEN period_month = 12 THEN 38250.00 ELSE 21825.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 1125.00 ELSE 750.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 1125.00 ELSE 750.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 8437.50 ELSE 5625.00 END,
    medical_aid = 3200.00,
    total_deductions = CASE WHEN period_month = 12 THEN 51012.50 ELSE 31400.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 61487.50 ELSE 43600.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 8437.50 ELSE 5625.00 END,
    sdl = CASE WHEN period_month = 12 THEN 1125.00 ELSE 750.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 123187.50 ELSE 82125.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000004';

-- Employee 5: e0000001-0000-0000-0000-000000000005
-- Was: Lerato Mokoena (Marketing Specialist)
-- Should be: Pieter van Wyk (Senior Developer)
UPDATE payslips SET
    employee_name = 'Pieter van Wyk',
    id_number = '8805055800085',
    department = 'IT',
    job_title = 'Senior Developer',
    basic_salary = 65000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 97500.00 ELSE 65000.00 END,
    paye = CASE WHEN period_month = 12 THEN 32175.00 ELSE 17725.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 975.00 ELSE 650.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 975.00 ELSE 650.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 7312.50 ELSE 4875.00 END,
    medical_aid = 2800.00,
    total_deductions = CASE WHEN period_month = 12 THEN 43262.50 ELSE 26050.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 54237.50 ELSE 38950.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 7312.50 ELSE 4875.00 END,
    sdl = CASE WHEN period_month = 12 THEN 975.00 ELSE 650.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 106762.50 ELSE 71175.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000005';

-- Employee 6: e0000001-0000-0000-0000-000000000006
-- Was: Johan Botha (Operations Manager)
-- Should be: Fatima Patel (Accountant)
UPDATE payslips SET
    employee_name = 'Fatima Patel',
    id_number = '9206066500086',
    department = 'Finance',
    job_title = 'Accountant',
    basic_salary = 50000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 75000.00 ELSE 50000.00 END,
    paye = CASE WHEN period_month = 12 THEN 22237.50 ELSE 12325.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 750.00 ELSE 500.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 750.00 ELSE 500.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 5625.00 ELSE 3750.00 END,
    medical_aid = 2500.00,
    total_deductions = CASE WHEN period_month = 12 THEN 31112.50 ELSE 19075.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 43887.50 ELSE 30925.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 5625.00 ELSE 3750.00 END,
    sdl = CASE WHEN period_month = 12 THEN 750.00 ELSE 500.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 82125.00 ELSE 54750.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000006';

-- Employee 7: e0000001-0000-0000-0000-000000000007
-- Was: Ayanda Zulu (Customer Support Lead)
-- Should be: Johan Meyer (Sales Manager)
UPDATE payslips SET
    employee_name = 'Johan Meyer',
    id_number = '8507075800087',
    department = 'Sales',
    job_title = 'Sales Manager',
    basic_salary = 70000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 105000.00 ELSE 70000.00 END,
    paye = CASE WHEN period_month = 12 THEN 34650.00 ELSE 19775.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 1050.00 ELSE 700.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 1050.00 ELSE 700.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 7875.00 ELSE 5250.00 END,
    medical_aid = 3000.00,
    total_deductions = CASE WHEN period_month = 12 THEN 46575.00 ELSE 28725.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 58425.00 ELSE 41275.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 7875.00 ELSE 5250.00 END,
    sdl = CASE WHEN period_month = 12 THEN 1050.00 ELSE 700.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 114975.00 ELSE 76650.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000007';

-- Employee 8: e0000001-0000-0000-0000-000000000008
-- Ayanda Nkosi - Already correct, no changes needed

-- Employee 9: e0000001-0000-0000-0000-000000000009
-- Was: Tshepo Mahlangu (Junior Developer)
-- Should be: David Botha (Sales Rep)
UPDATE payslips SET
    employee_name = 'David Botha',
    id_number = '9309095800089',
    department = 'Sales',
    job_title = 'Sales Rep',
    basic_salary = 40000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 60000.00 ELSE 40000.00 END,
    paye = CASE WHEN period_month = 12 THEN 15300.00 ELSE 8770.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 600.00 ELSE 400.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 600.00 ELSE 400.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 4500.00 ELSE 3000.00 END,
    medical_aid = 2000.00,
    total_deductions = CASE WHEN period_month = 12 THEN 22400.00 ELSE 14170.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 37600.00 ELSE 25830.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 4500.00 ELSE 3000.00 END,
    sdl = CASE WHEN period_month = 12 THEN 600.00 ELSE 400.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 65700.00 ELSE 43800.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000009';

-- Employee 10: e0000001-0000-0000-0000-000000000010
-- Was: Fatima Patel (Accountant)
-- Should be: Lindiwe Sithole (HR Officer)
UPDATE payslips SET
    employee_name = 'Lindiwe Sithole',
    id_number = '9410106500090',
    department = 'Human Resources',
    job_title = 'HR Officer',
    basic_salary = 38000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 57000.00 ELSE 38000.00 END,
    paye = CASE WHEN period_month = 12 THEN 14820.00 ELSE 7980.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 570.00 ELSE 380.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 570.00 ELSE 380.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 4275.00 ELSE 2850.00 END,
    medical_aid = 2000.00,
    total_deductions = CASE WHEN period_month = 12 THEN 21665.00 ELSE 13210.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 35335.00 ELSE 24790.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 4275.00 ELSE 2850.00 END,
    sdl = CASE WHEN period_month = 12 THEN 570.00 ELSE 380.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 62415.00 ELSE 41610.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000010';

-- Employee 11: e0000001-0000-0000-0000-000000000011
-- Was: David Nkosi (Sales Executive)
-- Should be: Zandile Khumalo (HR Coordinator)
UPDATE payslips SET
    employee_name = 'Zandile Khumalo',
    id_number = '9111115800091',
    department = 'Human Resources',
    job_title = 'HR Coordinator',
    basic_salary = 42000.00,
    gross_earnings = CASE WHEN period_month = 12 THEN 63000.00 ELSE 42000.00 END,
    paye = CASE WHEN period_month = 12 THEN 16695.00 ELSE 9560.00 END,
    uif_employee = CASE WHEN period_month = 12 THEN 630.00 ELSE 420.00 END,
    uif_employer = CASE WHEN period_month = 12 THEN 630.00 ELSE 420.00 END,
    pension_fund = CASE WHEN period_month = 12 THEN 4725.00 ELSE 3150.00 END,
    medical_aid = 2200.00,
    total_deductions = CASE WHEN period_month = 12 THEN 24250.00 ELSE 15330.00 END,
    net_pay = CASE WHEN period_month = 12 THEN 38750.00 ELSE 26670.00 END,
    employer_pension = CASE WHEN period_month = 12 THEN 4725.00 ELSE 3150.00 END,
    sdl = CASE WHEN period_month = 12 THEN 630.00 ELSE 420.00 END,
    total_employer_cost = CASE WHEN period_month = 12 THEN 68985.00 ELSE 45990.00 END
WHERE employee_id = 'e0000001-0000-0000-0000-000000000011';

-- Update payslip lines for employee 1 (Sipho Dlamini - CEO)
UPDATE payslip_lines SET amount = 150000.00
WHERE payslip_id IN (SELECT id FROM payslips WHERE employee_id = 'e0000001-0000-0000-0000-000000000001')
AND code = 'BASIC';

UPDATE payslip_lines SET amount = 52500.00
WHERE payslip_id IN (SELECT id FROM payslips WHERE employee_id = 'e0000001-0000-0000-0000-000000000001' AND period_month != 12)
AND code = 'PAYE';

UPDATE payslip_lines SET amount = 1500.00
WHERE payslip_id IN (SELECT id FROM payslips WHERE employee_id = 'e0000001-0000-0000-0000-000000000001' AND period_month != 12)
AND code IN ('UIF', 'UIF_ER', 'SDL');

UPDATE payslip_lines SET amount = 11250.00
WHERE payslip_id IN (SELECT id FROM payslips WHERE employee_id = 'e0000001-0000-0000-0000-000000000001' AND period_month != 12)
AND code IN ('PENSION', 'PENSION_ER');

UPDATE payslip_lines SET amount = 4500.00
WHERE payslip_id IN (SELECT id FROM payslips WHERE employee_id = 'e0000001-0000-0000-0000-000000000001')
AND code = 'MEDICAL';

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'SECURITY FIX APPLIED: Payslip employee names corrected to match HR service records';
    RAISE NOTICE 'Affected employees: 10 of 11 (Ayanda Nkosi was already correct)';
    RAISE NOTICE 'Affected payslips: ~30 records across Nov 2025, Dec 2025, Jan 2026';
END $$;
