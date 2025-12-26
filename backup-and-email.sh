#!/bin/bash

# Billing App Database Backup and Email Script (Linux)
# Schedule this script to run weekly using cron

set -e

# Source directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration file
CONFIG_FILE="${SCRIPT_DIR}/.backup-config.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file not found: $CONFIG_FILE"
    print_info "Please create .backup-config.json with database and email settings."
    exit 1
fi

# Extract configuration from JSON
DB_USER=$(grep -o '"user": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
DB_PASSWORD=$(grep -o '"password": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
DB_NAME=$(grep -o '"name": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
DB_HOST=$(grep -o '"host": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
DB_PORT=$(grep -o '"port": [0-9]*' "$CONFIG_FILE" | cut -d' ' -f2)

BACKUP_DIR=$(grep -o '"directory": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
RETENTION_DAYS=$(grep -o '"retentionDays": [0-9]*' "$CONFIG_FILE" | cut -d' ' -f2)

EMAIL_FROM=$(grep -o '"from": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
EMAIL_TO=$(grep -o '"to": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
SMTP_SERVER=$(grep -o '"smtpServer": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
SMTP_PORT=$(grep -o '"smtpPort": [0-9]*' "$CONFIG_FILE" | cut -d' ' -f2)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${DB_NAME}_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

print_header "Database Backup and Email Script"
print_info "Backup started at: $(date)"

# Step 1: Backup the database using pg_dump
print_info "[1/3] Creating database backup..."
export PGPASSWORD="$DB_PASSWORD"

if pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -F c -b -v "$DB_NAME" > "$BACKUP_PATH" 2>&1; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    print_success "Backup created successfully: $BACKUP_FILE"
    print_info "  File size: $BACKUP_SIZE"
else
    print_error "Failed to create backup"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

# Step 2: Delete old backups
print_info "[2/3] Cleaning up old backups (retention: $RETENTION_DAYS days)..."
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d 2>/dev/null || \
              date -v-${RETENTION_DAYS}d +%Y-%m-%d 2>/dev/null || \
              date +%Y-%m-%d)

find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql" -type f | while read -r old_backup; do
    OLD_DATE=$(basename "$old_backup" | sed "s/${DB_NAME}_backup_\(.*\)\.sql/\1/" | cut -d_ -f1)
    if [[ "$OLD_DATE" < "$CUTOFF_DATE" ]]; then
        rm -f "$old_backup"
        print_info "  Deleted: $(basename "$old_backup")"
    fi
done
print_success "Old backups cleaned up"

# Step 3: Send email notification
print_info "[3/3] Sending email notification..."

# Check if mail command exists
if command -v mail &> /dev/null || command -v sendmail &> /dev/null; then
    EMAIL_BODY="Database Backup Report

Database Name: $DB_NAME
Backup Date & Time: $(date '+%Y-%m-%d %H:%M:%S')
Backup File: $BACKUP_FILE
File Size: $BACKUP_SIZE
Backup Location: $BACKUP_PATH
Status: Backup completed successfully

This is an automated backup notification. Do not reply to this email."

    if command -v mail &> /dev/null; then
        echo "$EMAIL_BODY" | mail -s "Billing App Database Backup - $TIMESTAMP" "$EMAIL_TO"
        print_success "Email sent successfully to: $EMAIL_TO"
    elif command -v sendmail &> /dev/null; then
        {
            echo "To: $EMAIL_TO"
            echo "Subject: Billing App Database Backup - $TIMESTAMP"
            echo "From: $EMAIL_FROM"
            echo ""
            echo "$EMAIL_BODY"
        } | sendmail "$EMAIL_TO"
        print_success "Email sent successfully to: $EMAIL_TO"
    fi
else
    print_info "Warning: Mail utility not installed. Skipping email notification."
    print_info "Install 'mailutils' (Debian/Ubuntu) or 'postfix' for email support."
fi

# Summary
print_header "Backup Process Complete"
print_info "Backup completed at: $(date)"
print_info "Backup Summary:"
echo "  Database: $DB_NAME"
echo "  File: $BACKUP_FILE"
echo "  Size: $BACKUP_SIZE"
echo "  Location: $BACKUP_PATH"
echo ""
