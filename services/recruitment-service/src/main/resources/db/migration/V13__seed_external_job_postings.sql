-- ============================================================================
-- Seed External Job Postings for Development
-- ============================================================================

INSERT INTO external_job_postings (
    id, tenant_id, job_posting_id, portal, external_job_id, external_url,
    status, error_message, retry_count, posted_at, expires_at, last_checked_at,
    created_at, updated_at
) VALUES
    -- Senior Software Engineer on LinkedIn (POSTED)
    ('55555555-5555-5555-5555-555555555501',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111101',
     'LINKEDIN', 'LI-3847291', 'https://www.linkedin.com/jobs/view/3847291',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP + INTERVAL '21 days',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP),

    -- Senior Software Engineer on Pnet (POSTED)
    ('55555555-5555-5555-5555-555555555502',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111101',
     'PNET', 'PN-98321', 'https://www.pnet.co.za/jobs/98321',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP + INTERVAL '21 days',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP),

    -- HR Business Partner on LinkedIn (POSTED)
    ('55555555-5555-5555-5555-555555555503',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111102',
     'LINKEDIN', 'LI-3851002', 'https://www.linkedin.com/jobs/view/3851002',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '26 days',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP),

    -- HR Business Partner on Careers24 (POSTED)
    ('55555555-5555-5555-5555-555555555504',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111102',
     'CAREERS24', 'C24-44210', 'https://www.careers24.com/jobs/44210',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '26 days',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP),

    -- Financial Accountant on Indeed (POSTED)
    ('55555555-5555-5555-5555-555555555505',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111103',
     'INDEED', 'IND-7723901', 'https://za.indeed.com/viewjob?jk=7723901',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '28 days',
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),

    -- Financial Accountant on Pnet (POSTED)
    ('55555555-5555-5555-5555-555555555506',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111103',
     'PNET', 'PN-98455', 'https://www.pnet.co.za/jobs/98455',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '28 days',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),

    -- DevOps Engineer on LinkedIn (POSTED today)
    ('55555555-5555-5555-5555-555555555507',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111104',
     'LINKEDIN', 'LI-3855100', 'https://www.linkedin.com/jobs/view/3855100',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP + INTERVAL '29 days',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP),

    -- DevOps Engineer on Indeed (FAILED - will show error state)
    ('55555555-5555-5555-5555-555555555508',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111104',
     'INDEED', NULL, NULL,
     'FAILED', 'Connection timeout: Indeed API did not respond within 30s', 3,
     NULL, NULL,
     CURRENT_TIMESTAMP - INTERVAL '12 hours',
     CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),

    -- Marketing Coordinator on Careers24 (POSTED)
    ('55555555-5555-5555-5555-555555555509',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111105',
     'CAREERS24', 'C24-44350', 'https://www.careers24.com/jobs/44350',
     'POSTED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '8 days',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP),

    -- Marketing Coordinator on Pnet (EXPIRED)
    ('55555555-5555-5555-5555-555555555510',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111105',
     'PNET', 'PN-97800', 'https://www.pnet.co.za/jobs/97800',
     'EXPIRED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '6 days',
     CURRENT_TIMESTAMP - INTERVAL '6 days',
     CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),

    -- Junior Developer on LinkedIn (POSTED - filled job, still showing)
    ('55555555-5555-5555-5555-555555555511',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111107',
     'LINKEDIN', 'LI-3820050', 'https://www.linkedin.com/jobs/view/3820050',
     'REMOVED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '10 days',
     CURRENT_TIMESTAMP - INTERVAL '15 days',
     CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP),

    -- Junior Developer on Indeed (REMOVED after fill)
    ('55555555-5555-5555-5555-555555555512',
     '00000000-0000-0000-0000-000000000099',
     '11111111-1111-1111-1111-111111111107',
     'INDEED', 'IND-7710200', 'https://za.indeed.com/viewjob?jk=7710200',
     'REMOVED', NULL, 0,
     CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '10 days',
     CURRENT_TIMESTAMP - INTERVAL '15 days',
     CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP)

ON CONFLICT (job_posting_id, portal) DO NOTHING;

-- Update view counts on job postings to give advert performance meaningful data
UPDATE job_postings SET view_count = 87  WHERE id = '11111111-1111-1111-1111-111111111101' AND view_count = 0;
UPDATE job_postings SET view_count = 42  WHERE id = '11111111-1111-1111-1111-111111111102' AND view_count = 0;
UPDATE job_postings SET view_count = 31  WHERE id = '11111111-1111-1111-1111-111111111103' AND view_count = 0;
UPDATE job_postings SET view_count = 23  WHERE id = '11111111-1111-1111-1111-111111111104' AND view_count = 0;
UPDATE job_postings SET view_count = 56  WHERE id = '11111111-1111-1111-1111-111111111105' AND view_count = 0;
UPDATE job_postings SET view_count = 120 WHERE id = '11111111-1111-1111-1111-111111111107' AND view_count = 0;
