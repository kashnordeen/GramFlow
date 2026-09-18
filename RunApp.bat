@echo off
title GramFlow Inventory App Server
color 0A

echo ===================================================
echo     GRAMFLOW INVENTORY APP - AUTO SERVER RUNNER
echo ===================================================
echo.
echo  1. Starting Next.js Network Server...
echo  2. Opening http://localhost:3000 in your browser...
echo.
echo  (Keep this window open while using the app)
echo ===================================================
echo.

cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: .env is missing. Copy .env.example to .env and configure PostgreSQL.
  pause
  exit /b 1
)

echo Checking database migrations...
call npm run db:migrate
if errorlevel 1 (
  echo ERROR: Database setup failed. Check DATABASE_URL and PostgreSQL.
  pause
  exit /b 1
)

:: Launch default browser after 3 seconds delay in background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start the network server
call npm run dev:network
