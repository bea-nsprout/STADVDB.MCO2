#!/usr/bin/env node
/**
 * ETL Script: OLTP → OLAP Data Transformation
 *
 * This script extracts data from the primary OLTP database,
 * transforms it into a star schema format, and loads it into
 * the reports OLAP database.
 *
 * Usage:
 *   npm install pg @types/pg
 *   npx tsx scripts/etl-oltp-to-olap.ts
 *
 * Or with Docker:
 *   docker exec train-web-app npx tsx scripts/etl-oltp-to-olap.ts
 */

import { Pool } from 'pg';

// Database connection configurations
const primaryDB = new Pool({
  host: process.env.PRIMARY_DB_HOST || 'localhost',
  port: parseInt(process.env.PRIMARY_DB_PORT || '5432'),
  database: 'train_booking',
  user: 'trainadmin',
  password: 'trainpass123',
});

const reportsDB = new Pool({
  host: process.env.REPORTS_DB_HOST || 'localhost',
  port: parseInt(process.env.REPORTS_DB_PORT || '5434'),
  database: 'train_reports',
  user: 'trainadmin',
  password: 'trainpass123',
});

interface TicketRow {
  ticket_id: string;
  cost: number;
  class: string;
  booking_confirmed: boolean;
  reserved_at: Date;
  origin_name: string;
  origin_region: string;
  dest_name: string;
  dest_region: string;
  train_id: number;
  departure_time: Date;
  arrival_time: Date;
}

/**
 * Extract or create date dimension record
 */
async function getOrCreateDateDimension(
  timestamp: Date,
  client: any
): Promise<number> {
  const hour = timestamp.getHours();
  const day = timestamp.getDate();
  const month = timestamp.getMonth() + 1; // JS months are 0-indexed
  const year = timestamp.getFullYear();
  const dayOfWeek = timestamp.getDay();
  const quarter = Math.floor(month / 3) + 1;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check if date dimension already exists
  const existingDate = await client.query(
    `SELECT id FROM reports.dates
     WHERE hour = $1 AND day = $2 AND month = $3 AND year = $4`,
    [hour, day, month, year]
  );

  if (existingDate.rows.length > 0) {
    return existingDate.rows[0].id;
  }

  // Insert new date dimension
  const result = await client.query(
    `INSERT INTO reports.dates (hour, day, month, year, day_of_week, quarter, is_weekend)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [hour, day, month, year, dayOfWeek, quarter, isWeekend]
  );

  return result.rows[0].id;
}

/**
 * Extract or create station dimension record
 */
async function getOrCreateStationDimension(
  name: string,
  region: string,
  client: any
): Promise<number> {
  // Check if station dimension already exists
  const existingStation = await client.query(
    `SELECT id FROM reports.stations WHERE name = $1`,
    [name]
  );

  if (existingStation.rows.length > 0) {
    return existingStation.rows[0].id;
  }

  // Insert new station dimension
  const result = await client.query(
    `INSERT INTO reports.stations (name, region)
     VALUES ($1, $2)
     RETURNING id`,
    [name, region]
  );

  return result.rows[0].id;
}

/**
 * Extract or create seat dimension record
 */
async function getOrCreateSeatDimension(
  seatClass: string,
  trainId: number,
  client: any
): Promise<number> {
  const trainName = `Train ${trainId}`;

  // Check if seat dimension already exists
  const existingSeat = await client.query(
    `SELECT id FROM reports.seats WHERE class = $1 AND train = $2`,
    [seatClass, trainName]
  );

  if (existingSeat.rows.length > 0) {
    return existingSeat.rows[0].id;
  }

  // Insert new seat dimension
  const result = await client.query(
    `INSERT INTO reports.seats (class, train)
     VALUES ($1, $2)
     RETURNING id`,
    [seatClass, trainName]
  );

  return result.rows[0].id;
}

/**
 * Main ETL process
 */
async function runETL() {
  const primaryClient = await primaryDB.connect();
  const reportsClient = await reportsDB.connect();

  try {
    console.log('🚀 Starting ETL process...');
    console.log('📊 Extracting data from primary OLTP database...');

    // Extract tickets with all related data using JOINs
    const extractQuery = `
      SELECT
        t.ticket_id,
        t.cost,
        t.class,
        b.confirm_status as booking_confirmed,
        t.reserved_at,
        origin_stn.name as origin_name,
        'Unknown' as origin_region,
        dest_stn.name as dest_name,
        'Unknown' as dest_region,
        j.train_no as train_id,
        origin_sch.departure as departure_time,
        dest_sch.arrival as arrival_time
      FROM public.tickets t
      JOIN public.bookings b ON t.booking_id = b.id
      JOIN public.station origin_stn ON t.origin = origin_stn.id
      JOIN public.station dest_stn ON t.destination = dest_stn.id
      JOIN public.journeys j ON t.journey = j.id
      JOIN public.schedule origin_sch ON origin_sch.journey_id = j.id
        AND origin_sch.station = origin_stn.name
      JOIN public.schedule dest_sch ON dest_sch.journey_id = j.id
        AND dest_sch.station = dest_stn.name
      WHERE origin_sch.departure <= dest_sch.arrival
    `;

    const extractResult = await primaryClient.query<TicketRow>(extractQuery);
    const tickets = extractResult.rows;

    console.log(`✅ Extracted ${tickets.length} tickets from primary database`);

    if (tickets.length === 0) {
      console.log('ℹ️  No data to process. ETL complete.');
      return;
    }

    console.log('🔄 Transforming and loading data into OLAP star schema...');

    let processedCount = 0;
    let skippedCount = 0;

    // Begin transaction for reports database
    await reportsClient.query('BEGIN');

    for (const ticket of tickets) {
      try {
        // Transform: Create/get dimension records
        const departDateId = await getOrCreateDateDimension(
          ticket.departure_time,
          reportsClient
        );
        const arriveDateId = await getOrCreateDateDimension(
          ticket.arrival_time,
          reportsClient
        );
        const departStnId = await getOrCreateStationDimension(
          ticket.origin_name,
          ticket.origin_region,
          reportsClient
        );
        const arriveStnId = await getOrCreateStationDimension(
          ticket.dest_name,
          ticket.dest_region,
          reportsClient
        );
        const seatId = await getOrCreateSeatDimension(
          ticket.class,
          ticket.train_id,
          reportsClient
        );

        // Load: Insert into fact table (check for duplicates using source_ticket_id)
        const existingTicket = await reportsClient.query(
          `SELECT id FROM reports.tickets WHERE source_ticket_id = $1`,
          [ticket.ticket_id]
        );

        if (existingTicket.rows.length === 0) {
          await reportsClient.query(
            `INSERT INTO reports.tickets
             (seat, depart_date, arrive_date, depart_stn, arrive_stn, cost, booking_confirmed, source_ticket_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              seatId,
              departDateId,
              arriveDateId,
              departStnId,
              arriveStnId,
              ticket.cost,
              ticket.booking_confirmed,
              ticket.ticket_id,
            ]
          );
          processedCount++;
        } else {
          skippedCount++;
        }

        // Progress indicator
        if ((processedCount + skippedCount) % 100 === 0) {
          console.log(
            `   Processed ${processedCount + skippedCount}/${tickets.length} tickets...`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing ticket ${ticket.ticket_id}:`,
          error instanceof Error ? error.message : error
        );
        skippedCount++;
      }
    }

    // Commit transaction
    await reportsClient.query('COMMIT');

    console.log('\n✨ ETL process completed successfully!');
    console.log(`   📝 Processed: ${processedCount} tickets`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tickets (duplicates or errors)`);

    // Refresh materialized views
    console.log('\n🔄 Refreshing materialized views...');
    await reportsClient.query(
      'REFRESH MATERIALIZED VIEW reports.daily_revenue_by_route'
    );
    await reportsClient.query(
      'REFRESH MATERIALIZED VIEW reports.seat_class_performance'
    );
    await reportsClient.query(
      'REFRESH MATERIALIZED VIEW reports.popular_routes'
    );
    console.log('✅ Materialized views refreshed');
  } catch (error) {
    await reportsClient.query('ROLLBACK');
    console.error('❌ ETL process failed:', error);
    throw error;
  } finally {
    primaryClient.release();
    reportsClient.release();
  }
}

// Run ETL and handle exit
runETL()
  .then(() => {
    console.log('\n✅ ETL job finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ETL job failed:', error);
    process.exit(1);
  })
  .finally(() => {
    primaryDB.end();
    reportsDB.end();
  });
