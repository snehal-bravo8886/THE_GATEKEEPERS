@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 22+ required & pause & exit /b 1)
start "AETHER College Fest (Port 4400)" cmd /k "npm.cmd run fest:start"
if not exist node_modules npm.cmd install
npm.cmd run dev
pause
