# Development Environment Verification Checklist

## Pre-Setup Checklist

- [ ] Running Windows 10 or later
- [ ] Have Administrator access
- [ ] Internet connection available
- [ ] At least 10GB free disk space
- [ ] 8GB RAM minimum (16GB recommended)

## Post-Setup Checklist

### ✅ Phase 1: Installation Complete

- [ ] Docker Desktop installed and running
  - Verify: `docker --version`
  
- [ ] PostgreSQL installed and running
  - Verify: `psql --version`
  - Service running: Check Services app
  
- [ ] Node.js installed
  - Verify: `node --version`
  - NPM installed: `npm --version`

### ✅ Phase 2: Database Setup

- [ ] Database created
  - Verify: `psql -U postgres -l | grep billing_app`
  
- [ ] Connection works
  - Verify: `psql -U postgres -d billing_app`
  - Can run: `SELECT 1;` without errors

- [ ] Tables exist (if seeded)
  - Verify: `psql -U postgres -d billing_app -c "\dt"`

### ✅ Phase 3: Docker Configuration

- [ ] docker-compose.yaml exists and updated
  - Check for server and client services
  - PostgreSQL NOT in compose file

- [ ] .env file configured
  - DB_HOST=localhost
  - DB_PORT=5432
  - JWT_SECRET set
  - All required vars present

- [ ] DockerFiles updated
  - server/DockerFile uses development settings
  - client/DockerFile uses Vite dev server

### ✅ Phase 4: Services Running

- [ ] Docker containers build successfully
  ```bash
  docker-compose build
  ```
  
- [ ] Server container starts
  ```bash
  docker-compose up server
  # Should see: "Server is running on port 5000"
  ```
  
- [ ] Client container starts
  ```bash
  docker-compose up client
  # Should see Vite server message
  ```
  
- [ ] Both services run together
  ```bash
  docker-compose up
  # Containers should start and stay running
  ```

### ✅ Phase 5: Access Points

- [ ] Frontend accessible
  - URL: http://localhost:3000
  - Should load React app
  - Hot reload working (edit a file, check updates)
  
- [ ] Backend accessible
  - URL: http://localhost:5000
  - API health check: http://localhost:5000/health (if available)
  - CORS configured correctly for frontend
  
- [ ] Database connectivity
  - Server can connect to PostgreSQL
  - Check server logs: `docker-compose logs server`
  - No "database connection refused" errors

### ✅ Phase 6: Backup Configuration (Optional)

- [ ] .backup-config.json exists
  
- [ ] Database credentials correct
  - Can connect manually: `psql -U postgres -d billing_app`
  
- [ ] Email configuration set
  - SMTP server valid
  - Email credentials valid
  - Backup directory exists or can be created
  
- [ ] Test backup script
  ```bash
  .\backup-and-email.ps1
  # Should complete without errors
  ```
  
- [ ] Backup file created
  - Check ./backups/ directory
  - File size reasonable (>1MB for real data)
  
- [ ] Email received (if configured)
  - Check email for backup notification
  - Contains correct file size and timestamp

### ✅ Phase 7: Scheduled Backups (Optional)

- [ ] Task scheduled
  ```bash
  .\schedule-backup-task.ps1
  ```
  
- [ ] Task visible in Task Scheduler
  - Press Win+R, type: taskschd.msc
  - Find: BillingApp-DatabaseBackup
  - Status: Enabled
  
- [ ] Test task execution
  - Right-click task → Run
  - Verify backup created
  - Check email if configured

## Daily Development Checklist

### Morning Start

- [ ] Start Docker
  ```bash
  docker-compose up --build
  ```
  
- [ ] Check service logs
  ```bash
  docker-compose logs
  ```
  
- [ ] Verify frontend loads
  - Navigate to http://localhost:3000
  
- [ ] Verify backend responsive
  - Check API health
  - Can login/authenticate

### Before Committing Code

- [ ] Code builds without errors
  ```bash
  docker-compose up --build
  ```
  
- [ ] No console errors in browser
  - Check browser DevTools
  
- [ ] No errors in server logs
  ```bash
  docker-compose logs server
  ```
  
- [ ] Database queries working
  - Test problematic queries manually in psql

### End of Day

- [ ] Stop containers gracefully
  ```bash
  docker-compose down
  ```
  
- [ ] Commit work to git
  ```bash
  git add .
  git commit -m "Your message"
  ```

## Troubleshooting Checklist

### If Services Won't Start

- [ ] Docker Desktop is running
- [ ] Docker daemon is responsive: `docker ps`
- [ ] Ports 3000, 5000 are available
- [ ] Sufficient disk space
- [ ] Check firewall settings
- [ ] Review docker-compose syntax

### If Database Connection Fails

- [ ] PostgreSQL service running
- [ ] Database exists: `psql -U postgres -l`
- [ ] Correct credentials in .env
- [ ] Correct DB_HOST (should be `localhost` not `db`)
- [ ] PostgreSQL listening on 5432
- [ ] No firewall blocking local connections

### If Hot Reload Not Working

- [ ] Volume mounts correct in docker-compose.yaml
- [ ] File changes in correct directory
- [ ] Wait 1-2 seconds for detection
- [ ] Check file permissions
- [ ] Restart container: `docker-compose restart`

### If Backup Script Fails

- [ ] pg_dump is accessible: `where pg_dump`
- [ ] PostgreSQL service running
- [ ] Credentials correct in .backup-config.json
- [ ] Backup directory writable
- [ ] Email credentials valid (test with `.\backup-and-email.ps1`)
- [ ] SMTP firewall/port open

## Performance Checklist

- [ ] Containers use reasonable memory
  ```bash
  docker stats
  ```
  
- [ ] No excessive disk usage
  - Check ./backups/ size
  - Docker images not too large
  
- [ ] Build time reasonable (<5 minutes)
- [ ] Hot reload responsive (<2 seconds)
- [ ] No memory leaks in running containers

## Security Checklist

- [ ] JWT_SECRET changed from default
- [ ] Database passwords not hardcoded
- [ ] .env file not in git
- [ ] Backup files encrypted (if sensitive)
- [ ] Email credentials use app-specific passwords
- [ ] Container registries private (if using custom images)

## Documentation Checklist

- [ ] SETUP.md read and understood
- [ ] QUICKSTART.md bookmarked for quick reference
- [ ] ARCHITECTURE.md reviewed for system overview
- [ ] All scripts tested before using in automation
- [ ] Team aware of backup schedule

## Final Verification

Run this command sequence to verify everything:

```powershell
# Check all installations
docker --version
psql --version
node --version
npm --version

# Verify Docker running
docker ps

# Verify database exists
psql -U postgres -l | grep billing_app

# Build and start everything
docker-compose up --build

# In another terminal, check status
docker-compose ps

# Verify access
Invoke-WebRequest http://localhost:3000 -UseBasicParsing
Invoke-WebRequest http://localhost:5000 -UseBasicParsing
```

## Sign-Off

- [ ] All checks passed
- [ ] Environment ready for development
- [ ] Team notified of setup completion
- [ ] Backups running (if configured)
- [ ] Documentation reviewed

---

**Status**: ⚠️ **In Progress** / ✅ **Complete**

Date Completed: ______________
By: ______________
Notes: _______________________________________________________________

