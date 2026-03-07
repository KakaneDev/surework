#!/bin/bash
# SureWork GCP Deployment Script
# This script automates the GCP infrastructure setup from your local machine

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-surework-prod}"
REGION="europe-west1"
ZONE="europe-west1-b"
VM_NAME="surework-server"
MACHINE_TYPE="e2-medium"
DISK_SIZE="50GB"
STATIC_IP_NAME="surework-ip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first:"
        echo "  brew install google-cloud-sdk"
        exit 1
    fi
    log_info "gcloud CLI found"
}

# Check authentication
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 | grep -q "@"; then
        log_warn "Not authenticated. Running gcloud auth login..."
        gcloud auth login
    fi
    log_info "Authenticated as: $(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1)"
}

# Create or set project
setup_project() {
    log_info "Setting up GCP project: $PROJECT_ID"

    # Check if project exists
    if gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        log_info "Project $PROJECT_ID already exists"
    else
        log_info "Creating project $PROJECT_ID..."
        gcloud projects create "$PROJECT_ID" --name="SureWork Production"
    fi

    gcloud config set project "$PROJECT_ID"
    log_info "Project set to $PROJECT_ID"
}

# Link billing account
link_billing() {
    log_info "Checking billing account..."

    # List billing accounts
    BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(ACCOUNT_ID)" | head -n1)

    if [ -z "$BILLING_ACCOUNT" ]; then
        log_error "No billing account found. Please create one at console.cloud.google.com/billing"
        exit 1
    fi

    # Check if already linked
    CURRENT_BILLING=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")

    if [ -z "$CURRENT_BILLING" ] || [ "$CURRENT_BILLING" == "billingAccountName: ''" ]; then
        log_info "Linking billing account $BILLING_ACCOUNT to project..."
        gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
    else
        log_info "Billing already linked"
    fi
}

# Enable required APIs
enable_apis() {
    log_info "Enabling required APIs..."
    gcloud services enable compute.googleapis.com --quiet
    log_info "Compute Engine API enabled"
}

# Create VM instance
create_vm() {
    log_info "Creating Compute Engine VM..."

    # Check if VM exists
    if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" &> /dev/null; then
        log_warn "VM $VM_NAME already exists"
        return
    fi

    gcloud compute instances create "$VM_NAME" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size="$DISK_SIZE" \
        --boot-disk-type=pd-ssd \
        --tags=http-server,https-server \
        --metadata-from-file=startup-script=vm-startup.sh

    log_info "VM $VM_NAME created successfully"
}

# Create firewall rules
create_firewall_rules() {
    log_info "Creating firewall rules..."

    # HTTP rule
    if ! gcloud compute firewall-rules describe allow-http &> /dev/null; then
        gcloud compute firewall-rules create allow-http \
            --allow=tcp:80 \
            --target-tags=http-server \
            --description="Allow HTTP traffic"
        log_info "HTTP firewall rule created"
    else
        log_info "HTTP firewall rule already exists"
    fi

    # HTTPS rule
    if ! gcloud compute firewall-rules describe allow-https &> /dev/null; then
        gcloud compute firewall-rules create allow-https \
            --allow=tcp:443 \
            --target-tags=https-server \
            --description="Allow HTTPS traffic"
        log_info "HTTPS firewall rule created"
    else
        log_info "HTTPS firewall rule already exists"
    fi

    # API Gateway rule (for testing)
    if ! gcloud compute firewall-rules describe allow-api &> /dev/null; then
        gcloud compute firewall-rules create allow-api \
            --allow=tcp:8080 \
            --target-tags=http-server \
            --description="Allow API Gateway traffic (temporary)"
        log_info "API firewall rule created"
    else
        log_info "API firewall rule already exists"
    fi
}

# Reserve and assign static IP
setup_static_ip() {
    log_info "Setting up static IP..."

    # Reserve static IP if not exists
    if ! gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" &> /dev/null; then
        gcloud compute addresses create "$STATIC_IP_NAME" --region="$REGION"
        log_info "Static IP reserved"
    else
        log_info "Static IP already reserved"
    fi

    # Get the IP address
    STATIC_IP=$(gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" --format="get(address)")
    log_info "Static IP: $STATIC_IP"

    # Check current VM IP
    CURRENT_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --format="get(networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null || echo "")

    if [ "$CURRENT_IP" != "$STATIC_IP" ]; then
        log_info "Assigning static IP to VM..."

        # Remove current access config if exists
        gcloud compute instances delete-access-config "$VM_NAME" \
            --zone="$ZONE" \
            --access-config-name="external-nat" 2>/dev/null || true

        # Add new access config with static IP
        gcloud compute instances add-access-config "$VM_NAME" \
            --zone="$ZONE" \
            --address="$STATIC_IP"

        log_info "Static IP assigned to VM"
    else
        log_info "Static IP already assigned"
    fi

    echo ""
    echo "=========================================="
    echo -e "${GREEN}Static IP Address: $STATIC_IP${NC}"
    echo "=========================================="
    echo ""
}

# Print next steps
print_next_steps() {
    STATIC_IP=$(gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" --format="get(address)")

    echo ""
    echo "=========================================="
    echo -e "${GREEN}GCP Infrastructure Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. SSH into the VM:"
    echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
    echo ""
    echo "2. Clone your repository:"
    echo "   git clone https://github.com/inmo/surework.git"
    echo "   cd surework/surework"
    echo ""
    echo "3. Copy and edit production environment:"
    echo "   cp .env.production .env"
    echo "   nano .env  # Update passwords!"
    echo ""
    echo "4. Build and start services:"
    echo "   docker compose build"
    echo "   docker compose up -d"
    echo ""
    echo "5. Your API will be available at:"
    echo "   http://$STATIC_IP:8080"
    echo ""
    echo "6. Configure DNS (A record):"
    echo "   api.yourdomain.com -> $STATIC_IP"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  SureWork GCP Deployment"
    echo "=========================================="
    echo ""

    check_gcloud
    check_auth
    setup_project
    link_billing
    enable_apis
    create_vm
    create_firewall_rules
    setup_static_ip
    print_next_steps
}

# Run main function
main "$@"
