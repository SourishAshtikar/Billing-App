# 🔧 Quick Troubleshooting Guide

## Common Issues & Instant Fixes

### 🔴 Docker Issues

#### "Docker daemon is not running"
```powershell
# Fix 1: Start Docker Desktop manually
Start-Process "$env:ProgramFiles\Docker\Docker\Docker.exe"

# Wait 30 seconds, then verify
docker ps
```

#### "Port 5000 or 3000 already in use"
```powershell
# Find what's using the port
Get-Process | Where-Object {$_.Handles -like '*5000*'}

# Option 1: Kill the process
Stop-Process -Name <ProcessName> -Force

# Option 2: Change port in docker-compose.yaml
# Change: "5000:5000" to "5001:5000"
# Then restart: docker-compose up
```

#### "Docker containers exit immediately"
```powershell
# Check logs for errors
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up --build

# Check specific service
docker-compose logs server
docker-compose logs client
```

---

### 🔴 PostgreSQL Issues

#### "psql command not found"
```powershell
# Add PostgreSQL to PATH
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"

# Or reinstall from: https://www.postgresql.org/download/windows/

# Verify installation
psql --version
```

#### "Cannot connect to database"
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql* | Select-Object Name, Status

# Start PostgreSQL service
Start-Service -Name postgresql-x64-16

# Test connection
psql -U postgres

# If still failing, check .env
# DB_HOST must be: localhost (not 'db' or '127.0.0.1')
```

#### "Database 'billing_app' does not exist"
```powershell
# Create the database
psql -U postgres -c "CREATE DATABASE billing_app;"

# Verify it was created
psql -U postgres -l | findstr billing_app

# Or with SQL command
psql -U postgres -d postgres -c "\l"
```

#### "Permission denied for user postgres"
```powershell
# Check password in .env file
# Default: postgres

# Reset password (Windows PowerShell as Admin)
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Update .env if you changed password
notepad .env
```

---

### 🔴 Network/Connection Issues

#### "Cannot reach http://localhost:3000"
```powershell
# Check if client container is running
docker ps | findstr client

# Check client logs
docker-compose logs client

# Verify Vite is serving
# Should see: "Local: http://localhost:5173"

# If port 5173 is in use, change docker-compose.yaml:
# "3000:5173" to "3000:5174"
```

#### "Cannot reach http://localhost:5000"
```powershell
# Check if server container is running
docker ps | findstr server

# Check server logs
docker-compose logs server

# Look for: "Server is running on port 5000"

# Test directly
curl http://localhost:5000 -v

# Check firewall
netstat -an | findstr 5000
```

#### "Frontend cannot reach backend API"
```powershell
# Check .env VITE_API_URL
cat .env | findstr VITE

# Should be: VITE_API_URL=http://localhost:5000

# Check docker-compose.yaml environment
# Client container should have this environment variable

# Test API from frontend container
docker-compose exec client wget http://server:5000

# Check CORS settings in server code
```

---

### 🔴 NPM/Node Issues

#### "npm command not found"
```powershell
# Check Node.js installation
node --version

# If not found, install from: https://nodejs.org/

# After installation, restart terminal and verify
npm --version
```

#### "node_modules issues / Missing dependencies"
```powershell
# Clean install
rm -r node_modules
npm cache clean --force
npm install

# For Docker containers
docker-compose down -v
docker-compose up --build
```

#### "Port 3000 conflict with npm"
```powershell
# Change port in docker-compose.yaml
# From: "3000:5173"
# To:   "3001:5173"

# Then access at http://localhost:3001
```

---

### 🔴 Hot Reload Not Working

#### "Changes not reflecting in browser"
```powershell
# Option 1: Restart container
docker-compose restart client

# Option 2: Check volume mounts
# In docker-compose.yaml, verify:
# - ./client:/app
# - ./server:/app

# Option 3: Check file save
# Make sure files are saved
# Wait 1-2 seconds for detection

# Option 4: Hard refresh browser
# Ctrl+Shift+R (clears cache)
```

#### "Volumes not mounted correctly"
```powershell
# Verify current mounts
docker inspect <container_id> | findstr Mounts

# Full path example
# "./client:/app" (from Billing-App directory)

# Check from correct directory
cd "d:\Projects\Billing app\New-UI-Branch\Billing-App"
docker-compose up
```

---

### 🔴 Backup Issues

#### "Backup script fails to run"
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql* | Select-Object Status

# Start PostgreSQL
Start-Service -Name postgresql-x64-16

# Verify pg_dump exists
where pg_dump

# If not found, add to PATH
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"

# Test backup manually
.\backup-and-email.ps1 -ConfigPath ".\.backup-config.json"
```

#### "Email notification not sent"
```powershell
# Check .backup-config.json
# Verify SMTP settings:
# - smtpServer: smtp.gmail.com (for Gmail)
# - smtpPort: 587 (usually)
# - from: valid email address
# - password: app-specific password (for Gmail)

# For Gmail:
# 1. Enable 2-Factor Authentication
# 2. Generate App-Specific Password
# 3. Use that password in .backup-config.json

# Test with
.\backup-and-email.ps1
```

#### "Backup file not created"
```powershell
# Check permissions on ./backups directory
Test-Path ./backups

# Create directory if needed
New-Item -ItemType Directory -Path ./backups -Force

# Check disk space
Get-Volume C: | Select-Object SizeRemaining

# Run backup with error output
.\backup-and-email.ps1 -ErrorAction Stop
```

#### "Scheduled task not running"
```powershell
# Check if task exists
Get-ScheduledTask -TaskName "BillingApp-DatabaseBackup" -ErrorAction SilentlyContinue

# View task details
Get-ScheduledTask -TaskName "BillingApp-DatabaseBackup" | Select-Object *

# Run task manually
Start-ScheduledTask -TaskName "BillingApp-DatabaseBackup"

# View task history
Get-ScheduledTaskInfo -TaskName "BillingApp-DatabaseBackup"

# Re-create task if needed
.\schedule-backup-task.ps1
```

---

### 🔴 Build/Compilation Issues

#### "Docker build fails"
```powershell
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check logs for specific errors
docker-compose build 2>&1 | tail -20

# Build specific service
docker-compose build --no-cache server
```

#### "Package.json conflicts"
```powershell
# Check both package.json files exist
Test-Path ".\server\package.json"
Test-Path ".\client\package.json"

# Check version compatibility
cat .\server\package.json | findstr version
cat .\client\package.json | findstr version
```

---

### 🔴 Permission Issues

#### "Permission denied" errors
```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → Run as Administrator

# Or use this to elevate:
Start-Process powershell -Verb RunAs -ArgumentList "cd '$PWD'; & '.\setup-dev-environment.ps1'"
```

#### "Docker permission issues"
```powershell
# Add user to docker-users group (Windows)
# Control Panel → User Accounts → Manage User Accounts
# → Properties → Member Of → Add docker-users

# Restart computer for changes to take effect
```

---

### 🔴 Performance Issues

#### "Containers using too much memory"
```powershell
# Check Docker stats
docker stats

# Stop unused containers
docker-compose down

# Reduce Node memory usage
# In docker-compose.yaml, add:
# environment:
#   NODE_OPTIONS: --max-old-space-size=512
```

#### "Slow build times"
```powershell
# Use --no-cache only when necessary
docker-compose build --no-cache

# Check disk space
Get-Volume C: | Select-Object SizeRemaining

# Check internet speed
# May be slow npm install due to network
```

---

## 🆘 Still Having Issues?

### Debug Checklist

1. **Check Status**
   ```powershell
   docker ps                           # Running containers
   docker images                       # Downloaded images
   docker-compose logs                 # All logs
   docker-compose logs -f server       # Specific service
   ```

2. **Network Check**
   ```powershell
   # Test connectivity
   docker-compose exec server ping localhost
   docker-compose exec client ping server
   
   # Test port availability
   netstat -an | findstr LISTEN
   ```

3. **File Check**
   ```powershell
   # Verify file structure
   Test-Path docker-compose.yaml
   Test-Path .env
   Test-Path ./server/DockerFile
   Test-Path ./client/DockerFile
   
   # Check file contents
   cat docker-compose.yaml | head -20
   cat .env
   ```

4. **Service Check**
   ```powershell
   # Verify services
   Get-Service -Name postgresql* | Select-Object Name, Status
   Get-Process Docker
   docker ps
   ```

### Getting Help

1. Review relevant documentation
   - [SETUP.md](SETUP.md#troubleshooting)
   - [QUICKSTART.md](QUICKSTART.md#troubleshooting)

2. Check error messages
   - Read full error text
   - Google error message
   - Check logs: `docker-compose logs`

3. Try clean start
   ```powershell
   docker-compose down -v
   docker system prune -a
   docker-compose up --build
   ```

4. Escalate if needed
   - Document error messages
   - Share docker-compose logs
   - Share .env contents (redact passwords)

---

## 📞 Quick Command Cheat Sheet

```powershell
# 🔍 DIAGNOSTICS
docker ps                              # Running containers
docker ps -a                           # All containers
docker images                          # Downloaded images
docker-compose logs                    # View all logs
docker-compose logs -f service_name    # Live logs
docker stats                           # Resource usage
docker inspect <container_id>          # Container details

# 🚀 LIFECYCLE
docker-compose up                      # Start services
docker-compose up -d                   # Start in background
docker-compose down                    # Stop services
docker-compose down -v                 # Stop and remove volumes
docker-compose restart                 # Restart services
docker-compose restart service_name    # Restart specific service

# 🏗️ BUILD
docker-compose build                   # Build images
docker-compose build --no-cache        # Build without cache
docker system prune                    # Clean up
docker system prune -a                 # Clean everything

# 🔧 EXECUTE
docker-compose exec service_name cmd   # Run command in container
docker-compose exec server npm test    # Run tests
docker-compose exec client npm lint    # Run linter
```

---

**Last Updated**: December 26, 2025
**Version**: 1.0
