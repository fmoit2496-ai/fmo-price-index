@echo off
title Push to GitHub - fmo-price-index
cd /d "%~dp0"
echo ======================================================================
echo   Pushing FMO Aquatic Product Price Index Dashboard to GitHub
echo   Repository: https://github.com/fmoit2496-ai/fmo-price-index.git
echo ======================================================================
echo.
git push -u origin main
echo.
echo ======================================================================
if %errorlevel% equ 0 (
    echo   [SUCCESS] Pushed to GitHub successfully!
) else (
    echo   [ERROR] Push failed. Please check permissions.
)
echo ======================================================================
echo.
pause
