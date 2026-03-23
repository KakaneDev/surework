# SureWork ERP - VM Deployment Guide

Step-by-step instructions for deploying the full SureWork ERP platform on a Linux VM.

## Prerequisites

- **VM:** Ubuntu 22.04 LTS, 4 vCPU, 16GB RAM, 50GB SSD minimum
- **Network:** SSH access, ports 80/443/22 open
- **Domain (optional):** DNS A records pointing to the VM's IP for SSL
- **Source code:** This repository cloned to the VM

---

## Phase 1: VM Setup

### 1.1 System Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  docker.io docker-compose-plugin \
  nginx certbot python3-certbot-nginx \
  openjdk-21-jdk maven \
  curl git jq unzip
```

### 1.2 Docker Permissions

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 1.3 Configure Swap (critical for 16GB RAM)

```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 1.4 Install Node.js 20 (for frontend builds)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Phase 2: Environment Configuration

### 2.1 Create Production Environment File

```bash
cd /path/to/surework
cp .env.example .env.production
```

Edit `.env.production` with secure values:

```env
# Database
POSTGRES_USER=surework
POSTGRES_PASSWORD=<GENERATE_SECURE_32_CHAR_PASSWORD>

# JWT - MUST be at least 64 characters for HS512
JWT_SECRET=<GENERATE_SECURE_64_CHAR_SECRET>

# MinIO S3 Storage
MINIO_ROOT_USER=surework
MINIO_ROOT_PASSWORD=<GENERATE_SECURE_32_CHAR_PASSWORD>
S3_ACCESS_KEY=surework
S3_SECRET_KEY=<SAME_AS_MINIO_ROOT_PASSWORD>

# SMTP (for real emails, not MailHog)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<your-email@gmail.com>
MAIL_PASSWORD=<your-app-password>

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

Generate secrets:
```bash
openssl rand -base64 48  # For passwords
openssl rand -base64 64  # For JWT_SECRET
```

---

## Phase 3: Build Everything

### 3.1 Build Java Services

```bash
cd /path/to/surework

# Build all Maven modules (libs + services)
mvn clean package -DskipTests -q

# Verify JARs exist
ls services/*/target/*.jar
```

Expected output: 16 JAR files, one per service.

### 3.2 Build Frontend (Angular)

```bash
cd frontend
npm ci
npx ng build --configuration=production
cd ..
```

Output: `frontend/dist/surework/`

### 3.3 Build Frontend Admin

```bash
cd frontend-admin
npm ci
npx ng build --configuration=production
cd ..
```

Output: `frontend-admin/dist/frontend-admin/browser/`

### 3.4 Build Docker Images

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml build
```

This builds all 16 microservice images + frontend-admin image.

---

## Phase 4: Database Initialization

### 4.1 Start PostgreSQL First

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d postgres
sleep 10
```

### 4.2 Create Databases

The init script at `infrastructure/postgres/init/01-create-databases.sql` runs automatically on first start. Verify:

```bash
docker exec surework-postgres psql -U surework -c "\l" | grep surework
```

Expected: 14 databases (surework_admin, surework_identity, surework_tenant, etc.)

---

## Phase 5: Start Services (Ordered)

Services must start in dependency order. The production compose file handles this via `depends_on`, but for manual control:

### 5.1 Infrastructure Layer

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d \
  postgres redis zookeeper

sleep 15

docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d kafka
sleep 20
```

### 5.2 Service Discovery

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d eureka-server
sleep 30  # Wait for Eureka to be ready
```

Verify: `curl -s http://localhost:8761/actuator/health | jq .status`
Expected: `"UP"`

### 5.3 All Microservices + Gateway

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d
```

### 5.4 Verify All Services

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | sort
```

All containers should show `Up` status. Allow 2-3 minutes for all services to register with Eureka.

Health check:
```bash
# API Gateway
curl -s http://localhost:8080/actuator/health | jq .status

# Admin Service
curl -s http://localhost:8088/actuator/health | jq .status

# Identity Service
curl -s http://localhost:8085/actuator/health | jq .status
```

---

## Phase 6: Nginx Reverse Proxy

### 6.1 Configure Nginx

```bash
sudo cp infrastructure/gcp-deploy/nginx/surework.conf /etc/nginx/sites-available/surework
sudo ln -sf /etc/nginx/sites-available/surework /etc/nginx/sites-enabled/surework
sudo rm -f /etc/nginx/sites-enabled/default
```

### 6.2 Deploy Frontend Static Files

```bash
sudo mkdir -p /opt/surework/frontend/dist
sudo cp -r frontend/dist/surework/browser/* /opt/surework/frontend/dist/

# Also copy the landing page
sudo cp -r frontend/src/landing /opt/surework/frontend/dist/landing
```

### 6.3 Update Nginx Config

Edit `/etc/nginx/sites-available/surework` and set:
- `server_name` to your domain or VM IP
- `root` path to `/opt/surework/frontend/dist`
- Upstream to `127.0.0.1:8080` (API gateway)

Key location blocks:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    root /opt/surework/frontend/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Landing page
    location /landing {
        alias /opt/surework/frontend/dist/landing;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Admin API proxy
    location /admin-api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.4 Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 7: SSL/TLS (Optional but Recommended)

### 7.1 Setup Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 7.2 Enable Auto-Renewal

```bash
sudo systemctl enable certbot.timer
sudo certbot renew --dry-run  # Test
```

---

## Phase 8: Verification

### 8.1 End-to-End Test

1. Open `http://YOUR_VM_IP/` in browser - should show landing page
2. Click "Start Free Trial" - should show signup form
3. Fill form, submit - should show verification page
4. Check MailHog at `http://YOUR_VM_IP:8025` for verification code (dev only)
5. Enter code - should redirect to dashboard with full admin sidebar
6. Log out and log back in - should work

### 8.2 Service Health Dashboard

```bash
# Quick health check all services
for port in 8080 8085 8081 8088 8082 8083 8084 8090; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health)
  echo "Port $port: $status"
done
```

### 8.3 Database Verification

```bash
docker exec surework-postgres psql -U surework -d surework_admin \
  -c "SELECT count(*) FROM roles;"
# Expected: 10 (system roles)
```

---

## Phase 9: Production Hardening

### 9.1 Remove Development Services

For production, remove or don't start:
- **MailHog** (use real SMTP instead)
- **MinIO Console** (close port 9001)

### 9.2 Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to backend ports
# Only nginx (port 80/443) should be exposed
```

### 9.3 Environment Variables to Change

| Variable | Development Value | Production Value |
|----------|------------------|------------------|
| POSTGRES_PASSWORD | surework | Generated 32+ chars |
| JWT_SECRET | surework-jwt-secret-... | Generated 64+ chars |
| MINIO_ROOT_PASSWORD | surework123 | Generated 32+ chars |
| SPRING_PROFILES_ACTIVE | docker | prod |
| SPRING_JPA_HIBERNATE_DDL_AUTO | update | validate |
| MAIL_HOST | mailhog | smtp.gmail.com |

---

## Troubleshooting

### Service Won't Start

```bash
docker logs surework-<service> --tail 50
```

Common issues:
- **Database connection refused:** PostgreSQL not ready. Wait and retry.
- **Eureka connection failed:** Eureka not registered yet. Services retry automatically.
- **JWT signature mismatch:** Ensure all services use the same `JWT_SECRET`.

### Out of Memory

```bash
free -h
docker stats --no-stream
```

If memory is tight:
- Reduce Java heap: `-Xmx128m` per service
- Stop non-essential services (analytics, billing, reporting)
- Add more swap

### Database Issues

```bash
# Connect to a specific database
docker exec -it surework-postgres psql -U surework -d surework_admin

# Check table counts
docker exec surework-postgres psql -U surework -d surework_admin \
  -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public';"
```

### Restart Everything

```bash
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml down
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d
```

---

## Update Deployment

After code changes:

```bash
cd /path/to/surework
git pull

# Rebuild changed services
mvn clean package -DskipTests -q

# Rebuild Docker images
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml build --no-cache <service-name>

# Restart changed services
docker compose -f infrastructure/gcp-deploy/docker-compose.prod.yml up -d --force-recreate <service-name>

# If frontend changed
cd frontend && npx ng build --configuration=production && cd ..
sudo cp -r frontend/dist/surework/browser/* /opt/surework/frontend/dist/
```

---

## Architecture Summary

```
Internet → Nginx (80/443)
              ├── / → Angular SPA (static files)
              ├── /landing → Landing page (static HTML)
              ├── /api/* → API Gateway (8080)
              │     ├── /api/v1/signup → Tenant Service (8081)
              │     ├── /api/admin/* → Admin Service (8088)
              │     ├── /api/v1/auth/* → Identity Service (8085)
              │     ├── /api/v1/employees/* → Employee Service (8071)
              │     ├── /api/v1/leave/* → Leave Service (8082)
              │     ├── /api/v1/payroll/* → Payroll Service (8083)
              │     └── ... (14 more microservices)
              └── /admin-api/* → API Gateway → Admin Service

Infrastructure:
  PostgreSQL (14 databases) ← All services
  Redis ← Identity, Notification (caching, rate limits)
  Kafka ← Event bus (all services)
  MinIO ← Document storage
  Eureka ← Service discovery
```
