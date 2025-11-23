# VPS 部署完整指南

##  GitHub仓库已创建

你的代码仓库：https://github.com/zbx0011/private-fund-visualization

---

## 第一步：登录RackNerd VPS

使用SSH登录你的VPS（替换为你的VPS IP）：

`ash
ssh root@your-vps-ip
`

---

## 第二步：安装Node.js和PM2

`ash
# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v

# 安装PM2（进程管理器）
sudo npm install -g pm2

# 安装Git（如果没有）
sudo apt-get install git -y
`

---

## 第三步：克隆项目到VPS

`ash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆项目
git clone https://github.com/zbx0011/private-fund-visualization.git

# 进入项目目录
cd private-fund-visualization
`

---

## 第四步：配置环境变量

`ash
# 创建.env文件
nano .env
`

在文件中添加（按Ctrl+X，然后Y保存）：
`
LARK_APP_ID=你的飞书APP_ID
LARK_APP_SECRET=你的飞书APP_SECRET
`

---

## 第五步：安装依赖并构建

`ash
# 安装依赖
npm install

# 构建项目
npm run build
`

---

## 第六步：启动应用

`ash
# 使用PM2启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
`

---

## 第七步：配置防火墙

`ash
# 允许3000端口
sudo ufw allow 3000

# 允许SSH（重要！）
sudo ufw allow 22

# 启用防火墙
sudo ufw enable
`

---

## 第八步：访问网站

在浏览器中打开：
`
http://你的VPS_IP:3000
`

---

##  日常更新流程

以后修改代码后，只需要：

### 本地操作：
`powershell
git add .
git commit -m "更新描述"
git push
`

### VPS操作：
`ash
ssh root@your-vps-ip
cd /var/www/private-fund-visualization
./deploy.sh
`

就这么简单！

---

##  常用命令

`ash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs fund-visualization

# 重启应用
pm2 restart fund-visualization

# 停止应用
pm2 stop fund-visualization
`

---

##  注意事项

1. **数据库文件**：第一次部署时，数据库是空的，需要运行数据同步脚本
2. **端口访问**：确保VPS服务商的防火墙也开放了3000端口

祝部署顺利！
