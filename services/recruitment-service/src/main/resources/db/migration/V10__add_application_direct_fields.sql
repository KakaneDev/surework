-- V10__add_application_direct_fields.sql
-- Add direct applicant fields to applications table for public careers page submissions
-- These allow applications without requiring a pre-existing Candidate profile

-- Make candidate_id nullable (was previously NOT NULL)
-- This allows public applications where no Candidate exists yet
ALTER TABLE applications ALTER COLUMN candidate_id DROP NOT NULL;

-- Add direct applicant contact fields
ALTER TABLE applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add optional profile links
ALTER TABLE applications ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500);

-- Add additional application info
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notice_period VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS expected_salary DECIMAL(12,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS additional_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP;

-- Create index on email for duplicate checking on public applications
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email) WHERE email IS NOT NULL;

-- Create composite index for checking existing applications by job and email
CREATE INDEX IF NOT EXISTS idx_applications_job_email ON applications(job_posting_id, email)
    WHERE email IS NOT NULL AND deleted = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN applications.first_name IS 'Direct applicant first name (for public applications without Candidate profile)';
COMMENT ON COLUMN applications.last_name IS 'Direct applicant last name (for public applications without Candidate profile)';
COMMENT ON COLUMN applications.email IS 'Direct applicant email (for public applications without Candidate profile)';
COMMENT ON COLUMN applications.phone IS 'Direct applicant phone (for public applications without Candidate profile)';
COMMENT ON COLUMN applications.linkedin_url IS 'Applicant LinkedIn profile URL';
COMMENT ON COLUMN applications.portfolio_url IS 'Applicant portfolio/website URL';
COMMENT ON COLUMN applications.notice_period IS 'Applicant current notice period (e.g., "2 weeks", "1 month")';
COMMENT ON COLUMN applications.expected_salary IS 'Applicant expected salary';
COMMENT ON COLUMN applications.referred_by IS 'Name of person who referred the applicant';
COMMENT ON COLUMN applications.additional_notes IS 'Additional notes provided by the applicant';
COMMENT ON COLUMN applications.applied_at IS 'Timestamp when the public application was submitted';
