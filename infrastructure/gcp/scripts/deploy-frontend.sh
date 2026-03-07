#!/bin/bash
# SureWork Frontend Deployment Script
# Builds and deploys the Angular frontend to Nginx
#
# Usage: ./deploy-frontend.sh

set -e

# Configuration
FRONTEND_DIR="${FRONTEND_DIR:-$HOME/surework/surework/frontend/angular-app}"
NGINX_DIR="/var/www/surework"

echo "=========================================="
echo "  SureWork Frontend Deployment"
echo "  $(date)"
echo "=========================================="

# Check if running as root for nginx directory
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./deploy-frontend.sh"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR"

echo "[1/5] Installing dependencies..."
npm ci

echo "[2/5] Building production bundle..."
npm run build -- --configuration=production

echo "[3/5] Preparing deployment directory..."
mkdir -p "$NGINX_DIR"
rm -rf "${NGINX_DIR:?}"/*

echo "[4/5] Copying build artifacts..."
# Angular 17+ outputs to dist/angular-app/browser
if [ -d "dist/angular-app/browser" ]; then
    cp -r dist/angular-app/browser/* "$NGINX_DIR/"
elif [ -d "dist/angular-app" ]; then
    cp -r dist/angular-app/* "$NGINX_DIR/"
else
    echo "ERROR: Build output not found"
    exit 1
fi

# Set proper permissions
chown -R www-data:www-data "$NGINX_DIR"
chmod -R 755 "$NGINX_DIR"

echo "[5/5] Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "=========================================="
echo "  Frontend Deployment Complete"
echo "  Location: $NGINX_DIR"
echo "=========================================="
