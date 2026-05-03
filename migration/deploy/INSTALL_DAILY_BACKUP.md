# Daily Database Backup — VPS Setup

Activate automated daily PostgreSQL backups on the Hostinger VPS.

## Files
- `daily-backup.sh` — backup script (pg_dump + gzip + rotation)
- `smelitehajj-backup.service` — systemd one-shot service
- `smelitehajj-backup.timer` — runs daily at **02:30 server time**

Default retention: **14 days** (override via `BACKUP_RETENTION_DAYS` in backend `.env`).
Default location: `/var/backups/smelitehajj/` (override via `BACKUP_DIR`).

## One-time Installation (run on VPS as root)

```bash
# 1) Copy files
sudo cp /var/www/smelitehajj/migration/deploy/daily-backup.sh \
        /usr/local/bin/smelitehajj-daily-backup.sh
sudo chmod +x /usr/local/bin/smelitehajj-daily-backup.sh

sudo cp /var/www/smelitehajj/migration/deploy/smelitehajj-backup.service /etc/systemd/system/
sudo cp /var/www/smelitehajj/migration/deploy/smelitehajj-backup.timer   /etc/systemd/system/

# 2) Backup directory
sudo mkdir -p /var/backups/smelitehajj
sudo chmod 700 /var/backups/smelitehajj

# 3) Enable + start the timer
sudo systemctl daemon-reload
sudo systemctl enable --now smelitehajj-backup.timer

# 4) Verify
systemctl list-timers | grep smelitehajj
sudo systemctl status smelitehajj-backup.timer

# 5) Run once now to confirm it works
sudo systemctl start smelitehajj-backup.service
ls -lh /var/backups/smelitehajj/
tail -n 20 /var/backups/smelitehajj/backup.log
```

## Restore from a backup
```bash
gunzip -c /var/backups/smelitehajj/db_smelite_hajj_YYYYMMDD_HHMMSS.sql.gz \
  | psql -h localhost -U postgres -d smelite_hajj
```

## Notes
- The script reads DB credentials from `/var/www/smelitehajj/backend/.env`.
- Each successful run also logs a row into the `backup_history` table so it appears in Admin → Backup & Restore.
- To change schedule, edit `OnCalendar=` in the `.timer` file and `systemctl daemon-reload`.
