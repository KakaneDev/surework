#!/bin/bash
# SureWork VM Startup Script
# This script runs automatically when the VM is created
# It installs Docker, Docker Compose, and other dependencies

set -e

# Log all output
exec > >(tee /var/log/surework-startup.log) 2>&1

echo "=========================================="
echo "  SureWork VM Setup Starting"
echo "  $(date)"
echo "=========================================="

# Update system
echo "[1/6] Updating system packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Add default user to docker group
echo "[3/6] Configuring Docker permissions..."
# Get the first non-root user (usually the GCP-created user)
DEFAULT_USER=$(getent passwd 1000 | cut -d: -f1 || echo "")
if [ -n "$DEFAULT_USER" ]; then
    usermod -aG docker "$DEFAULT_USER"
fi

# Install Docker Compose v2
echo "[4/6] Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# Install additional tools
echo "[5/6] Installing additional tools..."
apt-get install -y \
    git \
    curl \
    wget \
    htop \
    vim \
    nginx \
    certbot \
    python3-certbot-nginx \
    openjdk-21-jdk \
    maven

# Enable Docker to start on boot
echo "[6/6] Enabling services..."
systemctl enable docker
systemctl start docker

# Verify installations
echo ""
echo "=========================================="
echo "  Installation Complete"
echo "=========================================="
echo ""
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Java version: $(java --version | head -n1)"
echo "Maven version: $(mvn --version | head -n1)"
echo ""
echo "VM is ready for SureWork deployment!"
echo "=========================================="
