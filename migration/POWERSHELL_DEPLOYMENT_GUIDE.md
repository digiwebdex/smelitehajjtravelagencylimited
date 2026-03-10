# 🚀 SM Elite Hajj - Complete VPS Deployment Guide (PowerShell)

## Your VPS Details
- **VPS IP:** `187.77.144.38`
- **Domain:** `smelitehajj.com`
- **GitHub:** `https://github.com/digiwebdex/smelitehajjtravelagencylimited-e557002a`
- **Admin Login:** `asomoalamin@yahoo.com` / `Asomo@235977#`

---

## ⚠️ IMPORTANT: Before You Start
- Open **PowerShell as Administrator** on your Windows PC
- Make sure you have SSH access to your VPS
- This guide assumes another website is already running on your VPS

---

## STEP 1: Connect to Your VPS

```powershell
ssh root@187.77.144.38
```
Type `yes` if asked about fingerprint, then enter your VPS root password.

---

## STEP 2: Update System & Install Required Software

Copy and paste this ENTIRE block:

```bash
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx (skip if already installed)
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Install Git
apt install -y git

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
node -v
npm -v
psql --version
nginx -v
```

---

## STEP 3: Create Project Directory

```bash
mkdir -p /var/www/smelitehajj
cd /var/www/smelitehajj
```

---

## STEP 4: Clone Your GitHub Repository

```bash
git clone https://github.com/digiwebdex/smelitehajjtravelagencylimited-e557002a.git .
```

---

## STEP 5: Set Up PostgreSQL Database

```bash
# Switch to postgres user and create database
sudo -u postgres psql -c "CREATE DATABASE smelite_hajj;"
sudo -u postgres psql -c "CREATE USER smelite_user WITH PASSWORD 'SM3l1t3H@jj2026!Secure';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smelite_hajj TO smelite_user;"
sudo -u postgres psql -d smelite_hajj -c "GRANT ALL ON SCHEMA public TO smelite_user;"

# Install required extensions
sudo -u postgres psql -d smelite_hajj -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d smelite_hajj -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
```

---

## STEP 6: Import Database Schema

```bash
# Import schema (tables, enums, indexes)
sudo -u postgres psql -d smelite_hajj -f /var/www/smelitehajj/migration/database/schema.sql

# Import functions and triggers
sudo -u postgres psql -d smelite_hajj -f /var/www/smelitehajj/migration/database/functions.sql

# Import data
sudo -u postgres psql -d smelite_hajj -f /var/www/smelitehajj/migration/database/data.sql
```

---

## STEP 7: Set Admin Password Properly

```bash
sudo -u postgres psql -d smelite_hajj -c "UPDATE public.users SET encrypted_password = crypt('Asomo@235977#', gen_salt('bf')) WHERE email = 'asomoalamin@yahoo.com';"
```

---

## STEP 8: Verify Database

```bash
# Check tables were created
sudo -u postgres psql -d smelite_hajj -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# Check data was imported
sudo -u postgres psql -d smelite_hajj -c "SELECT COUNT(*) FROM profiles;"
sudo -u postgres psql -d smelite_hajj -c "SELECT COUNT(*) FROM hero_content;"
sudo -u postgres psql -d smelite_hajj -c "SELECT COUNT(*) FROM services;"
sudo -u postgres psql -d smelite_hajj -c "SELECT COUNT(*) FROM site_settings;"
```

You should see numbers > 0 for all tables.

---

## STEP 9: Set Up Backend API Server

```bash
# Go to backend directory
cd /var/www/smelitehajj/migration/backend

# Install backend dependencies
npm install

# Create .env file for backend
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smelite_hajj
DB_USER=smelite_user
DB_PASSWORD=SM3l1t3H@jj2026!Secure
PORT=3001
BACKEND_URL=https://smelitehajj.com
JWT_SECRET=SM3l1t3H@jj-JWT-S3cr3t-K3y-2026-V3ry-S3cur3-R@nd0m
NODE_ENV=production
EOF

# Create uploads directory
mkdir -p uploads/team uploads/hotels uploads/gallery uploads/notices uploads/packages uploads/documents

# Test the backend
node server.js
```

You should see: `Server running on port 3001`. Press `Ctrl+C` to stop.

---

## STEP 10: Start Backend with PM2 (Auto-restart)

```bash
cd /var/www/smelitehajj/migration/backend
pm2 start server.js --name "smelitehajj-api"
pm2 save
pm2 startup
```

---

## STEP 11: Build the Frontend

```bash
cd /var/www/smelitehajj

# Install frontend dependencies
npm install

# Create frontend environment file
cat > .env.production << 'EOF'
VITE_API_URL=https://smelitehajj.com/api
VITE_SITE_URL=https://smelitehajj.com
EOF

# Build the frontend
npm run build
```

This creates a `dist/` folder with the production website.

---

## STEP 12: Configure Nginx

```bash
# Copy nginx config
cp /var/www/smelitehajj/migration/deploy/nginx-smelitehajj.conf /etc/nginx/sites-available/smelitehajj.conf

# Enable the site
ln -sf /etc/nginx/sites-available/smelitehajj.conf /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx
```

---

## STEP 13: Set Up SSL Certificate (HTTPS)

First, temporarily comment out the SSL lines in nginx config:

```bash
# Edit to temporarily use HTTP only (for certbot)
cat > /etc/nginx/sites-available/smelitehajj.conf << 'NGINX'
server {
    listen 80;
    server_name smelitehajj.com www.smelitehajj.com;

    root /var/www/smelitehajj/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /var/www/smelitehajj/migration/backend/uploads/;
        expires 30d;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

nginx -t && systemctl reload nginx

# Now get SSL certificate
certbot --nginx -d smelitehajj.com -d www.smelitehajj.com --email asomoalamin@yahoo.com --agree-tos --no-eff-email
```

Certbot will automatically update your nginx config with SSL.

---

## STEP 14: Update DNS Records

Go to your domain registrar (where you bought smelitehajj.com) and set:

| Type | Name | Value |
|------|------|-------|
| A | @ | 187.77.144.38 |
| A | www | 187.77.144.38 |

Wait 5-30 minutes for DNS propagation.

---

## STEP 15: Set File Permissions

```bash
chown -R www-data:www-data /var/www/smelitehajj/dist
chown -R www-data:www-data /var/www/smelitehajj/migration/backend/uploads
chmod -R 755 /var/www/smelitehajj/dist
chmod -R 755 /var/www/smelitehajj/migration/backend/uploads
```

---

## STEP 16: Auto-renew SSL

```bash
# Test auto-renewal
certbot renew --dry-run
```

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

```bash
# 1. Check backend is running
pm2 status

# 2. Check nginx is running
systemctl status nginx

# 3. Check PostgreSQL is running
systemctl status postgresql

# 4. Test API health
curl http://localhost:3001/api/health

# 5. Test website
curl -I https://smelitehajj.com
```

---

## 🔧 COMMON TROUBLESHOOTING

### "Port 3001 already in use"
```bash
lsof -i :3001
kill -9 <PID>
pm2 restart smelitehajj-api
```

### "Nginx config test fails"
```bash
nginx -t  # Shows the exact error
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
systemctl start postgresql
systemctl status postgresql

# Test database connection
sudo -u postgres psql -d smelite_hajj -c "SELECT 1;"
```

### "Frontend shows blank page"
```bash
# Check dist folder exists
ls -la /var/www/smelitehajj/dist/

# Rebuild if needed
cd /var/www/smelitehajj && npm run build
```

### "Backend API returns 502"
```bash
pm2 logs smelitehajj-api --lines 50
```

### View backend logs
```bash
pm2 logs smelitehajj-api
```

---

## 📋 QUICK REFERENCE

| Service | Command |
|---------|---------|
| Restart Backend | `pm2 restart smelitehajj-api` |
| View Backend Logs | `pm2 logs smelitehajj-api` |
| Restart Nginx | `systemctl restart nginx` |
| Restart PostgreSQL | `systemctl restart postgresql` |
| Update from GitHub | `cd /var/www/smelitehajj && git pull && npm run build` |
| Database Console | `sudo -u postgres psql -d smelite_hajj` |

---

## 🔐 Your Credentials (SAVE THESE!)

| Item | Value |
|------|-------|
| VPS SSH | `ssh root@187.77.144.38` |
| DB Name | `smelite_hajj` |
| DB User | `smelite_user` |
| DB Password | `SM3l1t3H@jj2026!Secure` |
| JWT Secret | `SM3l1t3H@jj-JWT-S3cr3t-K3y-2026-V3ry-S3cur3-R@nd0m` |
| Admin Email | `asomoalamin@yahoo.com` |
| Admin Password | `Asomo@235977#` |
| Backend Port | `3001` |
| Frontend | `https://smelitehajj.com` |
| API Base | `https://smelitehajj.com/api` |
