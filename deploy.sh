#!/bin/bash

echo "🚀 开始部署..."

# 进入项目目录
cd /var/www/private-fund-visualization

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 重启应用
echo "♻️  重启应用..."
pm2 restart fund-visualization

echo "✅ 部署完成！"
echo "🌐 访问地址: http://your-vps-ip:3000"
