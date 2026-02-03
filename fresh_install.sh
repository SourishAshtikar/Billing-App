#!/bin/bash

# fresh_install.sh
# Usage: ./fresh_install.sh

echo "======================================================="
echo "       Billing App - Fresh Database Installation       "
echo "======================================================="
echo "WARNING: This will stop all containers and PERMANENTLY "
echo "DELETE the database volume. All current data will be lost."
echo "The database will be restored from the backup file."
echo "======================================================="
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

echo ""
echo "[1/4] Stopping containers and removing volumes..."
# This only removes volumes associated with THIS docker-compose project (defaults to directory name)
docker compose down -v

echo ""
echo "[2/4] Rebuilding Docker images..."
# Ensure we are building with the updated Dockerfile (Postgres 18)
docker compose build --no-cache db

echo ""
echo "[3/4] Starting services..."
docker compose up -d

echo ""
echo "[4/4] Verifying database status..."
echo "Waiting for database to initialize (this may take a few seconds)..."
sleep 10
docker compose logs db

echo ""
echo "======================================================="
echo "       Installation Complete                           "
echo "======================================================="
echo "If you see 'database system is ready to accept connections'"
echo "and 'seed_data.sql', then the restore was successful."
