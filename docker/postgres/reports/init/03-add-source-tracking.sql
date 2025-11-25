-- Add source tracking to prevent duplicate ETL loads
-- This column stores the original ticket_id from the primary OLTP database

ALTER TABLE reports.tickets
ADD COLUMN IF NOT EXISTS source_ticket_id UUID;

-- Create unique index to prevent duplicate loads
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_source_id
ON reports.tickets(source_ticket_id)
WHERE source_ticket_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN reports.tickets.source_ticket_id IS
'Original ticket_id from the primary OLTP database for ETL tracking';

SELECT 'Source tracking column added successfully' AS status;
