#!/usr/bin/env node
/**
 * Sample Data Generator for Shinkansen Train Booking System
 *
 * Generates realistic sample data following the rules:
 * - Cars: First (16 seats × 1), Business (64 seats × 1), Economy (80 seats × 3)
 * - Schedule: Nov 25 - Dec 5, 20 journeys/day, 9am-5pm
 * - Seats: First (8×2), Business (16×4), Economy (16×5)
 *
 * Usage:
 *   npx tsx scripts/generate-sample-data.ts
 *   or: npm run generate-data
 *
 * Prerequisites:
 *   - Docker containers must be running: docker-compose up -d db-primary
 *   - Port 5432 must be available (check for conflicts with local PostgreSQL)
 *
 * Troubleshooting:
 *   If you encounter "password authentication failed" errors, see TROUBLESHOOTING.md
 *   Common issue: Local PostgreSQL using port 5432 (conflicts with Docker)
 */

import { Pool } from 'pg';

const db = new Pool({
  host: process.env.PRIMARY_DB_HOST || 'localhost',
  port: parseInt(process.env.PRIMARY_DB_PORT || '5432'),
  database: 'train_booking',
  user: 'trainadmin',
  password: 'trainpass123',
});

// Configuration
const CONFIG = {
  TRAINS_COUNT: 10, // 10 trains to handle 20 journeys/day
  START_DATE: new Date('2025-11-25'),
  END_DATE: new Date('2025-12-05'),
  JOURNEYS_PER_DAY: 20,
  OPERATING_HOURS: { START: 1, END: 9 }, // 9am to 5pm (in UTC+0 it's 1 to 9)
  BOOKING_PROBABILITY: 0.65, // 65% of seats will be booked
};

const STATIONS = [
  { id: 1, name: 'Tokyo' },
  { id: 2, name: 'Shin-Yokohama' },
  { id: 3, name: 'Toyohashi' },
  { id: 4, name: 'Nagoya' },
  { id: 5, name: 'Kyoto' },
  { id: 6, name: 'Shin-Osaka' },
];

const FARE_MATRIX: Record<string, Record<string, number>> = {
  'Tokyo': { 'Shin-Yokohama': 2000, 'Toyohashi': 7000, 'Nagoya': 9000, 'Kyoto': 11000, 'Shin-Osaka': 13000 },
  'Shin-Yokohama': { 'Tokyo': 2000, 'Toyohashi': 5500, 'Nagoya': 7500, 'Kyoto': 9500, 'Shin-Osaka': 11500 },
  'Toyohashi': { 'Tokyo': 7000, 'Shin-Yokohama': 5500, 'Nagoya': 2500, 'Kyoto': 4500, 'Shin-Osaka': 6500 },
  'Nagoya': { 'Tokyo': 9000, 'Shin-Yokohama': 7500, 'Toyohashi': 2500, 'Kyoto': 2500, 'Shin-Osaka': 4500 },
  'Kyoto': { 'Tokyo': 11000, 'Shin-Yokohama': 9500, 'Toyohashi': 4500, 'Nagoya': 2500, 'Shin-Osaka': 2000 },
  'Shin-Osaka': { 'Tokyo': 13000, 'Shin-Yokohama': 11500, 'Toyohashi': 6500, 'Nagoya': 4500, 'Kyoto': 2000 },
};

const CLASS_MULTIPLIERS = {
  'Economy': 1.0,
  'Business': 1.5,
  'First': 2.0,
};

interface Train {
  id: number;
  capacity: number;
}

interface Car {
  id: number;
  trainId: number;
  type: 'First' | 'Business' | 'Economy';
  carNo: number;
  seatCount: number;
}

interface Seat {
  id: number;
  row: number;
  column: number;
  carId: number;
}

async function clearExistingData() {
  console.log('🗑️  Clearing existing sample data...');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE tickets, bookings, schedule, journeys, seat, cars, trains, routes, station RESTART IDENTITY CASCADE');
    await client.query('COMMIT');
    console.log('✅ Existing data cleared');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertStations() {
  console.log('\n📍 Inserting stations...');
  const client = await db.connect();
  try {
    for (const station of STATIONS) {
      await client.query(
        'INSERT INTO station (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [station.name]
      );
    }
    console.log(`✅ Inserted ${STATIONS.length} stations`);
  } finally {
    client.release();
  }
}

async function insertRoutes() {
  console.log('\n🛤️  Inserting routes...');
  const client = await db.connect();
  try {
    await client.query('INSERT INTO routes (direction) VALUES ($1), ($2)', ['Eastbound', 'Westbound']);
    console.log('✅ Inserted 2 routes (Eastbound, Westbound)');
  } finally {
    client.release();
  }
}

async function insertTrains(): Promise<Train[]> {
  console.log('\n🚄 Inserting trains...');
  const client = await db.connect();
  const trains: Train[] = [];

  try {
    // Capacity: 16 (First) + 64 (Business) + 240 (Economy 3×80)
    const capacity = 16 + 64 + 240;

    for (let i = 0; i < CONFIG.TRAINS_COUNT; i++) {
      const result = await client.query(
        'INSERT INTO trains (capacity) VALUES ($1) RETURNING id',
        [capacity]
      );
      trains.push({ id: result.rows[0].id, capacity });
    }

    console.log(`✅ Inserted ${trains.length} trains (${capacity} seats each)`);
    return trains;
  } finally {
    client.release();
  }
}

async function insertCarsAndSeats(trains: Train[]): Promise<Map<number, Seat[]>> {
  console.log('\n🚃 Inserting cars and seats...');
  const client = await db.connect();
  const seatsByTrain = new Map<number, Seat[]>();

  let carIdCounter = 1;
  let totalSeats = 0;

  try {
    await client.query('BEGIN');

    for (const train of trains) {
      const trainSeats: Seat[] = [];

      // Car 1: First Class (16 seats: 8 rows × 2 cols)
      const firstCarId = carIdCounter++;
      await client.query(
        'INSERT INTO cars (id, train_id, type, car_no, seat_count) VALUES ($1, $2, $3, $4, $5)',
        [firstCarId, train.id, 'First', 1, 16]
      );

      for (let row = 1; row <= 8; row++) {
        for (let col = 1; col <= 2; col++) {
          const result = await client.query(
            'INSERT INTO seat ("row", "column", car) VALUES ($1, $2, $3) RETURNING id',
            [row, col, firstCarId]
          );
          trainSeats.push({ id: result.rows[0].id, row, column: col, carId: firstCarId });
          totalSeats++;
        }
      }

      // Car 2: Business Class (64 seats: 16 rows × 4 cols)
      const businessCarId = carIdCounter++;
      await client.query(
        'INSERT INTO cars (id, train_id, type, car_no, seat_count) VALUES ($1, $2, $3, $4, $5)',
        [businessCarId, train.id, 'Business', 2, 64]
      );

      for (let row = 1; row <= 16; row++) {
        for (let col = 1; col <= 4; col++) {
          const result = await client.query(
            'INSERT INTO seat ("row", "column", car) VALUES ($1, $2, $3) RETURNING id',
            [row, col, businessCarId]
          );
          trainSeats.push({ id: result.rows[0].id, row, column: col, carId: businessCarId });
          totalSeats++;
        }
      }

      // Cars 3-5: Economy Class (3 cars × 80 seats: 16 rows × 5 cols)
      for (let carNum = 3; carNum <= 5; carNum++) {
        const economyCarId = carIdCounter++;
        await client.query(
          'INSERT INTO cars (id, train_id, type, car_no, seat_count) VALUES ($1, $2, $3, $4, $5)',
          [economyCarId, train.id, 'Economy', carNum, 80]
        );

        for (let row = 1; row <= 16; row++) {
          for (let col = 1; col <= 5; col++) {
            const result = await client.query(
              'INSERT INTO seat ("row", "column", car) VALUES ($1, $2, $3) RETURNING id',
              [row, col, economyCarId]
            );
            trainSeats.push({ id: result.rows[0].id, row, column: col, carId: economyCarId });
            totalSeats++;
          }
        }
      }

      seatsByTrain.set(train.id, trainSeats);
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted ${carIdCounter - 1} cars and ${totalSeats} seats`);
    return seatsByTrain;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertJourneysAndSchedules(trains: Train[]) {
  console.log('\n🗓️  Inserting journeys and schedules...');
  const client = await db.connect();

  const currentDate = new Date(CONFIG.START_DATE);
  const journeys: Array<{ id: number; trainId: number; route: number; date: Date }> = [];
  let scheduleCount = 0;

  try {
    await client.query('BEGIN');

    // Iterate through each day
    while (currentDate <= CONFIG.END_DATE) {
      // const journeysToday: number[] = [];

      // Create 20 journeys for the day
      const hourSpan = CONFIG.OPERATING_HOURS.END - CONFIG.OPERATING_HOURS.START;
      const minutesPerJourney = (hourSpan * 60) / CONFIG.JOURNEYS_PER_DAY;

      for (let j = 0; j < CONFIG.JOURNEYS_PER_DAY; j++) {
        const trainIndex = j % trains.length;
        const train = trains[trainIndex];
        const route = (j % 2) + 1; // Alternate between Eastbound (1) and Westbound (2)

        // Insert journey
        const journeyResult = await client.query(
          'INSERT INTO journeys (train_no, route) VALUES ($1, $2) RETURNING id',
          [train.id, route]
        );
        const journeyId = journeyResult.rows[0].id;

        // Calculate departure time
        const minutesFromStart = j * minutesPerJourney;
        const departureHour = CONFIG.OPERATING_HOURS.START + Math.floor(minutesFromStart / 60);
        const departureMinute = Math.floor(minutesFromStart % 60);

        const baseTime = new Date(currentDate);
        baseTime.setHours(departureHour, departureMinute, 0, 0);

        journeys.push({ id: journeyId, trainId: train.id, route, date: new Date(baseTime) });

        // Create schedule stops
        if (route === 1) {
          // Eastbound: Shin-Osaka → Tokyo
          const stops = [
            { station: 'Shin-Osaka', depOffset: 0, arrOffset: 0 },
            { station: 'Kyoto', depOffset: 30, arrOffset: 35 },
            { station: 'Nagoya', depOffset: 105, arrOffset: 110 },
            { station: 'Toyohashi', depOffset: 135, arrOffset: 140 },
            { station: 'Shin-Yokohama', depOffset: 170, arrOffset: 175 },
            { station: 'Tokyo', depOffset: 195, arrOffset: 195 },
          ];

          for (const stop of stops) {
            const departure = new Date(baseTime.getTime() + stop.depOffset * 60000);
            const arrival = new Date(baseTime.getTime() + stop.arrOffset * 60000);

            await client.query(
              'INSERT INTO schedule (departure, arrival, station, journey_id, occupancy) VALUES ($1, $2, $3, $4, $5)',
              [departure, arrival, stop.station, journeyId, 0]
            );
            scheduleCount++;
          }
        } else {
          // Westbound: Tokyo → Shin-Osaka
          const stops = [
            { station: 'Tokyo', depOffset: 0, arrOffset: 0 },
            { station: 'Shin-Yokohama', depOffset: 25, arrOffset: 30 },
            { station: 'Toyohashi', depOffset: 75, arrOffset: 80 },
            { station: 'Nagoya', depOffset: 105, arrOffset: 110 },
            { station: 'Kyoto', depOffset: 180, arrOffset: 185 },
            { station: 'Shin-Osaka', depOffset: 210, arrOffset: 210 },
          ];

          for (const stop of stops) {
            const departure = new Date(baseTime.getTime() + stop.depOffset * 60000);
            const arrival = new Date(baseTime.getTime() + stop.arrOffset * 60000);

            await client.query(
              'INSERT INTO schedule (departure, arrival, station, journey_id, occupancy) VALUES ($1, $2, $3, $4, $5)',
              [departure, arrival, stop.station, journeyId, 0]
            );
            scheduleCount++;
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted ${journeys.length} journeys and ${scheduleCount} schedule entries`);
    return journeys;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertBookingsAndTickets(
  journeys: Array<{ id: number; trainId: number; route: number; date: Date }>,
  seatsByTrain: Map<number, Seat[]>
) {
  console.log('\n🎫 Inserting bookings and tickets...');
  const client = await db.connect();

  const emails = [
    'sakura.tanaka@example.jp',
    'hiroshi.yamamoto@example.jp',
    'yuki.sato@example.jp',
    'kenji.nakamura@example.jp',
    'mai.suzuki@example.jp',
    'takeshi.kobayashi@example.jp',
    'aiko.watanabe@example.jp',
    'daiki.ito@example.jp',
  ];

  let bookingCount = 0;
  let ticketCount = 0;

  try {
    await client.query('BEGIN');

    for (const journey of journeys) {
      const seats = seatsByTrain.get(journey.trainId);
      if (!seats) continue;

      // Get car info to determine seat class
      const carClassMap = new Map<number, string>();
      const carsResult = await client.query(
        'SELECT id, type FROM cars WHERE train_id = $1',
        [journey.trainId]
      );
      for (const car of carsResult.rows) {
        carClassMap.set(car.id, car.type);
      }

      // Book random percentage of seats
      const seatsToBook = Math.floor(seats.length * CONFIG.BOOKING_PROBABILITY);
      const shuffled = [...seats].sort(() => Math.random() - 0.5);
      const bookedSeats = shuffled.slice(0, seatsToBook);

      for (const seat of bookedSeats) {
        const email = emails[Math.floor(Math.random() * emails.length)];

        // Get the actual car ID from the database for this seat
        const seatCarResult = await client.query(
          'SELECT car FROM seat WHERE id = $1',
          [seat.id]
        );
        const actualCarId = seatCarResult.rows[0]?.car;
        const seatClass = carClassMap.get(actualCarId) || 'Economy';

        // Get random origin and destination respecting route direction
        let originIdx, destIdx;

        if (journey.route === 1) {
          // Eastbound: Shin-Osaka (5) → Tokyo (0)
          // Origin should have higher index than destination
          originIdx = Math.floor(Math.random() * 6); // 0-5
          destIdx = Math.floor(Math.random() * originIdx); // Always less than origin
          if (destIdx === originIdx || originIdx === 0) {
            // Ensure valid pair
            originIdx = 5; // Shin-Osaka
            destIdx = Math.floor(Math.random() * 5); // Any station before it
          }
        } else {
          // Westbound: Tokyo (0) → Shin-Osaka (5)
          // Origin should have lower index than destination
          originIdx = Math.floor(Math.random() * 6); // 0-5
          destIdx = originIdx + 1 + Math.floor(Math.random() * (5 - originIdx)); // Always greater than origin
          if (destIdx === originIdx || originIdx === 5) {
            // Ensure valid pair
            originIdx = 0; // Tokyo
            destIdx = 1 + Math.floor(Math.random() * 5); // Any station after it
          }
        }

        const originStation = STATIONS[originIdx];
        const destStation = STATIONS[destIdx];

        // Calculate fare
        const baseFare = FARE_MATRIX[originStation.name]?.[destStation.name] || 5000;
        const cost = Math.floor(baseFare * CLASS_MULTIPLIERS[seatClass as keyof typeof CLASS_MULTIPLIERS]);
        const confirmStatus = true;

        // Create booking
        const bookingResult = await client.query(
          'INSERT INTO bookings (email, cost_total, confirm_status) VALUES ($1, $2, $3) RETURNING id',
          [email, cost, confirmStatus]
        );
        const bookingId = bookingResult.rows[0].id;
        bookingCount++;

        // Create ticket
        await client.query(
          `INSERT INTO tickets (booking_id, cost, seat, class, origin, destination, journey, reserved_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            bookingId,
            cost,
            seat.id,
            seatClass,
            originStation.id,
            destStation.id,
            journey.id,
            new Date(journey.date.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Booked up to 7 days before
          ]
        );
        ticketCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted ${bookingCount} bookings and ${ticketCount} tickets`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateOccupancy() {
  console.log('\n📊 Updating schedule occupancy...');
  const client = await db.connect();

  try {
    await client.query(`
      UPDATE schedule s
      SET occupancy = (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.journey = s.journey_id
      )
    `);
    console.log('✅ Occupancy updated');
  } finally {
    client.release();
  }
}

async function printSummary() {
  console.log('\n📈 Data Generation Summary:');
  const client = await db.connect();

  try {
    const tables = ['station', 'routes', 'trains', 'cars', 'seat', 'journeys', 'schedule', 'bookings', 'tickets'];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table.padEnd(15)}: ${result.rows[0].count.toString().padStart(6)}`);
    }

    // Show date range
    const dateRange = await client.query(
      'SELECT MIN(departure)::date as start, MAX(departure)::date as end FROM schedule'
    );
    console.log(`\n   Schedule Range: ${dateRange.rows[0].start} to ${dateRange.rows[0].end}`);

    // Show average occupancy
    const avgOccupancy = await client.query(
      'SELECT AVG(occupancy)::numeric(10,2) as avg FROM schedule WHERE occupancy > 0'
    );
    console.log(`   Avg Occupancy : ${avgOccupancy.rows[0].avg || 0} passengers/journey`);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting Sample Data Generation...');
  console.log(`📅 Date Range: ${CONFIG.START_DATE.toDateString()} - ${CONFIG.END_DATE.toDateString()}`);
  console.log(`🎯 Target: ${CONFIG.JOURNEYS_PER_DAY} journeys/day\n`);

  try {
    await clearExistingData();
    await insertStations();
    await insertRoutes();
    const trains = await insertTrains();
    const seatsByTrain = await insertCarsAndSeats(trains);
    const journeys = await insertJourneysAndSchedules(trains);
    await insertBookingsAndTickets(journeys, seatsByTrain);
    await updateOccupancy();
    await printSummary();

    console.log('\n✅ Sample data generation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating sample data:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
