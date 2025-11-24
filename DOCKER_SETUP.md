# Docker Setup Guide

This guide explains how to launch the Train Booking System using Docker Compose.

## Architecture Overview

The system consists of 4 main containers:

1. **db-primary** (Port 5432) - Primary PostgreSQL database for OLTP operations
2. **db-replica** (Port 5433) - Hot backup using physical replication
3. **db-reports** (Port 5434) - Reports database for OLAP operations using logical replication
4. **web** (Port 5173) - SvelteKit web application
5. **jmeter** (Optional) - Load testing tool

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 5173, 5432, 5433, 5434 available

## Quick Start

### 1. Initial Setup

```bash
# Copy environment file
cp .env.example .env

# Make scripts executable (Linux/Mac)
chmod +x docker/scripts/*.sh
```

### 2. Launch the System

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Setup Logical Replication (After First Launch)

After all databases are up and running, setup the logical replication:

```bash
# On Linux/Mac
docker exec -it train-db-reports sh -c "apk add --no-cache postgresql-client bash && bash /docker-entrypoint-initdb.d/setup-replication.sh"

# Or manually via psql
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT reports.setup_subscription_from_primary();"
```

### 4. Verify Replication

```bash
# Check replication status on primary
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT * FROM pg_replication_slots;"

# Check subscription on reports database
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT * FROM pg_subscription;"

# Check replica status
docker exec -it train-db-replica psql -U trainadmin -c "SELECT * FROM pg_stat_replication;"
```

## Accessing Services

- **Web Application**: http://localhost:5173
- **Primary Database**: `postgresql://trainadmin:trainpass123@localhost:5432/train_booking`
- **Replica Database**: `postgresql://trainadmin:trainpass123@localhost:5433/train_booking`
- **Reports Database**: `postgresql://trainadmin:trainpass123@localhost:5434/train_reports`

## Database Management

### Connect to Databases

```bash
# Primary database
docker exec -it train-db-primary psql -U trainadmin -d train_booking

# Replica database
docker exec -it train-db-replica psql -U trainadmin -d train_booking

# Reports database
docker exec -it train-db-reports psql -U trainadmin -d train_reports
```

### Backup and Restore

```bash
# Backup primary database
docker exec train-db-primary pg_dump -U trainadmin train_booking > backup.sql

# Restore to database
docker exec -i train-db-primary psql -U trainadmin train_booking < backup.sql
```

### View WAL Archives (Hourly Backups)

```bash
# List archived WAL files
docker exec train-db-primary ls -lh /var/lib/postgresql/wal_archive/
```

## Load Testing

### Start JMeter Container

```bash
# Start with testing profile
docker-compose --profile testing up -d jmeter

# Access JMeter container
docker exec -it train-jmeter bash
```

### Run Load Tests

```bash
# Inside JMeter container
jmeter -n -t /tests/your-test-plan.jmx -l /results/results.jtl

# View results from host
cat docker/jmeter/results/results.jtl
```

## Refresh Materialized Views

The reports database has materialized views that need periodic refreshing:

```bash
# Refresh all materialized views
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT reports.refresh_all_views();"
```

## Troubleshooting

### Replica Not Starting

```bash
# Check primary database is healthy
docker-compose logs db-primary

# Remove replica data and restart
docker-compose down
docker volume rm mco2_trains_replica-data
docker-compose up -d
```

### Logical Replication Issues

```bash
# Drop and recreate subscription
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "DROP SUBSCRIPTION IF EXISTS reports_sub;"
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT reports.setup_subscription_from_primary();"

# Check for replication lag
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT * FROM pg_stat_replication;"
```

### View Container Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f web
docker-compose logs -f db-primary
docker-compose logs -f db-replica
docker-compose logs -f db-reports
```

## Stopping the System

```bash
# Stop all containers (keep data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Stop specific service
docker-compose stop web
```

## Performance Monitoring

### Database Statistics

```bash
# Check database size
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT pg_size_pretty(pg_database_size('train_booking'));"

# Check table sizes
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check active connections
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT count(*) FROM pg_stat_activity;"
```

## Development vs Production

### Development Mode

```bash
# Run with live reload
npm run dev

# Use local database (if not using Docker)
# Update DATABASE_URL in .env to point to localhost
```

### Production Mode

```bash
# Build and run with Docker
docker-compose up -d --build
```

## Updating the Schema

If you need to modify the database schema:

1. Update the SQL files in `docker/postgres/*/init/`
2. Rebuild the databases:

```bash
docker-compose down -v
docker-compose up -d --build
```

## Notes

- The primary database archives WAL files every hour for point-in-time recovery
- Materialized views in the reports database should be refreshed periodically
- The replica is read-only and cannot accept write operations
- For production, change all passwords in `.env` and docker-compose.yml
- Consider setting up automated backups for production use
