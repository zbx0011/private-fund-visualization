@echo off
chcp 65001 >nul
echo ========================================
echo   每日数据同步脚本
echo ========================================
echo.

:: 配置VPS信息
set VPS_IP=172.245.53.67
set VPS_USER=root

:: 获取当前日期
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATE=%datetime:~0,8%

echo [1/5] 启动本地开发服务器（如果未运行）...
echo 请确保 npm run dev 正在运行，按任意键继续...
pause >nul

echo.
echo [2/5] 同步飞书多维表格数据...
curl -X POST http://localhost:3000/api/lark-sync ^
  -H "Content-Type: application/json" ^
  -d "{\"appId\":\"cli_a81419422b37901c\",\"appSecret\":\"eP5Gc83r0Avd20kKLVqyHbAiaZMdvFKa\",\"appToken\":\"MKTubHkUKa13gbs9WdNcQNvsn3f\",\"autoDetectTable\":true}"

if %ERRORLEVEL% neq 0 (
    echo ❌ 飞书同步失败！
    pause
    exit /b 1
)
echo ✅ 飞书同步完成

echo.
echo [3/5] 抓取外部监控数据...
node scripts\scrape-qyyjt-with-login.js

if %ERRORLEVEL% neq 0 (
    echo ❌ 外部监控抓取失败！
    pause
    exit /b 1
)
echo ✅ 外部监控抓取完成

echo.
echo [4/5] 打包数据库文件...
tar -czf funds-db-%DATE%.tar.gz data\funds.db

if %ERRORLEVEL% neq 0 (
    echo ❌ 数据库打包失败！
    pause
    exit /b 1
)
echo ✅ 数据库已打包: funds-db-%DATE%.tar.gz

echo.
echo [5/5] 上传至VPS...
scp funds-db-%DATE%.tar.gz %VPS_USER%@%VPS_IP%:/tmp/

if %ERRORLEVEL% neq 0 (
    echo ❌ 上传失败！请检查SSH连接
    pause
    exit /b 1
)
echo ✅ 上传完成

echo.
echo ========================================
echo   本地同步完成！
echo ========================================
echo.
echo 📦 数据库文件: funds-db-%DATE%.tar.gz
echo 📤 已上传至: %VPS_USER%@%VPS_IP%:/tmp/
echo.
echo 下一步：请登录VPS并运行:
echo   cd /var/www/private-fund-visualization
echo   ./apply-db-update.sh
echo.
pause
