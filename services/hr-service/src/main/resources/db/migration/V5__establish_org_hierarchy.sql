-- V5__establish_org_hierarchy.sql
-- Establish organizational hierarchy for org chart
--
-- Organizational Structure:
-- Sipho Dlamini (CEO) - EMP-1001
-- ├── Nomvula Mbeki (CFO) - EMP-1002
-- │   └── Lerato Ndlovu (Finance Manager) - EMP-1004
-- │       └── Fatima Patel (Accountant) - EMP-1006
-- ├── Thabo Mokoena (HR Manager) - EMP-1003
-- │   ├── Lindiwe Sithole (HR Officer) - EMP-1010
-- │   └── Zandile Khumalo (HR Coordinator) - EMP-1011
-- ├── Johan Meyer (Sales Manager) - EMP-1007
-- │   └── David Botha (Sales Rep) - EMP-1009
-- └── Pieter van Wyk (Senior Developer/IT Lead) - EMP-1005
--     └── Ayanda Nkosi (Developer) - EMP-1008

-- CFO reports to CEO
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id = 'e0000001-0000-0000-0000-000000000002';

-- HR Manager reports to CEO
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id = 'e0000001-0000-0000-0000-000000000003';

-- Finance Manager reports to CFO
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000002'
WHERE id = 'e0000001-0000-0000-0000-000000000004';

-- Senior Developer (IT Lead) reports to CEO
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id = 'e0000001-0000-0000-0000-000000000005';

-- Accountant reports to Finance Manager
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000004'
WHERE id = 'e0000001-0000-0000-0000-000000000006';

-- Sales Manager reports to CEO
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id = 'e0000001-0000-0000-0000-000000000007';

-- Developer reports to Senior Developer
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000005'
WHERE id = 'e0000001-0000-0000-0000-000000000008';

-- Sales Rep reports to Sales Manager
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000007'
WHERE id = 'e0000001-0000-0000-0000-000000000009';

-- HR Officer reports to HR Manager
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000003'
WHERE id = 'e0000001-0000-0000-0000-000000000010';

-- HR Coordinator reports to HR Manager
UPDATE employees SET manager_id = 'e0000001-0000-0000-0000-000000000003'
WHERE id = 'e0000001-0000-0000-0000-000000000011';
