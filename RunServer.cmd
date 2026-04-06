@echo off
title RaiSK Upgraded Server
cd /d "%~dp0server"
echo ========================================
echo   RaiSK Upgraded - Starting Server...
echo ========================================
echo.
npx tsx src/index.ts
pause
