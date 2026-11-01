@echo off
cd /d "%~dp0"
echo Starting fictional CareBridge test hospital on http://127.0.0.1:4300
call npm.cmd run hospital:start
pause
