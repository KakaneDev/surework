-- Add offer_token column for public offer acceptance links
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_token VARCHAR(64) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_applications_offer_token ON applications(offer_token) WHERE offer_token IS NOT NULL;
