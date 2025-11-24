-- Setup Logical Replication Subscription for Reports Database
-- This script connects to the primary database and subscribes to data changes

-- Wait for primary database to be ready (this will be executed during init)
-- Note: The actual subscription creation will happen after both databases are up

-- Create a function to setup the subscription
-- This should be called after the primary database is fully initialized
CREATE OR REPLACE FUNCTION reports.setup_subscription_from_primary()
RETURNS void AS $$
BEGIN
  -- Check if subscription already exists
  IF NOT EXISTS (SELECT 1 FROM pg_subscription WHERE subname = 'reports_sub') THEN
    -- Create subscription to primary database
    -- This will receive changes from the primary database's 'reports_pub' publication
    CREATE SUBSCRIPTION reports_sub
    CONNECTION 'host=db-primary port=5432 dbname=train_booking user=trainadmin password=trainpass123'
    PUBLICATION reports_pub
    WITH (
      copy_data = true,
      create_slot = true,
      enabled = true,
      slot_name = 'reports_slot'
    );

    RAISE NOTICE 'Subscription reports_sub created successfully';
  ELSE
    RAISE NOTICE 'Subscription reports_sub already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Note: The subscription will be created manually or via a separate script
-- after both databases are fully initialized, due to initialization order dependencies

-- Create triggers to transform OLTP data to OLAP format
-- These will be used to populate the denormalized reports schema

-- Trigger function to extract and insert date dimensions
CREATE OR REPLACE FUNCTION reports.extract_date_dimension(ts timestamp)
RETURNS bigint AS $$
DECLARE
  date_id bigint;
BEGIN
  -- Check if date already exists
  SELECT id INTO date_id
  FROM reports.dates
  WHERE
    hour = EXTRACT(HOUR FROM ts) AND
    day = EXTRACT(DAY FROM ts) AND
    month = EXTRACT(MONTH FROM ts) AND
    year = EXTRACT(YEAR FROM ts);

  -- If not exists, insert new date record
  IF date_id IS NULL THEN
    INSERT INTO reports.dates (hour, day, month, year, day_of_week, quarter, is_weekend)
    VALUES (
      EXTRACT(HOUR FROM ts),
      EXTRACT(DAY FROM ts),
      EXTRACT(MONTH FROM ts),
      EXTRACT(YEAR FROM ts),
      EXTRACT(DOW FROM ts),
      EXTRACT(QUARTER FROM ts),
      EXTRACT(DOW FROM ts) IN (0, 6)
    )
    RETURNING id INTO date_id;
  END IF;

  RETURN date_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get or create station dimension
CREATE OR REPLACE FUNCTION reports.get_station_dimension(station_name text, station_region text DEFAULT 'Unknown')
RETURNS bigint AS $$
DECLARE
  station_id bigint;
BEGIN
  SELECT id INTO station_id
  FROM reports.stations
  WHERE name = station_name;

  IF station_id IS NULL THEN
    INSERT INTO reports.stations (name, region)
    VALUES (station_name, station_region)
    RETURNING id INTO station_id;
  END IF;

  RETURN station_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get or create seat dimension
CREATE OR REPLACE FUNCTION reports.get_seat_dimension(seat_class text, train_name text)
RETURNS bigint AS $$
DECLARE
  seat_id bigint;
BEGIN
  SELECT id INTO seat_id
  FROM reports.seats
  WHERE class = seat_class AND train = train_name;

  IF seat_id IS NULL THEN
    INSERT INTO reports.seats (class, train)
    VALUES (seat_class, train_name)
    RETURNING id INTO seat_id;
  END IF;

  RETURN seat_id;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh of materialized views every hour
-- This requires pg_cron extension (optional)
-- You can also manually refresh views or set up a cron job outside PostgreSQL

SELECT 'Subscription setup functions created successfully' AS status;
