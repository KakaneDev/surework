-- V4__add_ticket_merge.sql
-- Add support for ticket merging

-- Add merged_into_ticket_id column to tickets table
ALTER TABLE tickets
ADD COLUMN merged_into_ticket_id UUID REFERENCES tickets(id);

-- Create index for finding merged tickets
CREATE INDEX idx_tickets_merged_into ON tickets(merged_into_ticket_id) WHERE merged_into_ticket_id IS NOT NULL;

-- Create ticket_merges audit table for tracking merge history
CREATE TABLE ticket_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_ticket_id UUID NOT NULL REFERENCES tickets(id),
    source_ticket_id UUID NOT NULL REFERENCES tickets(id),
    merged_by_user_id UUID NOT NULL,
    merged_by_user_name VARCHAR(200),
    merged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_target_ticket FOREIGN KEY (target_ticket_id) REFERENCES tickets(id),
    CONSTRAINT fk_source_ticket FOREIGN KEY (source_ticket_id) REFERENCES tickets(id)
);

-- Indexes for merge history queries
CREATE INDEX idx_ticket_merges_target ON ticket_merges(target_ticket_id);
CREATE INDEX idx_ticket_merges_source ON ticket_merges(source_ticket_id);
CREATE INDEX idx_ticket_merges_merged_at ON ticket_merges(merged_at DESC);

COMMENT ON TABLE ticket_merges IS 'Audit log of ticket merge operations';
COMMENT ON COLUMN tickets.merged_into_ticket_id IS 'If set, indicates this ticket was merged into another ticket';
