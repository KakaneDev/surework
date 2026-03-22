-- ============================================================================
-- Development Test Data for Recruitment Service
-- ============================================================================

-- Insert sample job postings
INSERT INTO job_postings (
    id, job_reference, title, department_name, location, employment_type,
    description, requirements, status, posting_date, closing_date,
    positions_available, salary_min, salary_max, show_salary, internal_only, remote
) VALUES
    -- Open positions
    ('11111111-1111-1111-1111-111111111101', 'JOB-001001', 'Senior Software Engineer',
     'Engineering', 'Johannesburg', 'FULL_TIME',
     'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing and implementing scalable software solutions.',
     'Java, Spring Boot, PostgreSQL, 5+ years experience',
     'OPEN', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
     2, 650000.00, 850000.00, true, false, true),

    ('11111111-1111-1111-1111-111111111102', 'JOB-001002', 'HR Business Partner',
     'Human Resources', 'Cape Town', 'FULL_TIME',
     'Seeking an experienced HR Business Partner to support our Cape Town office and drive strategic HR initiatives.',
     'HR degree, SABPP certification preferred, 3+ years experience',
     'OPEN', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
     1, 450000.00, 600000.00, true, false, false),

    ('11111111-1111-1111-1111-111111111103', 'JOB-001003', 'Financial Accountant',
     'Finance', 'Durban', 'FULL_TIME',
     'Join our finance team as a Financial Accountant. You will be responsible for financial reporting and compliance.',
     'CA(SA) or CIMA, 2+ years post-article experience',
     'OPEN', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '30 days',
     1, 500000.00, 700000.00, false, false, false),

    ('11111111-1111-1111-1111-111111111104', 'JOB-001004', 'DevOps Engineer',
     'Engineering', 'Johannesburg', 'FULL_TIME',
     'Looking for a DevOps Engineer to help us build and maintain our cloud infrastructure.',
     'AWS/Azure, Kubernetes, CI/CD, 3+ years experience',
     'OPEN', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '28 days',
     1, 550000.00, 750000.00, true, false, true),

    ('11111111-1111-1111-1111-111111111105', 'JOB-001005', 'Marketing Coordinator',
     'Marketing', 'Pretoria', 'CONTRACT',
     'Contract position for a Marketing Coordinator to support our upcoming product launches.',
     'Marketing degree, digital marketing experience, 2+ years',
     'OPEN', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '14 days',
     1, 35000.00, 45000.00, true, false, false),

    -- Draft positions
    ('11111111-1111-1111-1111-111111111106', 'JOB-001006', 'Project Manager',
     'Operations', 'Johannesburg', 'FULL_TIME',
     'Project Manager needed to lead cross-functional teams and deliver enterprise projects.',
     'PMP certification, 5+ years PM experience',
     'DRAFT', NULL, NULL,
     1, 600000.00, 800000.00, false, true, false),

    -- Filled position
    ('11111111-1111-1111-1111-111111111107', 'JOB-001007', 'Junior Developer',
     'Engineering', 'Remote', 'FULL_TIME',
     'Entry-level developer position for a recent graduate.',
     'Computer Science degree, programming fundamentals',
     'FILLED', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days',
     1, 280000.00, 350000.00, true, false, true)
ON CONFLICT (job_reference) DO NOTHING;

-- Insert sample candidates
INSERT INTO candidates (
    id, candidate_reference, first_name, last_name, email, phone,
    current_job_title, current_employer, years_experience,
    highest_qualification, field_of_study, skills, status, source
) VALUES
    ('22222222-2222-2222-2222-222222222201', 'CAN-010001', 'Thabo', 'Molefe',
     'thabo.molefe@email.co.za', '+27 82 123 4567',
     'Software Developer', 'Tech Solutions SA', 6,
     'BSc Computer Science', 'Computer Science', 'Java, Python, AWS, Docker',
     'ACTIVE', 'LINKEDIN'),

    ('22222222-2222-2222-2222-222222222202', 'CAN-010002', 'Naledi', 'Dlamini',
     'naledi.dlamini@email.co.za', '+27 83 234 5678',
     'HR Officer', 'ABC Holdings', 4,
     'BCom Human Resources', 'Human Resource Management', 'HRIS, Labour Law, Recruitment',
     'ACTIVE', 'REFERRAL'),

    ('22222222-2222-2222-2222-222222222203', 'CAN-010003', 'Pieter', 'van der Berg',
     'pieter.vdberg@email.co.za', '+27 84 345 6789',
     'Financial Analyst', 'Nedbank', 3,
     'BCom Accounting', 'Accounting', 'SAP, Excel, Financial Modeling',
     'ACTIVE', 'JOB_BOARD'),

    ('22222222-2222-2222-2222-222222222204', 'CAN-010004', 'Zinhle', 'Nkosi',
     'zinhle.nkosi@email.co.za', '+27 85 456 7890',
     'DevOps Specialist', 'CloudFirst', 5,
     'BSc Information Technology', 'Information Technology', 'Kubernetes, Terraform, AWS, Azure',
     'ACTIVE', 'LINKEDIN'),

    ('22222222-2222-2222-2222-222222222205', 'CAN-010005', 'Michael', 'Smith',
     'michael.smith@email.co.za', '+27 86 567 8901',
     'Marketing Executive', 'Media House', 3,
     'BA Marketing', 'Marketing', 'Digital Marketing, Social Media, Analytics',
     'ACTIVE', 'DIRECT')
ON CONFLICT (email) DO NOTHING;

-- Insert sample applications
INSERT INTO applications (
    id, application_reference, candidate_id, job_posting_id,
    application_date, status, stage, screening_score, overall_rating
) VALUES
    -- Applications for Senior Software Engineer
    ('33333333-3333-3333-3333-333333333301', 'APP-00100001',
     '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101',
     CURRENT_DATE - INTERVAL '8 days', 'SHORTLISTED', 'FIRST_INTERVIEW', 85, 4),

    ('33333333-3333-3333-3333-333333333302', 'APP-00100002',
     '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101',
     CURRENT_DATE - INTERVAL '7 days', 'IN_REVIEW', 'SCREENING', 78, NULL),

    -- Applications for HR Business Partner
    ('33333333-3333-3333-3333-333333333303', 'APP-00100003',
     '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102',
     CURRENT_DATE - INTERVAL '4 days', 'NEW', 'NEW', NULL, NULL),

    -- Applications for DevOps Engineer
    ('33333333-3333-3333-3333-333333333304', 'APP-00100004',
     '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104',
     CURRENT_DATE, 'NEW', 'NEW', NULL, NULL),

    -- Applications for Marketing Coordinator
    ('33333333-3333-3333-3333-333333333305', 'APP-00100005',
     '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105',
     CURRENT_DATE - INTERVAL '5 days', 'INTERVIEWING', 'PHONE_SCREEN', 70, 3)
ON CONFLICT (candidate_id, job_posting_id) DO NOTHING;

-- Update application counts on job postings
UPDATE job_postings SET application_count = 2 WHERE id = '11111111-1111-1111-1111-111111111101';
UPDATE job_postings SET application_count = 1 WHERE id = '11111111-1111-1111-1111-111111111102';
UPDATE job_postings SET application_count = 1 WHERE id = '11111111-1111-1111-1111-111111111104';
UPDATE job_postings SET application_count = 1 WHERE id = '11111111-1111-1111-1111-111111111105';

-- Insert sample interviews
INSERT INTO interviews (
    id, application_id, interview_type, round_number, scheduled_at,
    duration_minutes, location_type, location_details, interviewer_id,
    interviewer_name, interviewer_email, status, reminder_sent
) VALUES
    -- Interview for Thabo (Senior Software Engineer)
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301',
     'VIDEO_CALL', 1, CURRENT_TIMESTAMP + INTERVAL '2 days',
     60, 'REMOTE', 'Microsoft Teams', '00000000-0000-0000-0000-000000000100',
     'System Administrator', 'admin@testcompany.co.za', 'SCHEDULED', false),

    -- Interview for Michael (Marketing Coordinator)
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333305',
     'PHONE_SCREEN', 1, CURRENT_TIMESTAMP + INTERVAL '1 day',
     30, 'REMOTE', 'Phone call', '00000000-0000-0000-0000-000000000100',
     'System Administrator', 'admin@testcompany.co.za', 'CONFIRMED', false)
ON CONFLICT DO NOTHING;
