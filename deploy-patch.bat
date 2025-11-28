@echo off
chcp 65001
echo ==========================================
echo 🚀 Starting Patch Deployment (Batch Mode)
echo ==========================================
echo.
echo This script will upload 5 modified files and restart the service.
echo You should be asked for your password multiple times (once for each file).
echo Password: Y6t1A5kp7f0PK3moOR
echo.

echo 1. Creating remote directory...
ssh -o StrictHostKeyChecking=no root@172.245.53.67 "mkdir -p /root/private-fund-visualization/src/contexts && mkdir -p /root/private-fund-visualization/src/app/api/yield-curve"

echo.
echo 2. Uploading database-server.ts...
scp -o StrictHostKeyChecking=no src/lib/database-server.ts root@172.245.53.67:/root/private-fund-visualization/src/lib/

echo.
echo 2.0 Uploading external-monitor-db.ts...
scp -o StrictHostKeyChecking=no src/lib/external-monitor-db.ts root@172.245.53.67:/root/private-fund-visualization/src/lib/

echo.
echo 2.1 Uploading yield-curve API...
scp -o StrictHostKeyChecking=no src/app/api/yield-curve/route.ts root@172.245.53.67:/root/private-fund-visualization/src/app/api/yield-curve/

echo.
echo 3. Uploading OverviewModule.tsx...
scp -o StrictHostKeyChecking=no src/components/modules/OverviewModule.tsx root@172.245.53.67:/root/private-fund-visualization/src/components/modules/

echo.
echo 3.1 Uploading FundChartModal.tsx...
scp -o StrictHostKeyChecking=no src/components/ui/fund-chart-modal.tsx root@172.245.53.67:/root/private-fund-visualization/src/components/ui/

echo.
echo 3.2 Uploading ProfitAnalysisChart.tsx...
scp -o StrictHostKeyChecking=no src/components/charts/ProfitAnalysisChart.tsx root@172.245.53.67:/root/private-fund-visualization/src/components/charts/
echo.
echo 6. Uploading layout.tsx...
scp -o StrictHostKeyChecking=no src/app/layout.tsx root@172.245.53.67:/root/private-fund-visualization/src/app/

echo.
echo 7. Building and Restarting...
ssh -o StrictHostKeyChecking=no root@172.245.53.67 "cd /root/private-fund-visualization && npm run build && pm2 restart all"

echo.
echo ✅ Done!
pause
