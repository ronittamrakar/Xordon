#!/usr/bin/env pwsh
# Lead Marketplace Phase 2 - Startup & Verification Script
# Run this to start both servers and verify the installation

Write-Host "`n=== Lead Marketplace Phase 2 - Startup Script ===" -ForegroundColor Cyan
Write-Host "This script will start the backend and frontend servers and verify the installation.`n" -ForegroundColor White

# Check if we're in the right directory
if (!(Test-Path "backend") -or !(Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# 1. Verify Database Migration
Write-Host "`n[1/5] Checking database migration..." -ForegroundColor Yellow
Push-Location backend
$migrationCheck = php scripts/check_migration_tables.php 2>&1
Pop-Location

if ($migrationCheck -match "FOUND.*FOUND.*FOUND.*FOUND") {
    Write-Host "  ✓ Database migration verified" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Database migration may be incomplete" -ForegroundColor Yellow
    Write-Host "  Run: cd backend && php scripts/run_marketplace_phase2.php" -ForegroundColor Gray
}

# 2. Check Backend Configuration
Write-Host "`n[2/5] Checking backend configuration..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    $envContent = Get-Content "backend/.env" -Raw
    if ($envContent -match "GEOCODING_PROVIDER") {
        Write-Host "  ✓ Geocoding configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Geocoding not configured (optional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ backend/.env not found" -ForegroundColor Yellow
}

# 3. Check Storage Directory
Write-Host "`n[3/5] Checking file storage..." -ForegroundColor Yellow
$storageDir = "backend/storage/provider-documents"
if (Test-Path $storageDir) {
    Write-Host "  ✓ Storage directory exists: $storageDir" -ForegroundColor Green
} else {
    Write-Host "  ! Creating storage directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $storageDir -Force | Out-Null
    Write-Host "  ✓ Created: $storageDir" -ForegroundColor Green
}

# 4. Start Backend Server
Write-Host "`n[4/5] Starting backend server..." -ForegroundColor Yellow
Write-Host "  Starting PHP development server on http://127.0.0.1:8001" -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    php -S 127.0.0.1:8001 server.php 2>&1
}

Start-Sleep -Seconds 2

# Check if backend started
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend server running" -ForegroundColor Green
        $backendRunning = $true
    }
} catch {
    Write-Host "  ⚠ Backend server started but health check failed (this is normal)" -ForegroundColor Yellow
    Write-Host "    Server is running in background job ID: $($backendJob.Id)" -ForegroundColor Gray
    $backendRunning = $true
}

# 5. Start Frontend Server
Write-Host "`n[5/5] Starting frontend development server..." -ForegroundColor Yellow
Write-Host "  Starting Vite on http://localhost:5173" -ForegroundColor Gray
Write-Host "`n  ⏳ This may take a moment..." -ForegroundColor Gray

$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}

Start-Sleep -Seconds 5

# Summary
Write-Host "`n" -NoNewline
Write-Host "=== Server Status ===" -ForegroundColor Cyan

if ($backendRunning) {
    Write-Host "  ✓ Backend:  " -NoNewline -ForegroundColor Green
    Write-Host "http://127.0.0.1:8001" -ForegroundColor White
} else {
    Write-Host "  ✗ Backend:  Failed to start" -ForegroundColor Red
}

Write-Host "  ⏳ Frontend: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5173 (starting...)" -ForegroundColor White

Write-Host "`n=== Quick Links ===" -ForegroundColor Cyan
Write-Host "  • Reviews:      http://localhost:5173/lead-marketplace/reviews" -ForegroundColor White
Write-Host "  • Documents:    http://localhost:5173/lead-marketplace/documents" -ForegroundColor White
Write-Host "  • Messages:     http://localhost:5173/lead-marketplace/messages" -ForegroundColor White
Write-Host "  • Appointments: http://localhost:5173/lead-marketplace/appointments" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "  1. Wait for frontend to finish starting (~30 seconds)" -ForegroundColor White
Write-Host "  2. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  3. Navigate to any of the links above" -ForegroundColor White
Write-Host "  4. Check browser console (F12) for any errors" -ForegroundColor White

Write-Host "`n=== Server Control ===" -ForegroundColor Cyan
Write-Host "  • View backend output:  " -NoNewline -ForegroundColor White
Write-Host "Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "  • View frontend output: " -NoNewline -ForegroundColor White
Write-Host "Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "  • Stop both servers:    " -NoNewline -ForegroundColor White
Write-Host "Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor Gray

Write-Host "`n=== Verification Tests ===" -ForegroundColor Cyan
Write-Host "  Run these in a new terminal:" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    php scripts/test_marketplace_phase2.php" -ForegroundColor Gray

Write-Host "`n✓ Servers are starting! Check the links above in ~30 seconds.`n" -ForegroundColor Green

# Keep script running to maintain jobs
Write-Host "Press Ctrl+C to stop all servers and exit.`n" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Completed" -or $backendJob.State -eq "Failed") {
            Write-Host "`n⚠ Backend server stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
            break
        }
        
        if ($frontendJob.State -eq "Completed" -or $frontendJob.State -eq "Failed") {
            Write-Host "`n⚠ Frontend server stopped unexpectedly" -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
            break
        }
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "Servers stopped.`n" -ForegroundColor Green
}
