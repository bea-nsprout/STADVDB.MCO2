# Docker Setup Guide

This guide explains how to launch the Train Booking System using Docker Compose.

## Quick Start for Windows Users

If you're on Windows and want to get started quickly, run these commands in **PowerShell (as Administrator)**:

### 1. Prerequisites
```powershell
# Install Docker Desktop for Windows first
# Download from: https://www.docker.com/products/docker-desktop
# Make sure Docker Desktop is running before continuing
```

### 2. Initial Setup
```powershell
# Navigate to project directory
cd <project-path>

# Copy environment file
Copy-Item .env.example .env
```

### 3. Start All Services
```powershell
# Start all containers (this may take a few minutes)
docker-compose up -d

# Check that all containers are running
docker-compose ps
```

### 4. Generate Sample Data
```powershell
# Install dependencies first
npm install

# Generate realistic sample data (45,000+ tickets)
npm run generate-data
```

### 5. Sync Data to Reports Database
```powershell
# Run ETL to sync OLTP → OLAP data
npm run etl
```

### 6. Access the Application
- Open your browser and go to: **http://localhost:5173**

### 7. (Optional) Setup Load Testing with k6
```powershell
# Only if you want to run load tests:
New-Item -ItemType Directory -Path docker\k6\scripts -Force
New-Item -ItemType Directory -Path docker\k6\results -Force
docker-compose --profile testing up -d k6
```

---

**That's it! Your system should now be running.**

For detailed instructions, troubleshooting, and advanced features, see the sections below.

## Architecture Overview

The system consists of 4 main containers:

1. **db-primary** (Port 5432) - Primary PostgreSQL database for OLTP operations
2. **db-replica** (Port 5433) - Hot backup using physical replication
3. **db-reports** (Port 5434) - Reports database for OLAP operations (synced via ETL)
4. **web** (Port 5173) - SvelteKit web application
5. **k6** (Optional) - Load testing tool

**Note:** Reports DB uses ETL for data sync (not logical replication) due to different schemas.

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux) installed
  - Windows: Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
  - Ensure WSL 2 backend is enabled (recommended for Windows)
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM
- Ports 5173, 5432, 5433, 5434 available

**Windows-Specific Notes:**
- Use PowerShell or Command Prompt as Administrator for Docker commands
- If using WSL 2, you can also run commands from a WSL terminal
- Ensure Docker Desktop is running before executing any docker commands

## Quick Start

### 1. Initial Setup

**Linux/Mac:**
```bash
# Copy environment file
cp .env.example .env

# Make scripts executable
chmod +x docker/scripts/*.sh
```

**Windows (Command Prompt):**
```cmd
REM Copy environment file
copy .env.example .env

REM Note: No need to make scripts executable on Windows
```

**Windows (PowerShell):**
```powershell
# Copy environment file
Copy-Item .env.example .env

# Note: No need to make scripts executable on Windows
```

### 2. Launch the System

**All Platforms (Linux/Mac/Windows):**
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Note for Windows:** These commands work the same in PowerShell, Command Prompt, or WSL terminal.

### 3. Generate Sample Data

**Generate realistic sample data (All Platforms):**
```bash
# Install dependencies (first time only)
npm install

# Generate 45,000+ tickets across 11 days
npm run generate-data
```

This creates:
- 10 trains (320 seats each)
- 220 journeys (20/day from Nov 25 - Dec 5)
- 45,000+ bookings across all classes
- Realistic pricing and occupancy

**⚠️ Warning:** This clears ALL existing data!

### 4. Sync Data to Reports Database (OLTP → OLAP)

**⚠️ Important:** Logical replication doesn't work because Primary and Reports have different schemas. Use the ETL script instead.

**Sync Data (All Platforms):**
```bash
# Run ETL to transform and load data
npm run etl
```

This will:
- Extract data from Primary DB (OLTP)
- Transform to star schema
- Load into Reports DB (OLAP)
- Refresh materialized views

### 5. Verify Data Sync

```bash
# Check data in reports database
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT COUNT(*) FROM reports.tickets;"

# Check replica status (physical replication)
docker exec -it train-db-replica psql -U trainadmin -c "SELECT * FROM pg_stat_replication;"

# View reports
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT * FROM reports.popular_routes LIMIT 10;"
```

## Accessing Services

- **Web Application**: http://localhost:5173
- **Primary Database**: `postgresql://trainadmin:trainpass123@localhost:5432/train_booking`
- **Replica Database**: `postgresql://trainadmin:trainpass123@localhost:5433/train_booking`
- **Reports Database**: `postgresql://trainadmin:trainpass123@localhost:5434/train_reports`

## Database Management

### Connect to Databases

**All Platforms (Linux/Mac/Windows):**
```bash
# Primary database
docker exec -it train-db-primary psql -U trainadmin -d train_booking

# Replica database
docker exec -it train-db-replica psql -U trainadmin -d train_booking

# Reports database
docker exec -it train-db-reports psql -U trainadmin -d train_reports
```

### Inspect Database Contents

**List all tables:**
```bash
# On primary database
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "\dt"

# On reports database
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "\dt"
```

**View table data:**
```bash
# View all records in a table (example: users table)
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT * FROM users LIMIT 10;"

# Count records in a table
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT COUNT(*) FROM users;"

# View table structure
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "\d users"
```

**Useful psql commands (when connected interactively):**
```sql
\dt              -- List all tables
\dt+             -- List tables with size info
\d table_name    -- Describe table structure
\l               -- List all databases
\dn              -- List all schemas
\q               -- Quit psql
```

**Quick data inspection (one-liners):**
```bash
# List all tables with row counts (primary database)
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "
SELECT schemaname, tablename,
  (SELECT COUNT(*) FROM pg_catalog.quote_ident(schemaname)||'.'||pg_catalog.quote_ident(tablename)) as row_count
FROM pg_tables
WHERE schemaname = 'public';"

# Show recent bookings
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;"
```

### Using pgAdmin (http://localhost:9000/browser/)

**Step 1: Connect pgAdmin container to the database network**

```bash
# Find your pgAdmin container name
docker ps | findstr pgadmin

# First, find the actual network name (Docker Compose adds a project prefix)
docker network ls

# The network will be named something like: stadvdb_mco2_train-network
# Connect pgAdmin to it (replace with your actual container name and network name)
docker network connect <project_name>_train-network <your-pgadmin-container-name>

# Example:
docker network connect stadvdb_mco2_train-network sql-201-docker-pgadmin-1
```

**⚠️ Important: Network Naming**
- Docker Compose automatically prefixes network names with your project/directory name
- The network will be called `<project_name>_train-network` (NOT just `train-network`)
- Run `docker network ls` to see the actual network name on your system
- Example: `stadvdb_mco2_train-network`

**Step 2: Access pgAdmin**
- Open browser: http://localhost:9000/browser/
- Login with your pgAdmin credentials

**Step 3: Add Primary Database Server**
- Right-click "Servers" in left panel → "Register" → "Server"
- **General tab:**
  - Name: `Train Booking - Primary`
- **Connection tab:**
  - Host: `train-db-primary` (use container name, NOT localhost)
  - Port: `5432`
  - Maintenance database: `train_booking`
  - Username: `trainadmin`
  - Password: `trainpass123`
  - Save password: ✓ (check this box)
- Click "Save"

**Step 4: Add Reports Database Server**
- Repeat the process with:
  - Name: `Train Booking - Reports`
  - Host: `train-db-reports`
  - Port: `5432` (note: use 5432 here, not 5434)
  - Maintenance database: `train_reports`
  - Username: `trainadmin`
  - Password: `trainpass123`

**Step 5: Add Replica Database Server (Optional)**
- Name: `Train Booking - Replica`
- Host: `train-db-replica`
- Port: `5432`
- Maintenance database: `train_booking`
- Username: `trainadmin`
- Password: `trainpass123`

**Important Notes:**
- When pgAdmin runs in Docker, use **container names** as hosts (`train-db-primary`, `train-db-reports`, `train-db-replica`)
- Always use port **5432** when connecting via Docker network
- If container names don't work, try using `host.docker.internal` with ports 5432, 5433, and 5434 instead

**Browsing the Data:**
- Expand server → Databases → train_booking → Schemas → public → Tables
- Right-click any table → "View/Edit Data" → "All Rows"

### Backup and Restore

**Linux/Mac:**
```bash
# Backup primary database
docker exec train-db-primary pg_dump -U trainadmin train_booking > backup.sql

# Restore to database
docker exec -i train-db-primary psql -U trainadmin train_booking < backup.sql
```

**Windows (PowerShell):**
```powershell
# Backup primary database
docker exec train-db-primary pg_dump -U trainadmin train_booking | Out-File -Encoding utf8 backup.sql

# Restore to database
Get-Content backup.sql | docker exec -i train-db-primary psql -U trainadmin train_booking
```

**Windows (Command Prompt):**
```cmd
REM Backup primary database
docker exec train-db-primary pg_dump -U trainadmin train_booking > backup.sql

REM Restore to database
docker exec -i train-db-primary psql -U trainadmin train_booking < backup.sql
```

### View WAL Archives (Hourly Backups)

```bash
# List archived WAL files
docker exec train-db-primary ls -lh /var/lib/postgresql/wal_archive/
```

## Load Testing

### Setup k6 Directory Structure (First Time Only)

Before using k6, create the necessary directories:

**Linux/Mac:**
```bash
mkdir -p docker/k6/scripts docker/k6/results
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Path docker\k6\scripts -Force
New-Item -ItemType Directory -Path docker\k6\results -Force
```

**Windows (Command Prompt):**
```cmd
mkdir docker\k6\scripts
mkdir docker\k6\results
```

**Or simply create these folders manually using File Explorer/Finder**

### Start k6 Container

**All Platforms (Linux/Mac/Windows):**
```bash
# Start with testing profile
docker-compose --profile testing up -d k6

# Access k6 container
docker exec -it train-k6 sh
```

### Run Load Tests

**From within the k6 container:**
```bash
# Run a load test script
k6 run /scripts/your-test-script.js

# Run with specific options
k6 run --vus 10 --duration 30s /scripts/your-test-script.js

# Output results to file
k6 run /scripts/your-test-script.js --out json=/results/results.json
```

**From host machine (All Platforms):**
```bash
# Run test directly without entering container
docker exec train-k6 k6 run /scripts/your-test-script.js

# Run with options
docker exec train-k6 k6 run --vus 10 --duration 30s /scripts/your-test-script.js
```

**View results from host:**
```bash
# Linux/Mac
cat docker/k6/results/results.json

# Windows (PowerShell)
Get-Content docker/k6/results/results.json

# Windows (Command Prompt)
type docker\k6\results\results.json
```

### Example k6 Test Script

Create a file at `docker/k6/scripts/basic-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,        // 10 virtual users
  duration: '30s', // Test duration
};

export default function () {
  // Test the web application
  const res = http.get('http://web:5173');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## Sample Data & ETL

### Generate New Sample Data

```bash
# Generate realistic sample data (⚠️ clears existing data!)
npm run generate-data

# Then sync to reports database
npm run etl
```

### Sync Data from Primary to Reports (Without Regenerating)

```bash
# Run ETL to sync latest data
npm run etl
```

### Refresh Materialized Views Only

The ETL script automatically refreshes views, but you can also refresh manually:

```bash
# Refresh all materialized views
docker exec -it train-db-reports psql -U trainadmin -d train_reports -c "SELECT reports.refresh_all_views();"
```

## Troubleshooting

**For detailed troubleshooting guides, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

The comprehensive troubleshooting guide covers:
- Database connection issues (password authentication failed)
- Port conflicts with local PostgreSQL
- Docker container issues
- Sample data generation problems
- Windows-specific issues
- Performance troubleshooting

Quick fixes for common issues:

### Windows-Specific Issues

**Docker Desktop Not Running:**
```powershell
# Check if Docker Desktop is running
docker version

# If error, start Docker Desktop from Start Menu
```

**Port Already in Use:**
```powershell
# Check what's using a port (e.g., 5432)
netstat -ano | findstr :5432

# Kill process by PID (replace <PID> with actual number)
taskkill /PID <PID> /F
```

**WSL 2 Issues:**
- Ensure WSL 2 is enabled in Docker Desktop settings
- Update WSL: `wsl --update` in PowerShell (as Administrator)
- Restart Docker Desktop after WSL updates

**Line Ending Issues:**
- If shell scripts fail, they may have Windows line endings (CRLF)
- Git should handle this automatically, but if issues persist:
  ```powershell
  # Configure Git to handle line endings
  git config --global core.autocrlf true
  ```

### Replica Not Starting

```bash
# Check primary database is healthy
docker-compose logs db-primary

# Remove replica data and restart
docker-compose down
docker volume rm mco2_trains_replica-data
docker-compose up -d
```

### Reports Database Out of Sync

```bash
# Re-run ETL to sync latest data
npm run etl

# Or clear reports data and reload everything
docker exec train-db-reports psql -U trainadmin -d train_reports -c "TRUNCATE reports.tickets CASCADE;"
npm run etl
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

# For db types
- run "npx kysely-codegen --url postgresql://trainadmin:trainpass123@localhost:5432/train_booking --out-file src/utils/db/oltp-types.ts" for oltp
- run "npx kysely-codegen --url postgresql://trainadmin:trainpass123@localhost:5434/train_reports --out-file src/utils/db/olap-types.ts" for olap

## Notes

- The primary database archives WAL files every hour for point-in-time recovery
- Materialized views in the reports database should be refreshed periodically
- The replica is read-only and cannot accept write operations
- For production, change all passwords in `.env` and docker-compose.yml
- Consider setting up automated backups for production use
