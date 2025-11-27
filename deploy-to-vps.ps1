# VPS Deployment Script
# This script updates code and database on the VPS

$VPS_HOST = "172.245.53.67"
$VPS_USER = "root"
$PROJECT_PATH = "/root/private-fund-visualization"

Write-Host "🚀 Starting VPS deployment..." -ForegroundColor Green

# Step 1: Upload database file
Write-Host "`n📦 Step 1: Uploading database..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no data/funds.db "${VPS_USER}@${VPS_HOST}:${PROJECT_PATH}/data/"

# Step 2: Update code on VPS
Write-Host "`n📥 Step 2: Updating code from Git..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" @"
cd ${PROJECT_PATH}
echo '=== Current Git status ==='
git status
echo '`n=== Pulling latest code ==='
git pull origin main
echo '`n=== Installing dependencies ==='
npm install
echo '`n=== Building project ==='
npm run build
echo '`n=== Restarting PM2 ==='
pm2 restart all
pm2 save
echo '`n=== PM2 Status ==='
pm2 list
"@

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Check https://your-domain.com to verify the update" -ForegroundColor Yellow
