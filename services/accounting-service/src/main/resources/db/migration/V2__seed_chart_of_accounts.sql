-- Standard Chart of Accounts for South African SME
-- Based on common South African accounting practices

-- ASSETS (1000-1999)
INSERT INTO accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_header, is_system) VALUES
-- Current Assets
('1000', 'Current Assets', 'ASSET', NULL, 'DEBIT', TRUE, TRUE),
('1100', 'Cash and Cash Equivalents', 'ASSET', 'CASH', 'DEBIT', TRUE, FALSE),
('1110', 'Petty Cash', 'ASSET', 'CASH', 'DEBIT', FALSE, FALSE),
('1120', 'Main Bank Account', 'ASSET', 'BANK', 'DEBIT', FALSE, FALSE),
('1130', 'Savings Account', 'ASSET', 'BANK', 'DEBIT', FALSE, FALSE),
('1200', 'Accounts Receivable', 'ASSET', 'ACCOUNTS_RECEIVABLE', 'DEBIT', TRUE, FALSE),
('1210', 'Trade Debtors', 'ASSET', 'ACCOUNTS_RECEIVABLE', 'DEBIT', FALSE, FALSE),
('1220', 'Allowance for Doubtful Debts', 'ASSET', 'ACCOUNTS_RECEIVABLE', 'CREDIT', FALSE, FALSE),
('1300', 'Inventory', 'ASSET', 'INVENTORY', 'DEBIT', TRUE, FALSE),
('1310', 'Raw Materials', 'ASSET', 'INVENTORY', 'DEBIT', FALSE, FALSE),
('1320', 'Work in Progress', 'ASSET', 'INVENTORY', 'DEBIT', FALSE, FALSE),
('1330', 'Finished Goods', 'ASSET', 'INVENTORY', 'DEBIT', FALSE, FALSE),
('1400', 'Prepaid Expenses', 'ASSET', 'PREPAID_EXPENSE', 'DEBIT', TRUE, FALSE),
('1410', 'Prepaid Insurance', 'ASSET', 'PREPAID_EXPENSE', 'DEBIT', FALSE, FALSE),
('1420', 'Prepaid Rent', 'ASSET', 'PREPAID_EXPENSE', 'DEBIT', FALSE, FALSE),
('1500', 'Other Current Assets', 'ASSET', 'OTHER_CURRENT_ASSET', 'DEBIT', TRUE, FALSE),
('1510', 'VAT Input (SARS)', 'ASSET', 'OTHER_CURRENT_ASSET', 'DEBIT', FALSE, TRUE),

-- Non-Current Assets
('1600', 'Non-Current Assets', 'ASSET', NULL, 'DEBIT', TRUE, TRUE),
('1610', 'Property, Plant & Equipment', 'ASSET', 'FIXED_ASSET', 'DEBIT', TRUE, FALSE),
('1611', 'Land and Buildings', 'ASSET', 'FIXED_ASSET', 'DEBIT', FALSE, FALSE),
('1612', 'Machinery & Equipment', 'ASSET', 'FIXED_ASSET', 'DEBIT', FALSE, FALSE),
('1613', 'Computer Equipment', 'ASSET', 'FIXED_ASSET', 'DEBIT', FALSE, FALSE),
('1614', 'Furniture & Fixtures', 'ASSET', 'FIXED_ASSET', 'DEBIT', FALSE, FALSE),
('1615', 'Motor Vehicles', 'ASSET', 'FIXED_ASSET', 'DEBIT', FALSE, FALSE),
('1620', 'Accumulated Depreciation', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', TRUE, FALSE),
('1621', 'Acc Dep - Buildings', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', FALSE, FALSE),
('1622', 'Acc Dep - Machinery', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', FALSE, FALSE),
('1623', 'Acc Dep - Computers', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', FALSE, FALSE),
('1624', 'Acc Dep - Furniture', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', FALSE, FALSE),
('1625', 'Acc Dep - Vehicles', 'ASSET', 'ACCUMULATED_DEPRECIATION', 'CREDIT', FALSE, FALSE);

-- LIABILITIES (2000-2999)
INSERT INTO accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_header, is_system) VALUES
-- Current Liabilities
('2000', 'Current Liabilities', 'LIABILITY', NULL, 'CREDIT', TRUE, TRUE),
('2100', 'Accounts Payable', 'LIABILITY', 'ACCOUNTS_PAYABLE', 'CREDIT', TRUE, FALSE),
('2110', 'Trade Creditors', 'LIABILITY', 'ACCOUNTS_PAYABLE', 'CREDIT', FALSE, FALSE),
('2200', 'Statutory Liabilities', 'LIABILITY', NULL, 'CREDIT', TRUE, TRUE),
('2210', 'VAT Output (SARS)', 'LIABILITY', 'VAT_PAYABLE', 'CREDIT', FALSE, TRUE),
('2220', 'PAYE Payable', 'LIABILITY', 'PAYE_PAYABLE', 'CREDIT', FALSE, TRUE),
('2230', 'UIF Payable', 'LIABILITY', 'UIF_PAYABLE', 'CREDIT', FALSE, TRUE),
('2240', 'SDL Payable', 'LIABILITY', 'OTHER_CURRENT_LIABILITY', 'CREDIT', FALSE, TRUE),
('2250', 'Provisional Tax Payable', 'LIABILITY', 'OTHER_CURRENT_LIABILITY', 'CREDIT', FALSE, TRUE),
('2300', 'Accrued Expenses', 'LIABILITY', 'ACCRUED_EXPENSE', 'CREDIT', TRUE, FALSE),
('2310', 'Accrued Salaries', 'LIABILITY', 'ACCRUED_EXPENSE', 'CREDIT', FALSE, FALSE),
('2320', 'Accrued Leave Pay', 'LIABILITY', 'ACCRUED_EXPENSE', 'CREDIT', FALSE, FALSE),
('2330', 'Accrued Bonus', 'LIABILITY', 'ACCRUED_EXPENSE', 'CREDIT', FALSE, FALSE),
('2400', 'Short-term Loans', 'LIABILITY', 'LOANS_PAYABLE', 'CREDIT', TRUE, FALSE),
('2410', 'Bank Overdraft', 'LIABILITY', 'LOANS_PAYABLE', 'CREDIT', FALSE, FALSE),

-- Non-Current Liabilities
('2500', 'Non-Current Liabilities', 'LIABILITY', NULL, 'CREDIT', TRUE, TRUE),
('2510', 'Long-term Loans', 'LIABILITY', 'LONG_TERM_LIABILITY', 'CREDIT', FALSE, FALSE),
('2520', 'Shareholders Loans', 'LIABILITY', 'LONG_TERM_LIABILITY', 'CREDIT', FALSE, FALSE);

-- EQUITY (3000-3999)
INSERT INTO accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_header, is_system) VALUES
('3000', 'Equity', 'EQUITY', NULL, 'CREDIT', TRUE, TRUE),
('3100', 'Share Capital', 'EQUITY', 'SHARE_CAPITAL', 'CREDIT', FALSE, FALSE),
('3200', 'Retained Earnings', 'EQUITY', 'RETAINED_EARNINGS', 'CREDIT', FALSE, TRUE),
('3300', 'Current Year Earnings', 'EQUITY', 'CURRENT_YEAR_EARNINGS', 'CREDIT', FALSE, TRUE),
('3400', 'Drawings', 'EQUITY', 'DRAWINGS', 'DEBIT', FALSE, FALSE);

-- REVENUE (4000-4999)
INSERT INTO accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_header, is_system, vat_category) VALUES
('4000', 'Revenue', 'REVENUE', NULL, 'CREDIT', TRUE, TRUE, NULL),
('4100', 'Sales Revenue', 'REVENUE', 'SALES_REVENUE', 'CREDIT', TRUE, FALSE, NULL),
('4110', 'Product Sales', 'REVENUE', 'SALES_REVENUE', 'CREDIT', FALSE, FALSE, 'STANDARD'),
('4120', 'Service Revenue', 'REVENUE', 'SERVICE_REVENUE', 'CREDIT', FALSE, FALSE, 'STANDARD'),
('4130', 'Export Sales', 'REVENUE', 'SALES_REVENUE', 'CREDIT', FALSE, FALSE, 'ZERO_RATED'),
('4200', 'Other Income', 'REVENUE', 'OTHER_INCOME', 'CREDIT', TRUE, FALSE, NULL),
('4210', 'Interest Income', 'REVENUE', 'INTEREST_INCOME', 'CREDIT', FALSE, FALSE, 'EXEMPT'),
('4220', 'Rental Income', 'REVENUE', 'OTHER_INCOME', 'CREDIT', FALSE, FALSE, 'STANDARD'),
('4230', 'Discounts Received', 'REVENUE', 'OTHER_INCOME', 'CREDIT', FALSE, FALSE, 'OUT_OF_SCOPE');

-- EXPENSES (5000-5999)
INSERT INTO accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_header, is_system, vat_category) VALUES
('5000', 'Expenses', 'EXPENSE', NULL, 'DEBIT', TRUE, TRUE, NULL),
-- Cost of Sales
('5100', 'Cost of Sales', 'EXPENSE', 'COST_OF_SALES', 'DEBIT', TRUE, FALSE, NULL),
('5110', 'Purchases', 'EXPENSE', 'COST_OF_SALES', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5120', 'Direct Labour', 'EXPENSE', 'COST_OF_SALES', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5130', 'Manufacturing Overhead', 'EXPENSE', 'COST_OF_SALES', 'DEBIT', FALSE, FALSE, 'STANDARD'),
-- Operating Expenses
('5200', 'Personnel Costs', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', TRUE, FALSE, NULL),
('5210', 'Salaries and Wages', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, TRUE, 'OUT_OF_SCOPE'),
('5220', 'Employer UIF', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, TRUE, 'OUT_OF_SCOPE'),
('5230', 'Employer SDL', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, TRUE, 'OUT_OF_SCOPE'),
('5240', 'Employer Pension', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5250', 'Employer Medical Aid', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5260', 'Bonus Expense', 'EXPENSE', 'SALARIES_WAGES', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5300', 'Occupancy Costs', 'EXPENSE', 'RENT_EXPENSE', 'DEBIT', TRUE, FALSE, NULL),
('5310', 'Rent Expense', 'EXPENSE', 'RENT_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5320', 'Rates and Taxes', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'EXEMPT'),
('5330', 'Security', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5400', 'Utilities', 'EXPENSE', 'UTILITIES', 'DEBIT', TRUE, FALSE, NULL),
('5410', 'Electricity', 'EXPENSE', 'UTILITIES', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5420', 'Water', 'EXPENSE', 'UTILITIES', 'DEBIT', FALSE, FALSE, 'ZERO_RATED'),
('5430', 'Telephone and Internet', 'EXPENSE', 'UTILITIES', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5500', 'Administrative Expenses', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', TRUE, FALSE, NULL),
('5510', 'Office Supplies', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5520', 'Insurance', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'EXEMPT'),
('5530', 'Professional Fees', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5540', 'Bank Charges', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'EXEMPT'),
('5550', 'Advertising and Marketing', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5560', 'Travel and Entertainment', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5570', 'Training and Development', 'EXPENSE', 'OTHER_EXPENSE', 'DEBIT', FALSE, FALSE, 'STANDARD'),
('5600', 'Depreciation', 'EXPENSE', 'DEPRECIATION', 'DEBIT', TRUE, FALSE, NULL),
('5610', 'Depreciation - Buildings', 'EXPENSE', 'DEPRECIATION', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5620', 'Depreciation - Machinery', 'EXPENSE', 'DEPRECIATION', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5630', 'Depreciation - Computers', 'EXPENSE', 'DEPRECIATION', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5640', 'Depreciation - Furniture', 'EXPENSE', 'DEPRECIATION', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5650', 'Depreciation - Vehicles', 'EXPENSE', 'DEPRECIATION', 'DEBIT', FALSE, FALSE, 'OUT_OF_SCOPE'),
('5700', 'Finance Costs', 'EXPENSE', 'INTEREST_EXPENSE', 'DEBIT', TRUE, FALSE, NULL),
('5710', 'Interest Expense', 'EXPENSE', 'INTEREST_EXPENSE', 'DEBIT', FALSE, FALSE, 'EXEMPT'),
('5720', 'Bank Overdraft Interest', 'EXPENSE', 'INTEREST_EXPENSE', 'DEBIT', FALSE, FALSE, 'EXEMPT'),
('5800', 'Taxation', 'EXPENSE', 'TAX_EXPENSE', 'DEBIT', TRUE, FALSE, NULL),
('5810', 'Income Tax Expense', 'EXPENSE', 'TAX_EXPENSE', 'DEBIT', FALSE, TRUE, 'OUT_OF_SCOPE');

-- Set parent relationships
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1000') WHERE account_code IN ('1100', '1200', '1300', '1400', '1500');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1100') WHERE account_code IN ('1110', '1120', '1130');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1200') WHERE account_code IN ('1210', '1220');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1300') WHERE account_code IN ('1310', '1320', '1330');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1400') WHERE account_code IN ('1410', '1420');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1500') WHERE account_code IN ('1510');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1600') WHERE account_code IN ('1610', '1620');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1610') WHERE account_code IN ('1611', '1612', '1613', '1614', '1615');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '1620') WHERE account_code IN ('1621', '1622', '1623', '1624', '1625');

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2000') WHERE account_code IN ('2100', '2200', '2300', '2400');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2100') WHERE account_code IN ('2110');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2200') WHERE account_code IN ('2210', '2220', '2230', '2240', '2250');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2300') WHERE account_code IN ('2310', '2320', '2330');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2400') WHERE account_code IN ('2410');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '2500') WHERE account_code IN ('2510', '2520');

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '3000') WHERE account_code IN ('3100', '3200', '3300', '3400');

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '4000') WHERE account_code IN ('4100', '4200');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '4100') WHERE account_code IN ('4110', '4120', '4130');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '4200') WHERE account_code IN ('4210', '4220', '4230');

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5000') WHERE account_code IN ('5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5100') WHERE account_code IN ('5110', '5120', '5130');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5200') WHERE account_code IN ('5210', '5220', '5230', '5240', '5250', '5260');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5300') WHERE account_code IN ('5310', '5320', '5330');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5400') WHERE account_code IN ('5410', '5420', '5430');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5500') WHERE account_code IN ('5510', '5520', '5530', '5540', '5550', '5560', '5570');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5600') WHERE account_code IN ('5610', '5620', '5630', '5640', '5650');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5700') WHERE account_code IN ('5710', '5720');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE account_code = '5800') WHERE account_code IN ('5810');

COMMENT ON TABLE accounts IS 'Standard Chart of Accounts for South African SME with VAT categorization';
