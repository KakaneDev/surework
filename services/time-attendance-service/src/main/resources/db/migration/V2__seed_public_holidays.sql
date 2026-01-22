-- ============================================================================
-- Seed South African Public Holidays for 2024, 2025, and 2026
-- Per Public Holidays Act 36 of 1994
-- ============================================================================

-- 2024 Public Holidays
INSERT INTO public_holidays (name, holiday_date, year, holiday_type, description) VALUES
('New Year''s Day', '2024-01-01', 2024, 'FIXED', 'First day of the year'),
('Human Rights Day', '2024-03-21', 2024, 'FIXED', 'Commemorates the Sharpeville massacre of 1960'),
('Good Friday', '2024-03-29', 2024, 'CALCULATED', 'Friday before Easter Sunday'),
('Family Day', '2024-04-01', 2024, 'CALCULATED', 'Monday after Easter Sunday'),
('Freedom Day', '2024-04-27', 2024, 'FIXED', 'Commemorates first democratic elections in 1994'),
('Workers'' Day', '2024-05-01', 2024, 'FIXED', 'International Workers'' Day'),
('Youth Day', '2024-06-16', 2024, 'FIXED', 'Commemorates the Soweto uprising of 1976'),
('Youth Day (Observed)', '2024-06-17', 2024, 'FIXED', 'Youth Day falls on Sunday, observed on Monday'),
('National Women''s Day', '2024-08-09', 2024, 'FIXED', 'Commemorates the 1956 march to Union Buildings'),
('Heritage Day', '2024-09-24', 2024, 'FIXED', 'Celebration of South African cultural heritage'),
('Day of Reconciliation', '2024-12-16', 2024, 'FIXED', 'Promotes reconciliation and national unity'),
('Christmas Day', '2024-12-25', 2024, 'FIXED', 'Christian celebration of the birth of Jesus Christ'),
('Day of Goodwill', '2024-12-26', 2024, 'FIXED', 'Day for giving back to the community');

-- 2025 Public Holidays
INSERT INTO public_holidays (name, holiday_date, year, holiday_type, description) VALUES
('New Year''s Day', '2025-01-01', 2025, 'FIXED', 'First day of the year'),
('Human Rights Day', '2025-03-21', 2025, 'FIXED', 'Commemorates the Sharpeville massacre of 1960'),
('Good Friday', '2025-04-18', 2025, 'CALCULATED', 'Friday before Easter Sunday'),
('Family Day', '2025-04-21', 2025, 'CALCULATED', 'Monday after Easter Sunday'),
('Freedom Day', '2025-04-27', 2025, 'FIXED', 'Commemorates first democratic elections in 1994'),
('Freedom Day (Observed)', '2025-04-28', 2025, 'FIXED', 'Freedom Day falls on Sunday, observed on Monday'),
('Workers'' Day', '2025-05-01', 2025, 'FIXED', 'International Workers'' Day'),
('Youth Day', '2025-06-16', 2025, 'FIXED', 'Commemorates the Soweto uprising of 1976'),
('National Women''s Day', '2025-08-09', 2025, 'FIXED', 'Commemorates the 1956 march to Union Buildings'),
('Heritage Day', '2025-09-24', 2025, 'FIXED', 'Celebration of South African cultural heritage'),
('Day of Reconciliation', '2025-12-16', 2025, 'FIXED', 'Promotes reconciliation and national unity'),
('Christmas Day', '2025-12-25', 2025, 'FIXED', 'Christian celebration of the birth of Jesus Christ'),
('Day of Goodwill', '2025-12-26', 2025, 'FIXED', 'Day for giving back to the community');

-- 2026 Public Holidays
INSERT INTO public_holidays (name, holiday_date, year, holiday_type, description) VALUES
('New Year''s Day', '2026-01-01', 2026, 'FIXED', 'First day of the year'),
('Human Rights Day', '2026-03-21', 2026, 'FIXED', 'Commemorates the Sharpeville massacre of 1960'),
('Human Rights Day (Observed)', '2026-03-23', 2026, 'FIXED', 'Human Rights Day falls on Saturday, observed on Monday'),
('Good Friday', '2026-04-03', 2026, 'CALCULATED', 'Friday before Easter Sunday'),
('Family Day', '2026-04-06', 2026, 'CALCULATED', 'Monday after Easter Sunday'),
('Freedom Day', '2026-04-27', 2026, 'FIXED', 'Commemorates first democratic elections in 1994'),
('Workers'' Day', '2026-05-01', 2026, 'FIXED', 'International Workers'' Day'),
('Youth Day', '2026-06-16', 2026, 'FIXED', 'Commemorates the Soweto uprising of 1976'),
('National Women''s Day', '2026-08-09', 2026, 'FIXED', 'Commemorates the 1956 march to Union Buildings'),
('National Women''s Day (Observed)', '2026-08-10', 2026, 'FIXED', 'Women''s Day falls on Sunday, observed on Monday'),
('Heritage Day', '2026-09-24', 2026, 'FIXED', 'Celebration of South African cultural heritage'),
('Day of Reconciliation', '2026-12-16', 2026, 'FIXED', 'Promotes reconciliation and national unity'),
('Christmas Day', '2026-12-25', 2026, 'FIXED', 'Christian celebration of the birth of Jesus Christ'),
('Day of Goodwill', '2026-12-26', 2026, 'FIXED', 'Day for giving back to the community');

-- Update substitute holiday flags
UPDATE public_holidays SET is_substitute = true, original_date = '2024-06-16'
WHERE name = 'Youth Day (Observed)' AND year = 2024;

UPDATE public_holidays SET is_substitute = true, original_date = '2025-04-27'
WHERE name = 'Freedom Day (Observed)' AND year = 2025;

UPDATE public_holidays SET is_substitute = true, original_date = '2026-03-21'
WHERE name = 'Human Rights Day (Observed)' AND year = 2026;

UPDATE public_holidays SET is_substitute = true, original_date = '2026-08-09'
WHERE name = 'National Women''s Day (Observed)' AND year = 2026;

COMMENT ON TABLE public_holidays IS 'South African public holidays per Public Holidays Act 36 of 1994 - includes substitute days when holidays fall on Sundays';
