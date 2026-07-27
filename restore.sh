#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./restore.sh <path_to_db_backup.sql.gz> [path_to_uploads_backup.tar.gz]${NC}"
    echo "Example: ./restore.sh ./backups/db_backup_20260727_120000.sql.gz"
    exit 1
fi

DB_BACKUP_FILE="$1"
UPLOADS_BACKUP_FILE="$2"

if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo -e "${RED}Error: Database backup file '$DB_BACKUP_FILE' not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: THIS WILL OVERWRITE THE CURRENT DATABASE!${NC}"
echo -e "Press Enter to proceed or Ctrl+C to abort..."
read -r

echo -e "${GREEN}[1/2] Restoring PostgreSQL Database from $DB_BACKUP_FILE...${NC}"
gunzip -c "$DB_BACKUP_FILE" | docker exec -i ttlo_db psql -U postgres

if [ -n "$UPLOADS_BACKUP_FILE" ] && [ -f "$UPLOADS_BACKUP_FILE" ]; then
    echo -e "${GREEN}[2/2] Restoring User Uploads from $UPLOADS_BACKUP_FILE...${NC}"
    docker run --rm \
      -v ttlo_uploads_data:/volume \
      -v "$(pwd)/$(dirname "$UPLOADS_BACKUP_FILE")":/backup \
      alpine tar -xzf "/backup/$(basename "$UPLOADS_BACKUP_FILE")" -C /volume
fi

echo -e "${GREEN}Restoration complete! Restarting web container...${NC}"
docker compose restart web
