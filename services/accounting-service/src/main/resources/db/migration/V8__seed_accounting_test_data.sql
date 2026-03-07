-- Seed test data for accounting dashboard
-- This creates realistic balances and transactions for development/testing

-- =====================================================
-- FISCAL PERIODS FOR 2025 AND 2026
-- =====================================================

INSERT INTO fiscal_periods (fiscal_year, period_number, period_name, start_date, end_date, status, is_year_end) VALUES
-- 2025 Fiscal Year (All Closed)
(2025, 1, 'January 2025', '2025-01-01', '2025-01-31', 'CLOSED', FALSE),
(2025, 2, 'February 2025', '2025-02-01', '2025-02-28', 'CLOSED', FALSE),
(2025, 3, 'March 2025', '2025-03-01', '2025-03-31', 'CLOSED', FALSE),
(2025, 4, 'April 2025', '2025-04-01', '2025-04-30', 'CLOSED', FALSE),
(2025, 5, 'May 2025', '2025-05-01', '2025-05-31', 'CLOSED', FALSE),
(2025, 6, 'June 2025', '2025-06-01', '2025-06-30', 'CLOSED', FALSE),
(2025, 7, 'July 2025', '2025-07-01', '2025-07-31', 'CLOSED', FALSE),
(2025, 8, 'August 2025', '2025-08-01', '2025-08-31', 'CLOSED', FALSE),
(2025, 9, 'September 2025', '2025-09-01', '2025-09-30', 'CLOSED', FALSE),
(2025, 10, 'October 2025', '2025-10-01', '2025-10-31', 'CLOSED', FALSE),
(2025, 11, 'November 2025', '2025-11-01', '2025-11-30', 'CLOSED', FALSE),
(2025, 12, 'December 2025', '2025-12-01', '2025-12-31', 'CLOSED', TRUE),
-- 2026 Fiscal Year
(2026, 1, 'January 2026', '2026-01-01', '2026-01-31', 'OPEN', FALSE),
(2026, 2, 'February 2026', '2026-02-01', '2026-02-28', 'FUTURE', FALSE),
(2026, 3, 'March 2026', '2026-03-01', '2026-03-31', 'FUTURE', FALSE),
(2026, 4, 'April 2026', '2026-04-01', '2026-04-30', 'FUTURE', FALSE),
(2026, 5, 'May 2026', '2026-05-01', '2026-05-31', 'FUTURE', FALSE),
(2026, 6, 'June 2026', '2026-06-01', '2026-06-30', 'FUTURE', FALSE),
(2026, 7, 'July 2026', '2026-07-01', '2026-07-31', 'FUTURE', FALSE),
(2026, 8, 'August 2026', '2026-08-01', '2026-08-31', 'FUTURE', FALSE),
(2026, 9, 'September 2026', '2026-09-01', '2026-09-30', 'FUTURE', FALSE),
(2026, 10, 'October 2026', '2026-10-01', '2026-10-31', 'FUTURE', FALSE),
(2026, 11, 'November 2026', '2026-11-01', '2026-11-30', 'FUTURE', FALSE),
(2026, 12, 'December 2026', '2026-12-01', '2026-12-31', 'FUTURE', TRUE)
ON CONFLICT (fiscal_year, period_number) DO NOTHING;

-- =====================================================
-- UPDATE ACCOUNT BALANCES
-- =====================================================

-- ASSETS
-- Cash and Bank
UPDATE accounts SET current_balance = 15000.00, ytd_debit = 15000.00, ytd_credit = 0 WHERE account_code = '1110'; -- Petty Cash
UPDATE accounts SET current_balance = 485750.00, ytd_debit = 1250000.00, ytd_credit = 764250.00 WHERE account_code = '1120'; -- Main Bank Account
UPDATE accounts SET current_balance = 125000.00, ytd_debit = 125000.00, ytd_credit = 0 WHERE account_code = '1130'; -- Savings Account

-- Accounts Receivable
UPDATE accounts SET current_balance = 287500.00, ytd_debit = 650000.00, ytd_credit = 362500.00 WHERE account_code = '1210'; -- Trade Debtors
UPDATE accounts SET current_balance = -12500.00, ytd_debit = 0, ytd_credit = 12500.00 WHERE account_code = '1220'; -- Allowance for Doubtful Debts

-- Inventory
UPDATE accounts SET current_balance = 45000.00, ytd_debit = 95000.00, ytd_credit = 50000.00 WHERE account_code = '1310'; -- Raw Materials
UPDATE accounts SET current_balance = 25000.00, ytd_debit = 75000.00, ytd_credit = 50000.00 WHERE account_code = '1320'; -- Work in Progress
UPDATE accounts SET current_balance = 85000.00, ytd_debit = 185000.00, ytd_credit = 100000.00 WHERE account_code = '1330'; -- Finished Goods

-- Prepaid Expenses
UPDATE accounts SET current_balance = 24000.00, ytd_debit = 24000.00, ytd_credit = 0 WHERE account_code = '1410'; -- Prepaid Insurance
UPDATE accounts SET current_balance = 18000.00, ytd_debit = 18000.00, ytd_credit = 0 WHERE account_code = '1420'; -- Prepaid Rent

-- VAT Input
UPDATE accounts SET current_balance = 42500.00, ytd_debit = 125000.00, ytd_credit = 82500.00 WHERE account_code = '1510'; -- VAT Input (SARS)

-- Fixed Assets
UPDATE accounts SET current_balance = 850000.00, ytd_debit = 850000.00, ytd_credit = 0 WHERE account_code = '1611'; -- Land and Buildings
UPDATE accounts SET current_balance = 175000.00, ytd_debit = 175000.00, ytd_credit = 0 WHERE account_code = '1612'; -- Machinery & Equipment
UPDATE accounts SET current_balance = 125000.00, ytd_debit = 145000.00, ytd_credit = 20000.00 WHERE account_code = '1613'; -- Computer Equipment
UPDATE accounts SET current_balance = 65000.00, ytd_debit = 75000.00, ytd_credit = 10000.00 WHERE account_code = '1614'; -- Furniture & Fixtures
UPDATE accounts SET current_balance = 320000.00, ytd_debit = 420000.00, ytd_credit = 100000.00 WHERE account_code = '1615'; -- Motor Vehicles

-- Accumulated Depreciation (Credit balances for contra-assets)
UPDATE accounts SET current_balance = -85000.00, ytd_debit = 0, ytd_credit = 85000.00 WHERE account_code = '1621'; -- Acc Dep - Buildings
UPDATE accounts SET current_balance = -35000.00, ytd_debit = 0, ytd_credit = 35000.00 WHERE account_code = '1622'; -- Acc Dep - Machinery
UPDATE accounts SET current_balance = -45000.00, ytd_debit = 0, ytd_credit = 45000.00 WHERE account_code = '1623'; -- Acc Dep - Computers
UPDATE accounts SET current_balance = -18000.00, ytd_debit = 0, ytd_credit = 18000.00 WHERE account_code = '1624'; -- Acc Dep - Furniture
UPDATE accounts SET current_balance = -96000.00, ytd_debit = 0, ytd_credit = 96000.00 WHERE account_code = '1625'; -- Acc Dep - Vehicles

-- LIABILITIES
-- Accounts Payable
UPDATE accounts SET current_balance = 187500.00, ytd_debit = 450000.00, ytd_credit = 637500.00 WHERE account_code = '2110'; -- Trade Creditors

-- Statutory Liabilities
UPDATE accounts SET current_balance = 67500.00, ytd_debit = 195000.00, ytd_credit = 262500.00 WHERE account_code = '2210'; -- VAT Output (SARS)
UPDATE accounts SET current_balance = 48750.00, ytd_debit = 146250.00, ytd_credit = 195000.00 WHERE account_code = '2220'; -- PAYE Payable
UPDATE accounts SET current_balance = 8125.00, ytd_debit = 24375.00, ytd_credit = 32500.00 WHERE account_code = '2230'; -- UIF Payable
UPDATE accounts SET current_balance = 8125.00, ytd_debit = 24375.00, ytd_credit = 32500.00 WHERE account_code = '2240'; -- SDL Payable
UPDATE accounts SET current_balance = 35000.00, ytd_debit = 0, ytd_credit = 35000.00 WHERE account_code = '2250'; -- Provisional Tax Payable

-- Accrued Expenses
UPDATE accounts SET current_balance = 125000.00, ytd_debit = 1375000.00, ytd_credit = 1500000.00 WHERE account_code = '2310'; -- Accrued Salaries
UPDATE accounts SET current_balance = 45000.00, ytd_debit = 15000.00, ytd_credit = 60000.00 WHERE account_code = '2320'; -- Accrued Leave Pay
UPDATE accounts SET current_balance = 75000.00, ytd_debit = 0, ytd_credit = 75000.00 WHERE account_code = '2330'; -- Accrued Bonus

-- Long-term Liabilities
UPDATE accounts SET current_balance = 450000.00, ytd_debit = 50000.00, ytd_credit = 500000.00 WHERE account_code = '2510'; -- Long-term Loans
UPDATE accounts SET current_balance = 150000.00, ytd_debit = 0, ytd_credit = 150000.00 WHERE account_code = '2520'; -- Shareholders Loans

-- EQUITY
UPDATE accounts SET current_balance = 500000.00, ytd_debit = 0, ytd_credit = 500000.00 WHERE account_code = '3100'; -- Share Capital
UPDATE accounts SET current_balance = 425000.00, ytd_debit = 0, ytd_credit = 425000.00 WHERE account_code = '3200'; -- Retained Earnings
UPDATE accounts SET current_balance = 187250.00, ytd_debit = 0, ytd_credit = 187250.00 WHERE account_code = '3300'; -- Current Year Earnings
UPDATE accounts SET current_balance = -60000.00, ytd_debit = 60000.00, ytd_credit = 0 WHERE account_code = '3400'; -- Drawings

-- REVENUE (YTD figures)
UPDATE accounts SET current_balance = 1850000.00, ytd_debit = 0, ytd_credit = 1850000.00 WHERE account_code = '4110'; -- Product Sales
UPDATE accounts SET current_balance = 425000.00, ytd_debit = 0, ytd_credit = 425000.00 WHERE account_code = '4120'; -- Service Revenue
UPDATE accounts SET current_balance = 125000.00, ytd_debit = 0, ytd_credit = 125000.00 WHERE account_code = '4130'; -- Export Sales
UPDATE accounts SET current_balance = 8500.00, ytd_debit = 0, ytd_credit = 8500.00 WHERE account_code = '4210'; -- Interest Income
UPDATE accounts SET current_balance = 36000.00, ytd_debit = 0, ytd_credit = 36000.00 WHERE account_code = '4220'; -- Rental Income
UPDATE accounts SET current_balance = 4250.00, ytd_debit = 0, ytd_credit = 4250.00 WHERE account_code = '4230'; -- Discounts Received

-- EXPENSES (YTD figures)
UPDATE accounts SET current_balance = 650000.00, ytd_debit = 650000.00, ytd_credit = 0 WHERE account_code = '5110'; -- Purchases
UPDATE accounts SET current_balance = 275000.00, ytd_debit = 275000.00, ytd_credit = 0 WHERE account_code = '5120'; -- Direct Labour
UPDATE accounts SET current_balance = 85000.00, ytd_debit = 85000.00, ytd_credit = 0 WHERE account_code = '5130'; -- Manufacturing Overhead

UPDATE accounts SET current_balance = 650000.00, ytd_debit = 650000.00, ytd_credit = 0 WHERE account_code = '5210'; -- Salaries and Wages
UPDATE accounts SET current_balance = 13000.00, ytd_debit = 13000.00, ytd_credit = 0 WHERE account_code = '5220'; -- Employer UIF
UPDATE accounts SET current_balance = 6500.00, ytd_debit = 6500.00, ytd_credit = 0 WHERE account_code = '5230'; -- Employer SDL
UPDATE accounts SET current_balance = 45500.00, ytd_debit = 45500.00, ytd_credit = 0 WHERE account_code = '5240'; -- Employer Pension
UPDATE accounts SET current_balance = 32500.00, ytd_debit = 32500.00, ytd_credit = 0 WHERE account_code = '5250'; -- Employer Medical Aid

UPDATE accounts SET current_balance = 72000.00, ytd_debit = 72000.00, ytd_credit = 0 WHERE account_code = '5310'; -- Rent Expense
UPDATE accounts SET current_balance = 18000.00, ytd_debit = 18000.00, ytd_credit = 0 WHERE account_code = '5320'; -- Rates and Taxes
UPDATE accounts SET current_balance = 12000.00, ytd_debit = 12000.00, ytd_credit = 0 WHERE account_code = '5330'; -- Security

UPDATE accounts SET current_balance = 24000.00, ytd_debit = 24000.00, ytd_credit = 0 WHERE account_code = '5410'; -- Electricity
UPDATE accounts SET current_balance = 6000.00, ytd_debit = 6000.00, ytd_credit = 0 WHERE account_code = '5420'; -- Water
UPDATE accounts SET current_balance = 18000.00, ytd_debit = 18000.00, ytd_credit = 0 WHERE account_code = '5430'; -- Telephone and Internet

UPDATE accounts SET current_balance = 8500.00, ytd_debit = 8500.00, ytd_credit = 0 WHERE account_code = '5510'; -- Office Supplies
UPDATE accounts SET current_balance = 36000.00, ytd_debit = 36000.00, ytd_credit = 0 WHERE account_code = '5520'; -- Insurance
UPDATE accounts SET current_balance = 45000.00, ytd_debit = 45000.00, ytd_credit = 0 WHERE account_code = '5530'; -- Professional Fees
UPDATE accounts SET current_balance = 7500.00, ytd_debit = 7500.00, ytd_credit = 0 WHERE account_code = '5540'; -- Bank Charges
UPDATE accounts SET current_balance = 35000.00, ytd_debit = 35000.00, ytd_credit = 0 WHERE account_code = '5550'; -- Advertising and Marketing
UPDATE accounts SET current_balance = 22500.00, ytd_debit = 22500.00, ytd_credit = 0 WHERE account_code = '5560'; -- Travel and Entertainment
UPDATE accounts SET current_balance = 15000.00, ytd_debit = 15000.00, ytd_credit = 0 WHERE account_code = '5570'; -- Training and Development

UPDATE accounts SET current_balance = 17000.00, ytd_debit = 17000.00, ytd_credit = 0 WHERE account_code = '5610'; -- Depreciation - Buildings
UPDATE accounts SET current_balance = 17500.00, ytd_debit = 17500.00, ytd_credit = 0 WHERE account_code = '5620'; -- Depreciation - Machinery
UPDATE accounts SET current_balance = 25000.00, ytd_debit = 25000.00, ytd_credit = 0 WHERE account_code = '5630'; -- Depreciation - Computers
UPDATE accounts SET current_balance = 6500.00, ytd_debit = 6500.00, ytd_credit = 0 WHERE account_code = '5640'; -- Depreciation - Furniture
UPDATE accounts SET current_balance = 32000.00, ytd_debit = 32000.00, ytd_credit = 0 WHERE account_code = '5650'; -- Depreciation - Vehicles

UPDATE accounts SET current_balance = 18500.00, ytd_debit = 18500.00, ytd_credit = 0 WHERE account_code = '5710'; -- Interest Expense
UPDATE accounts SET current_balance = 3500.00, ytd_debit = 3500.00, ytd_credit = 0 WHERE account_code = '5720'; -- Bank Overdraft Interest

UPDATE accounts SET current_balance = 52500.00, ytd_debit = 52500.00, ytd_credit = 0 WHERE account_code = '5810'; -- Income Tax Expense

-- =====================================================
-- JOURNAL ENTRIES - Recent Transactions
-- =====================================================

-- Get the current period ID
DO $$
DECLARE
    v_current_period_id UUID;
    v_je_id_1 UUID;
    v_je_id_2 UUID;
    v_je_id_3 UUID;
    v_je_id_4 UUID;
    v_je_id_5 UUID;
    v_bank_account_id UUID;
    v_debtors_id UUID;
    v_sales_id UUID;
    v_vat_output_id UUID;
    v_salaries_id UUID;
    v_paye_id UUID;
    v_uif_id UUID;
    v_accrued_salaries_id UUID;
    v_creditors_id UUID;
    v_purchases_id UUID;
    v_vat_input_id UUID;
    v_electricity_id UUID;
    v_rent_id UUID;
BEGIN
    -- Get current period
    SELECT id INTO v_current_period_id FROM fiscal_periods WHERE status = 'OPEN' LIMIT 1;

    -- Get account IDs
    SELECT id INTO v_bank_account_id FROM accounts WHERE account_code = '1120';
    SELECT id INTO v_debtors_id FROM accounts WHERE account_code = '1210';
    SELECT id INTO v_sales_id FROM accounts WHERE account_code = '4110';
    SELECT id INTO v_vat_output_id FROM accounts WHERE account_code = '2210';
    SELECT id INTO v_salaries_id FROM accounts WHERE account_code = '5210';
    SELECT id INTO v_paye_id FROM accounts WHERE account_code = '2220';
    SELECT id INTO v_uif_id FROM accounts WHERE account_code = '2230';
    SELECT id INTO v_accrued_salaries_id FROM accounts WHERE account_code = '2310';
    SELECT id INTO v_creditors_id FROM accounts WHERE account_code = '2110';
    SELECT id INTO v_purchases_id FROM accounts WHERE account_code = '5110';
    SELECT id INTO v_vat_input_id FROM accounts WHERE account_code = '1510';
    SELECT id INTO v_electricity_id FROM accounts WHERE account_code = '5410';
    SELECT id INTO v_rent_id FROM accounts WHERE account_code = '5310';

    -- Journal Entry 1: Customer Payment Received (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0001') THEN
        v_je_id_1 := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id_1, 'JE-2026-0001', '2026-01-25', '2026-01-25', 'Customer payment received - ABC Trading', 'INV-2026-0042', 'RECEIPT', 'POSTED', 57500.00, 57500.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id_1, 1, v_bank_account_id, 'Payment from ABC Trading', 57500.00, NULL),
        (v_je_id_1, 2, v_debtors_id, 'Clear debtor - ABC Trading', NULL, 57500.00);
    END IF;

    -- Journal Entry 2: Sales Invoice (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0002') THEN
        v_je_id_2 := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id_2, 'JE-2026-0002', '2026-01-24', '2026-01-24', 'Sales invoice - XYZ Corporation', 'INV-2026-0055', 'INVOICE', 'POSTED', 86250.00, 86250.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, vat_category, vat_amount, net_amount)
        VALUES
        (v_je_id_2, 1, v_debtors_id, 'Invoice to XYZ Corporation', 86250.00, NULL, NULL, NULL, NULL),
        (v_je_id_2, 2, v_sales_id, 'Product sales', NULL, 75000.00, 'STANDARD', 11250.00, 75000.00),
        (v_je_id_2, 3, v_vat_output_id, 'VAT Output @ 15%', NULL, 11250.00, NULL, NULL, NULL);
    END IF;

    -- Journal Entry 3: Monthly Payroll (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0003') THEN
        v_je_id_3 := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id_3, 'JE-2026-0003', '2026-01-22', '2026-01-22', 'January 2026 Payroll', 'PAY-2026-001', 'PAYROLL', 'POSTED', 125000.00, 125000.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id_3, 1, v_salaries_id, 'Gross salaries', 125000.00, NULL),
        (v_je_id_3, 2, v_paye_id, 'PAYE deductions', NULL, 28125.00),
        (v_je_id_3, 3, v_uif_id, 'UIF deductions', NULL, 1250.00),
        (v_je_id_3, 4, v_accrued_salaries_id, 'Net salaries payable', NULL, 95625.00);
    END IF;

    -- Journal Entry 4: Supplier Payment (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0004') THEN
        v_je_id_4 := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id_4, 'JE-2026-0004', '2026-01-20', '2026-01-20', 'Payment to supplier - TechSupply Co', 'EFT-2026-0089', 'PAYMENT', 'POSTED', 34500.00, 34500.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id_4, 1, v_creditors_id, 'Payment to TechSupply Co', 34500.00, NULL),
        (v_je_id_4, 2, v_bank_account_id, 'EFT payment', NULL, 34500.00);
    END IF;

    -- Journal Entry 5: Purchase Invoice (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0005') THEN
        v_je_id_5 := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id_5, 'JE-2026-0005', '2026-01-18', '2026-01-18', 'Purchase invoice - Raw Materials Ltd', 'BILL-2026-0023', 'BILL', 'POSTED', 51750.00, 51750.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, vat_category, vat_amount, net_amount)
        VALUES
        (v_je_id_5, 1, v_purchases_id, 'Raw materials purchase', 45000.00, NULL, 'STANDARD', 6750.00, 45000.00),
        (v_je_id_5, 2, v_vat_input_id, 'VAT Input @ 15%', 6750.00, NULL, NULL, NULL, NULL),
        (v_je_id_5, 3, v_creditors_id, 'Payable to Raw Materials Ltd', NULL, 51750.00, NULL, NULL, NULL);
    END IF;

END $$;

-- Add a few more recent journal entries for variety
DO $$
DECLARE
    v_current_period_id UUID;
    v_je_id UUID;
    v_bank_account_id UUID;
    v_electricity_id UUID;
    v_rent_id UUID;
    v_vat_input_id UUID;
    v_office_supplies_id UUID;
BEGIN
    SELECT id INTO v_current_period_id FROM fiscal_periods WHERE status = 'OPEN' LIMIT 1;
    SELECT id INTO v_bank_account_id FROM accounts WHERE account_code = '1120';
    SELECT id INTO v_electricity_id FROM accounts WHERE account_code = '5410';
    SELECT id INTO v_rent_id FROM accounts WHERE account_code = '5310';
    SELECT id INTO v_vat_input_id FROM accounts WHERE account_code = '1510';
    SELECT id INTO v_office_supplies_id FROM accounts WHERE account_code = '5510';

    -- Electricity Payment (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0006') THEN
        v_je_id := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id, 'JE-2026-0006', '2026-01-15', '2026-01-15', 'Electricity payment - Eskom', 'EFT-2026-0075', 'PAYMENT', 'POSTED', 4600.00, 4600.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id, 1, v_electricity_id, 'Electricity expense', 4000.00, NULL),
        (v_je_id, 2, v_vat_input_id, 'VAT Input', 600.00, NULL),
        (v_je_id, 3, v_bank_account_id, 'EFT payment', NULL, 4600.00);
    END IF;

    -- Rent Payment (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0007') THEN
        v_je_id := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id, 'JE-2026-0007', '2026-01-05', '2026-01-05', 'Monthly rent payment - January 2026', 'EFT-2026-0045', 'PAYMENT', 'POSTED', 6900.00, 6900.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id, 1, v_rent_id, 'Rent expense', 6000.00, NULL),
        (v_je_id, 2, v_vat_input_id, 'VAT Input', 900.00, NULL),
        (v_je_id, 3, v_bank_account_id, 'EFT payment', NULL, 6900.00);
    END IF;

    -- Office Supplies (skip if already exists)
    IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_number = 'JE-2026-0008') THEN
        v_je_id := gen_random_uuid();
        INSERT INTO journal_entries (id, entry_number, transaction_date, posting_date, description, reference, entry_type, status, total_debit, total_credit, fiscal_period_id)
        VALUES (v_je_id, 'JE-2026-0008', '2026-01-10', '2026-01-10', 'Office supplies purchase - Waltons', 'CARD-2026-0012', 'PAYMENT', 'POSTED', 1725.00, 1725.00, v_current_period_id);

        INSERT INTO journal_entry_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
        VALUES
        (v_je_id, 1, v_office_supplies_id, 'Office supplies', 1500.00, NULL),
        (v_je_id, 2, v_vat_input_id, 'VAT Input', 225.00, NULL),
        (v_je_id, 3, v_bank_account_id, 'Card payment', NULL, 1725.00);
    END IF;

END $$;

COMMENT ON TABLE journal_entries IS 'Test data seeded for accounting dashboard development';
