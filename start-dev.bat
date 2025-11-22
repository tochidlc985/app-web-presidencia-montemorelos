@echo off
REM Montemorelos Presidency App - Windows Startup Script

echo 🚀 Starting Montemorelos Presidency App...

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
if errorlevel 1 (
    echo ⚠️  MongoDB is not running. Please start MongoDB first.
    echo    Try: mongod --dbpath C:\path\to\your\db
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the development server
echo 🌐 Starting development server...
start cmd /k "npm run dev"

REM Start the backend server
echo 🔙 Starting backend server...
start cmd /k "npm run server"

pause
