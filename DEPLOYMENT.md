# TTLO Portal — Production Deployment & Administration Guide

This guide provides step-by-step instructions for deploying, updating, managing, and backing up the **TTLO Portal** on a fresh Ubuntu Server (22.04 LTS / 24.04 LTS) using Docker and Docker Compose.

---

## 1. System Requirements & Prerequisites

### Recommended Server Specifications
* **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS (64-bit AMD64 or ARM64)
* **CPU**: 2 vCPUs minimum (4 vCPUs recommended for high concurrency)
* **RAM**: 4 GB minimum (8 GB recommended)
* **Storage**: 40 GB SSD / NVMe minimum (for OS, Docker containers, database, and uploads)
* **Network**: Static IPv4 address with ports `80` (HTTP) and `443` (HTTPS) open in firewall.

---

## 2. Server Initial Setup & Docker Installation

Run the following commands on a fresh Ubuntu Server:

```bash
# Update system package index
sudo apt update && sudo apt upgrade -y

# Install prerequisite tools
sudo apt install -y ca-certificates curl gnupg lsb-release git unzip

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Application Setup & Deployment

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/thesis-ttlo.git
cd thesis-ttlo
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
nano .env
```

Set all production credentials in `.env`:
- `DATABASE_URL`: `postgres://ttlo_admin:<YOUR_STRONG_PASSWORD>@db:5432/ttlo_db`
- `POSTGRES_PASSWORD`: `<YOUR_STRONG_PASSWORD>`
- `AUTH_SECRET`: Secret generated via `openssl rand -hex 32`
- `NEXTAUTH_SECRET`: Same secret key as `AUTH_SECRET`
- `NEXTAUTH_URL`: `https://ttlo.yourdomain.com`
- `AUTH_GOOGLE_ID`: Your Google OAuth Client ID
- `AUTH_GOOGLE_SECRET`: Your Google OAuth Client Secret
- `ALLOWED_DOMAINS`: Allowed institutional domains (e.g. `dlsu.edu.ph,carsu.edu.ph`)
- `ADMIN_EMAILS`: Admin user emails

### Step 3: Make Scripts Executable & Deploy
```bash
chmod +x deploy.sh update.sh backup.sh restore.sh
./deploy.sh
```

---

## 4. SSL Certificate Setup (Let's Encrypt & Certbot)

To secure your installation with free HTTPS certificates via Let's Encrypt:

```bash
# 1. Install Certbot
sudo apt install -y certbot

# 2. Obtain Certificate via Standalone ACME challenge
sudo systemctl stop nginx || docker compose stop nginx
sudo certbot certonly --standalone -d ttlo.yourdomain.com

# 3. Update Nginx configuration
# Open nginx/nginx.conf and uncomment the HTTPS server block (port 443)
# Replace 'ttlo.yourdomain.com' with your actual domain.

# 4. Restart Nginx service
docker compose restart nginx
```

---

## 5. Maintenance & Management Commands

### Single-Command Zero-Downtime Update
To pull git updates, apply database migrations, and reload containers:
```bash
./update.sh
```

### Viewing Real-Time Logs
```bash
# View all container logs
docker compose logs -f

# View web application logs only
docker compose logs -f web

# View database logs only
docker compose logs -f db
```

### Checking Container Health Status
```bash
docker compose ps
```

---

## 6. Backup & Disaster Recovery

### Creating a Manual Backup
Run the backup script to archive the PostgreSQL database and user uploads:
```bash
./backup.sh
```
Backups are saved to `./backups/` as `db_backup_TIMESTAMP.sql.gz` and `uploads_backup_TIMESTAMP.tar.gz`.

### Setting Up Automated Daily Backups (Cron)
Add a cron job to run backups daily at 2:00 AM:
```bash
crontab -e
```
Add the following line:
```cron
0 2 * * * cd /path/to/thesis-ttlo && ./backup.sh >> /var/log/ttlo-backup.log 2>&1
```

### Restoring a Backup
To restore database state from a backup archive:
```bash
./restore.sh ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz ./backups/uploads_backup_YYYYMMDD_HHMMSS.tar.gz
```

---

## 7. Troubleshooting Guide

| Issue / Symptom | Possible Cause | Solution |
| :--- | :--- | :--- |
| **`Database connection failed`** | PostgreSQL container is starting or credentials mismatch. | Check `docker compose logs db` and verify `POSTGRES_PASSWORD` matches `DATABASE_URL` in `.env`. |
| **Google OAuth `redirect_uri_mismatch`** | NextAuth URL does not match Google Cloud Console settings. | Ensure `NEXTAUTH_URL=https://ttlo.yourdomain.com` and add `https://ttlo.yourdomain.com/api/auth/callback/google` in Google Cloud Console. |
| **Upload file size error (`413 Payload Too Large`)** | Nginx default body size limit reached. | Verify `client_max_body_size 100M;` is present in `nginx/nginx.conf`. |
| **Container unhealthy on `/api/health`** | Web process unable to query database. | Verify `db` container is healthy (`docker compose ps`) and run `curl http://localhost:3000/api/health`. |
| **Permission denied on uploads directory** | Mount volume permissions misconfigured. | Run `docker exec -it ttlo_web chown -R nextjs:nodejs /app/public/uploads`. |
