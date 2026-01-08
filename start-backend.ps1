# Start PHP development server for backend
Write-Host "Starting PHP Backend Server on port 8001..." -ForegroundColor Cyan

# Start PHP built-in server using router.php from project root
php -S 127.0.0.1:8001 router.php

Write-Host "Backend server stopped." -ForegroundColor Yellow
