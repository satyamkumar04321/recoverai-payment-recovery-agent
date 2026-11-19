$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host "=========================================" -ForegroundColor Green
Write-Host "     RecoverAI Services Launching...     " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# 1. Start FastAPI Backend
Write-Host "[1/2] Starting FastAPI Backend on port 8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root`" && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

# 2. Start Vite Frontend
Write-Host "[2/2] Starting React Vite Frontend on port 3000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\frontend`" && npm.cmd run dev"

Start-Sleep -Seconds 3
Write-Host "Opening http://localhost:3000 in your browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

