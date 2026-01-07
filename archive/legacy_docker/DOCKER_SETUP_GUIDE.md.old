# Docker Setup & Build Guide

## Prerequisites
- Docker installed and running
- Docker Compose installed
- Git configured

## Quick Start

### 1. Verify Environment Variables
The `.env` file at the root is already configured for Docker. Key variables:
- `DATABASE_URL=postgresql://postgres:billingappdb@db:5432/billing_db?schema=public`
- `JWT_SECRET=f6702b7eedad2b0085b91dbc40e62f58`
- `PORT=3001`

### 2. Build and Run Docker Containers

#### From Windows PowerShell:
```powershell
# Navigate to project root
cd "d:\Projects\Billing app\Final Devpl Branch\Billing-App"

# Build all images and start containers
docker compose up -d --build

# Check status
docker compose ps

# View logs for any service
docker compose logs -f server
docker compose logs -f client
docker compose logs -f db
```

#### From macOS/Linux Terminal:
```bash
cd "/path/to/Billing-App"
docker compose up -d --build
docker compose ps
```

### 3. Access the Application
- **Frontend**: http://localhost (port 80)
- **API**: http://localhost:3001 (port 3001)
- **Database**: localhost:5432

### 4. Verify Services are Running
```bash
# Check database health
docker compose exec db pg_isready -U postgres -d billing_db

# Check server health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost/
```

## Troubleshooting

### Issue: Database Connection Fails
**Symptom**: Server logs show "ECONNREFUSED" or database connection errors
**Fix**:
```bash
# Ensure db service is healthy
docker compose logs db

# Restart the database
docker compose restart db

# Wait 10 seconds and restart server
sleep 10
docker compose restart server
```

### Issue: Port Already in Use
**Windows**:
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
# Kill the process (replace PID)
Stop-Process -Id <PID> -Force
```

**macOS/Linux**:
```bash
lsof -i :3001
kill -9 <PID>
```

### Issue: Build Fails with "ENOMEM"
**Solution**: The Docker daemon may lack RAM. Increase Docker's memory allocation:
- **Windows**: Docker Desktop → Settings → Resources → Memory (increase to 4GB+)
- **Mac**: Docker Desktop → Preferences → Resources → Memory

### Issue: Migrations Fail
**Solution**:
```bash
# Clean rebuild
docker compose down -v
docker compose up -d --build

# Or manually reset migrations
docker compose exec server sh -c "npx prisma migrate reset --force"
```

## Key Fixes Applied

1. **Server Dockerfile** - Fixed Prisma generation and migrations
   - Removed hardcoded invalid DATABASE_URL
   - Uses proper `prisma migrate deploy` instead of `db push`
   - Properly sets NODE_ENV=production

2. **docker-compose.yml** - Fixed port misconfigurations
   - Server now correctly exposed on port 3001 (was 5000)
   - All services using correct internal DNS names
   - Proper health checks for database dependency

3. **.env Files** - Created proper configuration
   - Root `.env` with all shared variables
   - Server `.env` with database and JWT config
   - Client `.env` with API URL pointing to `/api`

4. **Prisma Migrations** - Added proper migration files
   - Created initial migration with correct schema
   - Schema now properly references DATABASE_URL from .env
   - All tables defined matching the Prisma schema

5. **.dockerignore Files** - Optimized Docker builds
   - Reduces build context size
   - Faster image builds
   - Prevents unnecessary files in containers

## Cleaning Up

### Stop All Services
```bash
docker compose down
```

### Remove Volumes (Clean Database)
```bash
docker compose down -v
```

### Remove Unused Images
```bash
docker image prune -a
```

### Full Clean Rebuild
```bash
docker compose down -v
docker image prune -a -f
docker compose up -d --build
```

## Environment Variables Reference

### Root `.env` & `server/.env`
| Variable | Default | Purpose |
|----------|---------|---------|
| POSTGRES_USER | postgres | Database username |
| POSTGRES_PASSWORD | billingappdb | Database password |
| POSTGRES_DB | billing_db | Database name |
| DATABASE_URL | postgresql://postgres:billingappdb@db:5432/billing_db?schema=public | Prisma connection string |
| PORT | 3001 | Server port |
| JWT_SECRET | f6702b7eedad2b0085b91dbc40e62f58 | JWT signing secret |
| CLIENT_URL | http://localhost | Frontend URL for CORS |
| NODE_ENV | production | Environment mode |

### `client/.env`
| Variable | Default | Purpose |
|----------|---------|---------|
| VITE_API_URL | /api | API endpoint (relative to frontend) |

## Production Deployment

For Oracle Cloud Always Free or other cloud deployments:

1. Update `CLIENT_URL` in `.env` to your domain/IP:
```env
CLIENT_URL=http://your-instance-ip-or-domain
```

2. Use stronger JWT_SECRET (generate a secure token):
```bash
openssl rand -base64 32
```

3. Use a stronger database password

4. Add SSL/TLS certificates (use Let's Encrypt + Nginx Proxy Manager)

5. See [DOCKER_DEPLOYMENT_ORACLE.md](./DOCKER_DEPLOYMENT_ORACLE.md) for detailed cloud deployment steps

## Docker Compose Service Architecture

```
┌─────────────────────────────────────────────────┐
│            Docker Network (default)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────────┐        │
│  │   Client     │  │     Server       │        │
│  │  (Nginx)     │──│   (Node.js +     │        │
│  │  Port: 80    │  │   Express +      │        │
│  └──────────────┘  │   Prisma)        │        │
│  http://localhost  │  Port: 3001      │        │
│                    └────────┬─────────┘        │
│                             │                  │
│                    ┌────────▼─────────┐        │
│                    │   Database       │        │
│                    │  (PostgreSQL)    │        │
│                    │  Port: 5432      │        │
│                    └──────────────────┘        │
│                    postgres_data volume        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Additional Commands

### View Real-time Logs
```bash
docker compose logs -f          # All services
docker compose logs -f server   # Just server
docker compose logs -f client   # Just client
docker compose logs -f db       # Just database
```

### Execute Commands in Containers
```bash
# Database commands
docker compose exec db psql -U postgres -d billing_db

# Server commands
docker compose exec server npm run build
docker compose exec server npx prisma studio  # Prisma data studio

# Shell access
docker compose exec server sh
docker compose exec client sh
```

### Push Database Schema Changes
```bash
docker compose exec server npx prisma migrate dev --name migration_name
docker compose exec server npx prisma db push
```

## Security Notes

- **Change JWT_SECRET** before production deployment
- **Change POSTGRES_PASSWORD** before production deployment
- Use environment-specific `.env` files for different deployments
- Never commit `.env` files with actual credentials to git
- Use `.env.example` as template for documentation
- Enable HTTPS/SSL for production
- Restrict database access to only necessary services

## Next Steps

1. Run: `docker compose up -d --build`
2. Wait 30 seconds for migrations to complete
3. Access http://localhost
4. Default credentials can be set up via admin panel
5. Upload resources and projects via CSV if needed
