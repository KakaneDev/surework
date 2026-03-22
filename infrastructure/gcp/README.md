# SureWork GCP Deployment

Deploy SureWork ERP Platform to Google Cloud Platform using a single Compute Engine VM with Docker Compose.

## Cost Summary: ~$30-40/month

| Component | GCP Service | Monthly Cost |
|-----------|-------------|--------------|
| Compute | Compute Engine e2-medium (2 vCPU, 4GB RAM) | $25-30 |
| Disk | 50GB SSD boot disk | $5 |
| Static IP | 1 external IP | $3 |
| **TOTAL** | | **~$33-38** |

With $300 free credits, this setup runs for ~8-9 months free.

## Quick Start

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed (`brew install google-cloud-sdk`)
- Your free trial or billing account activated

### Step 1: Deploy GCP Infrastructure

From your local machine:

```bash
cd infrastructure/gcp

# Make scripts executable
chmod +x deploy.sh vm-startup.sh

# Run deployment script
./deploy.sh
```

This creates:
- Compute Engine VM (e2-medium, Ubuntu 22.04)
- Firewall rules (HTTP, HTTPS, API port 8080)
- Static IP address

### Step 2: Setup the VM

SSH into the VM:

```bash
gcloud compute ssh surework-server --zone=europe-west1-b
```

Run the setup script:

```bash
# Clone this repo first
git clone https://github.com/inmo/surework.git
cd surework/surework/infrastructure/gcp

chmod +x vm-setup.sh
./vm-setup.sh
```

### Step 3: Start Services

```bash
cd ~/surework/surework

# Start infrastructure first
docker compose up -d postgres redis zookeeper kafka minio

# Wait for PostgreSQL to be ready
docker compose logs -f postgres
# Wait for "database system is ready to accept connections"
# Press Ctrl+C to exit logs

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Step 4: Verify Deployment

```bash
# Check API Gateway health
curl http://localhost:8080/actuator/health

# View Eureka dashboard (from browser using external IP)
# http://<YOUR-STATIC-IP>:8761
```

## File Structure

```
infrastructure/gcp/
├── deploy.sh              # Main deployment script (run locally)
├── vm-startup.sh          # VM startup script (auto-runs on VM creation)
├── vm-setup.sh            # VM setup script (run after SSH)
├── nginx/
│   ├── surework-api.conf      # API Gateway Nginx config
│   └── surework-frontend.conf # Frontend Nginx config
├── systemd/
│   └── surework.service   # Systemd service for auto-start
├── scripts/
│   ├── backup-db.sh       # Database backup script
│   ├── deploy-frontend.sh # Frontend deployment script
│   ├── health-check.sh    # Service health check
│   ├── setup-ssl.sh       # SSL certificate setup
│   └── update-deploy.sh   # Update and redeploy script
└── README.md              # This file
```

## Domain & SSL Setup

### 1. Configure DNS

Point your domain to the GCP static IP:

```
Type: A
Name: api
Value: <YOUR-STATIC-IP>
TTL: 300
```

### 2. Install Nginx Configs

```bash
# Copy configs
sudo cp infrastructure/gcp/nginx/surework-api.conf /etc/nginx/sites-available/
sudo cp infrastructure/gcp/nginx/surework-frontend.conf /etc/nginx/sites-available/

# Edit with your domain
sudo nano /etc/nginx/sites-available/surework-api.conf
# Change: server_name api.yourdomain.com;

# Enable sites
sudo ln -s /etc/nginx/sites-available/surework-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL

```bash
sudo ./infrastructure/gcp/scripts/setup-ssl.sh api.yourdomain.com
```

## Auto-Start on Boot

Enable the systemd service so SureWork starts automatically when the VM boots:

```bash
# Edit the service file to set correct path
sudo nano /etc/systemd/system/surework.service
# Update WorkingDirectory to your path

# Copy and enable
sudo cp infrastructure/gcp/systemd/surework.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable surework
sudo systemctl start surework
```

## Backup Strategy

### Manual Backup

```bash
./infrastructure/gcp/scripts/backup-db.sh
```

### Automated Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /home/$USER/surework/surework/infrastructure/gcp/scripts/backup-db.sh
```

### Cloud Storage Backups (Optional)

```bash
# Create bucket
gcloud storage buckets create gs://surework-backups-prod --location=europe-west1

# Set environment variable and run backup
export GCS_BUCKET=gs://surework-backups-prod
./backup-db.sh
```

## Useful Commands

### Service Management

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f api-gateway

# Restart a service
docker compose restart api-gateway

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Check resource usage
docker stats
```

### Health Check

```bash
./infrastructure/gcp/scripts/health-check.sh
```

### Update and Redeploy

```bash
# Update all services
./infrastructure/gcp/scripts/update-deploy.sh

# Update specific service
./infrastructure/gcp/scripts/update-deploy.sh api-gateway
```

### SSH Access

```bash
gcloud compute ssh surework-server --zone=europe-west1-b
```

## Monitoring

### Install GCP Cloud Ops Agent

```bash
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

This provides:
- CPU, memory, disk metrics in GCP Console
- Log aggregation
- Alerting capabilities

## Scaling Up

When you need more resources:

### Vertical Scaling

```bash
# Stop VM
gcloud compute instances stop surework-server --zone=europe-west1-b

# Resize to more powerful machine
gcloud compute instances set-machine-type surework-server \
  --zone=europe-west1-b \
  --machine-type=e2-standard-2  # 2 vCPU, 8GB RAM

# Start VM
gcloud compute instances start surework-server --zone=europe-west1-b
```

### Future Options

- **Managed Database**: Migrate PostgreSQL to Cloud SQL
- **Container Orchestration**: Move to GKE Autopilot
- **CDN**: Deploy frontend to Firebase Hosting

## Troubleshooting

### Services Not Starting

```bash
# Check if infrastructure is healthy
docker compose ps

# View logs for failing service
docker compose logs <service-name>

# Restart infrastructure
docker compose restart postgres redis kafka
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Consider upgrading to e2-standard-2 (8GB RAM)
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify databases exist
docker compose exec postgres psql -U surework -c "\l"
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8080

# Or restart all containers
docker compose down
docker compose up -d
```
