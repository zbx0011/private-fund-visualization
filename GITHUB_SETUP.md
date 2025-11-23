# Git 和 GitHub 配置向导

## 步骤1：配置 Git 用户信息（必须）

在命令行中运行以下命令（请替换为你的信息）：

```powershell
# 设置你的姓名
git config --global user.name "你的名字"

# 设置你的邮箱（建议使用GitHub注册邮箱）
git config --global user.email "your-email@example.com"
```

**示例：**
```powershell
git config --global user.name "Zhang San"
git config --global user.email "zhangsan@example.com"
```

---

## 步骤2：创建GitHub仓库

1. 打开浏览器，访问：https://github.com/new
2. 填写信息：
   - **Repository name（仓库名）**: `private-fund-visualization`
   - **Description（描述）**: 私募基金数据可视化平台
   - **Privacy（隐私）**: 选择 **Private**（私有，推荐）
   - **✅ 重要**: 不要勾选 "Initialize this repository with a README"
3. 点击 **Create repository**（创建仓库）

---

## 步骤3：将代码推送到GitHub

创建完仓库后，GitHub会显示一些命令。我们需要运行这些命令：

```powershell
# 添加GitHub远程仓库（请替换 USERNAME 为你的GitHub用户名）
git remote add origin https://github.com/USERNAME/private-fund-visualization.git

# 推送代码到GitHub
git push -u origin main
```

**如果提示输入用户名和密码：**
- 用户名：你的GitHub用户名
- 密码：需要使用 **Personal Access Token**（不是GitHub登录密码）

**如何创建 Personal Access Token：**
1. 访问：https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 填写：
   - Note: `private-fund-vps`
   - Expiration: 选择有效期
   - 勾选权限：**repo** (全部勾选)
4. 点击 **Generate token**
5. **复制显示的token**（只显示一次，请保存好）
6. 使用这个token作为密码

---

## 步骤4：验证推送成功

访问你的GitHub仓库页面：
```
https://github.com/你的用户名/private-fund-visualization
```

应该能看到所有代码文件。

---

## 完成后告诉我

执行完这些步骤后，告诉我"已完成"，我会继续帮你配置VPS部署。
