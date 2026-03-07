# SureWork ERP - GCP Deployment Guide

## VM Details
- **Project:** surework-staging
- **VM Name:** surework-vm
- **External IP:** 136.116.141.75
- **Zone:** us-central1-a
- **Machine:** e2-standard-4 (4 vCPU, 16 GB RAM, 50 GB SSD)
- **OS:** Ubuntu 22.04 LTS
- **Monthly Cost:** ~$103/month

## Quick Start (3 Steps)

### Step 1: Push Code to VM
From your LOCAL machine (where you have the repo):

```bash
# Option A: Use gcloud SCP to push the entire project
gcloud compute scp --recurse ./surework surework-vm:/opt/surework \
    --zone=us-central1-a --project=surework-staging

# Option B: SSH into VM and clone from Git
gcloud compute ssh surework-vm --zone=us-central1-a --project=surework-staging
# Then on the VM:
cd /opt && git clone <your-repo-url> surework
```

### Step 2: Setup the VM (run once)
```bash
gcloud compute ssh surework-vm --zone=us-central1-a --project=surework-staging

# On the VM:
cd /opt/surework/infrastructure/gcp-deploy
sudo bash vm-setup.sh
```

### Step 3: Deploy
```bash
# Still on the VM:
cd /opt/surework/infrastructure/gcp-deploy
bash deploy.sh
```

## After Deployment

| Endpoint | URL |
|----------|-----|
| Frontend | http://136.116.141.75/ |
| Admin | http://136.116.141.75/admin |
| API Health | http://136.116.141.75/health |
| Eureka Dashboard | http://136.116.141.75:8761 |

## Useful Commands

```bash
# Check all container status
cd /opt/surework/infrastructure/gcp-deploy
docker compose -f docker-compose.prod.yml ps

# View logs for a specific service
docker compose -f docker-compose.prod.yml logs -f api-gateway

# Restart a service
docker compose -f docker-compose.prod.yml restart employee-service

# Run health check
bash scripts/health-check.sh

# Stop everything
docker compose -f docker-compose.prod.yml down

# Update deployment (after code changes)
git pull
bash deploy.sh

# Update without rebuilding (just restart containers)
bash deploy.sh --skip-build --skip-frontend
```

## Troubleshooting

**Service won't start?**
```bash
docker compose -f docker-compose.prod.yml logs <service-name>
```

**Out of memory?**
```bash
free -h                           # Check memory
docker stats --no-stream          # Check per-container memory
```

**Database issues?**
```bash
docker exec -it surework-postgres psql -U surework -l  # List databases
```

**Stop VM to save costs:**
```bash
# From local machine
gcloud compute instances stop surework-vm --zone=us-central1-a --project=surework-staging

# Start it again
gcloud compute instances start surework-vm --zone=us-central1-a --project=surework-staging
```
