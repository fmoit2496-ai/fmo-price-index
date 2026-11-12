@echo off
cd /d "%~dp0"
echo Starting FMO Price Dashboard...
start http://localhost:3000
node server.js
pause
