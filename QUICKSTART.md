# Billing App - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Setup Script (5 minutes)
```bash
# Open terminal and navigate to project directory
cd ~/path/to/Billing-App
sudo chmod +x setup-dev-environment.sh
sudo ./setup-dev-environment.sh
```

### Step 2: Create Database (30 seconds)
```bash
sudo -u postgres psql -c "CREATE DATABASE billing_app;"
```

### Step 3: Start Development Environment (1 minute)
```bash
docker-compose up --build
```

## 🎯 Access Points

| Component | URL | Notes |
|-----------|-----|-------|
| Frontend (React) | http://localhost:3000 | Hot reload enabled |
| Backend API | http://localhost:5000 | RESTful API |
| PostgreSQL | localhost:5432 | Local installation |

## 📦 What Gets Installed

✅ Docker Desktop  
✅ PostgreSQL (local)  
✅ Node.js & npm  
✅ Project dependencies  

## 🔐 Setup Automated Backups (Optional)

1. **Edit Configuration** (2 minutes)
   ```powershell
   # Edit .backup-config.json with your email settings
   notepad .backup-config.json
   ```

2. **Schedule Weekly Backups** (1 minute)
   ```powershell
   # Run as Administrator
   .\schedule-backup-task.ps1
   ```

3. **Test Backup Script**
   ```powershell
   .\backup-and-email.ps1
   ```

## 🚀 Daily Development Commands

```bash
# Start everything
docker-compose up

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild containers
docker-compose up --build
```

## 🐘 PostgreSQL Common Commands

```bash
# Connect to database
sudo -u postgres psql -d billing_app

# List tables
sudo -u postgres psql -d billing_app -c "\dt"

# Create backup
pg_dump -U postgres -d billing_app -F c > backup.sql

# Restore backup
pg_restore -U postgres -d billing_app backup.sql
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker won't start | Enable Hyper-V in Windows, restart Docker |
| Port 3000/5000 in use | Change port in `docker-compose.yaml` |
| Database not found | Run: `psql -U postgres -c "CREATE DATABASE billing_app;"` |
| PostgreSQL not found | Run setup script again or install from [postgresql.org](https://www.postgresql.org/) |

## 📋 Environment Variables

Update `.env` file for configuration:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=billing_app
JWT_SECRET=change-me-in-production
```

## 📚 Full Documentation

See [SETUP.md](SETUP.md) for detailed setup and configuration guide.

## ✨ Key Features

- **Docker Containers** for server and client
- **PostgreSQL** installed locally (not in Docker)
- **Hot Reload** enabled for development
- **Automated Backups** with email notifications
- **Weekly Scheduling** via Windows Task Scheduler

---

**Need Help?** Refer to [SETUP.md](SETUP.md) for complete troubleshooting and advanced configuration.
