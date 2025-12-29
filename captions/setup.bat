@echo off
REM Captioning Platform Setup Script for Windows

echo.
echo ========================================
echo Captioning Platform - Setup
echo ========================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed. Please install Python 3.9+ from https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python is installed

echo.
echo Installing Backend Dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..

echo.
echo Installing Python Dependencies...
cd server\python
pip install -r requirements.txt
if errorlevel 1 (
    echo WARNING: Python dependencies installation failed. Some features may not work.
)
echo [OK] Python dependencies installation attempted
cd ..\..

echo.
echo Installing Frontend Dependencies...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update server/.env with your MongoDB URI
echo 2. Run: npm run dev:server (in one terminal)
echo 3. Run: npm run dev:client (in another terminal)
echo.
echo For detailed setup instructions, see README.md
echo.
pause
