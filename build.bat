@echo off
title Build FMO Price Dashboard
cd /d "%~dp0"
echo ========================================================
echo   Building FMO Aquatic Product Price Index Dashboard...
echo ========================================================
node build.js
echo ========================================================
pause
