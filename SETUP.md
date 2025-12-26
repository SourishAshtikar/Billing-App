# Billing App Development Environment Setup Guide

## Overview

This guide will help you set up the Billing App for local development on Linux. The setup includes:
- **Docker** for containerizing the server and client
- **PostgreSQL** running locally (not in Docker)
- **Automated weekly backups** with email notifications

## Prerequisites

- Linux (Ubuntu, Debian, CentOS, Fedora, or Arch)
- Root/sudo privileges
- Internet connection for initial setup

## Quick Start

### 1. Run the Setup Script

Open a terminal and run:

```bash
cd ~/path/to/Billing-App
sudo chmod +x setup-dev-environment.sh
sudo ./setup-dev-environment.sh
```

This script will automatically:
- Detect your Linux distribution (Debian/Ubuntu, RHEL/CentOS, or Arch)
- Update the package manager
- Install Docker
- Install PostgreSQL
- Start both services
- Install Node.js dependencies for server and client

### 2. Create the Database

After the setup script completes:

```bash
# Connect to PostgreSQL and create the database
sudo -u postgres psql -c "CREATE DATABASE billing_app;"
```

### 3. (Optional) Seed Initial Data

If you want to populate the database with initial admin user:

```bash
cd server
node seed_admin.js
cd ..
```

### 4. Start the Development Containers

```bash
docker-compose up --build
```

This will start:
- **Server**: Available at `http://localhost:5000`
- **Client**: Available at `http://localhost:3000`

## Configuration

### Environment Variables (.env file)

The `.env` file contains configuration for:

```env
DB_HOST=localhost          # PostgreSQL host
DB_PORT=5432             # PostgreSQL port
DB_USER=postgres         # PostgreSQL username
DB_PASSWORD=postgres     # PostgreSQL password
DB_NAME=billing_app      # Database name
DB_DIALECT=postgres      # Database dialect
NODE_ENV=development     # Environment mode
JWT_SECRET=your_jwt_secret_key_change_me  # JWT secret key
```

**Important**: Change `JWT_SECRET` to a secure value in production.

## Automated Backups and Email Notifications

### Setup Steps

1. **Configure Backup Settings**

   Edit `.backup-config.json`:

   ```json
   {
     "database": {
       "user": "postgres",
       "password": "postgres",
       "name": "billing_app",
       "host": "localhost",
       "port": 5432
     },
     "backup": {
       "directory": "./backups",
       "retentionDays": 30
     },
     "email": {
       "from": "your-email@gmail.com",
       "password": "your-app-specific-password",
       "to": "admin@billingapp.com",
       "smtpServer": "smtp.gmail.com",
       "smtpPort": 587
     }
   }
   ```

   **Email Configuration Tips:**
   - For Gmail, use an [App-Specific Password](https://support.google.com/accounts/answer/185833)
   - Other providers may need different SMTP settings
   - For Linux, you can use `sendmail` or `mailutils` instead of SMTP

2. **Install Mail Utility (Optional but recommended)**

   For automatic email notifications:

   ```bash
   # Debian/Ubuntu
   sudo apt-get install mailutils

   # CentOS/RHEL
   sudo yum install postfix

   # Arch
   sudo pacman -S postfix
   ```

3. **Make Backup Script Executable**

   ```bash
   sudo chmod +x backup-and-email.sh
   ```

4. **Test the Backup Script**

   ```bash
   sudo ./backup-and-email.sh
   ```

5. **Schedule Weekly Backups with Cron**

   Run the cron setup script:

   ```bash
   sudo chmod +x setup-backup-cron.sh
   sudo ./setup-backup-cron.sh
   ```

   **Options:**
   ```bash
   # Schedule for Monday at 3:00 AM
   sudo ./setup-backup-cron.sh --day 1 --time 03:00
   
   # Schedule for Friday at 5:00 PM
   sudo ./setup-backup-cron.sh --day 5 --time 17:00
   ```

   **Day numbers:** 0=Sunday, 1=Monday, 2=Tuesday, etc.

6. **Verify the Scheduled Task**

   ```bash
   # List all cron jobs
   crontab -l
   
   # Should show the backup script scheduled
   ```

## Docker Compose Configuration

The `docker-compose.yaml` file defines two services:

### Server Container
- **Built from**: `./server/DockerFile`
- **Port**: 5000 → Docker 5000
- **Environment**: Connected to local PostgreSQL via `host.docker.internal`
- **Volumes**: Mounted for live development

### Client Container
- **Built from**: `./client/DockerFile`
- **Port**: 3000 → Docker 5173 (Vite dev server)
- **Environment**: Points to local server API
- **Volumes**: Mounted for live development

Both services use a custom bridge network for inter-service communication.

## Troubleshooting

### Docker won't start
- Ensure Docker is installed: `docker --version`
- Start Docker service: `sudo systemctl start docker`
- Enable on boot: `sudo systemctl enable docker`

### PostgreSQL connection failed
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable on boot
sudo systemctl enable postgresql
```

### Database doesn't exist
```bash
sudo -u postgres psql -c "CREATE DATABASE billing_app;"
sudo -u postgres psql -d billing_app -c "\d"  # List tables
```

### Backup script fails
```bash
# Test backup script manually
sudo ./backup-and-email.sh

# Check PostgreSQL is installed
which pg_dump

# Check backup directory permissions
ls -la ./backups
```

### Port already in use
If port 5000 or 3000 is already in use, modify `docker-compose.yaml`:
```yaml
ports:
  - "5001:5000"  # Change first number to available port
```

## Common Commands

### Start development environment
```bash
docker-compose up
```

### Stop containers
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f server
docker-compose logs -f client
```

### Rebuild containers
```bash
docker-compose up --build
```

### Stop specific service
```bash
docker-compose stop server
```

### Remove everything (clean slate)
```bash
docker-compose down -v
```

## PostgreSQL Management

### Connect to database
```bash
sudo -u postgres psql -d billing_app
```

### Backup manually
```bash
pg_dump -U postgres -d billing_app -F c > backup.sql
```

### Restore from backup
```bash
pg_restore -U postgres -d billing_app backup.sql
```

## Production Deployment

For production, consider:
1. Use strong passwords and secure JWT secrets
2. Change `.env` settings appropriately
3. Enable SSL for database connections
4. Implement rate limiting and authentication
5. Use environment-specific Dockerfiles
6. Store credentials securely (not in version control)

## File Structure

```
Billing-App/
├── docker-compose.yaml              # Container orchestration
├── .env                             # Environment variables
├── .backup-config.json              # Backup configuration
├── setup-dev-environment.ps1        # Initial setup script
├── backup-and-email.ps1             # Backup script
├── schedule-backup-task.ps1         # Task scheduler script
├── server/                          # Node.js backend
│   ├── DockerFile
│   ├── package.json
│   └── src/
└── client/                          # React frontend
    ├── DockerFile
    ├── package.json
    └── src/
```

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all prerequisites are installed
3. Review Docker and PostgreSQL logs
4. Ensure ports 5000 and 3000 are available

## Additional Resources

- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Guide](https://nodejs.org/en/docs/)
- [React Documentation](https://react.dev/)
