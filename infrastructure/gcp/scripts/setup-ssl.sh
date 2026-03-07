#!/bin/bash
# SureWork SSL Setup Script
# Configures Let's Encrypt SSL certificates for API and frontend domains
#
# Prerequisites:
# - Domain DNS must point to this server's IP
# - Nginx must be installed and configured
#
# Usage: sudo ./setup-ssl.sh api.yourdomain.com app.yourdomain.com

set -e

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

if [ $# -lt 1 ]; then
    echo "Usage: $0 <api-domain> [frontend-domain]"
    echo "Example: $0 api.surework.co.za app.surework.co.za"
    exit 1
fi

API_DOMAIN="$1"
FRONTEND_DOMAIN="${2:-}"

echo "=========================================="
echo "  SureWork SSL Setup"
echo "=========================================="
echo ""
echo "API Domain: $API_DOMAIN"
[ -n "$FRONTEND_DOMAIN" ] && echo "Frontend Domain: $FRONTEND_DOMAIN"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Update Nginx configs with actual domains
echo "[1/3] Updating Nginx configuration..."

# Update API config
if [ -f "/etc/nginx/sites-available/surework-api" ]; then
    sed -i "s/server_name .*/server_name ${API_DOMAIN};/" /etc/nginx/sites-available/surework-api
fi

# Update frontend config
if [ -n "$FRONTEND_DOMAIN" ] && [ -f "/etc/nginx/sites-available/surework-frontend" ]; then
    sed -i "s/server_name .*/server_name ${FRONTEND_DOMAIN};/" /etc/nginx/sites-available/surework-frontend
fi

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

echo "[2/3] Obtaining SSL certificates..."

# Get certificate for API domain
echo "Getting certificate for $API_DOMAIN..."
certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email

# Get certificate for frontend domain if provided
if [ -n "$FRONTEND_DOMAIN" ]; then
    echo "Getting certificate for $FRONTEND_DOMAIN..."
    certbot --nginx -d "$FRONTEND_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
fi

echo "[3/3] Setting up auto-renewal..."
# Certbot auto-renewal is configured automatically via systemd timer

# Verify timer is enabled
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=========================================="
echo "  SSL Setup Complete"
echo "=========================================="
echo ""
echo "Your sites are now available at:"
echo "  https://${API_DOMAIN}"
[ -n "$FRONTEND_DOMAIN" ] && echo "  https://${FRONTEND_DOMAIN}"
echo ""
echo "Certificate auto-renewal is configured."
echo "Test renewal with: sudo certbot renew --dry-run"
echo ""
