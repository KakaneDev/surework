-- Link admin user to employee record in hr-service for leave management
-- The employee_id corresponds to Sipho Dlamini (CEO) from hr-service seed data

UPDATE users
SET employee_id = 'e0000001-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000100'
  AND employee_id IS NULL;
