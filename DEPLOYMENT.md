# RackNerd VPS 部署指南

## 一、首次部署（只需做一次）

### 1. 登录VPS
```bash
ssh root@your-racknerd-ip
```

### 2. 安装Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # 验证安装
```

### 3. 安装PM2
```bash
sudo npm install -g pm2
```

### 4. 安装Git（如果没有）
```bash
sudo apt-get install git
```

### 5. 克隆项目到VPS
```bash
cd /var/www
git clone https://github.com/你的用户名/private-fund-visualization.git
cd private-fund-visualization
```

### 6. 安装依赖并构建
```bash
npm install
npm run build
```

### 7. 启动应用
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. 配置防火墙
```bash
sudo ufw allow 3000
sudo ufw allow 22  # SSH
```

### 9. 访问网站
浏览器打开：`http://你的VPS_IP:3000`

---

## 二、日常更新（每次修改后）

### 本地操作：
```bash
# 1. 提交代码
git add .
git commit -m "更新描述"
git push
```

### VPS操作：
```bash
# 2. SSH登录VPS
ssh root@your-racknerd-ip

# 3. 运行更新脚本
cd /var/www/private-fund-visualization
./deploy.sh
```

就这么简单！2分钟完成更新。

---

## 三、常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs fund-visualization

# 重启应用
pm2 restart fund-visualization

# 停止应用
pm2 stop fund-visualization
```

---

## 四、绑定域名（可选）

如果你有域名，可以绑定：

1. 域名DNS添加A记录，指向VPS IP
2. 安装Nginx：`sudo apt install nginx`
3. 配置Nginx代理到3000端口
4. 使用Let's Encrypt配置HTTPS

需要帮助可以随时问我！
