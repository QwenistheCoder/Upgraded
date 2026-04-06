@echo off
title RaiSK Upgraded Client
cd /d "%~dp0client"
echo ========================================
echo   RaiSK Upgraded - Starting Client...
echo ========================================
echo.
echo  Opening browser shortly...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
npx vite dev
pause
