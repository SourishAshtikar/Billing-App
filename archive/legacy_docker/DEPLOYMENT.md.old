# Deployment Guide

This guide explains how to deploy the Billing Application to a new machine.

## Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Git

## Installation

1. **Clone the Codebase**
   ```bash
   git clone <repository-url>
   cd Billing-App
   ```

2. **Server Setup**
   ```bash
   cd server
   npm install
   ```

   - Create a `.env` file in the `server` directory with your configuration:
     ```env
     PORT=5000
     DATABASE_URL="postgresql://user:password@localhost:5432/billing_db?schema=public"
     JWT_SECRET="your_secret_key"
     CLIENT_URL="http://localhost:5173"
     ```

3. **Database Patch / Setup**
   The application uses Prisma Migrations to manage the database schema.
   
   Run the following command to apply all migrations (this acts as the "database patch"):
   ```bash
   npx prisma migrate deploy
   ```
   
   This will create all tables and apply changes found in `prisma/migrations`.

   **Initial Data (Seeding)**
   To create the default Admin user (`admin@test.com` / `admin`):
   ```bash
   npm run seed
   ```

4. **Client Setup**
   ```bash
   cd ../client
   npm install
   ```

   - Create a `.env` file in the `client` directory:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

## Running the Application

- **Server**: `cd server && npm run dev` (or `npm start` for production)
- **Client**: `cd client && npm run dev` (or `npm run build && npm run preview`)

## Troubleshooting
- If `npx prisma migrate deploy` fails, ensure your `DATABASE_URL` is correct and the database server is running.
