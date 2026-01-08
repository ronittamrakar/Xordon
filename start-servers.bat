@echo off
echo ========================================
echo Starting Xordon Application Servers
echo ========================================
echo.

REM Check if backend server is already running on port 8001
netstat -ano | findstr :8001 > nul
if %errorlevel% equ 0 (
    echo [INFO] Backend server already running on port 8001
) else (
    echo [INFO] Starting backend server on port 8001...
    start "Xordon Backend" cmd /k "php -S 127.0.0.1:8001 -t backend/public backend/router.php"
    timeout /t 2 /nobreak > nul
)

REM Check if frontend server is already running on port 5173
netstat -ano | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo [INFO] Frontend server already running on port 5173
) else (
    echo [INFO] Starting frontend server...
    start "Xordon Frontend" cmd /k "npm run dev:frontend"
)

echo.
echo ========================================
echo Backend Server: http://localhost:8001
echo Frontend Server: http://localhost:5173
echo API Test Page: http://localhost:5173/api-test.html
echo ========================================
echo.
echo [INFO] Both servers should now be running in separate windows.
echo [INFO] Press Ctrl+C in each window to stop the servers.
echo.
pause
