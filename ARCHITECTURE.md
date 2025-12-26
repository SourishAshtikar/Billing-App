# Development Environment Architecture & Setup

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT ENVIRONMENT                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              Your Windows Machine
                    ┌─────────────────────────────────────┐
                    │                                     │
        ┌───────────┴───────────┐              ┌─────────┴──────────┐
        │   Docker Desktop      │              │   PostgreSQL       │
        │   (Engine)            │              │   (Local)          │
        │                       │              │                    │
        ├───────────────────────┤              ├────────────────────┤
        │ ┌─────────────────┐   │              │ Port: 5432         │
        │ │ Server          │   │              │ User: postgres     │
        │ │ Container       │   │              │ Database: billing_ │
        │ ├─────────────────┤   │              │          app       │
        │ │ Port: 5000      │   │              │ Auto-start: ✓      │
        │ │ Node.js + Exp   │   │              └────────────────────┘
        │ │ Hot Reload: ✓   │   │
        │ │ Volume Mounts   │   │   ┌───────────────────────────┐
        │ └────────┬────────┘   │   │  Weekly Backup Process    │
        │          │            │   ├───────────────────────────┤
        │ ┌────────▼────────┐   │   │ ✓ pg_dump to SQL          │
        │ │ Client          │   │   │ ✓ Old backups cleanup     │
        │ │ Container       │   │   │ ✓ Email notification      │
        │ ├─────────────────┤   │   │ ✓ Windows Task Scheduled  │
        │ │ Port: 3000      │   │   └───────────────────────────┘
        │ │ Vite Dev Server │   │
        │ │ Hot Reload: ✓   │   │
        │ │ Volume Mounts   │   │
        │ └─────────────────┘   │
        │                       │
        └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Browser (Local Dev)                                 │
│                                                                              │
│  Frontend: http://localhost:3000  ←→  Backend: http://localhost:5000        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Setup Process Flow

```
START
  ↓
┌─────────────────────────────────────────┐
│ Run setup-dev-environment.ps1           │
├─────────────────────────────────────────┤
│ 1. Check Administrator Privileges       │
│ 2. Install Docker Desktop               │
│ 3. Install PostgreSQL                   │
│ 4. Start PostgreSQL Service             │
│ 5. Install Node.js (if needed)          │
│ 6. Install npm dependencies             │
│ 7. Start Docker Desktop                 │
└────────────────┬────────────────────────┘
                 ↓
        [Setup Complete]
                 ↓
┌─────────────────────────────────────────┐
│ Create Database                         │
│ psql -U postgres -c \                   │
│   "CREATE DATABASE billing_app;"        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ (Optional) Seed Admin User              │
│ cd server && node seed_admin.js         │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Start Development Environment           │
│ docker-compose up --build               │
└────────────────┬────────────────────────┘
                 ↓
        [Ready for Development]
```

## Backup & Email Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Backup Execution (Weekly)                      │
└──────────────────────────────────────────────────────────────────┘

Windows Task Scheduler
  ↓
[BillingApp-DatabaseBackup Task Triggered]
  ↓
backup-and-email.ps1 Starts
  ↓
┌──────────────────────────────────────────┐
│ Step 1: Create Backup                    │
│ ├─ pg_dump → SQL file                   │
│ ├─ Compress to .sql format              │
│ └─ Store in ./backups/                  │
└─────────────┬────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ Step 2: Cleanup Old Backups              │
│ ├─ Find files older than 30 days        │
│ ├─ Delete old backup files              │
│ └─ Free up disk space                   │
└─────────────┬────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ Step 3: Send Email Notification         │
│ ├─ Connect to SMTP server               │
│ ├─ Format HTML email with details       │
│ ├─ Include file size & location         │
│ └─ Send to configured email address     │
└─────────────┬────────────────────────────┘
              ↓
        [Backup Complete]
```

## File Organization

```
Billing-App/
│
├── 📋 Configuration Files
│   ├── docker-compose.yaml         [Container orchestration]
│   ├── .env                        [Environment variables]
│   └── .backup-config.json         [Backup settings]
│
├── 🚀 Setup & Execution Scripts
│   ├── setup-dev-environment.ps1   [Main setup (PowerShell)]
│   ├── setup-dev-environment.bat   [Setup launcher (Batch)]
│   ├── backup-and-email.ps1        [Weekly backup script]
│   └── schedule-backup-task.ps1    [Task scheduler setup]
│
├── 📚 Documentation
│   ├── SETUP.md                    [Complete setup guide]
│   ├── QUICKSTART.md               [Quick reference]
│   ├── DEVELOPMENT_SETUP.md        [Setup summary]
│   └── README.md                   [Original README]
│
├── 🔧 Backend (server/)
│   ├── DockerFile                  [Updated for development]
│   ├── package.json
│   ├── index.js
│   └── src/
│
└── 🎨 Frontend (client/)
    ├── DockerFile                  [Updated for development]
    ├── package.json
    ├── vite.config.js
    └── src/
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT ENVIRONMENT                         │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND LAYER
├── React 19                    [UI Framework]
├── Vite                        [Dev Server & Build Tool]
├── Material-UI                 [Component Library]
├── React Router                [Navigation]
└── Axios                       [HTTP Client]

DOCKER LAYER
├── Docker Desktop              [Container Platform]
├── Docker Compose              [Multi-container Orchestration]
└── Alpine Linux                [Lightweight base image]

BACKEND LAYER
├── Node.js 20                  [Runtime]
├── Express.js                  [Web Framework]
├── Sequelize                   [ORM]
├── JWT                         [Authentication]
└── Multer                      [File Upload]

DATABASE LAYER
├── PostgreSQL 16               [Database]
├── pg_dump                     [Backup Tool]
└── psql                        [CLI Client]

AUTOMATION
├── Windows Task Scheduler      [Scheduling]
├── PowerShell                  [Scripting]
└── Email (SMTP)               [Notifications]
```

## Setup Commands Quick Reference

```powershell
# ========== INITIAL SETUP ==========
.\setup-dev-environment.ps1              # Full setup (recommended)
# OR
.\setup-dev-environment.bat              # Click to run (Windows)

# ========== DATABASE ==========
psql -U postgres -c "CREATE DATABASE billing_app;"

# ========== DOCKER OPERATIONS ==========
docker-compose up                        # Start containers
docker-compose up --build                # Start with rebuild
docker-compose down                      # Stop containers
docker-compose logs -f                   # View logs
docker ps                                # List running containers

# ========== DEVELOPMENT ==========
docker-compose exec server npm test      # Run server tests
docker-compose exec client npm lint      # Run client linter

# ========== BACKUP & EMAIL ==========
.\backup-and-email.ps1                  # Test backup script
.\schedule-backup-task.ps1              # Schedule weekly backups

# ========== DATABASE BACKUP (Manual) ==========
pg_dump -U postgres -d billing_app -F c > backup.sql
pg_restore -U postgres -d billing_app backup.sql
```

## Port Mappings

```
┌─────────────────────────────────────┐
│        PORT CONFIGURATION           │
├─────────────────────────────────────┤
│ Service      │ Local  │ Container   │
├──────────────┼────────┼─────────────┤
│ PostgreSQL   │ 5432   │ 5432        │
│ Server (API) │ 5000   │ 5000        │
│ Client (UI)  │ 3000   │ 5173        │
└─────────────────────────────────────┘

Note: Container ports can be changed in docker-compose.yaml
```

## Development Workflow

```
Day-to-Day Development
│
├─ Code Changes
│  └─ Automatic hot reload in containers
│
├─ Database Changes
│  └─ Run migrations/seed scripts manually
│
├─ Testing
│  └─ Run npm test in appropriate container
│
└─ Commit & Push
   └─ Git version control


Weekly Tasks
│
├─ Database Backup (Automated)
│  ├─ Runs on configured day & time
│  ├─ Cleanup old backups
│  └─ Send email notification
│
└─ Code Review
   └─ Before deploying to production
```

## Troubleshooting Flowchart

```
Problem Occurs?
│
├─→ Docker won't start
│   └─ Enable Hyper-V, restart Docker Desktop
│
├─→ Port already in use
│   └─ Change port in docker-compose.yaml
│
├─→ Database connection failed
│   └─ Verify PostgreSQL running: Get-Service postgresql*
│       └─ Start: Start-Service -Name postgresql-x64-16
│
├─→ Node modules issue
│   └─ Delete node_modules, run npm install
│
├─→ Backup fails
│   └─ Check .backup-config.json credentials
│       └─ Verify pg_dump accessible: where pg_dump
│
└─→ Still not working?
    └─ Check SETUP.md troubleshooting section
        └─ Or review detailed documentation
```

---

**For more information, see:**
- [SETUP.md](SETUP.md) - Complete setup guide
- [QUICKSTART.md](QUICKSTART.md) - Quick reference
- [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) - Setup summary
