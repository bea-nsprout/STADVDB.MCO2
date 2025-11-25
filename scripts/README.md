# ETL Script: OLTP → OLAP Data Transformation

## Overview

This ETL (Extract, Transform, Load) script synchronizes data from the **primary OLTP database** (train_booking) to the **reports OLAP database** (train_reports), transforming normalized transactional data into a denormalized star schema optimized for analytics.

## Architecture

### Source: Primary Database (OLTP)
- **Purpose**: Transactional operations
- **Schema**: Normalized relational tables
- **Tables**: tickets, bookings, journeys, schedules, stations, etc.

### Target: Reports Database (OLAP)
- **Purpose**: Analytics and reporting
- **Schema**: Star schema with dimensions and fact tables
- **Dimensions**: dates, seats, stations
- **Fact Table**: tickets

## Star Schema Design

```
┌─────────────┐
│   DATES     │
│ (Dimension) │
└──────┬──────┘
       │
       ├─────depart_date───┐
       │                   │
       └─────arrive_date   │
                           │
┌─────────────┐      ┌────▼────────┐      ┌─────────────┐
│   STATIONS  │      │   TICKETS   │      │    SEATS    │
│ (Dimension) │◄────┤  (Fact)     ├─────►│ (Dimension) │
└─────────────┘      └─────────────┘      └─────────────┘
  depart_stn              │                    seat
  arrive_stn              │
                          ▼
                    [Measures: cost, booking_confirmed]
```

## Features

- **Incremental Loading**: Only new tickets are loaded (duplicate detection via `source_ticket_id`)
- **Dimension Management**: Automatically creates/reuses dimension records
- **Transaction Safety**: All operations wrapped in transactions with rollback on error
- **Materialized Views**: Auto-refreshes analytical views after ETL
- **Progress Tracking**: Real-time progress updates during execution

## Usage

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `pg` - PostgreSQL client
- `@types/pg` - TypeScript types
- `tsx` - TypeScript execution

### 2. Run ETL

**From your local machine:**
```bash
npm run etl
```

**From within Docker container:**
```bash
docker exec train-web-app npm run etl
```

**With custom database hosts:**
```bash
# If databases are on different hosts
PRIMARY_DB_HOST=db-primary REPORTS_DB_HOST=db-reports npm run etl

# Using Docker service names (default)
npm run etl
```

### 3. Schedule Regular ETL Runs

**Option A: Using cron (Linux/Mac)**
```bash
# Run ETL every hour
0 * * * * cd /path/to/project && npm run etl >> /var/log/etl.log 2>&1
```

**Option B: Using Windows Task Scheduler**
Create a scheduled task that runs:
```cmd
cmd /c "cd C:\path\to\project && npm run etl"
```

**Option C: Using Docker + cron**
Add to docker-compose.yml:
```yaml
etl-scheduler:
  image: node:20-alpine
  volumes:
    - .:/app
  working_dir: /app
  command: sh -c "while true; do npm run etl && sleep 3600; done"
  networks:
    - train-network
  depends_on:
    - db-primary
    - db-reports
```

## Configuration

The script reads database configuration from environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PRIMARY_DB_HOST` | `localhost` | Primary database host |
| `PRIMARY_DB_PORT` | `5432` | Primary database port |
| `REPORTS_DB_HOST` | `localhost` | Reports database host |
| `REPORTS_DB_PORT` | `5434` | Reports database port |

## Output

The script provides detailed progress information:

```
🚀 Starting ETL process...
📊 Extracting data from primary OLTP database...
✅ Extracted 156 tickets from primary database
🔄 Transforming and loading data into OLAP star schema...
   Processed 100/156 tickets...

✨ ETL process completed successfully!
   📝 Processed: 150 tickets
   ⏭️  Skipped: 6 tickets (duplicates or errors)

🔄 Refreshing materialized views...
✅ Materialized views refreshed

✅ ETL job finished successfully
```

## Data Transformations

### 1. Ticket Fact Records
- Extracts ticket data with JOIN across multiple tables
- Maps foreign keys to dimension keys
- Includes measures: cost, booking_confirmed

### 2. Date Dimension
- Extracts hour, day, month, year from timestamps
- Calculates day_of_week, quarter, is_weekend
- Creates separate records for departure and arrival times

### 3. Station Dimension
- Extracts station name and region
- Normalizes station references

### 4. Seat Dimension
- Extracts seat class and train information
- Creates dimension records for seat analytics

## Materialized Views

The ETL automatically refreshes these views after loading:

1. **daily_revenue_by_route**: Revenue grouped by date and route
2. **seat_class_performance**: Booking and revenue by seat class
3. **popular_routes**: Trip counts and revenue by origin-destination pairs

## Error Handling

- **Transaction Rollback**: All changes rolled back on error
- **Detailed Logging**: Errors logged with ticket ID and message
- **Graceful Degradation**: Continues processing on individual ticket errors
- **Exit Codes**: Returns 0 on success, 1 on failure

## Troubleshooting

### Connection Issues
```bash
# Test primary database connection
docker exec train-db-primary psql -U trainadmin -d train_booking -c "SELECT 1;"

# Test reports database connection
docker exec train-db-reports psql -U trainadmin -d train_reports -c "SELECT 1;"
```

### Check Data
```bash
# View ticket count in reports
docker exec train-db-reports psql -U trainadmin -d train_reports -c "SELECT COUNT(*) FROM reports.tickets;"

# View popular routes
docker exec train-db-reports psql -U trainadmin -d train_reports -c "SELECT * FROM reports.popular_routes;"
```

### Reset Reports Database
```bash
# WARNING: This deletes all data
docker exec train-db-reports psql -U trainadmin -d train_reports -c "TRUNCATE reports.tickets CASCADE;"
```

## Performance

- **Batch Size**: Processes all tickets in a single transaction
- **Index Usage**: Leverages indexes on dimension lookups
- **Memory**: Uses connection pooling to manage resources
- **Scalability**: For large datasets (>10,000 tickets), consider batching

## Future Enhancements

- [ ] Add incremental loading based on timestamp
- [ ] Implement CDC (Change Data Capture) for real-time sync
- [ ] Add data quality checks and validation
- [ ] Support for slowly changing dimensions (SCD Type 2)
- [ ] Parallel processing for large datasets
- [ ] Add metrics and monitoring (Prometheus/Grafana)

## License

Part of the Train Booking System project.
