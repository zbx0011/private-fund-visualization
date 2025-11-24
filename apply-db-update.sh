#!/bin/bash

echo "========================================"
echo "  VPS 数据库更新脚本"
echo "========================================"
echo ""

# 配置
PROJECT_DIR="/var/www/private-fund-visualization"
DB_FILE="data/funds.db"
BACKUP_DIR="$PROJECT_DIR/backups"

# 切换到项目目录
cd "$PROJECT_DIR" || exit 1

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 查找最新的数据库包
LATEST_DB=$(ls -t /tmp/funds-db-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_DB" ]; then
    echo "❌ 错误: 在 /tmp/ 目录下找不到数据库文件"
    echo "请确保已运行本地同步脚本上传数据库"
    exit 1
fi

echo "[1/4] 找到数据库文件: $LATEST_DB"
echo ""

# 备份当前数据库
echo "[2/4] 备份当前数据库..."
BACKUP_NAME="funds-db-backup-$(date +%Y%m%d-%H%M%S).db"
cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_NAME"

if [ $? -eq 0 ]; then
    echo "✅ 备份成功: $BACKUP_DIR/$BACKUP_NAME"
else
    echo "❌ 备份失败！"
    exit 1
fi
echo ""

# 解压新数据库
echo "[3/4] 应用新数据库..."
tar -xzf "$LATEST_DB" -C "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    echo "✅ 数据库更新成功"
else
    echo "❌ 数据库更新失败！正在恢复备份..."
    cp "$BACKUP_DIR/$BACKUP_NAME" "$DB_FILE"
    exit 1
fi
echo ""

# 重启应用
echo "[4/4] 重启应用..."
pm2 restart fund-app

if [ $? -eq 0 ]; then
    echo "✅ 应用重启成功"
else
    echo "⚠️  应用重启失败，请手动检查"
fi
echo ""

# 清理旧备份（保留最近7天）
echo "清理旧备份（保留最近7天）..."
find "$BACKUP_DIR" -name "funds-db-backup-*.db" -mtime +7 -delete
echo ""

echo "========================================"
echo "  数据库更新完成！"
echo "========================================"
echo ""
echo "📊 当前数据库: $DB_FILE"
echo "💾 备份位置: $BACKUP_DIR/$BACKUP_NAME"
echo "🔗 网站地址: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "运行 'pm2 logs fund-app' 查看应用日志"
echo ""
