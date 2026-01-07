# Ubuntu VM Deployment Guide - Billing App

Complete step-by-step guide to deploy the Billing App on an Ubuntu VM with Docker.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Setup](#system-setup)
3. [Clone Repository](#clone-repository)
4. [Configuration](#configuration)
5. [Deploy with Docker](#deploy-with-docker)
6. [Database Seeding](#database-seeding)
7. [Verification](#verification)
8. [Access Application](#access-application)
9. [Useful Commands](#useful-commands)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Hardware Requirements:**
- Minimum 2GB RAM
- 10GB free disk space
- Modern Ubuntu version (20.04 LTS or later recommended)

**Internet Connection:** Required for downloading Docker images and dependencies

---

## System Setup

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Docker

```bash
# Install Docker
sudo apt install -y docker.io

# Add current user to docker group (optional, avoids sudo)
sudo usermod -aG docker $USER

# Apply group membership
newgrp docker

# Verify Docker installation
docker --version
```

### Step 3: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 4: Start Docker Service

```bash
# Start Docker daemon
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify Docker is running
sudo systemctl status docker
```

---

## Clone Repository

### Step 1: Install Git (if needed)

```bash
sudo apt install -y git
```

### Step 2: Clone the Repository

```bash
# Navigate to desired directory
cd /opt
# or
cd /home/username

# Clone repository
git clone <your-repository-url> billing-app
cd billing-app
```

Or if you have the code as a compressed file:

```bash
# Extract the archive
tar -xzf billing-app.tar.gz
cd billing-app
```

---

## Configuration

### Step 1: Create Environment Files

#### Root `.env` file

Create `.env` in the project root:

```bash
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=billinguser
POSTGRES_PASSWORD=SecurePassword123!
POSTGRES_DB=billing_db

# API Configuration
DATABASE_URL=postgresql://billinguser:SecurePassword123!@db:5432/billing_db
JWT_SECRET=your-secret-key-change-this-12345
NODE_ENV=production

# Client Configuration
CLIENT_URL=http://localhost
VITE_API_URL=/api
EOF
```

**⚠️ IMPORTANT:** Change `POSTGRES_PASSWORD`, `DATABASE_URL`, and `JWT_SECRET` to secure values!

#### Server `.env` file

Create `server/.env`:

```bash
cat > server/.env << 'EOF'
PORT=3001
DATABASE_URL=postgresql://billinguser:SecurePassword123!@db:5432/billing_db
JWT_SECRET=your-secret-key-change-this-12345
NODE_ENV=production
EOF
```

#### Client `.env` file

Create `client/.env`:

```bash
cat > client/.env << 'EOF'
VITE_API_URL=/api
EOF
```

### Step 2: Verify Configuration Files

```bash
# Check all .env files exist
ls -la .env server/.env client/.env

# Verify docker-compose.yml exists
ls -la docker-compose.yml
```

---

## Deploy with Docker

### Step 1: Build Docker Images

```bash
# Build all images (db, server, client)
docker-compose build
```

Expected output:
```
[+] Building 200.0s (... FINISHED)
 => [db internal] ...
 => [server internal] ...
 => [client internal] ...
```

### Step 2: Start Services

```bash
# Start all services in background
docker-compose up -d

# Wait 15-30 seconds for services to initialize
sleep 30

# Verify containers are running
docker-compose ps
```

Expected output:
```
NAME                   STATUS                    PORTS
billing-app-db-1       Up (healthy)              0.0.0.0:5432->5432/tcp
billing-app-server-1   Up (healthy)              0.0.0.0:3001->3001/tcp
billing-app-client-1   Up                        0.0.0.0:80->80/tcp
```

### Step 3: Check Logs for Errors

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs server    # API server logs
docker-compose logs db        # Database logs
docker-compose logs client    # Nginx logs

# Follow logs in real-time
docker-compose logs -f server
```

---

## Database Seeding

### Step 1: Seed Default Admin User

```bash
# Run the seed script
docker-compose exec server npm run prisma:seed
```

Expected output:
```
> server@1.0.0 prisma:seed
> node prisma/seed.js

{
  admin: {
    id: 'c2c5c8f5-ca43-4dcd-bd59-0af6034f22b0',
    email: 'admin@test.com',
    password: '...',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: '2025-12-28T...',
    ...
  }
}
```

### Step 2: Verify Admin User Created

```bash
# Connect to database
docker-compose exec db psql -U billinguser -d billing_db -c "SELECT id, email, name, role FROM \"User\";"
```

Expected output:
```
                  id                  |     email      |   name    | role
--------------------------------------+----------------+-----------+------
 c2c5c8f5-ca43-4dcd-bd59-0af6034f22b0 | admin@test.com | Admin User | ADMIN
(1 row)
```

---

## Verification

### Step 1: Check All Containers

```bash
# See all running containers
docker-compose ps

# Check resource usage
docker stats

# View container details
docker-compose logs --tail=50
```

### Step 2: Test API Health

```bash
# Test API health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"OK","timestamp":"2025-12-28T..."}
```

### Step 3: Test Database Connection

```bash
# Connect to database
docker-compose exec db psql -U billinguser -d billing_db

# Inside psql shell:
\dt                              # List all tables
SELECT COUNT(*) FROM "User";     # Count users
\q                               # Quit
```

### Step 4: Test Frontend

```bash
# Verify frontend is serving
curl http://localhost/ | head -20

# Expected response should contain HTML with <title>client</title>
```

---

## Access Application

### From the VM Directly

```bash
# Get the VM's IP address
hostname -I

# Example: 192.168.1.100
```

### From Another Machine

If you want to access from another computer on the network:

1. **Find VM IP:**
   ```bash
   hostname -I
   ```

2. **Access via browser:**
   - Frontend: `http://<VM_IP>`
   - API: `http://<VM_IP>:3001/api`

3. **If using SSH tunnel:**
   ```bash
   # On your local machine
   ssh -L 8080:localhost:80 username@vm_ip
   # Then access: http://localhost:8080
   ```

### Local Access on VM

- **Frontend:** http://localhost
- **API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

---

## Default Login Credentials

After seeding, use these to log in:

| Field | Value |
|-------|-------|
| **Email** | admin@test.com |
| **Password** | admin |
| **Role** | Admin |

**⚠️ IMPORTANT:** Change this password in production!

---

## Useful Commands

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data (CAREFUL!)
docker-compose down -v

# Restart specific service
docker-compose restart server

# View service status
docker-compose ps

# View logs
docker-compose logs -f <service_name>
```

### Database Operations

```bash
# Open database shell
docker-compose exec db psql -U billinguser -d billing_db

# Backup database
docker-compose exec db pg_dump -U billinguser billing_db > backup.sql

# Restore database
docker-compose exec -T db psql -U billinguser -d billing_db < backup.sql
```

### Re-seeding (if needed)

```bash
# Clear all data and reseed
docker-compose down -v
docker-compose up -d
docker-compose exec server npm run prisma:seed
```

### Rebuild Images (after code changes)

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build server
```

### Check Application Status

```bash
# View detailed logs
docker-compose logs --tail=100

# Check container health
docker-compose exec server npm run build

# Test API
curl -X GET http://localhost:3001/api/health
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :5432

# Kill the process (if needed)
sudo kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Issue: Database Connection Failed

**Error:** `connection refused` or `ECONNREFUSED`

**Solution:**
```bash
# Check if database is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Wait longer for database to start (30-60 seconds)
sleep 60
docker-compose restart server
```

### Issue: Out of Disk Space

**Error:** `no space left on device`

**Solution:**
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Remove old images
docker image prune
```

### Issue: Permission Denied

**Error:** `permission denied`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes
newgrp docker

# Or use sudo
sudo docker-compose ps
```

### Issue: Server Keeps Restarting

**Solution:**
```bash
# Check server logs
docker-compose logs server --tail=50

# Rebuild server
docker-compose up -d --build server

# Wait for startup (30 seconds)
sleep 30
docker-compose logs server
```

### Issue: Cannot Login

**Error:** "Invalid email or password"

**Solution:**
```bash
# Verify user exists in database
docker-compose exec db psql -U billinguser -d billing_db -c "SELECT email, role FROM \"User\";"

# Re-seed if needed
docker-compose exec server npm run prisma:seed

# Check server logs for errors
docker-compose logs server
```

### View Application Logs for Debugging

```bash
# All logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs -f server

# Last 100 lines
docker-compose logs --tail=100
```

---

## Performance Optimization (Optional)

### Adjust Docker Compose for Better Performance

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  db:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  server:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  client:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### Enable Docker Logging Rotation

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

---

## Backup and Restore

### Backup Everything

```bash
# Backup database
docker-compose exec db pg_dump -U billinguser billing_db > backup_$(date +%Y%m%d).sql

# Backup application data
tar -czf billing-app-backup_$(date +%Y%m%d).tar.gz ./uploads/

# Or backup entire project
tar -czf billing-app-full-backup_$(date +%Y%m%d).tar.gz ./
```

### Restore Database

```bash
# Stop services
docker-compose down

# Start only database
docker-compose up -d db

# Restore
docker-compose exec -T db psql -U billinguser -d billing_db < backup_YYYYMMDD.sql

# Start all services
docker-compose up -d
```

---

## Security Recommendations

1. **Change Default Password:**
   - Log in with admin@test.com / admin
   - Change password immediately in settings

2. **Use Strong Passwords:**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

3. **Update Environment Variables:**
   - Change `JWT_SECRET` to a random value
   - Change `POSTGRES_PASSWORD` to a strong password

4. **Enable HTTPS (Production):**
   - Use Let's Encrypt with Nginx reverse proxy
   - Configure SSL certificates

5. **Regular Backups:**
   ```bash
   # Schedule daily backups
   0 2 * * * /home/user/backup.sh
   ```

6. **Monitor Logs:**
   ```bash
   # Check logs regularly
   docker-compose logs --since 1h
   ```

7. **Update Docker Images:**
   ```bash
   # Periodically update base images
   docker-compose pull
   docker-compose up -d --build
   ```

---

## Monitoring (Optional)

### Setup Basic Monitoring

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Monitor system
htop

# Monitor Docker
docker stats

# Monitor containers
watch -n 1 'docker-compose ps'
```

### Setup Log Aggregation (Portainer)

```bash
# Install Portainer for container management
docker run -d -p 8000:8000 -p 9443:9443 \
  --name portainer \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Access at https://localhost:9443
```

---

## Scaling (Advanced)

If you need to handle more users:

1. **Increase Database Resources:**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
   ```

2. **Add Multiple Server Instances:**
   ```bash
   docker-compose up -d --scale server=3
   ```

3. **Use Load Balancer:**
   - Implement Nginx load balancing
   - Round-robin across multiple servers

---

## Support & Troubleshooting

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify containers: `docker-compose ps`
3. Test connectivity: `docker-compose exec server npm run build`
4. Review Docker status: `docker system info`
5. Check disk space: `df -h`

---

## Quick Start Summary

```bash
# 1. Prerequisites
sudo apt update && sudo apt install -y docker.io docker-compose git

# 2. Clone & Setup
cd /opt && git clone <repo> billing-app && cd billing-app

# 3. Configure
# Edit .env, server/.env, client/.env files

# 4. Deploy
docker-compose build
docker-compose up -d

# 5. Seed
docker-compose exec server npm run prisma:seed

# 6. Verify
docker-compose ps
curl http://localhost:3001/api/health

# 7. Access
# Open http://localhost in browser
# Login: admin@test.com / admin
```

---

**Last Updated:** December 28, 2025

For updates and issues, check the main README.md file.
