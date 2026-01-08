# 🚀 Quick Start Guide

## Starting the Application

### Option 1: Quick Start (Recommended)
Double-click `start-servers.bat` - this will start the backend server automatically.

Then in a separate terminal:
```bash
npm run dev
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend Server
cd backend
php -S localhost:8080 -t public router.php

# Terminal 2 - Frontend Server
npm run dev
```

## Application URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api
- **API Test Page:** http://localhost:5173/api-test.html

## Testing the Connection

### Browser Test
Open: http://localhost:5173/api-test.html

### PowerShell Test
```bash
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

## Troubleshooting

### Frontend can't connect to backend?
1. Make sure the backend server is running on port 8080
2. Restart the Vite dev server: Stop (Ctrl+C) and run `npm run dev` again

### Database connection errors?
Check that MySQL is running and the credentials in `backend/.env` are correct:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=xordon
DB_USER=root
DB_PASS=
```

### API returns HTML instead of JSON?
Restart the backend server to clear any cached PHP files.

## Recent Fixes (2025-12-27)

✅ Fixed backend server not running
✅ Fixed Vite proxy configuration (now points to port 8080)
✅ Fixed PHP warnings in Logger.php
✅ Verified database connection is working
✅ Verified all API endpoints are responding correctly

See `FIXES_APPLIED.md` for detailed information.
