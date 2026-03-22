-- ============================================================================
-- Test Data for Employee Service
-- ============================================================================

-- Insert departments
INSERT INTO departments (id, code, name, description, active) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'ENG', 'Engineering', 'Software Development and IT Infrastructure', true),
    ('d0000001-0000-0000-0000-000000000002', 'HR', 'Human Resources', 'HR and People Operations', true),
    ('d0000001-0000-0000-0000-000000000003', 'FIN', 'Finance', 'Finance and Accounting', true),
    ('d0000001-0000-0000-0000-000000000004', 'MKT', 'Marketing', 'Marketing and Communications', true),
    ('d0000001-0000-0000-0000-000000000005', 'OPS', 'Operations', 'Business Operations', true),
    ('d0000001-0000-0000-0000-000000000006', 'SALES', 'Sales', 'Sales and Business Development', true);

-- Insert employees
INSERT INTO employees (
    id, employee_number, first_name, last_name, email, phone,
    id_number, date_of_birth, gender, marital_status,
    street_address, suburb, city, province, postal_code,
    hire_date, status, employment_type, department_id, job_title,
    basic_salary, pay_frequency, tax_status,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
) VALUES
    -- Engineering Department
    ('e0000001-0000-0000-0000-000000000001', 'EMP-1001', 'Sipho', 'Dlamini',
     'sipho.dlamini@surework.co.za', '+27 82 111 2001',
     '8501015800083', '1985-01-01', 'MALE', 'MARRIED',
     '45 Innovation Drive', 'Sandton', 'Johannesburg', 'Gauteng', '2196',
     '2020-03-15', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000001', 'Senior Software Engineer',
     85000.00, 'MONTHLY', 'NORMAL',
     'Nomsa Dlamini', '+27 82 999 1111', 'SPOUSE'),

    ('e0000001-0000-0000-0000-000000000002', 'EMP-1002', 'Lerato', 'Molefe',
     'lerato.molefe@surework.co.za', '+27 83 222 3002',
     '9003150200087', '1990-03-15', 'FEMALE', 'SINGLE',
     '12 Tech Park', 'Rosebank', 'Johannesburg', 'Gauteng', '2196',
     '2021-06-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000001', 'Software Developer',
     55000.00, 'MONTHLY', 'NORMAL',
     'Thabo Molefe', '+27 83 888 2222', 'SIBLING'),

    ('e0000001-0000-0000-0000-000000000003', 'EMP-1003', 'Johan', 'van der Merwe',
     'johan.vdm@surework.co.za', '+27 84 333 4003',
     '8806125800082', '1988-06-12', 'MALE', 'MARRIED',
     '78 Cyber Street', 'Centurion', 'Pretoria', 'Gauteng', '0157',
     '2019-09-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000001', 'DevOps Engineer',
     72000.00, 'MONTHLY', 'NORMAL',
     'Anna van der Merwe', '+27 84 777 3333', 'SPOUSE'),

    -- Human Resources
    ('e0000001-0000-0000-0000-000000000004', 'EMP-1004', 'Thandi', 'Nkosi',
     'thandi.nkosi@surework.co.za', '+27 82 444 5004',
     '8712050200089', '1987-12-05', 'FEMALE', 'MARRIED',
     '23 HR Boulevard', 'Waterfall', 'Midrand', 'Gauteng', '1685',
     '2018-02-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000002', 'HR Manager',
     68000.00, 'MONTHLY', 'NORMAL',
     'Sbu Nkosi', '+27 82 666 4444', 'SPOUSE'),

    ('e0000001-0000-0000-0000-000000000005', 'EMP-1005', 'Michelle', 'Adams',
     'michelle.adams@surework.co.za', '+27 83 555 6005',
     '9205200400086', '1992-05-20', 'FEMALE', 'SINGLE',
     '56 People Lane', 'Sea Point', 'Cape Town', 'Western Cape', '8005',
     '2022-01-15', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000002', 'HR Officer',
     42000.00, 'MONTHLY', 'NORMAL',
     'James Adams', '+27 83 555 5555', 'FATHER'),

    -- Finance
    ('e0000001-0000-0000-0000-000000000006', 'EMP-1006', 'Pieter', 'Botha',
     'pieter.botha@surework.co.za', '+27 84 666 7006',
     '8509085800085', '1985-09-08', 'MALE', 'MARRIED',
     '99 Finance Road', 'Umhlanga', 'Durban', 'KwaZulu-Natal', '4320',
     '2017-05-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000003', 'Financial Manager',
     95000.00, 'MONTHLY', 'NORMAL',
     'Susan Botha', '+27 84 444 6666', 'SPOUSE'),

    ('e0000001-0000-0000-0000-000000000007', 'EMP-1007', 'Ayanda', 'Zulu',
     'ayanda.zulu@surework.co.za', '+27 82 777 8007',
     '9108120200084', '1991-08-12', 'FEMALE', 'SINGLE',
     '34 Accounts Street', 'Ballito', 'Durban', 'KwaZulu-Natal', '4399',
     '2021-03-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000003', 'Accountant',
     48000.00, 'MONTHLY', 'NORMAL',
     'Thulani Zulu', '+27 82 333 7777', 'FATHER'),

    -- Marketing
    ('e0000001-0000-0000-0000-000000000008', 'EMP-1008', 'Nokuthula', 'Mthembu',
     'nokuthula.mthembu@surework.co.za', '+27 83 888 9008',
     '8903250200081', '1989-03-25', 'FEMALE', 'MARRIED',
     '67 Brand Avenue', 'Sandton', 'Johannesburg', 'Gauteng', '2196',
     '2020-07-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000004', 'Marketing Manager',
     72000.00, 'MONTHLY', 'NORMAL',
     'Sibusiso Mthembu', '+27 83 222 8888', 'SPOUSE'),

    -- Operations
    ('e0000001-0000-0000-0000-000000000009', 'EMP-1009', 'David', 'Smith',
     'david.smith@surework.co.za', '+27 84 999 0009',
     '8704155800088', '1987-04-15', 'MALE', 'MARRIED',
     '12 Operations Park', 'Randburg', 'Johannesburg', 'Gauteng', '2194',
     '2019-01-15', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000005', 'Operations Manager',
     78000.00, 'MONTHLY', 'NORMAL',
     'Sarah Smith', '+27 84 111 9999', 'SPOUSE'),

    -- Sales
    ('e0000001-0000-0000-0000-000000000010', 'EMP-1010', 'Bongani', 'Ndaba',
     'bongani.ndaba@surework.co.za', '+27 82 100 1010',
     '9006200200086', '1990-06-20', 'MALE', 'SINGLE',
     '45 Sales Drive', 'Bryanston', 'Johannesburg', 'Gauteng', '2021',
     '2022-04-01', 'ACTIVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000006', 'Sales Executive',
     52000.00, 'MONTHLY', 'NORMAL',
     'Grace Ndaba', '+27 82 000 1010', 'MOTHER'),

    -- Employee on leave
    ('e0000001-0000-0000-0000-000000000011', 'EMP-1011', 'Zandile', 'Khumalo',
     'zandile.khumalo@surework.co.za', '+27 83 111 1111',
     '9201150200082', '1992-01-15', 'FEMALE', 'MARRIED',
     '88 Rest Road', 'Morningside', 'Durban', 'KwaZulu-Natal', '4001',
     '2021-08-01', 'ON_LEAVE', 'FULL_TIME', 'd0000001-0000-0000-0000-000000000002', 'HR Coordinator',
     38000.00, 'MONTHLY', 'NORMAL',
     'Mandla Khumalo', '+27 83 000 1111', 'SPOUSE'),

    -- Contract employee
    ('e0000001-0000-0000-0000-000000000012', 'EMP-1012', 'James', 'Williams',
     'james.williams@surework.co.za', '+27 84 121 1212',
     '8811205800087', '1988-11-20', 'MALE', 'SINGLE',
     '22 Contract Lane', 'Claremont', 'Cape Town', 'Western Cape', '7708',
     '2023-01-01', 'ACTIVE', 'CONTRACT', 'd0000001-0000-0000-0000-000000000001', 'Contract Developer',
     65000.00, 'MONTHLY', 'NORMAL',
     'Mary Williams', '+27 84 000 1212', 'MOTHER');

-- Update managers
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id IN ('e0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000012');

UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000004'
WHERE id IN ('e0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000011');

UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000006'
WHERE id = 'e0000001-0000-0000-0000-000000000007';
