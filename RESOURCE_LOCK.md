# 🔒 RESOURCE LOCK — SM Elite Hajj Travel Agency

> **WARNING: This file documents locked resources on the production VPS (187.77.144.38).**
> **DO NOT use any of these ports, folders, databases, or service names for other projects.**

---

## 🖥️ Server Details

| Property | Value |
|----------|-------|
| **VPS IP** | `187.77.144.38` |
| **Provider** | Hostinger KVM |
| **OS** | Ubuntu |

---

## 🚫 Reserved Resources

### 📁 Directories (DO NOT overwrite or share)

| Path | Purpose |
|------|---------|
| `/var/www/smelitehajj/` | Frontend source code + built `dist/` |
| `/var/www/smelitehajj/dist/` | Production build (served by Nginx) |
| `/var/www/smelitehajj/migration/backend/` | Node.js Express API server |
| `/var/www/smelitehajj/migration/backend/uploads/` | File uploads (Multer storage) |

### 🔌 Ports (DO NOT reuse)

| Port | Service |
|------|---------|
| `3002` | SM Elite Hajj backend API (Node.js/Express) |

### 🗄️ Database (DO NOT drop or share)

| Property | Value |
|----------|-------|
| **Database Name** | `smelite_hajj` |
| **Engine** | PostgreSQL (local) |

### ⚙️ PM2 Process (DO NOT rename or conflict)

| PM2 Name | Script | CWD |
|----------|--------|-----|
| `smelitehajj-api` | `server.js` | `/var/www/smelitehajj/migration/backend/` |

### 🌐 Nginx Config (DO NOT modify without caution)

| File | Domains |
|------|---------|
| `/etc/nginx/sites-available/smelitehajj.conf` | `smelitehajj.com`, `www.smelitehajj.com` |

### 🔐 SSL Certificates

| Path | Domains |
|------|---------|
| `/etc/letsencrypt/live/smelitehajj.com/` | `smelitehajj.com`, `www.smelitehajj.com` |

---

## 📌 GitHub Repository

| Property | Value |
|----------|-------|
| **Repo** | `https://github.com/digiwebdex/smelitehajjtravelagencylimited-2da956e9.git` |
| **Branch** | `main` |

---

## ✅ Safe Port Ranges for New Projects

When adding new projects to this VPS, use ports **3003+** (avoid 3002).
Always check existing usage first:

```bash
pm2 list
ss -tlnp | grep LISTEN
```

---

## 🚨 Deployment Commands (for reference)

```bash
cd /var/www/smelitehajj && git pull && npm install && npm run build && systemctl reload nginx
cd /var/www/smelitehajj/migration/backend && npm install && pm2 restart smelitehajj-api && pm2 save
```

---

*Last updated: 2026-04-04*
