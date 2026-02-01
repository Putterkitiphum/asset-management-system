@echo off
echo ========================================
echo 🚀 Starting Asset Management System
echo ========================================
echo.

echo 📦 Installing dependencies if needed...
call npm install

echo.
echo 🔧 Starting Backend Server...
start cmd /k "cd backend && npm run dev"

echo 🔧 Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers are starting...
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo.
echo Press any key to open the application...
pause > nul
start http://localhost:3000

echo.
echo To stop both servers, close all command windows.
pause