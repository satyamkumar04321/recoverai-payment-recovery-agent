@echo off
title RecoverAI Launcher
cd /d "%~dp0"

echo ========================================================
echo               RecoverAI - Starting Services
echo ========================================================
echo.

:: 1. Start FastAPI Backend in new window
echo [1/2] Starting Backend Server (FastAPI + Uvicorn)...
start "RecoverAI - Backend API (Port 8000)" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: 2. Start Vite Frontend in new window
echo [2/2] Starting Frontend Server (React + Vite)...
start "RecoverAI - Frontend UI (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo ========================================================
echo  Donon servers alag windows me start ho chuke hain!
echo  - Frontend UI:  http://localhost:3000
echo  - Backend API:  http://localhost:8000
echo  - Swagger Docs: http://localhost:8000/docs
echo ========================================================
echo.
echo Browser open kar rahe hain (3 seconds)...
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000
exit
