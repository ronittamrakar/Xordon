# Development startup script for the application

Write-Host 'Starting development environment...' -ForegroundColor Green

# Kill any existing processes on the ports
Write-Host 'Cleaning up existing processes...' -ForegroundColor Yellow

# Kill processes using port 8001 (PHP backend)
$port8001 = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($port8001) {
    $port8001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host 'Killed process on port 8001' -ForegroundColor Yellow
}

# Kill dev-related ports (5173-5179) so Vite can bind exclusively to 5173
$devPorts = 5173..5179
foreach ($p in $devPorts) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object {
            try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
        }
        Write-Host "Killed process(es) on port $p" -ForegroundColor Yellow
    }
}

# NOTE: Port 3003 (XordonForms) no longer needed - Webforms now runs natively in main app

Start-Sleep -Seconds 6

# Check if MySQL is running (XAMPP)
Write-Host 'Checking MySQL connection...' -ForegroundColor Cyan
try {
    $testDb = php -r "try { new PDO('mysql:host=127.0.0.1;port=3306;dbname=xordon', 'root', ''); echo 'OK'; } catch(Exception `$e) { echo 'FAIL'; }" 2>&1
    if ($testDb -match 'OK') {
        Write-Host 'MySQL connection OK' -ForegroundColor Green
    } else {
        Write-Host 'WARNING: MySQL connection failed. Make sure XAMPP MySQL is running!' -ForegroundColor Red
        Write-Host 'Start XAMPP Control Panel and start MySQL before continuing.' -ForegroundColor Yellow
    }
} catch {
    Write-Host 'WARNING: Could not test MySQL connection' -ForegroundColor Yellow
}

# Start the PHP backend server using router.php from project root
Write-Host 'Starting PHP Backend Server on port 8001...' -ForegroundColor Cyan
$phpJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    php -S 127.0.0.1:8001 router.php 2>&1
}
Start-Sleep -Seconds 2

# Verify backend started
$backendTest = Invoke-WebRequest -Uri "http://127.0.0.1:8001/" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
if ($backendTest.StatusCode -eq 200) {
    Write-Host 'PHP Backend started successfully' -ForegroundColor Green
} else {
    Write-Host 'WARNING: PHP Backend may not have started correctly' -ForegroundColor Yellow
}

# Start the Vite dev server
Write-Host 'Starting Vite Dev Server on port 5173...' -ForegroundColor Cyan
$viteJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}
Start-Sleep -Seconds 3

# Verify Vite bound to 5173 with retry (up to 6 attempts, 1s interval)
$maxAttempts = 6
$attempt = 0
$viteConn = $null
while (($attempt -lt $maxAttempts) -and -not $viteConn) {
    $attempt++
    $viteConn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($viteConn) { break }
    Start-Sleep -Seconds 1
}
if (-not $viteConn) {
    Write-Host "ERROR: Vite did not bind to port 5173 after $maxAttempts attempts. Fetching job output..." -ForegroundColor Red
    Receive-Job -Id $viteJob.Id -Keep
    Write-Host 'Exiting due to Vite not binding to required port.' -ForegroundColor Red
    Exit 1
} else {
    Write-Host "Vite is listening on port 5173 (after $attempt attempt(s))" -ForegroundColor Green
}

# NOTE: XordonForms dev server removed - Webforms now runs natively in main app at /webforms/*

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host 'Development environment started!' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Frontend: http://localhost:5173/' -ForegroundColor Cyan
Write-Host 'API:      http://localhost:8001/' -ForegroundColor Cyan
Write-Host 'WebForms: http://localhost:5173/webforms/' -ForegroundColor Cyan
Write-Host ''
Write-Host 'IMPORTANT: Clear browser localStorage if you see auth errors:' -ForegroundColor Yellow
Write-Host '  1. Open DevTools (F12)' -ForegroundColor White
Write-Host '  2. Go to Application > Local Storage' -ForegroundColor White
Write-Host '  3. Clear all items for localhost:5173' -ForegroundColor White
Write-Host '  4. Refresh the page' -ForegroundColor White
Write-Host ''
Write-Host 'Press Ctrl+C to stop the servers' -ForegroundColor Yellow

# Keep script running and show output
try {
    while ($true) {
        # Check if jobs are still running
        $phpStatus = Get-Job -Id $phpJob.Id -ErrorAction SilentlyContinue
        $viteStatus = Get-Job -Id $viteJob.Id -ErrorAction SilentlyContinue
        
        if ($phpStatus.State -eq 'Failed') {
            Write-Host 'PHP Backend stopped unexpectedly!' -ForegroundColor Red
            Receive-Job -Id $phpJob.Id
        }
        if ($viteStatus.State -eq 'Failed') {
            Write-Host 'Vite server stopped unexpectedly!' -ForegroundColor Red
            Receive-Job -Id $viteJob.Id
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host 'Stopping servers...' -ForegroundColor Yellow
    Stop-Job -Id $phpJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $viteJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $phpJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $viteJob.Id -ErrorAction SilentlyContinue
}
