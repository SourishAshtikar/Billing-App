#!/bin/bash

# Billing App Database Backup Cron Job Setup (Linux)
# Schedule this script to set up weekly backups using cron

set -e

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
    echo -e "${CYAN}========================================${NC}\n"
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script requires root privileges. Please run with sudo:"
   echo "sudo $0"
   exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-and-email.sh"
CONFIG_FILE="${SCRIPT_DIR}/.backup-config.json"

# Default values
DAY_OF_WEEK="0"  # 0 = Sunday
TIME="02:00"     # 2:00 AM

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --day)
            DAY_OF_WEEK="$2"
            shift 2
            ;;
        --time)
            TIME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--day DAY_OF_WEEK] [--time TIME]"
            echo "  --day:  Day of week (0=Sunday, 1=Monday, etc.) Default: 0 (Sunday)"
            echo "  --time: Time in HH:MM format. Default: 02:00"
            exit 1
            ;;
    esac
done

print_header "Backup Cron Job Setup"

# Validate inputs
if ! [[ "$DAY_OF_WEEK" =~ ^[0-6]$ ]]; then
    print_error "Invalid day of week. Use 0-6 (0=Sunday, 1=Monday, etc.)"
    exit 1
fi

if ! [[ "$TIME" =~ ^[0-2][0-9]:[0-5][0-9]$ ]]; then
    print_error "Invalid time format. Use HH:MM (e.g., 02:00)"
    exit 1
fi

# Check if files exist
if [ ! -f "$BACKUP_SCRIPT" ]; then
    print_error "Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file not found: $CONFIG_FILE"
    print_info "Please configure .backup-config.json first."
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
print_success "Backup script is executable"

# Convert time to cron format
HOUR=$(echo "$TIME" | cut -d: -f1 | sed 's/^0//')
MINUTE=$(echo "$TIME" | cut -d: -f2 | sed 's/^0//')

# Create cron job
CRON_JOB="$MINUTE $HOUR * * $DAY_OF_WEEK $BACKUP_SCRIPT"

print_info "Creating cron job..."
print_info "Schedule: Every week on day $DAY_OF_WEEK at $TIME"
print_info "Command: $CRON_JOB"

# Check if cron job already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" || true)

if [ -n "$EXISTING_CRON" ]; then
    print_info "Existing cron job found. Removing it..."
    (crontab -l 2>/dev/null | grep -v -F "$BACKUP_SCRIPT"; true) | crontab -
    print_success "Old cron job removed"
fi

# Add new cron job
(crontab -l 2>/dev/null || true; echo "$CRON_JOB") | crontab -

print_success "Cron job created successfully"

# Verify cron job was created
if crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" > /dev/null; then
    print_success "Cron job verified"
else
    print_error "Failed to verify cron job"
    exit 1
fi

# Display summary
print_header "Setup Complete!"

echo -e "${YELLOW}Cron Job Details:${NC}"
echo "  Script: $BACKUP_SCRIPT"
echo "  Schedule: Every week on day $DAY_OF_WEEK at $TIME"
echo "  Config: $CONFIG_FILE"
echo ""

# Show day of week
case $DAY_OF_WEEK in
    0) DAY_NAME="Sunday" ;;
    1) DAY_NAME="Monday" ;;
    2) DAY_NAME="Tuesday" ;;
    3) DAY_NAME="Wednesday" ;;
    4) DAY_NAME="Thursday" ;;
    5) DAY_NAME="Friday" ;;
    6) DAY_NAME="Saturday" ;;
esac

echo -e "${YELLOW}When it runs:${NC}"
echo "  $DAY_NAME at $TIME"
echo ""

echo -e "${YELLOW}To view all cron jobs:${NC}"
echo "  crontab -l"
echo ""

echo -e "${YELLOW}To test the backup script:${NC}"
echo "  $BACKUP_SCRIPT"
echo ""

echo -e "${YELLOW}To modify the schedule:${NC}"
echo "  sudo $0 --day 1 --time 03:00  (Monday at 3:00 AM)"
echo ""

echo -e "${YELLOW}Before first run, make sure to:${NC}"
echo "  1. Edit .backup-config.json with your email credentials"
echo "  2. Test the backup script: sudo $BACKUP_SCRIPT"
echo "  3. Verify email notifications are working"
echo ""

echo -e "${CYAN}========================================${NC}"
