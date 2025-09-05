@echo off
echo.
echo ========================================
echo    TwinSpires VPS Auto-Installer
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js from https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

echo.
echo 📦 Installing dependencies...
npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!

REM Check if .env exists
if not exist .env (
    echo.
    echo 📝 Creating .env file...
    copy env-example.txt .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file and add your SUPABASE_SERVICE_KEY
    echo.
)

echo.
echo ========================================
echo        Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Edit .env file with your SUPABASE_SERVICE_KEY
echo 2. Test: npm run manual
echo 3. Start: npm start
echo.
echo Or use PM2 for background operation:
echo   npm install -g pm2
echo   pm2 start scheduler.js --name twinspires-scraper
echo.
pause
