# S.M. Elite Hajj - CMS Export Documentation

## Complete System Architecture for cPanel Migration

This document provides comprehensive documentation of the current system to rebuild it for cPanel hosting with Node.js/PHP + MySQL.

---

## 📊 DATABASE SCHEMA (Convert to MySQL)

### 1. `profiles` - User Profiles
```sql
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. `packages` - Hajj & Umrah Packages
```sql
CREATE TABLE packages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT DEFAULT 7,
    hotel_rating INT DEFAULT 5,
    stock INT DEFAULT 50,
    type ENUM('hajj', 'umrah') NOT NULL,
    includes JSON,  -- Array of included items
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. `bookings` - Customer Bookings
```sql
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    package_id VARCHAR(36) NOT NULL,
    passenger_count INT DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    travel_date DATE,
    notes TEXT,
    passenger_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
);
```

### 4. `hero_content` - Hero Section CMS
```sql
CREATE TABLE hero_content (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    badge_text VARCHAR(255),
    primary_button_text VARCHAR(100),
    primary_button_link VARCHAR(255),
    secondary_button_text VARCHAR(100),
    secondary_button_link VARCHAR(255),
    background_image_url VARCHAR(500),
    stats JSON,  -- Array of {number, label} objects
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5. `menu_items` - Navigation Menu CMS
```sql
CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    label VARCHAR(100) NOT NULL,
    href VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. `services` - Services Section CMS
```sql
CREATE TABLE services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    icon_name VARCHAR(50) NOT NULL,  -- Lucide icon name: Plane, Hotel, Shield, Users, Clock, HeartHandshake
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 7. `testimonials` - Testimonials CMS
```sql
CREATE TABLE testimonials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    package_name VARCHAR(255),
    quote TEXT NOT NULL,
    rating INT DEFAULT 5,
    avatar_url VARCHAR(500),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8. `faq_items` - FAQ CMS
```sql
CREATE TABLE faq_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 9. `team_members` - Team CMS
```sql
CREATE TABLE team_members (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    qualifications TEXT,
    avatar_url VARCHAR(500),
    board_type ENUM('management', 'shariah') DEFAULT 'management',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 10. `visa_countries` - Visa Services CMS
```sql
CREATE TABLE visa_countries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    country_name VARCHAR(255) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    processing_time VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 11. `contact_info` - Contact Information CMS
```sql
CREATE TABLE contact_info (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type VARCHAR(50) NOT NULL,  -- 'phone', 'email', 'address', 'hours'
    icon_name VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details JSON NOT NULL,  -- Array of strings
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 12. `footer_content` - Footer CMS
```sql
CREATE TABLE footer_content (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_description TEXT,
    copyright_text VARCHAR(255),
    quick_links JSON,     -- Array of {name, href}
    services_links JSON,  -- Array of {label, href}
    social_links JSON,    -- Array of {platform, url}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 13. `notification_settings` - SMS & Email Configuration
```sql
CREATE TABLE notification_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_type VARCHAR(50) NOT NULL,  -- 'sms' or 'email'
    is_enabled BOOLEAN DEFAULT FALSE,
    config JSON NOT NULL,
    -- SMS config: {api_url, api_key, sender_id}
    -- Email config: {smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 14. `notification_logs` - Notification History
```sql
CREATE TABLE notification_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    booking_id VARCHAR(36),
    notification_type VARCHAR(50) NOT NULL,  -- 'sms' or 'email'
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,  -- 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

### 15. `section_settings` - Section Enable/Disable
```sql
CREATE TABLE section_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_key VARCHAR(50) NOT NULL UNIQUE,  -- 'hero', 'services', 'hajj', 'umrah', etc.
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔐 AUTHENTICATION SYSTEM

### User Registration
```javascript
// Required fields
{
    email: "user@example.com",
    password: "password123",
    full_name: "User Name"
}
```

### User Login
```javascript
{
    email: "user@example.com",
    password: "password123"
}
```

### Admin Role Check
```sql
SELECT role FROM profiles WHERE id = :user_id;
-- Returns 'admin' or 'customer'
```

---

## 📧 NOTIFICATION SYSTEM

### SMS Integration (Bulk SMS)
```javascript
// Configuration stored in notification_settings
{
    api_url: "https://bulksmsbd.net/api/smsapi",
    api_key: "YOUR_API_KEY",
    sender_id: "YOUR_SENDER_ID"
}

// Send SMS
POST api_url
{
    api_key: "xxx",
    senderid: "xxx",
    number: "+8801XXXXXXXXX",
    message: "Your booking is confirmed..."
}
```

### Email Integration (Custom SMTP)
```javascript
// Configuration stored in notification_settings
{
    smtp_host: "smtp.example.com",
    smtp_port: 587,
    smtp_user: "user@example.com",
    smtp_pass: "password",
    from_email: "noreply@example.com",
    from_name: "S.M. Elite Hajj"
}

// Use Nodemailer (Node.js) or PHPMailer (PHP)
```

---

## 📁 FILE STRUCTURE (SUGGESTED)

### Node.js + Express
```
/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/
├── views/
│   ├── layouts/
│   ├── admin/
│   └── frontend/
├── routes/
│   ├── api/
│   ├── admin.js
│   └── frontend.js
├── controllers/
│   ├── AdminController.js
│   ├── BookingController.js
│   └── NotificationController.js
├── models/
│   ├── Package.js
│   ├── Booking.js
│   └── User.js
├── middleware/
│   └── auth.js
├── config/
│   └── database.js
├── app.js
└── package.json
```

### PHP Laravel
```
/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   └── Frontend/
│   │   └── Middleware/
│   └── Models/
├── database/
│   └── migrations/
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/
├── resources/
│   └── views/
│       ├── admin/
│       └── frontend/
├── routes/
│   ├── web.php
│   └── api.php
└── .env
```

---

## 🎨 FRONTEND COMPONENTS

### Design System (CSS Variables)
```css
:root {
    --primary: 142 55% 23%;        /* Green */
    --secondary: 43 74% 66%;       /* Gold */
    --background: 45 20% 97%;      /* Cream */
    --foreground: 142 45% 15%;     /* Dark green */
    --card: 45 30% 98%;
    --muted: 45 15% 93%;
}
```

### Fonts Used
- **Headings**: Amiri, Scheherazade New (Arabic/Islamic style)
- **Body**: Inter, system fonts
- **Arabic**: Noto Naskh Arabic

### Icon Library
Using Lucide Icons: https://lucide.dev/icons/

---

## 🔧 ADMIN PANEL MODULES

### 1. Dashboard
- Total bookings count
- Revenue statistics
- Recent bookings
- Notification logs

### 2. Packages Management
- CRUD operations for Hajj/Umrah packages
- Toggle active/inactive
- Image upload

### 3. Bookings Management
- View all bookings
- Update status (pending → confirmed → completed)
- Filter by status, date
- Export to CSV

### 4. Content Management
- Hero Section
- Menu Items
- Services
- Testimonials
- FAQ
- Team Members
- Footer

### 5. Settings
- SMS Configuration
- Email Configuration
- Notification Templates

---

## 📱 API ENDPOINTS (SUGGESTED)

### Public APIs
```
GET  /api/packages?type=hajj|umrah
GET  /api/packages/:id
GET  /api/hero-content
GET  /api/menu-items
GET  /api/services
GET  /api/testimonials
GET  /api/faq
GET  /api/team-members
GET  /api/footer-content
GET  /api/visa-countries
POST /api/bookings  (create booking)
```

### Admin APIs (Protected)
```
GET    /api/admin/bookings
PUT    /api/admin/bookings/:id
DELETE /api/admin/bookings/:id

CRUD   /api/admin/packages
CRUD   /api/admin/hero-content
CRUD   /api/admin/menu-items
CRUD   /api/admin/services
CRUD   /api/admin/testimonials
CRUD   /api/admin/faq
CRUD   /api/admin/team-members
CRUD   /api/admin/footer-content
CRUD   /api/admin/visa-countries

GET    /api/admin/notification-settings
PUT    /api/admin/notification-settings
GET    /api/admin/notification-logs
```

---

## 🚀 cPanel DEPLOYMENT STEPS

### For Node.js:
1. Access cPanel → Setup Node.js App
2. Create application with Node.js version 18+
3. Upload files via File Manager
4. Create MySQL database via MySQL Database Wizard
5. Configure environment variables:
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
   - `SESSION_SECRET`
6. Run `npm install`
7. Start application

### For PHP Laravel:
1. Upload files via File Manager
2. Create MySQL database
3. Update `.env` file with database credentials
4. Run migrations: `php artisan migrate`
5. Set document root to `/public`

---

## 📦 PACKAGE DEPENDENCIES

### Node.js
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "mysql2": "^3.x",
    "sequelize": "^6.x",
    "bcryptjs": "^2.x",
    "jsonwebtoken": "^9.x",
    "nodemailer": "^6.x",
    "multer": "^1.x",
    "dotenv": "^16.x",
    "ejs": "^3.x"
  }
}
```

### PHP Composer
```json
{
  "require": {
    "php": "^8.1",
    "laravel/framework": "^10.x",
    "phpmailer/phpmailer": "^6.x"
  }
}
```

---

## 📋 REMAINING FEATURES TO IMPLEMENT

The following features were requested but need implementation in the new system:

1. **SEO CMS** - Meta title, description, keywords per page
2. **Design Controls** - Font selection, font size, color schemes
3. **Logo Management** - Upload, background removal
4. **Image Size Control** - Resize uploaded images
5. **WYSIWYG Editor** - Rich text editing for descriptions
6. **Media Library** - Central file management
7. **SMS/Email Templates** - Customizable notification templates
8. **Booking Field Control** - Configurable form fields

---

## 💾 DATA EXPORT

To export current data from Lovable Cloud:

1. Use the Cloud tab in Lovable
2. Navigate to Database → Tables
3. Export each table as CSV
4. Import into MySQL using phpMyAdmin

---

## 📞 SUPPORT

This documentation provides the complete architecture for rebuilding the system. 
For the actual implementation, you'll need a developer familiar with Node.js/Express or PHP/Laravel.

---

*Generated: January 2026*
*Project: S.M. Elite Hajj - Lovable to cPanel Migration*
