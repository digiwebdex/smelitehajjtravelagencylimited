#!/bin/bash
# Daily database backup script for SM Elite Hajj VPS
# Runs daily via cron, dumps PostgreSQL DB, compresses, rotates old backups.

set -euo pipefail

# Load env from backend .env if present
if [ -f /var/www/smelitehajj/backend/.env ]; then
  set -a
  . /var/www/smelitehajj/backend/.env
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-smelite_hajj}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/smelitehajj}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"
LOG="$BACKUP_DIR/backup.log"

echo "[$(date)] Starting backup -> $FILE" >> "$LOG"

PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
  --no-owner --no-privileges --clean --if-exists \
  "$DB_NAME" | gzip -9 > "$FILE"

SIZE=$(du -h "$FILE" | cut -f1)
echo "[$(date)] Backup completed ($SIZE)" >> "$LOG"

# Rotate: delete backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "db_${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Rotation done (kept $RETENTION_DAYS days)" >> "$LOG"

# Optional: log row into backup_history table
if command -v psql >/dev/null 2>&1; then
  BYTES=$(stat -c%s "$FILE" 2>/dev/null || echo 0)
  PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
    "INSERT INTO backup_history (backup_name, backup_type, file_path, file_size, status) \
     VALUES ('$(basename "$FILE")', 'daily-auto', '$FILE', $BYTES, 'completed')" \
    >> "$LOG" 2>&1 || echo "[$(date)] backup_history insert skipped" >> "$LOG"
fi
