@echo off
REM Development startup script for the application

echo.
echo ========================================
echo Starting Development Environment
echo ========================================
echo.

REM Kill any existing node processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Start the development server (Backend + Frontend)
echo Starting npm run dev...
npm run dev

echo.
echo Servers stopped.
pause
