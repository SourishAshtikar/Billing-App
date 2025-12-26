#!/bin/bash

# Billing App Development Environment Setup Script (Linux)
# This script sets up Docker, PostgreSQL, and configures the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${CYAN}========================================${NC}"
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

print_header "Billing App Development Environment Setup"

# Step 1: Update package manager
print_info "[1/6] Updating package manager..."
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get upgrade -y
elif command -v yum &> /dev/null; then
    yum update -y
elif command -v pacman &> /dev/null; then
    pacman -Syu --noconfirm
else
    print_error "Unsupported package manager"
    exit 1
fi
print_success "Package manager updated"

# Step 2: Install Docker
print_info "[2/6] Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is already installed: $DOCKER_VERSION"
else
    print_info "Installing Docker..."
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get install -y docker.io docker-compose
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Fedora
        yum install -y docker
        # Install Docker Compose separately
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        pacman -S --noconfirm docker docker-compose
    fi
    print_success "Docker installed"
fi

# Step 3: Install PostgreSQL
print_info "[3/6] Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL is already installed: $PSQL_VERSION"
else
    print_info "Installing PostgreSQL..."
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get install -y postgresql postgresql-contrib
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Fedora
        yum install -y postgresql postgresql-server postgresql-contrib
        # Initialize database (for first time)
        postgresql-setup initdb 2>/dev/null || true
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        pacman -S --noconfirm postgresql
    fi
    print_success "PostgreSQL installed"
fi

# Step 4: Start Docker service
print_info "[4/6] Starting Docker service..."
systemctl start docker || true
systemctl enable docker || true

# Check Docker is running
if systemctl is-active --quiet docker; then
    print_success "Docker service started"
else
    print_error "Failed to start Docker service"
    print_info "Try manual start: sudo systemctl start docker"
fi

# Step 5: Start PostgreSQL service
print_info "[5/6] Starting PostgreSQL service..."
systemctl start postgresql || systemctl start postgresql || true
systemctl enable postgresql || true

# Check PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL service started"
else
    print_error "Failed to start PostgreSQL service"
    print_info "Try manual start: sudo systemctl start postgresql"
fi

# Step 6: Install Node.js and npm
print_info "[6/6] Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed: $NODE_VERSION"
else
    print_info "Installing Node.js..."
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        pacman -S --noconfirm nodejs npm
    fi
    print_success "Node.js installed"
fi

# Install npm dependencies
print_info "Installing npm dependencies for server..."
cd server || exit 1
npm install
cd ..
print_success "Server dependencies installed"

print_info "Installing npm dependencies for client..."
cd client || exit 1
npm install
cd ..
print_success "Client dependencies installed"

# Summary
print_header "Setup Complete!"
echo -e "${GREEN}All components installed successfully!${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create the PostgreSQL database:"
echo "   sudo -u postgres psql -c \"CREATE DATABASE billing_app;\""
echo ""
echo "2. (Optional) Seed initial admin data:"
echo "   cd server && node seed_admin.js && cd .."
echo ""
echo "3. Set up automated backups (optional):"
echo "   sudo ./setup-backup-cron.sh"
echo ""
echo "4. Start the development containers:"
echo "   docker-compose up --build"
echo ""
echo "Server will be available at: http://localhost:5000"
echo "Client will be available at: http://localhost:3000"
echo -e "\n${CYAN}========================================${NC}\n"
