@echo off
echo ==========================================
echo      Private Fund Scraper Automation
echo ==========================================

echo.
echo [1/3] Checking for running Edge processes...
taskkill /F /IM msedge.exe /T >nul 2>&1
if %errorlevel% equ 0 (
    echo      - Edge processes terminated.
) else (
    echo      - No Edge processes found (Clean).
)

echo.
echo [2/3] Starting Scraper...
echo      - Target: https://www.qyyjt.cn/combination/20250603164207
echo.

call npm run scrape:edge -- "https://www.qyyjt.cn/combination/20250603164207"

echo.
echo [3/3] Done!
echo.
pause
