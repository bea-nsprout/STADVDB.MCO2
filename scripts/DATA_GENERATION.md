# Sample Data Generation Guide

## Overview

The `generate-sample-data.ts` script creates realistic sample data for the Shinkansen Train Booking System, following the exact specifications from the rules document.

## What It Generates

### 📊 Data Volume

| Item | Count | Details |
|------|-------|---------|
| **Stations** | 6 | Tokyo, Shin-Yokohama, Toyohashi, Nagoya, Kyoto, Shin-Osaka |
| **Routes** | 2 | Eastbound (Shin-Osaka → Tokyo), Westbound (Tokyo → Shin-Osaka) |
| **Trains** | 10 | Each with 320 seats (16 First + 64 Business + 240 Economy) |
| **Cars** | 50 | 10 trains × 5 cars each |
| **Seats** | 3,200 | 10 trains × 320 seats |
| **Journeys** | 220 | 11 days × 20 journeys/day |
| **Schedules** | 1,320 | 220 journeys × 6 stops each |
| **Bookings** | ~45,000+ | 65% of available seats |
| **Tickets** | ~45,000+ | One ticket per booking |

### 🚃 Train Configuration (Per Train)

| Class | Cars | Seats/Car | Layout | Total Seats |
|-------|------|-----------|--------|-------------|
| **First** | 1 | 16 | 8 rows × 2 cols (A-B) | 16 |
| **Business** | 1 | 64 | 16 rows × 4 cols (A-D) | 64 |
| **Economy** | 3 | 80 | 16 rows × 5 cols (A-E) | 240 |
| **Total** | **5** | - | - | **320** |

### 📅 Schedule Details

- **Date Range:** November 25 - December 5, 2024 (11 days)
- **Journeys per Day:** 20
- **Operating Hours:** 9:00 AM - 5:00 PM
- **Frequency:** Every ~24 minutes (480 minutes / 20 journeys)
- **Routes:** Alternating Eastbound/Westbound

### 💰 Pricing

**Base Fares (Economy):**

| Route | Fare (¥) |
|-------|----------|
| Tokyo ↔ Shin-Yokohama | 2,000 |
| Tokyo ↔ Kyoto | 11,000 |
| Tokyo ↔ Shin-Osaka | 13,000 |
| Kyoto ↔ Shin-Osaka | 2,000 |
| Nagoya ↔ Kyoto | 2,500 |

**Class Multipliers:**
- Economy: 1.0× (base price)
- Business: 1.5× (base price)
- First: 2.0× (base price)

**Example:** Tokyo → Shin-Osaka
- Economy: ¥13,000
- Business: ¥19,500
- First: ¥26,000

### 🎫 Booking Simulation

- **Booking Rate:** 65% of seats (realistic occupancy)
- **Confirmation Rate:** 90% confirmed, 10% pending
- **Reservation Timing:** Tickets booked 0-7 days before departure
- **Email Patterns:** Japanese-style email addresses (e.g., `sakura.tanaka@example.jp`)

## Usage

### Quick Start

```bash
npm run generate-data
```

This will:
1. ⚠️ **Clear ALL existing data** (bookings, tickets, schedules, etc.)
2. Generate fresh sample data following the rules
3. Show a summary of what was created

### ⚠️ WARNING

**This script DELETES all existing data!** It runs:
```sql
TRUNCATE tickets, bookings, schedule, journeys, seat, cars, trains, routes, station RESTART IDENTITY CASCADE;
```

Make sure you:
- ✅ Have a backup if needed
- ✅ Are running in development/testing environment
- ❌ **DO NOT** run this in production!

### Custom Configuration

Edit the `CONFIG` object in `generate-sample-data.ts`:

```typescript
const CONFIG = {
  TRAINS_COUNT: 10,              // Number of train sets
  START_DATE: new Date('2024-11-25'),
  END_DATE: new Date('2024-12-05'),
  JOURNEYS_PER_DAY: 20,          // Journeys per day
  OPERATING_HOURS: { START: 9, END: 17 }, // 9am to 5pm
  BOOKING_PROBABILITY: 0.65,     // 65% of seats booked
};
```

### Running from Docker

```bash
# If running inside Docker container
docker exec train-web-app npm run generate-data

# Or from host machine (databases must be accessible)
npm run generate-data
```

### With Custom Database Connection

```bash
# Set environment variables
PRIMARY_DB_HOST=db-primary PRIMARY_DB_PORT=5432 npm run generate-data
```

## Output Example

```
🚀 Starting Sample Data Generation...
📅 Date Range: Mon Nov 25 2024 - Thu Dec 05 2024
🎯 Target: 20 journeys/day

🗑️  Clearing existing sample data...
✅ Existing data cleared

📍 Inserting stations...
✅ Inserted 6 stations

🛤️  Inserting routes...
✅ Inserted 2 routes (Eastbound, Westbound)

🚄 Inserting trains...
✅ Inserted 10 trains (320 seats each)

🚃 Inserting cars and seats...
✅ Inserted 50 cars and 3200 seats

🗓️  Inserting journeys and schedules...
✅ Inserted 220 journeys and 1320 schedule entries

🎫 Inserting bookings and tickets...
✅ Inserted 45760 bookings and 45760 tickets

📊 Updating schedule occupancy...
✅ Occupancy updated

📈 Data Generation Summary:
   station        :      6
   routes         :      2
   trains         :     10
   cars           :     50
   seat           :   3200
   journeys       :    220
   schedule       :   1320
   bookings       :  45760
   tickets        :  45760

   Schedule Range: 2024-11-25 to 2024-12-05
   Avg Occupancy : 208.00 passengers/journey

✅ Sample data generation completed successfully!
```

## Verification

### Check Data Quality

```bash
# Verify seat distribution
docker exec train-db-primary psql -U trainadmin -d train_booking -c "
  SELECT c.type, COUNT(*) as total_seats
  FROM seat s
  JOIN cars c ON s.car = c.id
  GROUP BY c.type
  ORDER BY c.type;
"

# Verify journeys per day
docker exec train-db-primary psql -U trainadmin -d train_booking -c "
  SELECT DATE(departure) as date, COUNT(DISTINCT journey_id) as journeys
  FROM schedule
  GROUP BY DATE(departure)
  ORDER BY date;
"

# Check average occupancy
docker exec train-db-primary psql -U trainadmin -d train_booking -c "
  SELECT AVG(occupancy)::numeric(10,2) as avg_occupancy
  FROM schedule;
"

# View popular routes
docker exec train-db-primary psql -U trainadmin -d train_booking -c "
  SELECT
    os.name as origin,
    ds.name as destination,
    COUNT(*) as bookings,
    SUM(t.cost) as revenue
  FROM tickets t
  JOIN station os ON t.origin = os.id
  JOIN station ds ON t.destination = ds.id
  GROUP BY os.name, ds.name
  ORDER BY bookings DESC
  LIMIT 10;
"
```

### Expected Results

**Seat Distribution:**
```
   type    | total_seats
-----------+-------------
 Business  |         640  (10 trains × 64 seats)
 Economy   |       2,400  (10 trains × 240 seats)
 First     |         160  (10 trains × 16 seats)
```

**Journeys per Day:**
```
    date    | journeys
------------+----------
 2024-11-25 |       20
 2024-11-26 |       20
 ...         ...
 2024-12-05 |       20
```

## After Data Generation

### 1. Run ETL to Sync Reports Database

```bash
npm run etl
```

This will transform and load the new OLTP data into the OLAP reports database.

### 2. Restart Application (if needed)

```bash
docker-compose restart web
```

### 3. Verify in Application

Visit http://localhost:5173 and:
- ✅ Check available journeys
- ✅ Try booking tickets
- ✅ Verify seat selection works
- ✅ Check reports/analytics

## Troubleshooting

### Error: Connection refused

**Problem:** Can't connect to database

**Solution:**
```bash
# Check if database is running
docker ps | grep train-db-primary

# If not running, start it
docker-compose up -d db-primary

# Check connectivity
docker exec train-db-primary psql -U trainadmin -d train_booking -c "SELECT 1;"
```

### Error: Out of memory

**Problem:** Not enough RAM to generate data

**Solution:** Reduce `TRAINS_COUNT` or `BOOKING_PROBABILITY` in config:
```typescript
const CONFIG = {
  TRAINS_COUNT: 5,              // Reduced from 10
  BOOKING_PROBABILITY: 0.4,     // Reduced from 0.65
};
```

### Data looks wrong

**Problem:** Seat counts don't match rules

**Solution:** Check car configuration matches:
```bash
docker exec train-db-primary psql -U trainadmin -d train_booking -c "
  SELECT train_id, type, COUNT(*) as cars, SUM(seat_count) as seats
  FROM cars
  GROUP BY train_id, type
  ORDER BY train_id, type;
"
```

Each train should have:
- 1 First car: 16 seats
- 1 Business car: 64 seats
- 3 Economy cars: 240 seats total

## Comparison: Old vs New Sample Data

| Aspect | Old (`03-sample-data.sql`) | New (`generate-sample-data.ts`) |
|--------|----------------------------|----------------------------------|
| **Trains** | 4 trains, 160 seats each | 10 trains, 320 seats each ✅ |
| **Seat Layout** | Simplified | Follows rules exactly ✅ |
| **Schedule** | ~8 journeys (sample) | 220 journeys (11 days × 20/day) ✅ |
| **Date Range** | Tomorrow only | Nov 25 - Dec 5, 2024 ✅ |
| **Bookings** | 4 sample bookings | ~45,000+ realistic bookings ✅ |
| **Tickets** | 2 tickets | ~45,000+ tickets ✅ |
| **Data Volume** | Minimal (testing) | Production-like volume ✅ |

## Performance

**Generation Time:** ~30-60 seconds (depending on system)
**Database Size:** ~50-100 MB
**RAM Usage:** ~200-300 MB during generation

## Next Steps

1. ✅ Generate sample data: `npm run generate-data`
2. ✅ Run ETL: `npm run etl`
3. ✅ Test application: http://localhost:5173
4. ✅ View reports: Check popular routes, revenue, etc.

## License

Part of the Train Booking System project.
