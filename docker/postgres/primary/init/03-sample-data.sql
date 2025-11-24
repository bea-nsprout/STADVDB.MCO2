-- Sample Data for Shinkansen Train Booking System
-- Based on the actual application data structure

-- Insert Stations (Japanese Shinkansen line)
INSERT INTO public.station (name) VALUES
  ('Tokyo'),
  ('Shin-Yokohoma'),
  ('Toyohashi'),
  ('Nagoya'),
  ('Kyoto'),
  ('Shin-Osaka')
ON CONFLICT (name) DO NOTHING;

-- Insert Routes (Tokaido Shinkansen directions)
INSERT INTO public.routes (direction) VALUES
  ('Eastbound'),   -- Shin-Osaka to Tokyo
  ('Westbound')    -- Tokyo to Shin-Osaka
ON CONFLICT DO NOTHING;

-- Insert Trains (Shinkansen train sets)
-- Total capacity: 16 (First) + 64 (Business) + 80 (Economy) = 160 seats per train
INSERT INTO public.trains (capacity) VALUES
  (160),  -- Train 1: 8-car configuration
  (160),  -- Train 2: 8-car configuration
  (160),  -- Train 3: 8-car configuration
  (160)   -- Train 4: 8-car configuration
ON CONFLICT DO NOTHING;

-- Insert Cars for Train 1 (8 cars: 1 First, 1 Business, 6 Economy)
-- First: 16 seats, Business: 64 seats, Economy: 80 seats (14+14+14+14+12+12)
INSERT INTO public.cars (id, train_id, type, car_no, seat_count) VALUES
  (1, 1, 'First', 1, 16),      -- First Class car: 16 seats
  (2, 1, 'Business', 2, 64),   -- Business car: 64 seats
  (3, 1, 'Economy', 3, 14),    -- Economy cars: 80 total
  (4, 1, 'Economy', 4, 14),
  (5, 1, 'Economy', 5, 14),
  (6, 1, 'Economy', 6, 14),
  (7, 1, 'Economy', 7, 12),
  (8, 1, 'Economy', 8, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert Cars for Train 2
INSERT INTO public.cars (id, train_id, type, car_no, seat_count) VALUES
  (9, 2, 'First', 1, 16),
  (10, 2, 'Business', 2, 64),
  (11, 2, 'Economy', 3, 14),
  (12, 2, 'Economy', 4, 14),
  (13, 2, 'Economy', 5, 14),
  (14, 2, 'Economy', 6, 14),
  (15, 2, 'Economy', 7, 12),
  (16, 2, 'Economy', 8, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert Cars for Train 3
INSERT INTO public.cars (id, train_id, type, car_no, seat_count) VALUES
  (17, 3, 'First', 1, 16),
  (18, 3, 'Business', 2, 64),
  (19, 3, 'Economy', 3, 14),
  (20, 3, 'Economy', 4, 14),
  (21, 3, 'Economy', 5, 14),
  (22, 3, 'Economy', 6, 14),
  (23, 3, 'Economy', 7, 12),
  (24, 3, 'Economy', 8, 12)
ON CONFLICT (id) DO NOTHING;

-- Generate seats for all cars
-- First Class cars (4 rows x 4 seats = 16 seats)
DO $$
DECLARE
  car_rec RECORD;
BEGIN
  FOR car_rec IN SELECT id FROM public.cars WHERE type = 'First' LOOP
    INSERT INTO public.seat ("row", "column", car)
    SELECT r, c, car_rec.id
    FROM generate_series(1, 4) AS r
    CROSS JOIN generate_series(1, 4) AS c
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Business Class cars (16 rows x 4 seats = 64 seats)
DO $$
DECLARE
  car_rec RECORD;
BEGIN
  FOR car_rec IN SELECT id FROM public.cars WHERE type = 'Business' LOOP
    INSERT INTO public.seat ("row", "column", car)
    SELECT r, c, car_rec.id
    FROM generate_series(1, 16) AS r
    CROSS JOIN generate_series(1, 4) AS c
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Economy Class cars with 14 seats (7 rows x 2 seats = 14 seats)
DO $$
DECLARE
  car_rec RECORD;
BEGIN
  FOR car_rec IN SELECT id FROM public.cars WHERE type = 'Economy' AND seat_count = 14 LOOP
    INSERT INTO public.seat ("row", "column", car)
    SELECT r, c, car_rec.id
    FROM generate_series(1, 7) AS r
    CROSS JOIN generate_series(1, 2) AS c
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Economy Class cars with 12 seats (6 rows x 2 seats = 12 seats)
DO $$
DECLARE
  car_rec RECORD;
BEGIN
  FOR car_rec IN SELECT id FROM public.cars WHERE type = 'Economy' AND seat_count = 12 LOOP
    INSERT INTO public.seat ("row", "column", car)
    SELECT r, c, car_rec.id
    FROM generate_series(1, 6) AS r
    CROSS JOIN generate_series(1, 2) AS c
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Insert Journeys (multiple trips per day)
INSERT INTO public.journeys (train_no, route) VALUES
  (1, 1),  -- Train 1 Eastbound
  (1, 2),  -- Train 1 Westbound
  (2, 1),  -- Train 2 Eastbound
  (2, 2),  -- Train 2 Westbound
  (3, 1),  -- Train 3 Eastbound
  (3, 2),  -- Train 3 Westbound
  (4, 1),  -- Train 4 Eastbound
  (4, 2)   -- Train 4 Westbound
ON CONFLICT DO NOTHING;

-- Insert Schedule entries for Journey 1 (Train 1 Eastbound: Shin-Osaka -> Tokyo)
DO $$
DECLARE
  journey1_id bigint;
  base_date timestamp;
BEGIN
  SELECT id INTO journey1_id FROM public.journeys WHERE train_no = 1 AND route = 1 LIMIT 1;
  base_date := CURRENT_DATE + INTERVAL '1 day' + INTERVAL '6 hours'; -- Tomorrow at 6 AM

  IF journey1_id IS NOT NULL THEN
    INSERT INTO public.schedule (departure, arrival, station, journey_id, occupancy) VALUES
      (base_date, base_date + INTERVAL '5 minutes', 'Shin-Osaka', journey1_id, 0),
      (base_date + INTERVAL '30 minutes', base_date + INTERVAL '35 minutes', 'Kyoto', journey1_id, 0),
      (base_date + INTERVAL '1 hour 45 minutes', base_date + INTERVAL '1 hour 50 minutes', 'Nagoya', journey1_id, 0),
      (base_date + INTERVAL '2 hours 15 minutes', base_date + INTERVAL '2 hours 20 minutes', 'Toyohashi', journey1_id, 0),
      (base_date + INTERVAL '2 hours 50 minutes', base_date + INTERVAL '2 hours 55 minutes', 'Shin-Yokohoma', journey1_id, 0),
      (base_date + INTERVAL '3 hours 15 minutes', base_date + INTERVAL '3 hours 15 minutes', 'Tokyo', journey1_id, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Schedule for Journey 2 (Train 1 Westbound: Tokyo -> Shin-Osaka)
DO $$
DECLARE
  journey2_id bigint;
  base_date timestamp;
BEGIN
  SELECT id INTO journey2_id FROM public.journeys WHERE train_no = 1 AND route = 2 LIMIT 1;
  base_date := CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours'; -- Tomorrow at 2 PM

  IF journey2_id IS NOT NULL THEN
    INSERT INTO public.schedule (departure, arrival, station, journey_id, occupancy) VALUES
      (base_date, base_date + INTERVAL '5 minutes', 'Tokyo', journey2_id, 0),
      (base_date + INTERVAL '25 minutes', base_date + INTERVAL '30 minutes', 'Shin-Yokohoma', journey2_id, 0),
      (base_date + INTERVAL '1 hour 15 minutes', base_date + INTERVAL '1 hour 20 minutes', 'Toyohashi', journey2_id, 0),
      (base_date + INTERVAL '1 hour 45 minutes', base_date + INTERVAL '1 hour 50 minutes', 'Nagoya', journey2_id, 0),
      (base_date + INTERVAL '3 hours', base_date + INTERVAL '3 hours 5 minutes', 'Kyoto', journey2_id, 0),
      (base_date + INTERVAL '3 hours 30 minutes', base_date + INTERVAL '3 hours 30 minutes', 'Shin-Osaka', journey2_id, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert more schedules for other journeys
DO $$
DECLARE
  journey_rec RECORD;
  base_date timestamp;
  hour_offset integer := 8;
BEGIN
  FOR journey_rec IN
    SELECT id, train_no, route
    FROM public.journeys
    WHERE id NOT IN (
      SELECT id FROM public.journeys WHERE train_no = 1 ORDER BY id LIMIT 2
    )
  LOOP
    base_date := CURRENT_DATE + INTERVAL '1 day' + (hour_offset || ' hours')::interval;

    IF journey_rec.route = 1 THEN -- Eastbound
      INSERT INTO public.schedule (departure, arrival, station, journey_id, occupancy) VALUES
        (base_date, base_date + INTERVAL '5 minutes', 'Shin-Osaka', journey_rec.id, 0),
        (base_date + INTERVAL '30 minutes', base_date + INTERVAL '35 minutes', 'Kyoto', journey_rec.id, 0),
        (base_date + INTERVAL '1 hour 45 minutes', base_date + INTERVAL '1 hour 50 minutes', 'Nagoya', journey_rec.id, 0),
        (base_date + INTERVAL '2 hours 15 minutes', base_date + INTERVAL '2 hours 20 minutes', 'Toyohashi', journey_rec.id, 0),
        (base_date + INTERVAL '2 hours 50 minutes', base_date + INTERVAL '2 hours 55 minutes', 'Shin-Yokohoma', journey_rec.id, 0),
        (base_date + INTERVAL '3 hours 15 minutes', base_date + INTERVAL '3 hours 15 minutes', 'Tokyo', journey_rec.id, 0)
      ON CONFLICT DO NOTHING;
    ELSE -- Westbound
      INSERT INTO public.schedule (departure, arrival, station, journey_id, occupancy) VALUES
        (base_date, base_date + INTERVAL '5 minutes', 'Tokyo', journey_rec.id, 0),
        (base_date + INTERVAL '25 minutes', base_date + INTERVAL '30 minutes', 'Shin-Yokohoma', journey_rec.id, 0),
        (base_date + INTERVAL '1 hour 15 minutes', base_date + INTERVAL '1 hour 20 minutes', 'Toyohashi', journey_rec.id, 0),
        (base_date + INTERVAL '1 hour 45 minutes', base_date + INTERVAL '1 hour 50 minutes', 'Nagoya', journey_rec.id, 0),
        (base_date + INTERVAL '3 hours', base_date + INTERVAL '3 hours 5 minutes', 'Kyoto', journey_rec.id, 0),
        (base_date + INTERVAL '3 hours 30 minutes', base_date + INTERVAL '3 hours 30 minutes', 'Shin-Osaka', journey_rec.id, 0)
      ON CONFLICT DO NOTHING;
    END IF;

    hour_offset := hour_offset + 4; -- Next train 4 hours later
  END LOOP;
END $$;

-- Insert Sample Bookings
INSERT INTO public.bookings (email, cost_total, confirm_status) VALUES
  ('sakura.tanaka@example.jp', 13500, true),     -- Economy Tokyo to Osaka
  ('hiroshi.yamamoto@example.jp', 20000, true),  -- Business Tokyo to Kyoto
  ('yuki.sato@example.jp', 30000, false),        -- First Class Osaka to Tokyo (pending)
  ('kenji.nakamura@example.jp', 9000, true)      -- Economy Nagoya to Tokyo
ON CONFLICT DO NOTHING;

-- Insert Sample Tickets
DO $$
DECLARE
  booking1_id bigint;
  booking2_id bigint;
  journey1_id bigint;
  seat_economy bigint;
  seat_business bigint;
  tokyo_id bigint;
  osaka_id bigint;
  kyoto_id bigint;
  nagoya_id bigint;
BEGIN
  SELECT id INTO booking1_id FROM public.bookings WHERE email = 'sakura.tanaka@example.jp' LIMIT 1;
  SELECT id INTO booking2_id FROM public.bookings WHERE email = 'hiroshi.yamamoto@example.jp' LIMIT 1;
  SELECT id INTO journey1_id FROM public.journeys WHERE train_no = 1 AND route = 2 LIMIT 1;
  SELECT id INTO seat_economy FROM public.seat WHERE car IN (SELECT id FROM public.cars WHERE type = 'Economy') LIMIT 1;
  SELECT id INTO seat_business FROM public.seat WHERE car IN (SELECT id FROM public.cars WHERE type = 'Business') LIMIT 1;
  SELECT id INTO tokyo_id FROM public.station WHERE name = 'Tokyo';
  SELECT id INTO osaka_id FROM public.station WHERE name = 'Shin-Osaka';
  SELECT id INTO kyoto_id FROM public.station WHERE name = 'Kyoto';
  SELECT id INTO nagoya_id FROM public.station WHERE name = 'Nagoya';

  IF booking1_id IS NOT NULL AND journey1_id IS NOT NULL AND seat_economy IS NOT NULL THEN
    -- Ticket 1: Tokyo to Osaka, Economy
    INSERT INTO public.tickets (booking_id, cost, seat, class, origin, destination, journey, reserved_at) VALUES
      (booking1_id, 10500, seat_economy, 'Economy', tokyo_id, osaka_id, journey1_id, CURRENT_TIMESTAMP - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- Ticket 2: Tokyo to Kyoto, Business
    INSERT INTO public.tickets (booking_id, cost, seat, class, origin, destination, journey, reserved_at) VALUES
      (booking2_id, 13000, seat_business, 'Business', tokyo_id, kyoto_id, journey1_id, CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Update occupancy counts based on tickets
UPDATE public.schedule s
SET occupancy = (
  SELECT COUNT(*)
  FROM public.tickets t
  WHERE t.journey = s.journey_id
);

SELECT 'Sample Shinkansen data inserted successfully' AS status;
SELECT COUNT(*) || ' stations created' FROM public.station;
SELECT COUNT(*) || ' trains created' FROM public.trains;
SELECT COUNT(*) || ' cars created' FROM public.cars;
SELECT COUNT(*) || ' seats created' FROM public.seat;
SELECT COUNT(*) || ' journeys created' FROM public.journeys;
SELECT COUNT(*) || ' schedule entries created' FROM public.schedule;
SELECT COUNT(*) || ' bookings created' FROM public.bookings;
SELECT COUNT(*) || ' tickets created' FROM public.tickets;
