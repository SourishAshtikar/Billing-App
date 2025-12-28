# Oracle Cloud Always Free Deployment Guide (VM.Standard.E2.1.Micro)

This guide provides step-by-step instructions to host the Billing App on an Oracle Cloud "Always Free" instance using Docker.

## 1. Oracle Cloud Instance Preparation

### Create the VM
1. Log in to Oracle Cloud Console.
2. Go to **Compute -> Instances -> Create Instance**.
3. **Image**: Select `Ubuntu 22.04` or `Oracle Linux 8`.
4. **Shape**: Select `VM.Standard.E2.1.Micro` (Always Free Eligible).
5. **SSH Keys**: Download your private key or paste your public key.
6. **Create**.

### Network Configuration (Ingress Rules)
1. Go to your Instance Details page.
2. Click on the **Subnet** link.
3. Click on the **Default Security List**.
4. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80, 443`
   - **Description**: Allow HTTP and HTTPS traffic.

---

## 2. Server Setup (Via SSH)

SSH into your instance:
```bash
ssh -i <your-key>.key ubuntu@<your-instance-ip>
```

### Update and Install Core Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
```

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Create Swap Space (CRITICAL)
The `E2.1.Micro` only has 1GB of RAM. Building the app will likely fail without swap.
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Application Deployment

### Clone the Repository
```bash
git clone <your-repo-url>
cd Billing-App
```

### Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=billing_db

# Server configuration
JWT_SECRET=your_jwt_secret_here
PORT=3001
CLIENT_URL=http://<your-instance-ip>

# Database URL for Prisma (must match the services above)
DATABASE_URL=postgresql://postgres:your_strong_password@db:5432/billing_db?schema=public
```

Update your `docker-compose.yml` to use these environment variables if needed, or simply ensure they are passed to the services.

### Build and Run
```bash
docker compose up -d --build
```

---

## 4. Open OS Firewall Ports
Oracle instances often have a secondary OS-level firewall.

**For Ubuntu:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**For Oracle Linux / RHEL:**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

## 5. Verification
Wait a few minutes for the build to finish and the database to initialize.
Access your app via: `http://<your-instance-ip>`

---

## 6. (Optional) Setup SSL with Let's Encrypt
If you have a domain, you can use Nginx Proxy Manager or Certbot to secure your connection.
Since the current `client/Dockerfile` uses Nginx, you can easily point your domain A-record to the instance IP.
