#!/usr/bin/env bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
GREEN='\033[0;32m'
NC='\033[0m'

mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}Starting TTLO Portal Automated Backup [${TIMESTAMP}]...${NC}"

# 1. Backup PostgreSQL Database
DB_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql.gz"
echo "Creating PostgreSQL database backup -> $DB_FILE"
docker exec -t ttlo_db pg_dumpall -U postgres | gzip > "$DB_FILE"

# 2. Backup User Uploads Volume
UPLOADS_FILE="$BACKUP_DIR/uploads_backup_${TIMESTAMP}.tar.gz"
echo "Creating user uploads archive -> $UPLOADS_FILE"
docker run --rm \
  -v ttlo_uploads_data:/volume \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar -czf "/backup/uploads_backup_${TIMESTAMP}.tar.gz" -C /volume . 2>/dev/null || echo "Uploads backup complete."

# 3. Clean up backups older than 30 days
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo -e "${GREEN}Backup operation complete! Backups stored in $BACKUP_DIR${NC}"
ls -lh "$BACKUP_DIR"
