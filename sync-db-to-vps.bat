@echo off
echo ==========================================
echo      Database Sync to VPS
echo ==========================================

set VPS_HOST=172.245.53.67
set VPS_USER=root
set VPS_PATH=/root/private-fund-visualization/data
set LOCAL_DB=e:\私募可视化\private-fund-visualization\data\funds.db

echo.
echo [1/2] Uploading database to VPS...
echo      - Source: %LOCAL_DB%
echo      - Target: %VPS_USER%@%VPS_HOST%:%VPS_PATH%/funds.db
echo.

REM Upload database using SCP (you will be prompted for password)
scp "%LOCAL_DB%" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/funds.db

if %errorlevel% equ 0 (
    echo.
    echo [2/2] ✅ Database synced successfully!
    echo.
    echo      Your VPS now has the latest data.
    echo      Check: http://172.245.53.67:3000/monitor
) else (
    echo.
    echo [2/2] ❌ Failed to sync database.
)

echo.
pause
