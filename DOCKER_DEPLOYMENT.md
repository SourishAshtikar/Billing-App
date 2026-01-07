# Docker Deployment Guide

This guide provides instructions on how to deploy the Billing Application using Docker and Docker Compose. This is the recommended method for fresh setups as it handles the database, backend, and frontend with a single command.

## Prerequisites
- **Docker** and **Docker Compose** installed on your machine.

## Quick Start (Fresh Deployment)

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Billing-App
   ```

2. **Run with Docker Compose**
   From the root directory, run:
   ```bash
   docker-compose up --build -d
   ```
   *This will:*
   - Build the PostgreSQL database and initialize schemas using `database/init.sql`.
   - Build the Backend server (Node.js/Prisma).
   - Build the Frontend client (React/Vite).
   - Start all services in the background.

3. **Verify Installation**
   - **Frontend**: Navigate to `http://localhost`.
   - **Backend Health**: Navigate to `http://localhost:3001/api/health`.

## Components Details

### 1. Database (`billing-db`)
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Data Persistence**: Volumes are mapped to `billing_db_data`.
- **Initialization**: Automatically runs `database/init.sql` on first startup.

### 2. Backend Server (`billing-server`)
- **Image**: `node:20-alpine` (Multi-stage)
- **Port**: `3001`
- **Prisma**: Migrations and client generation are handled during build.

### 3. Frontend Client (`billing-client`)
- **Image**: `nginx:stable-alpine`
- **Port**: `80`
- **Nginx Proxy**: Correctly proxies `/api/*` requests to the `billing-server` container.

## Troubleshooting

- **Database Connectivity**: If the server fails to connect to the DB, ensure the `db` service is healthy (`docker-compose ps`).
- **Logs**: View logs for a specific service using:
  ```bash
  docker-compose logs -f server
  ```
- **Rebuilding**: If you make code changes, rebuild the stack:
  ```bash
  docker-compose up --build -d
  ```

---
> [!NOTE]
> Legacy deployment files and documentation have been moved to the `archive_legacy_docker` directory.
