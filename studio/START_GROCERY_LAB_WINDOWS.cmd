@echo off
cd /d "%~dp0"
title Sprout and Stone - Local Grocery Lab
node --version >NUL 2>&1
if errorlevel 1 (
 echo Node.js is not installed. Install Node.js 22+ first.
 pause
 exit /b 1
)
echo Starting synthetic grocery lab on http://127.0.0.1:4200
npm.cmd run lab:start
pause
