-- Add notification columns for interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_notified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewer_notified BOOLEAN NOT NULL DEFAULT false;
