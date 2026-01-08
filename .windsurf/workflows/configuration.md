---
description: Configure local environment (env files, deps, migrations, dev servers)
---

# Local Development Setup

## 1. Environment Files

### Frontend
- Copy `.env.example` → `.env`
- Set `VITE_API_URL=http://localhost:8001` (or your backend URL)

### Backend
- Copy `backend/.env.example` → `backend/.env`
- Configure database credentials:
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_DATABASE=mailmandu` (or your database name)
  - `DB_USERNAME=root`
  - `DB_PASSWORD=` (your MySQL password)
- Add mail/SMS provider keys as needed (SendGrid, Twilio, etc.)

## 2. Install Dependencies

### Backend (PHP)
```bash
cd backend
composer install
```

### Frontend (Node)
```bash
npm install
```

## 3. Database Setup

1. Start MySQL (XAMPP or local service)
2. Create database if needed:
   ```sql
   CREATE DATABASE mailmandu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run migrations:
   ```bash
   cd backend
   php run_all_migrations.php
   ```
   Or for specific migration sets:
   - `php run_thryv_migrations.php` - Thryv parity features
   - `php run_p0_migration.php` - P0 parity features

## 4. Start Development Servers

### Backend
```bash
cd backend
php -S localhost:8001 -t public
```

### Frontend
```bash
npm run dev
```
This starts Vite dev server on `http://localhost:5173` with API proxying configured.

### Alternative: Start All Services
```bash
npm run dev:all
```
This runs both frontend and backend concurrently.

## 5. Verify Setup

### API Health Check
- Open `http://localhost:8001/health-check.php`
- Should return JSON with database connection status

### Frontend
- Open `http://localhost:5173`
- Login with dev credentials (check AuthContext.tsx for dev mode defaults)
- Verify pages load with data

## 6. Common Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=mailmandu
DB_USERNAME=root
DB_PASSWORD=

APP_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173

# Email (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

# SMS (Twilio/SignalWire)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal (optional)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8001
VITE_SOCKET_URL=ws://localhost:8001
VITE_STRIPE_PUBLISHABLE_KEY=
```

## 7. Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `backend/.env`
- Ensure database exists
- Check `backend/public/health-check.php` for detailed error

### API Not Loading
- Verify backend server is running on port 8001
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors
- Verify `vite.config.ts` proxy configuration

### Migration Errors
- Check MySQL user has CREATE/ALTER permissions
- Review migration files in `backend/migrations/`
- Check for duplicate table errors (migrations may have run partially)

### Port Conflicts
- Backend default: 8001 (change with `php -S localhost:PORT`)
- Frontend default: 5173 (change in `vite.config.ts`)
