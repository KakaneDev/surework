-- V100__add_user_verification_fields.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_code') THEN
        ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_code_expiry') THEN
        ALTER TABLE users ADD COLUMN verification_code_expiry TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(email, verification_code) WHERE verification_code IS NOT NULL;
