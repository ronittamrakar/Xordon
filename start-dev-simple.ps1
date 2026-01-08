# Simple dev server starter
Write-Host "Starting Xordon Development Servers..." -ForegroundColor Cyan

# Start PHP backend server
$phpJob = Start-Job -ScriptBlock {
    Set-Location "d:\Backup\App Backups\Xordon"
    php -S 127.0.0.1:8001 -t backend/public backend/router.php
}

Write-Host "✓ PHP Backend started on http://127.0.0.1:8001" -ForegroundColor Green

# Wait a moment for PHP to start
Start-Sleep -Seconds 1

# Start Vite frontend server
Write-Host "Starting Vite frontend..." -ForegroundColor Cyan
Set-Location "d:\Backup\App Backups\Xordon"
node ./scripts/start-dev.js

# Cleanup on exit
Stop-Job $phpJob
Remove-Job $phpJob
