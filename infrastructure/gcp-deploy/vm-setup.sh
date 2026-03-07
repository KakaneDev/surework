#!/bin/bash
# =============================================================================
# SureWork ERP - VM Setup Script
# Run this ONCE on a fresh Ubuntu 22.04 GCE VM to install all dependencies
# Usage: sudo bash vm-setup.sh
# =============================================================================

set -euo pipefail

echo "============================================"
echo "  SureWork ERP - VM Setup"
echo "  Ubuntu 22.04 LTS | GCE e2-standard-4"
echo "============================================"

# --- Update system ---
echo "[1/7] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# --- Install essential tools ---
echo "[2/7] Installing essential tools..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    make \
    unzip \
    htop \
    jq

# --- Install Docker ---
echo "[3/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully."
else
    echo "Docker already installed."
fi

# --- Add current user to docker group ---
echo "[4/7] Configuring Docker permissions..."
SUDO_USER_NAME="${SUDO_USER:-$(whoami)}"
if [ "$SUDO_USER_NAME" != "root" ]; then
    usermod -aG docker "$SUDO_USER_NAME"
    echo "Added $SUDO_USER_NAME to docker group."
fi

# --- Install Nginx ---
echo "[5/7] Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    echo "Nginx installed successfully."
else
    echo "Nginx already installed."
fi

# --- Configure swap (important for 19 microservices on 16GB RAM) ---
echo "[6/7] Configuring swap space (8GB)..."
if [ ! -f /swapfile ]; then
    fallocate -l 8G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Optimize swap usage
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    sysctl vm.vfs_cache_pressure=50
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    echo "Swap configured: 8GB"
else
    echo "Swap already configured."
fi

# --- Install Java 17 (needed for building Spring Boot services) ---
echo "[7/7] Installing Java 17 and Maven..."
if ! command -v java &> /dev/null; then
    apt-get install -y openjdk-17-jdk-headless
    echo "Java 17 installed."
else
    echo "Java already installed."
fi

if ! command -v mvn &> /dev/null; then
    apt-get install -y maven
    echo "Maven installed."
else
    echo "Maven already installed."
fi

# --- Install Node.js 20 (needed for building Angular frontends) ---
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "Node.js 20 installed."
else
    echo "Node.js already installed."
fi

# --- Create app directory ---
mkdir -p /opt/surework
chown -R "${SUDO_USER_NAME}:${SUDO_USER_NAME}" /opt/surework

# --- Configure firewall (UFW) ---
echo "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo ""
echo "============================================"
echo "  VM Setup Complete!"
echo "============================================"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo "  Java: $(java -version 2>&1 | head -1)"
echo "  Maven: $(mvn -version 2>&1 | head -1)"
echo "  Node.js: $(node --version)"
echo "  Swap: $(swapon --show)"
echo ""
echo "  Next step: Run deploy.sh to deploy the application"
echo "============================================"
