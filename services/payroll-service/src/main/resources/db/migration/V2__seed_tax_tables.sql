-- South African Tax Tables for 2025/2026 Tax Year
-- Based on SARS tax tables effective from 1 March 2025

-- Insert 2025/2026 Tax Year
INSERT INTO tax_tables (
    id,
    tax_year,
    start_year,
    end_year,
    effective_from,
    effective_to,
    is_active,
    primary_rebate,
    secondary_rebate,
    tertiary_rebate,
    threshold_under_65,
    threshold_65_to_74,
    threshold_75_and_over,
    medical_credit_main_member,
    medical_credit_first_dependant,
    medical_credit_additional,
    uif_monthly_ceiling
) VALUES (
    gen_random_uuid(),
    '2025/2026',
    2025,
    2026,
    '2025-03-01',
    '2026-02-28',
    TRUE,
    17235.00,    -- Primary rebate
    9444.00,     -- Secondary rebate (65 and older)
    3145.00,     -- Tertiary rebate (75 and older)
    95750.00,    -- Tax threshold under 65
    148217.00,   -- Tax threshold 65-74
    165689.00,   -- Tax threshold 75 and over
    364.00,      -- Medical credit main member (monthly)
    364.00,      -- Medical credit first dependant (monthly)
    246.00,      -- Medical credit additional dependants (monthly)
    17712.00     -- UIF monthly ceiling
);

-- Get the tax table ID for inserting brackets
DO $$
DECLARE
    tax_table_uuid UUID;
BEGIN
    SELECT id INTO tax_table_uuid FROM tax_tables WHERE tax_year = '2025/2026';

    -- Insert tax brackets for 2025/2026
    -- Bracket 1: R0 - R237,100 at 18%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 0, 237100, 0.18, 0);

    -- Bracket 2: R237,101 - R370,500 at 26%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 237101, 370500, 0.26, 42678);

    -- Bracket 3: R370,501 - R512,800 at 31%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 370501, 512800, 0.31, 77362);

    -- Bracket 4: R512,801 - R673,000 at 36%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 512801, 673000, 0.36, 121475);

    -- Bracket 5: R673,001 - R857,900 at 39%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 673001, 857900, 0.39, 179147);

    -- Bracket 6: R857,901 - R1,817,000 at 41%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 857901, 1817000, 0.41, 251258);

    -- Bracket 7: R1,817,001 and above at 45%
    INSERT INTO tax_brackets (tax_table_id, min_income, max_income, rate, base_tax)
    VALUES (tax_table_uuid, 1817001, NULL, 0.45, 644489);
END $$;

-- Comment explaining the tax calculation methodology
COMMENT ON TABLE tax_tables IS
'South African PAYE tax tables. Tax is calculated as:
1. Annualize monthly income
2. Find the applicable bracket
3. Calculate tax = base_tax + (income - bracket_min) * rate
4. Subtract rebates (primary for all, secondary for 65+, tertiary for 75+)
5. Subtract medical tax credits
6. Divide by 12 for monthly PAYE

The rebates ensure:
- Under 65: No tax if income < R95,750
- 65-74: No tax if income < R148,217
- 75+: No tax if income < R165,689';
