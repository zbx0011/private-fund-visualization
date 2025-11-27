@echo off
chcp 65001 >nul
echo ========================================
echo   完整代码同步到VPS脚本
echo ========================================
echo.

:: 配置VPS信息
set VPS_IP=172.245.53.67
set VPS_USER=root
set VPS_PATH=/var/www/private-fund-visualization

:: 获取当前日期
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATE=%datetime:~0,8%
set TIMESTAMP=%datetime:~0,12%

echo [1/6] 打包本地项目代码...
:: 创建排除数据库和临时文件的tar包
tar --exclude=data/funds.db --exclude=data/lark*.json --exclude=data/monitor*.json --exclude=node_modules --exclude=.next --exclude=.git --exclude=*.tar.gz --exclude=*.bat --exclude=sync-to-vps.bat -czf /tmp/private-fund-visualization-%DATE%.tar.gz .

if %ERRORLEVEL% neq 0 (
    echo ❌ 代码打包失败！
    pause
    exit /b 1
)
echo ✅ 代码已打包: private-fund-visualization-%DATE%.tar.gz

echo.
echo [2/6] 上传代码到VPS...
scp private-fund-visualization-%DATE%.tar.gz %VPS_USER%@%VPS_IP%:/tmp/

if %ERRORLEVEL% neq 0 (
    echo ❌ 代码上传失败！请检查SSH连接
    pause
    exit /b 1
)
echo ✅ 代码上传完成

echo.
echo [3/6] 在VPS上部署新代码...
ssh %VPS_USER%@%VPS_IP% "cd /tmp && tar -xzf private-fund-visualization-%DATE%.tar.gz -C %VPS_PATH% && chown -R www-data:www-data %VPS_PATH% && chmod -R 755 %VPS_PATH%"

if %ERRORLEVEL% neq 0 (
    echo ❌ 代码部署失败！
    pause
    exit /b 1
)
echo ✅ 代码部署完成

echo.
echo [4/6] 同步飞书多维表格数据...
curl -X POST http://localhost:3003/api/lark-sync ^
  -H "Content-Type: application/json" ^
  -d "{\"appId\":\"cli_a81419422b37901c\",\"appSecret\":\"eP5Gc83r0Avd20kKLVqyHbAiaZMdvFKa\",\"appToken\":\"MKTubHkUKa13gbs9WdNcQNvsn3f\",\"autoDetectTable\":true}"

if %ERRORLEVEL% neq 0 (
    echo ❌ 飞书同步失败！
    pause
    exit /b 1
)
echo ✅ 飞书同步完成

echo.
echo [5/6] 抓取外部监控数据...
node scripts/merge-and-calculate.js

if %ERRORLEVEL% neq 0 (
    echo ❌ 数据计算失败！
    pause
    exit /b 1
)
echo ✅ 数据计算完成

echo.
echo [6/6] 打包并上传数据库...
tar -czf funds-db-%DATE%.tar.gz data/funds.db

scp funds-db-%DATE%.tar.gz %VPS_USER%@%VPS_IP%:/tmp/

if %ERRORLEVEL% neq 0 (
    echo ❌ 数据库上传失败！
    pause
    exit /b 1
)

:: 在VPS上更新数据库
ssh %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && tar -xzf /tmp/funds-db-%DATE%.tar.gz && chown www-data:www-data data/funds.db && chmod 644 data/funds.db"

if %ERRORLEVEL% neq 0 (
    echo ❌ 数据库更新失败！
    pause
    exit /b 1
)
echo ✅ 数据库更新完成

echo.
echo [7/6] 在VPS上重启服务...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && pm2 restart private-fund-visualization"

if %ERRORLEVEL% neq 0 (
    echo ⚠️  服务重启失败，请手动重启或检查PM2状态
    echo 可以运行: ssh %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && pm2 status"
)

echo.
echo ========================================
echo   完整同步完成！
echo ========================================
echo.
echo 📦 代码包: private-fund-visualization-%DATE%.tar.gz
echo 🗄️  数据库: funds-db-%DATE%.tar.gz
echo 🚀 VPS路径: %VPS_PATH%
echo 📊 VPS访问: http://%VPS_IP%:3003
echo.
echo 清理临时文件...
del private-fund-visualization-%DATE%.tar.gz
del funds-db-%DATE%.tar.gz

echo.
echo ✅ 同步完成！请访问 http://%VPS_IP%:3003 查看更新
echo.
pause