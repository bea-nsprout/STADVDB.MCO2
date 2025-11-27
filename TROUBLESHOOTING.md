# Troubleshooting Guide

This guide covers common issues and their solutions for the Train Booking System.

## Table of Contents

1. [Database Connection Issues](#database-connection-issues)
2. [Docker Issues](#docker-issues)
3. [Sample Data Generation Issues](#sample-data-generation-issues)
4. [Port Conflicts](#port-conflicts)
5. [Windows-Specific Issues](#windows-specific-issues)
6. [Performance Issues](#performance-issues)

---

## Database Connection Issues

### Error: `password authentication failed for user "trainadmin"`

This error typically occurs when trying to run the sample data generation script. There are several possible causes:

#### Cause 1: Port Conflict with Local PostgreSQL (Most Common)

**Symptoms:**
- Error message: `password authentication failed for user "trainadmin"`
- Running `netstat -ano | findstr :5432` shows multiple processes on port 5432

**Diagnosis:**
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# On Mac/Linux
lsof -i :5432
```

If you see **two different PIDs** (Process IDs), you have a port conflict.

**Solution:**

1. **Identify which process is local PostgreSQL:**
   ```bash
   # Windows
   tasklist /FI "PID eq <PID>"

   # Mac/Linux
   ps aux | grep <PID>
   ```

2. **Stop the local PostgreSQL service:**

   **Windows - Method 1 (Services GUI):**
   - Press `Win + R`
   - Type `services.msc` and press Enter
   - Find any service starting with "postgresql"
   - Right-click → Stop

   **Windows - Method 2 (Command Line):**
   ```bash
   # If PostgreSQL is a service
   net stop postgresql-x64-16
   # or
   net stop postgresql-x64-15

   # If running as a standalone process
   taskkill /PID <PID> /F
   ```

   **Mac:**
   ```bash
   brew services stop postgresql
   # or
   sudo pkill -u postgres
   ```

   **Linux:**
   ```bash
   sudo systemctl stop postgresql
   # or
   sudo service postgresql stop
   ```

3. **Restart Docker containers:**
   ```bash
   docker-compose down
   docker-compose up -d db-primary
   ```

4. **Verify only Docker is using port 5432:**
   ```bash
   netstat -ano | findstr :5432
   ```

   You should see only ONE process (Docker).

5. **Run the script again:**
   ```bash
   npx tsx scripts/generate-sample-data.ts
   ```

#### Cause 2: Database Container Not Running

**Symptoms:**
- Connection refused errors
- Cannot connect to localhost:5432

**Solution:**

1. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

2. **If db-primary is not running, start it:**
   ```bash
   docker-compose up -d db-primary
   ```

3. **Wait for database to be ready (15-30 seconds):**
   ```bash
   # Check logs for "database system is ready to accept connections"
   docker-compose logs db-primary
   ```

4. **Try the script again:**
   ```bash
   npx tsx scripts/generate-sample-data.ts
   ```

#### Cause 3: Database Not Initialized

**Symptoms:**
- Database exists but `trainadmin` user doesn't exist
- Error occurs when connecting from outside Docker

**Solution:**

1. **Connect to database inside Docker to verify:**
   ```bash
   docker-compose exec db-primary psql -U trainadmin -d train_booking -c "SELECT 1;"
   ```

2. **If this works, the database is fine. If not, recreate it:**
   ```bash
   docker-compose down -v
   docker-compose up -d db-primary
   ```

   **Warning:** `-v` deletes all data!

---

## Docker Issues

### Docker Compose Command Not Found

**Symptoms:**
```
'docker-compose' is not recognized as an internal or external command
```

**Solution:**

**Newer Docker versions (Docker Desktop 4.0+):**
```bash
# Use 'docker compose' (space, not hyphen)
docker compose up -d
docker compose ps
docker compose down
```

**Older Docker versions:**
```bash
# Install docker-compose separately
# Windows/Mac: Included in Docker Desktop
# Linux:
sudo apt-get install docker-compose
```

### Containers Immediately Exit After Starting

**Symptoms:**
- `docker-compose ps` shows containers with "Exit 1" status
- Containers don't stay running

**Diagnosis:**
```bash
# Check container logs
docker-compose logs db-primary
docker-compose logs web
```

**Common Solutions:**

1. **Port already in use:**
   - See [Port Conflicts](#port-conflicts) section

2. **Volume permission issues (Linux):**
   ```bash
   sudo chown -R $USER:$USER .
   docker-compose down -v
   docker-compose up -d
   ```

3. **Corrupted volumes:**
   ```bash
   docker-compose down -v
   docker volume prune
   docker-compose up -d
   ```

### Container Shows "Unhealthy" Status

**Symptoms:**
- `docker-compose ps` shows containers as "unhealthy"

**Diagnosis:**
```bash
# Check health check logs
docker inspect train-db-primary --format='{{json .State.Health}}'
```

**Solution:**
```bash
# Restart the container
docker-compose restart db-primary

# If problem persists, recreate
docker-compose down
docker-compose up -d
```

---

## Sample Data Generation Issues

### Error: Cannot find module '/app/scripts/generate-sample-data.ts'

**Symptoms:**
- Error when running `docker-compose exec web npx tsx scripts/generate-sample-data.ts`

**Cause:**
The Docker container doesn't include source files (only the built application).

**Solution:**
Run the script from your **host machine** (not inside Docker):
```bash
# From your project directory
npx tsx scripts/generate-sample-data.ts
```

The script will connect to the database running in Docker via localhost:5432.

### Script Runs But No Data Appears

**Symptoms:**
- Script completes without errors
- Database tables are empty

**Diagnosis:**
```bash
# Check if data exists
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT COUNT(*) FROM bookings;"
```

**Solution:**

1. **Ensure you're checking the right database:**
   ```bash
   # Connect to primary database
   docker exec -it train-db-primary psql -U trainadmin -d train_booking

   # List tables
   \dt

   # Check data
   SELECT COUNT(*) FROM stations;
   SELECT COUNT(*) FROM journeys;
   SELECT COUNT(*) FROM bookings;
   ```

2. **Re-run the script with verbose output:**
   ```bash
   npx tsx scripts/generate-sample-data.ts
   ```

   Watch for any errors during execution.

---

## Port Conflicts

### Identifying Port Conflicts

**Check what's using a specific port:**

**Windows:**
```bash
netstat -ano | findstr :<PORT>

# Example for port 5432
netstat -ano | findstr :5432
```

**Mac/Linux:**
```bash
lsof -i :<PORT>

# Example for port 5432
lsof -i :5432
```

### Common Port Conflicts

#### Port 5432 (Primary Database)

**Common conflicts:**
- Local PostgreSQL installation
- Other database services

**Solutions:**

**Option 1: Stop conflicting service (recommended)**
- See [Database Connection Issues](#database-connection-issues) above

**Option 2: Change Docker port mapping**

Edit `docker-compose.yml`:
```yaml
db-primary:
  ports:
    - "5435:5432"  # Change host port to 5435
```

Then update the script `scripts/generate-sample-data.ts`:
```typescript
const db = new Pool({
  host: process.env.PRIMARY_DB_HOST || 'localhost',
  port: parseInt(process.env.PRIMARY_DB_PORT || '5435'), // Change to 5435
  database: 'train_booking',
  user: 'trainadmin',
  password: 'trainpass123',
});
```

#### Port 5173 (Web Application)

**Common conflicts:**
- Vite dev server
- Other web applications

**Solution:**

Edit `docker-compose.yml`:
```yaml
web:
  ports:
    - "5174:5173"  # Change host port to 5174
```

Access app at: http://localhost:5174

#### Port 5433 (Replica Database)

**Common conflicts:**
- Multiple PostgreSQL installations

**Solution:**

Edit `docker-compose.yml`:
```yaml
db-replica:
  ports:
    - "5435:5432"  # Change host port to 5435
```

---

## Windows-Specific Issues

### Docker Desktop Not Running

**Symptoms:**
```
error during connect: This error may indicate that the docker daemon is not running
```

**Solution:**

1. **Start Docker Desktop:**
   - Search "Docker Desktop" in Start Menu
   - Launch the application
   - Wait for it to fully start (icon in system tray turns green)

2. **Verify Docker is running:**
   ```bash
   docker version
   ```

### WSL 2 Integration Issues

**Symptoms:**
- Slow Docker performance on Windows
- Containers fail to start
- Network connectivity issues

**Solution:**

1. **Enable WSL 2 in Docker Desktop:**
   - Open Docker Desktop
   - Settings → General
   - Check "Use WSL 2 based engine"

2. **Update WSL:**
   ```powershell
   # Run as Administrator
   wsl --update
   wsl --set-default-version 2
   ```

3. **Restart Docker Desktop**

### Permission Denied Errors

**Symptoms:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution:**

**Option 1: Run as Administrator**
- Right-click PowerShell/Command Prompt
- Select "Run as Administrator"

**Option 2: Add user to docker-users group**
- Open "Computer Management"
- Local Users and Groups → Groups
- Double-click "docker-users"
- Add your user account
- Log out and log back in

### Line Ending Issues (CRLF vs LF)

**Symptoms:**
- Shell scripts fail with syntax errors
- `/bin/bash^M: bad interpreter` errors

**Solution:**

```bash
# Configure Git to handle line endings
git config --global core.autocrlf true

# Re-clone the repository or reset files
git rm --cached -r .
git reset --hard
```

---

## Performance Issues

### Slow Database Queries

**Diagnosis:**
```bash
# Check slow queries
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

**Solution:**

1. **Add indexes:**
   ```sql
   CREATE INDEX idx_bookings_email ON bookings(email);
   CREATE INDEX idx_tickets_journey ON tickets(journey);
   ```

2. **Analyze tables:**
   ```bash
   docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "ANALYZE;"
   ```

### High Memory Usage

**Symptoms:**
- Docker containers consuming excessive RAM
- System slowdown

**Solution:**

1. **Check container resource usage:**
   ```bash
   docker stats
   ```

2. **Adjust memory limits in `docker-compose.yml`:**
   ```yaml
   db-primary:
     deploy:
       resources:
         limits:
           memory: 512M  # Reduce if needed
         reservations:
           memory: 256M
   ```

3. **Restart containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Containers Running Out of Disk Space

**Diagnosis:**
```bash
# Check Docker disk usage
docker system df
```

**Solution:**

1. **Clean up unused resources:**
   ```bash
   # Remove unused containers
   docker container prune

   # Remove unused images
   docker image prune -a

   # Remove unused volumes (WARNING: deletes data!)
   docker volume prune

   # Clean everything
   docker system prune -a --volumes
   ```

2. **Check volume sizes:**
   ```bash
   docker system df -v
   ```

---

## Quick Reference

### Restart Everything (Keep Data)

```bash
docker-compose down
docker-compose up -d
```

### Full Reset (Delete All Data)

```bash
docker-compose down -v
docker volume prune
docker-compose up -d
```

### Check Service Health

```bash
# All services
docker-compose ps

# Logs for specific service
docker-compose logs -f db-primary
docker-compose logs -f web

# Last 50 lines
docker-compose logs --tail=50 db-primary
```

### Database Quick Checks

```bash
# Test connection
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "SELECT 1;"

# Count records
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "
SELECT 'bookings' as table, COUNT(*) FROM bookings
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'journeys', COUNT(*) FROM journeys;
"

# Check database size
docker exec -it train-db-primary psql -U trainadmin -d train_booking -c "
SELECT pg_size_pretty(pg_database_size('train_booking'));
"
```

---

## Still Having Issues?

If your problem isn't covered here:

1. **Check container logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Check Docker daemon logs:**
   - Windows: Docker Desktop → Settings → Troubleshoot → View logs
   - Linux: `journalctl -u docker`

3. **Try a full reset:**
   ```bash
   docker-compose down -v
   docker system prune -a --volumes
   docker-compose up -d --build
   ```

4. **Verify system requirements:**
   - Docker Desktop installed and running
   - At least 4GB available RAM
   - Ports 5432, 5433, 5434, 5173 available
   - Sufficient disk space (at least 10GB free)

5. **Check Docker version:**
   ```bash
   docker version
   docker-compose version
   ```

   Recommended: Docker 20.10+, Docker Compose 2.0+
