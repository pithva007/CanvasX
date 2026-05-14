@echo off
REM DrawTogether Setup Script for Windows
REM This script sets up both backend and frontend

echo.
echo DrawTogether - Collaborative Whiteboard Setup
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

echo Node.js version:
node -v
echo npm version:
npm -v
echo.

REM Setup backend
echo Setting up backend...
cd server

if not exist .env (
    copy .env.example .env
    echo Created .env file
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install backend dependencies
    exit /b 1
)

echo Backend dependencies installed
cd ..
echo.

REM Setup frontend
echo Setting up frontend...
cd client

if not exist .env (
    copy .env.example .env
    echo Created .env file
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install frontend dependencies
    exit /b 1
)

echo Frontend dependencies installed
cd ..
echo.

REM Summary
echo ================================================
echo Setup complete!
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd server ^&^& npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd client ^&^& npm run dev
echo.
echo Then open http://localhost:5173 in your browser
echo.
echo ================================================
