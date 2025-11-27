# Full Project Deployment Script
# This script archives the current project and deploys it to VPS
# ensuring an EXACT copy of local code and data.

$VPS_HOST = "172.245.53.67"
$VPS_USER = "root"
$PROJECT_PATH = "/root/private-fund-visualization"
$ARCHIVE_NAME = "deploy_package.tar.gz"

Write-Host "🚀 Starting FULL VPS deployment..." -ForegroundColor Green

# Step 1: Create Archive
Write-Host "`n📦 Step 1: Archiving project (excluding node_modules, .git, .next)..." -ForegroundColor Cyan
# Note: Windows tar might need specific syntax for exclusions
# We use --exclude before the target to ensure it works on most versions
tar -czvf $ARCHIVE_NAME --exclude=node_modules --exclude=.git --exclude=.next --exclude=$ARCHIVE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create archive"
    exit 1
}

# Step 2: Upload Archive
Write-Host "`n📤 Step 2: Uploading archive to VPS..." -ForegroundColor Cyan
# Using scp (will prompt for password)
scp -o StrictHostKeyChecking=no $ARCHIVE_NAME "${VPS_USER}@${VPS_HOST}:/root/"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload archive"
    exit 1
}

# Step 3: Deploy on VPS
Write-Host "`n🛠️  Step 3: Extracting and building on VPS..." -ForegroundColor Cyan

# Define the remote commands
# Note: We escape $ with ` (backtick) to prevent PowerShell from expanding it
# We will also strip carriage returns (`r) to prevent bash errors
$remoteCommands = @"
# Stop services
pm2 stop all || true

# Backup old data just in case
if [ -d ${PROJECT_PATH}/data ]; then
    echo "Backing up data..."
    cp -r ${PROJECT_PATH}/data /root/data_backup_`$(date +%s)
fi

# Clean old directory but keep data if moving failed (safety)
rm -rf ${PROJECT_PATH}
mkdir -p ${PROJECT_PATH}

# Extract archive
echo "Extracting archive..."
tar -xzvf /root/${ARCHIVE_NAME} -C ${PROJECT_PATH}

# Cleanup archive
rm /root/${ARCHIVE_NAME}

# Setup and Build
cd ${PROJECT_PATH}
echo 'Installing dependencies...'
npm install
echo 'Building project...'
npm run build

# Restart
echo 'Restarting services...'
pm2 restart all || pm2 start npm --name 'fund-viz' -- start
pm2 save
pm2 list
"@

# Remove carriage returns (CR) which cause "command not found" errors in Linux bash
$remoteCommands = $remoteCommands -replace "`r", ""

# Execute via SSH
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $remoteCommands

# Cleanup local archive
if (Test-Path $ARCHIVE_NAME) {
    Remove-Item $ARCHIVE_NAME
}

Write-Host "`n✅ Full Deployment Complete!" -ForegroundColor Green
