@echo off
cd /d "%~dp0"
echo ========================================================
echo  Deploying FMO Price Dashboard to Cloudflare Pages...
echo ========================================================
npx wrangler pages deploy dist --project-name fmo-price-dashboard
pause
