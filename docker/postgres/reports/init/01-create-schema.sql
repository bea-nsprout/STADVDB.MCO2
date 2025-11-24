-- Reports Database (OLAP) Schema
-- This database is optimized for analytical operations and reporting
-- Data is denormalized for better query performance

-- Create reports schema
CREATE SCHEMA IF NOT EXISTS reports;

-- 1. Date dimension table (for time-based analytics)
CREATE TABLE IF NOT EXISTS reports.dates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  hour smallint NOT NULL,
  day smallint NOT NULL,
  month smallint NOT NULL,
  year smallint NOT NULL,
  day_of_week smallint,
  quarter smallint,
  is_weekend boolean,
  CONSTRAINT dates_pkey PRIMARY KEY (id)
);

-- 2. Seats dimension table (for seat/class analytics)
CREATE TABLE IF NOT EXISTS reports.seats (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  class text NOT NULL,
  train text NOT NULL,
  car_type text,
  CONSTRAINT seats_pkey PRIMARY KEY (id)
);

-- 3. Stations dimension table (for location-based analytics)
CREATE TABLE IF NOT EXISTS reports.stations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  city text,
  CONSTRAINT stations_pkey PRIMARY KEY (id)
);

-- 4. Tickets fact table (main fact table for analytics)
CREATE TABLE IF NOT EXISTS reports.tickets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  seat bigint NOT NULL,
  depart_date bigint NOT NULL,
  arrive_date bigint NOT NULL,
  depart_stn bigint NOT NULL,
  arrive_stn bigint NOT NULL,
  cost integer NOT NULL,
  booking_confirmed boolean DEFAULT false,
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_depart_date_fkey FOREIGN KEY (depart_date) REFERENCES reports.dates(id) ON DELETE CASCADE,
  CONSTRAINT tickets_arrive_date_fkey FOREIGN KEY (arrive_date) REFERENCES reports.dates(id) ON DELETE CASCADE,
  CONSTRAINT tickets_seat_fkey FOREIGN KEY (seat) REFERENCES reports.seats(id) ON DELETE CASCADE,
  CONSTRAINT tickets_depart_stn_fkey FOREIGN KEY (depart_stn) REFERENCES reports.stations(id) ON DELETE CASCADE,
  CONSTRAINT tickets_arrive_stn_fkey FOREIGN KEY (arrive_stn) REFERENCES reports.stations(id) ON DELETE CASCADE
);

-- Create indexes for analytical queries
CREATE INDEX IF NOT EXISTS idx_tickets_depart_date ON reports.tickets(depart_date);
CREATE INDEX IF NOT EXISTS idx_tickets_arrive_date ON reports.tickets(arrive_date);
CREATE INDEX IF NOT EXISTS idx_tickets_depart_stn ON reports.tickets(depart_stn);
CREATE INDEX IF NOT EXISTS idx_tickets_arrive_stn ON reports.tickets(arrive_stn);
CREATE INDEX IF NOT EXISTS idx_tickets_seat ON reports.tickets(seat);
CREATE INDEX IF NOT EXISTS idx_tickets_cost ON reports.tickets(cost);
CREATE INDEX IF NOT EXISTS idx_dates_year_month ON reports.dates(year, month);
CREATE INDEX IF NOT EXISTS idx_stations_region ON reports.stations(region);

-- Create materialized views for common analytics

-- View 1: Daily Revenue by Route
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.daily_revenue_by_route AS
SELECT
  d.year,
  d.month,
  d.day,
  ds.name as origin,
  dest.name as destination,
  COUNT(t.id) as ticket_count,
  SUM(t.cost) as total_revenue
FROM reports.tickets t
JOIN reports.dates d ON t.depart_date = d.id
JOIN reports.stations ds ON t.depart_stn = ds.id
JOIN reports.stations dest ON t.arrive_stn = dest.id
GROUP BY d.year, d.month, d.day, ds.name, dest.name;

-- View 2: Seat Class Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.seat_class_performance AS
SELECT
  s.class,
  s.train,
  d.year,
  d.month,
  COUNT(t.id) as bookings,
  SUM(t.cost) as revenue,
  AVG(t.cost) as avg_ticket_price
FROM reports.tickets t
JOIN reports.seats s ON t.seat = s.id
JOIN reports.dates d ON t.depart_date = d.id
GROUP BY s.class, s.train, d.year, d.month;

-- View 3: Popular Routes
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.popular_routes AS
SELECT
  ds.name as origin,
  dest.name as destination,
  ds.region as origin_region,
  dest.region as dest_region,
  COUNT(t.id) as trip_count,
  SUM(t.cost) as total_revenue
FROM reports.tickets t
JOIN reports.stations ds ON t.depart_stn = ds.id
JOIN reports.stations dest ON t.arrive_stn = dest.id
GROUP BY ds.name, dest.name, ds.region, dest.region;

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON reports.daily_revenue_by_route(year, month, day);
CREATE INDEX IF NOT EXISTS idx_seat_performance_date ON reports.seat_class_performance(year, month);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE train_reports TO trainadmin;
GRANT ALL PRIVILEGES ON SCHEMA reports TO trainadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA reports TO trainadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA reports TO trainadmin;
-- Note: Materialized views are included in the TABLES grant above

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION reports.refresh_all_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY reports.daily_revenue_by_route;
  REFRESH MATERIALIZED VIEW CONCURRENTLY reports.seat_class_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY reports.popular_routes;
END;
$$ LANGUAGE plpgsql;

SELECT 'Reports schema created successfully' AS status;
