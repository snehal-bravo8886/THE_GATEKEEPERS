@echo off
cd /d "%~dp0"
title CanTheySeeIt - Security Dashboard
node --version >NUL 2>&1
if errorlevel 1 (
 echo Node.js is not installed. Install Node.js 22+ first.
 pause
 exit /b 1
)
if not exist "node_modules\tsx" (
 echo First-run install: npm.cmd install
 npm.cmd install
 if errorlevel 1 (
  echo Dependency installation failed; check internet and run npm.cmd install manually.
  pause
  exit /b 1
 )
)
echo Opening http://127.0.0.1:4100
start "" "http://127.0.0.1:4100"
npm.cmd run dev
pause
