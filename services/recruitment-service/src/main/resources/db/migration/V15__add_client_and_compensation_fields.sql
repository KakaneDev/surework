-- Add client entity and compensation flexibility for consulting/staffing companies
-- Supports posting jobs on behalf of clients with reusable Client entity

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    contact_person VARCHAR(150),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    website VARCHAR(500),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_tenant_name ON clients(tenant_id, name);

-- Enable RLS on clients table (same pattern as job_postings)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_clients ON clients
    USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
    WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Add new columns to job_postings for client and compensation flexibility
ALTER TABLE job_postings ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE job_postings ADD COLUMN client_visibility VARCHAR(20) DEFAULT 'HIDDEN'
    CHECK (client_visibility IN ('SHOW_NAME', 'CONFIDENTIAL', 'HIDDEN'));
ALTER TABLE job_postings ADD COLUMN compensation_type VARCHAR(20) DEFAULT 'MONTHLY'
    CHECK (compensation_type IN ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'));
ALTER TABLE job_postings ADD COLUMN salary_currency VARCHAR(3) DEFAULT 'ZAR';
ALTER TABLE job_postings ADD COLUMN project_name VARCHAR(200);

CREATE INDEX idx_job_postings_client_id ON job_postings(client_id);
