-- ============================================================================
-- Recruitment Service Database Schema
-- South African Applicant Tracking System (ATS)
-- ============================================================================

-- Job Postings Table
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_reference VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    department_id UUID,
    department_name VARCHAR(100),
    location VARCHAR(100),
    employment_type VARCHAR(20) NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    qualifications TEXT,
    skills TEXT,
    experience_years_min INTEGER,
    experience_years_max INTEGER,
    salary_min DECIMAL(15, 2),
    salary_max DECIMAL(15, 2),
    show_salary BOOLEAN DEFAULT false,
    benefits TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    posting_date DATE,
    closing_date DATE,
    positions_available INTEGER NOT NULL DEFAULT 1,
    positions_filled INTEGER NOT NULL DEFAULT 0,
    hiring_manager_id UUID,
    hiring_manager_name VARCHAR(100),
    recruiter_id UUID,
    recruiter_name VARCHAR(100),
    internal_only BOOLEAN DEFAULT false,
    remote BOOLEAN DEFAULT false,
    application_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_employment_type CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE')),
    CONSTRAINT chk_job_status CHECK (status IN ('DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'FILLED', 'CANCELLED')),
    CONSTRAINT chk_experience_range CHECK (experience_years_min IS NULL OR experience_years_max IS NULL OR experience_years_min <= experience_years_max),
    CONSTRAINT chk_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    CONSTRAINT chk_positions CHECK (positions_available >= 1 AND positions_filled >= 0 AND positions_filled <= positions_available)
);

-- Candidates Table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_reference VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    id_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    current_job_title VARCHAR(100),
    current_employer VARCHAR(100),
    years_experience INTEGER,
    highest_qualification VARCHAR(100),
    field_of_study VARCHAR(100),
    skills TEXT,
    languages VARCHAR(500),
    expected_salary DECIMAL(15, 2),
    notice_period_days INTEGER,
    available_from DATE,
    willing_to_relocate BOOLEAN DEFAULT false,
    preferred_locations VARCHAR(500),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    source VARCHAR(50),
    referred_by VARCHAR(100),
    internal_candidate BOOLEAN DEFAULT false,
    employee_id UUID,
    blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_candidate_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'HIRED', 'ARCHIVED')),
    CONSTRAINT chk_gender CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'))
);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_reference VARCHAR(20) NOT NULL UNIQUE,
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id),
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    stage VARCHAR(30) NOT NULL DEFAULT 'NEW',
    cover_letter TEXT,
    screening_score INTEGER,
    screening_notes TEXT,
    screened_by UUID,
    screened_at TIMESTAMP WITH TIME ZONE,
    assessment_score INTEGER,
    assessment_notes TEXT,
    interview_count INTEGER NOT NULL DEFAULT 0,
    overall_interview_rating INTEGER,
    offer_salary DECIMAL(15, 2),
    offer_date DATE,
    offer_expiry_date DATE,
    offer_response_date DATE,
    expected_start_date DATE,
    rejection_reason TEXT,
    rejection_notes TEXT,
    rejected_by UUID,
    rejected_at TIMESTAMP WITH TIME ZONE,
    withdrawn_reason TEXT,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    overall_rating INTEGER,
    starred BOOLEAN DEFAULT false,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_application_status CHECK (status IN (
        'NEW', 'IN_REVIEW', 'SCREENED', 'SHORTLISTED', 'INTERVIEWING',
        'OFFER_MADE', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED',
        'REJECTED', 'WITHDRAWN', 'ON_HOLD'
    )),
    CONSTRAINT chk_recruitment_stage CHECK (stage IN (
        'NEW', 'SCREENING', 'PHONE_SCREEN', 'ASSESSMENT', 'FIRST_INTERVIEW',
        'SECOND_INTERVIEW', 'FINAL_INTERVIEW', 'REFERENCE_CHECK',
        'BACKGROUND_CHECK', 'OFFER', 'ONBOARDING', 'COMPLETED'
    )),
    CONSTRAINT chk_screening_score CHECK (screening_score IS NULL OR (screening_score >= 0 AND screening_score <= 100)),
    CONSTRAINT chk_assessment_score CHECK (assessment_score IS NULL OR (assessment_score >= 0 AND assessment_score <= 100)),
    CONSTRAINT chk_overall_rating CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
    CONSTRAINT chk_interview_rating CHECK (overall_interview_rating IS NULL OR (overall_interview_rating >= 1 AND overall_interview_rating <= 5)),
    CONSTRAINT uk_candidate_job UNIQUE (candidate_id, job_posting_id)
);

-- Interviews Table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    interview_type VARCHAR(30) NOT NULL,
    round_number INTEGER NOT NULL DEFAULT 1,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    end_time TIMESTAMP WITH TIME ZONE,
    location_type VARCHAR(20) NOT NULL,
    location_details VARCHAR(500),
    meeting_link VARCHAR(500),
    interviewer_id UUID NOT NULL,
    interviewer_name VARCHAR(100),
    interviewer_email VARCHAR(255),
    panel_interviewer_ids TEXT,
    panel_interviewer_names TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    rescheduled_from TIMESTAMP WITH TIME ZONE,
    reschedule_reason TEXT,
    technical_rating INTEGER,
    communication_rating INTEGER,
    cultural_fit_rating INTEGER,
    overall_rating INTEGER,
    recommendation VARCHAR(20),
    feedback TEXT,
    strengths TEXT,
    concerns TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,
    agenda TEXT,
    topics_to_cover TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_interview_type CHECK (interview_type IN (
        'PHONE_SCREEN', 'VIDEO_CALL', 'IN_PERSON', 'PANEL',
        'TECHNICAL', 'BEHAVIORAL', 'CASE_STUDY', 'PRESENTATION',
        'GROUP', 'FINAL'
    )),
    CONSTRAINT chk_location_type CHECK (location_type IN ('ONSITE', 'REMOTE', 'HYBRID')),
    CONSTRAINT chk_interview_status CHECK (status IN (
        'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED',
        'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'FEEDBACK_PENDING'
    )),
    CONSTRAINT chk_recommendation CHECK (recommendation IS NULL OR recommendation IN (
        'STRONG_HIRE', 'HIRE', 'LEAN_HIRE', 'NEUTRAL',
        'LEAN_NO_HIRE', 'NO_HIRE', 'STRONG_NO_HIRE'
    )),
    CONSTRAINT chk_tech_rating CHECK (technical_rating IS NULL OR (technical_rating >= 1 AND technical_rating <= 5)),
    CONSTRAINT chk_comm_rating CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
    CONSTRAINT chk_culture_rating CHECK (cultural_fit_rating IS NULL OR (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5)),
    CONSTRAINT chk_interview_overall_rating CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
    CONSTRAINT chk_duration CHECK (duration_minutes >= 15 AND duration_minutes <= 480)
);

-- Candidate Documents Table (for CVs, cover letters, certificates, etc.)
CREATE TABLE candidate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    document_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_document_type CHECK (document_type IN (
        'CV', 'COVER_LETTER', 'CERTIFICATE', 'QUALIFICATION',
        'ID_DOCUMENT', 'REFERENCE', 'PORTFOLIO', 'OTHER'
    ))
);

-- Application Notes Table (for recruiter/interviewer notes)
CREATE TABLE application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    author_id UUID NOT NULL,
    author_name VARCHAR(100),
    note_type VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_note_type CHECK (note_type IN ('GENERAL', 'SCREENING', 'INTERVIEW', 'FEEDBACK', 'INTERNAL'))
);

-- Email Templates Table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    variables VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_template_type CHECK (template_type IN (
        'APPLICATION_RECEIVED', 'INTERVIEW_INVITATION', 'INTERVIEW_REMINDER',
        'INTERVIEW_CONFIRMATION', 'OFFER_LETTER', 'REJECTION', 'WELCOME'
    ))
);

-- Talent Pool Table (for future opportunities)
CREATE TABLE talent_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    pool_name VARCHAR(100) NOT NULL,
    added_by UUID NOT NULL,
    added_by_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Recruitment Events Table (for career fairs, etc.)
CREATE TABLE recruitment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    organizer_id UUID,
    organizer_name VARCHAR(100),
    budget DECIMAL(15, 2),
    expected_attendees INTEGER,
    actual_attendees INTEGER,
    candidates_sourced INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_event_type CHECK (event_type IN ('CAREER_FAIR', 'CAMPUS_DRIVE', 'OPEN_DAY', 'WEBINAR', 'OTHER')),
    CONSTRAINT chk_event_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Create indexes for common queries
CREATE INDEX idx_job_postings_status ON job_postings(status) WHERE deleted = false;
CREATE INDEX idx_job_postings_department ON job_postings(department_id) WHERE deleted = false;
CREATE INDEX idx_job_postings_employment_type ON job_postings(employment_type) WHERE deleted = false;
CREATE INDEX idx_job_postings_location ON job_postings(location) WHERE deleted = false;
CREATE INDEX idx_job_postings_posting_date ON job_postings(posting_date) WHERE deleted = false;

CREATE INDEX idx_candidates_status ON candidates(status) WHERE deleted = false;
CREATE INDEX idx_candidates_email ON candidates(email) WHERE deleted = false;
CREATE INDEX idx_candidates_skills ON candidates USING gin(to_tsvector('english', skills)) WHERE deleted = false;

CREATE INDEX idx_applications_candidate ON applications(candidate_id) WHERE deleted = false;
CREATE INDEX idx_applications_job ON applications(job_posting_id) WHERE deleted = false;
CREATE INDEX idx_applications_status ON applications(status) WHERE deleted = false;
CREATE INDEX idx_applications_stage ON applications(stage) WHERE deleted = false;
CREATE INDEX idx_applications_date ON applications(application_date) WHERE deleted = false;

CREATE INDEX idx_interviews_application ON interviews(application_id) WHERE deleted = false;
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id) WHERE deleted = false;
CREATE INDEX idx_interviews_status ON interviews(status) WHERE deleted = false;
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at) WHERE deleted = false;

-- Create sequences for reference numbers
CREATE SEQUENCE job_reference_seq START WITH 1000;
CREATE SEQUENCE candidate_reference_seq START WITH 10000;
CREATE SEQUENCE application_reference_seq START WITH 100000;

-- Function to generate job reference
CREATE OR REPLACE FUNCTION generate_job_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_reference IS NULL THEN
        NEW.job_reference := 'JOB-' || LPAD(nextval('job_reference_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate candidate reference
CREATE OR REPLACE FUNCTION generate_candidate_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.candidate_reference IS NULL THEN
        NEW.candidate_reference := 'CAN-' || LPAD(nextval('candidate_reference_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate application reference
CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_reference IS NULL THEN
        NEW.application_reference := 'APP-' || LPAD(nextval('application_reference_seq')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trg_job_reference
    BEFORE INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION generate_job_reference();

CREATE TRIGGER trg_candidate_reference
    BEFORE INSERT ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION generate_candidate_reference();

CREATE TRIGGER trg_application_reference
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION generate_application_reference();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER trg_job_postings_updated
    BEFORE UPDATE ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_candidates_updated
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_interviews_updated
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE job_postings IS 'Job vacancy postings for recruitment';
COMMENT ON TABLE candidates IS 'Job seekers and applicants in the talent pool';
COMMENT ON TABLE applications IS 'Job applications linking candidates to positions';
COMMENT ON TABLE interviews IS 'Interview schedule and feedback for applications';
COMMENT ON TABLE candidate_documents IS 'Documents uploaded by candidates (CV, certificates, etc.)';
COMMENT ON TABLE application_notes IS 'Notes and comments on applications by recruiters';
COMMENT ON TABLE email_templates IS 'Email templates for recruitment communications';
COMMENT ON TABLE talent_pool IS 'Candidates grouped for future opportunities';
COMMENT ON TABLE recruitment_events IS 'Career fairs and recruitment events';
