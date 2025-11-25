@echo off
echo ==========================================
echo   Complete Sync: Code + Data to VPS
echo ==========================================

set VPS_HOST=172.245.53.67
set VPS_USER=root
set VPS_PATH=/root/private-fund-visualization

echo.
echo [1/3] Syncing code to GitHub...
git add .
git commit -m "sync: update from local"
git push origin main

echo.
echo [2/3] Uploading database to VPS...
scp "e:\私募可视化\private-fund-visualization\data\funds.db" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/data/

echo.
echo [3/3] Pulling latest code on VPS...
ssh %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && git pull origin main && npm install"

echo.
echo ✅ All done! Your VPS is now up to date.
echo.
pause
