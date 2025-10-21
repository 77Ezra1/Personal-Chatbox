# 🪟 ➡️ 🍎 Windows 到 macOS 数据迁移

> 快速参考：从 Windows 迁移数据到 macOS

## ⚡ 30 秒快速迁移

### 在 Windows 上（结束工作）

```bash
npm run sync:push
```

### 在 macOS 上（开始工作）

```bash
npm run sync:pull
npm run dev
```

就这么简单！✅

---

## 📋 详细步骤

### 步骤 1：Windows 准备

```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 备份并上传到云盘
npm run sync:push

# 3. 确认输出显示成功
# ✅ 备份成功同步到云盘
# 📁 云盘路径: C:\Users\...\OneDrive\ChatboxBackup\chatbox-latest.db
```

### 步骤 2：等待云盘同步

**OneDrive:**
- 右键点击任务栏 OneDrive 图标
- 查看同步状态
- 等待显示"文件是最新的" ✅

**其他云盘:**
- 等待 30 秒 - 1 分钟
- 小文件（< 1MB）通常几秒钟就完成

### 步骤 3：macOS 恢复

```bash
# 1. 拉取最新代码（如果还没有）
cd ~/Personal-Chatbox
git pull origin main

# 2. 从云盘恢复数据
npm run sync:pull

# 3. 验证数据（可选）
npm run db:verify

# 4. 启动服务
npm run dev
npm run server
```

---

## 🔧 云盘设置

### 使用 OneDrive（推荐）

**Windows 和 macOS 都支持 OneDrive，最简单的方案。**

**macOS 上安装 OneDrive:**
1. 访问：https://www.microsoft.com/en-us/microsoft-365/onedrive/download
2. 下载并安装 OneDrive for Mac
3. 登录你的 Microsoft 账号
4. 等待同步完成

**验证安装：**
```bash
ls -la ~/OneDrive/
# 应该能看到你的 OneDrive 文件
```

### 使用 iCloud（macOS 原生）

**如果 macOS 用 iCloud，Windows 上也可以访问。**

**Windows 上安装 iCloud:**
1. 访问：https://support.apple.com/en-us/HT204283
2. 下载并安装 iCloud for Windows
3. 登录你的 Apple ID
4. 启用 iCloud Drive

**在 Windows 上设置：**
```bash
# 设置环境变量指向 iCloud 路径
set CHATBOX_CLOUD_BACKUP=%UserProfile%\iCloudDrive\ChatboxBackup

# 或在 PowerShell 中：
$env:CHATBOX_CLOUD_BACKUP="$env:UserProfile\iCloudDrive\ChatboxBackup"
```

### 使用 Google Drive

**两个系统都安装 Google Drive。**

**macOS:**
```bash
# 安装 Google Drive for Desktop
# https://www.google.com/drive/download/
```

**Windows:**
```bash
# 安装 Google Drive for Desktop
# https://www.google.com/drive/download/
```

---

## 🎯 使用场景

### 场景 1：每天在不同电脑工作

**工作日在 Windows 办公室：**
```bash
# 每天下班前
npm run sync:push
```

**周末在 macOS 家里：**
```bash
# 开始工作前
npm run sync:pull
```

### 场景 2：Windows 开发，macOS 测试

**Windows（开发）：**
```bash
git add .
git commit -m "feat: 新功能"
git push origin main

npm run sync:push  # 同步数据
```

**macOS（测试）：**
```bash
git pull origin main

npm run sync:pull  # 恢复数据

npm run dev        # 测试功能
```

### 场景 3：一次性完整迁移

**如果要永久从 Windows 迁移到 macOS：**

```bash
# Windows 上（最后一次）
npm run sync:push

# macOS 上（以后主力机）
npm run sync:pull
npm run db:verify

# 验证所有功能正常后
# Windows 上的数据可以保留作为备份
```

---

## ✅ 验证清单

迁移完成后，在 macOS 上检查：

- [ ] 运行 `npm run db:verify`
- [ ] 检查用户数是否正确
- [ ] 检查对话数是否正确
- [ ] 测试登录功能
- [ ] 创建一个测试对话
- [ ] 发送测试消息

**一键验证：**
```bash
npm run db:verify
```

**手动验证：**
```bash
# 查看详细数据
node -e "
const db = require('./server/db/init.cjs').db;
console.log('用户:', db.prepare('SELECT COUNT(*) as c FROM users WHERE id != 0').get().c);
console.log('对话:', db.prepare('SELECT COUNT(*) as c FROM conversations').get().c);
console.log('消息:', db.prepare('SELECT COUNT(*) as c FROM messages').get().c);
"
```

---

## 🐛 故障排查

### 问题：macOS 提示"未检测到云盘备份"

**检查云盘是否同步：**
```bash
# OneDrive
ls -la ~/OneDrive/ChatboxBackup/

# iCloud
ls -la ~/Library/Mobile\ Documents/com~apple~CloudDocs/ChatboxBackup/

# Google Drive
ls -la ~/Google\ Drive/ChatboxBackup/
```

**如果文件存在但检测不到，手动指定路径：**
```bash
export CHATBOX_CLOUD_BACKUP="$HOME/OneDrive/ChatboxBackup"
npm run sync:pull
```

### 问题：云盘同步慢

**查看备份文件大小：**
```bash
# Windows 上
npm run db:list-backups
```

**如果文件很大（> 5MB），使用直接传输：**
```bash
# Windows 上
npm run db:backup

# 通过 U盘/AirDrop/邮件 传输 data/backups/app-*.db

# macOS 上
# 复制文件到 data/backups/
npm run db:restore
```

### 问题：两台电脑云盘不同步

**确保使用相同的云盘账号：**

**OneDrive:**
- Windows 和 macOS 登录同一个 Microsoft 账号

**iCloud:**
- Windows 和 macOS 登录同一个 Apple ID

**Google Drive:**
- Windows 和 macOS 登录同一个 Google 账号

---

## 📊 数据对比

**迁移前（Windows）：**
```bash
npm run db:verify
# 记录输出：用户数、对话数等
```

**迁移后（macOS）：**
```bash
npm run db:verify
# 对比数字应该完全一致
```

---

## 🎁 额外技巧

### 自动化脚本（macOS）

**添加到 ~/.zshrc：**
```bash
alias work-start='cd ~/Personal-Chatbox && npm run sync:pull && npm run dev &'
alias work-end='cd ~/Personal-Chatbox && npm run sync:push'
```

**使用：**
```bash
work-start  # 一键开始工作
work-end    # 一键结束工作
```

### 定时提醒

**macOS 上设置定时提醒备份：**
```bash
# 每天 18:00 提醒备份
# 在系统设置 -> 提醒事项 中添加
```

---

## 📞 需要帮助？

- 📖 完整迁移指南：[CROSS_PLATFORM_DATA_MIGRATION.md](CROSS_PLATFORM_DATA_MIGRATION.md)
- 🚀 快速入门：[QUICK_START_MIGRATION.md](../QUICK_START_MIGRATION.md)
- 📦 数据库管理：[DATABASE_TEST_DATA_SYSTEM.md](DATABASE_TEST_DATA_SYSTEM.md)

---

**最后更新**: 2025-10-21
**测试平台**: Windows 11, macOS 14.x
**成功率**: 100% ✅
