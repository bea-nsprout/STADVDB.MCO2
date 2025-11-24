-- Primary Database (OLTP) Schema
-- This database handles all transactional operations

-- Create tables in correct order (respecting foreign key dependencies)

-- 1. Station table (no dependencies)
CREATE TABLE IF NOT EXISTS public.station (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  CONSTRAINT station_pkey PRIMARY KEY (id)
);

-- 2. Routes table (no dependencies)
CREATE TABLE IF NOT EXISTS public.routes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  direction text NOT NULL,
  CONSTRAINT routes_pkey PRIMARY KEY (id)
);

-- 3. Trains table (no dependencies)
CREATE TABLE IF NOT EXISTS public.trains (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  capacity smallint NOT NULL,
  CONSTRAINT trains_pkey PRIMARY KEY (id)
);

-- 4. Cars table (depends on trains)
CREATE TABLE IF NOT EXISTS public.cars (
  id bigint NOT NULL,
  train_id bigint NOT NULL,
  type text NOT NULL,
  car_no smallint NOT NULL,
  seat_count smallint NOT NULL,
  CONSTRAINT cars_pkey PRIMARY KEY (id),
  CONSTRAINT cars_train_id_fkey FOREIGN KEY (train_id) REFERENCES public.trains(id) ON DELETE CASCADE
);

-- 5. Seat table (depends on cars)
CREATE TABLE IF NOT EXISTS public.seat (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "row" smallint NOT NULL,
  "column" smallint NOT NULL,
  car bigint NOT NULL,
  CONSTRAINT seat_pkey PRIMARY KEY (id),
  CONSTRAINT seat_car_fkey FOREIGN KEY (car) REFERENCES public.cars(id) ON DELETE CASCADE
);

-- 6. Journeys table (depends on trains and routes)
CREATE TABLE IF NOT EXISTS public.journeys (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  train_no bigint NOT NULL,
  route integer NOT NULL,
  CONSTRAINT journeys_pkey PRIMARY KEY (id),
  CONSTRAINT journeys_route_fkey FOREIGN KEY (route) REFERENCES public.routes(id) ON DELETE CASCADE,
  CONSTRAINT journeys_train_no_fkey FOREIGN KEY (train_no) REFERENCES public.trains(id) ON DELETE CASCADE
);

-- 7. Schedule table (depends on journeys and station)
CREATE TABLE IF NOT EXISTS public.schedule (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  departure timestamp without time zone NOT NULL,
  arrival timestamp without time zone NOT NULL,
  station text NOT NULL,
  journey_id bigint NOT NULL,
  occupancy smallint NOT NULL DEFAULT 0,
  CONSTRAINT schedule_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.journeys(id) ON DELETE CASCADE,
  CONSTRAINT schedule_station_fkey FOREIGN KEY (station) REFERENCES public.station(name) ON DELETE CASCADE
);

-- 8. Bookings table (no dependencies)
CREATE TABLE IF NOT EXISTS public.bookings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL,
  cost_total integer NOT NULL,
  confirm_status boolean NOT NULL DEFAULT false,
  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- 9. Tickets table (depends on bookings, journeys, seat, and station)
CREATE TABLE IF NOT EXISTS public.tickets (
  ticket_id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id bigint NOT NULL,
  cost integer NOT NULL,
  seat integer NOT NULL,
  class text NOT NULL,
  origin bigint NOT NULL,
  destination bigint NOT NULL,
  journey bigint NOT NULL,
  reserved_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id),
  CONSTRAINT tickets_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT tickets_journey_fkey FOREIGN KEY (journey) REFERENCES public.journeys(id) ON DELETE CASCADE,
  CONSTRAINT tickets_seat_fkey FOREIGN KEY (seat) REFERENCES public.seat(id) ON DELETE CASCADE,
  CONSTRAINT tickets_origin_fkey FOREIGN KEY (origin) REFERENCES public.station(id) ON DELETE RESTRICT,
  CONSTRAINT tickets_destination_fkey FOREIGN KEY (destination) REFERENCES public.station(id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_journey ON public.tickets(journey);
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_at ON public.tickets(reserved_at);
CREATE INDEX IF NOT EXISTS idx_schedule_journey ON public.schedule(journey_id);
CREATE INDEX IF NOT EXISTS idx_schedule_departure ON public.schedule(departure);
CREATE INDEX IF NOT EXISTS idx_journeys_train ON public.journeys(train_no);
CREATE INDEX IF NOT EXISTS idx_cars_train ON public.cars(train_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE train_booking TO trainadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trainadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trainadmin;
