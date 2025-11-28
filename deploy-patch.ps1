$VPS_HOST = "172.245.53.67"
$VPS_USER = "root"
$PROJECT_PATH = "/root/private-fund-visualization"

Write-Host "🚀 Starting PATCH deployment..." -ForegroundColor Green
Write-Host "This will only upload the 5 modified files to avoid connection timeouts."

# 1. Ensure directories exist (especially the new contexts folder)
Write-Host "`n📁 Ensuring remote directories exist..."
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "mkdir -p ${PROJECT_PATH}/src/contexts"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to connect to VPS. You might be blocked. Try waiting a few minutes."
    exit 1
}

# 2. Upload files
$FILES = @(
    "src/lib/database-server.ts",
    "src/components/modules/OverviewModule.tsx",
    "src/app/page.tsx",
    "src/contexts/DashboardContext.tsx",
    "src/app/layout.tsx"
)

Write-Host "`n📤 Uploading modified files..."
foreach ($file in $FILES) {
    Write-Host "  Uploading $file ..."
    scp -o StrictHostKeyChecking=no $file "${VPS_USER}@${VPS_HOST}:${PROJECT_PATH}/$file"
}

# 3. Build and Restart
Write-Host "`n🛠️  Building and Restarting (this may take a minute)..."
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "cd ${PROJECT_PATH} && npm run build && pm2 restart all"

Write-Host "`n✅ Patch Complete! Please refresh your browser." -ForegroundColor Green
