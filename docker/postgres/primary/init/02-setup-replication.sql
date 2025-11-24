-- Setup Replication for Primary Database

-- Create replication user for physical replication (hot backup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH REPLICATION PASSWORD 'replicapass123' LOGIN;
  END IF;
END
$$;

-- Create publication for logical replication to reports database
-- This will replicate data changes to the reports database
CREATE PUBLICATION reports_pub FOR ALL TABLES;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;

-- Create a function to automatically add new tables to the publication
CREATE OR REPLACE FUNCTION add_table_to_publication()
RETURNS event_trigger AS $$
BEGIN
  -- Add newly created tables to the publication
  EXECUTE 'ALTER PUBLICATION reports_pub ADD TABLE ' || quote_ident(tg_tag);
END;
$$ LANGUAGE plpgsql;

-- Logging configuration
-- Log replication connections for monitoring
ALTER SYSTEM SET log_replication_commands = 'on';

-- Performance tuning for replication
ALTER SYSTEM SET max_worker_processes = 16;
ALTER SYSTEM SET max_logical_replication_workers = 8;

-- Confirm setup
SELECT 'Replication setup completed successfully' AS status;
