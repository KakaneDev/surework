-- Add RECEIVED status to application check constraint (used by public careers page submissions)
ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_application_status;
ALTER TABLE applications ADD CONSTRAINT chk_application_status
    CHECK (status IN ('NEW', 'RECEIVED', 'IN_REVIEW', 'SCREENED', 'SHORTLISTED', 'INTERVIEWING',
                      'OFFER_MADE', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED', 'REJECTED',
                      'WITHDRAWN', 'ON_HOLD'));
