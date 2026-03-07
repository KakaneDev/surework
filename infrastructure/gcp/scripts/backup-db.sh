#!/bin/bash
# SureWork Database Backup Script
# Run manually or via cron
#
# Setup cron (daily at 2 AM):
#   crontab -e
#   0 2 * * * /home/harrismogale/surework/surework/infrastructure/gcp/scripts/backup-db.sh
#
# Restore backup:
#   gunzip < backup.sql.gz | docker exec -i surework-postgres psql -U surework

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
CONTAINER_NAME="${CONTAINER_NAME:-surework-postgres}"
DB_USER="${DB_USER:-surework}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
GCS_BUCKET="${GCS_BUCKET:-}"  # Optional: gs://surework-backups-prod

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="surework_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "=========================================="
echo "  SureWork Database Backup"
echo "  $(date)"
echo "=========================================="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container $CONTAINER_NAME is not running"
    exit 1
fi

echo "[1/4] Creating database backup..."
docker exec "$CONTAINER_NAME" pg_dumpall -U "$DB_USER" > "$BACKUP_PATH"

echo "[2/4] Compressing backup..."
gzip "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "      Backup size: $BACKUP_SIZE"

echo "[3/4] Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "surework_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/surework_*.sql.gz 2>/dev/null | wc -l)
echo "      Remaining backups: $REMAINING"

# Optional: Upload to Google Cloud Storage
if [ -n "$GCS_BUCKET" ]; then
    echo "[4/4] Uploading to Google Cloud Storage..."
    if command -v gsutil &> /dev/null; then
        gsutil cp "$BACKUP_PATH" "${GCS_BUCKET}/"
        echo "      Uploaded to ${GCS_BUCKET}/"
    else
        echo "      WARNING: gsutil not installed, skipping cloud upload"
    fi
else
    echo "[4/4] Cloud storage not configured (set GCS_BUCKET to enable)"
fi

echo ""
echo "=========================================="
echo "  Backup Complete"
echo "  File: $BACKUP_PATH"
echo "  Size: $BACKUP_SIZE"
echo "=========================================="
