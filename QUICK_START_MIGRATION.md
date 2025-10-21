# 🚀 跨平台数据迁移快速指南

> 在 macOS 和 Windows 间快速同步数据库数据

## ⚡ 超快速迁移（30 秒）

### 在源电脑（macOS 或 Windows）

```bash
# 1. 备份数据
npm run sync:push

# 2. 通过云盘自动同步（iCloud/OneDrive）
```

### 在目标电脑（Windows 或 macOS）

```bash
# 1. 从云盘恢复
npm run sync:pull

# 2. 验证（可选）
npm run db:verify

# 3. 启动服务
npm run dev
```

---

## 📦 所有可用命令

### 基础命令
```bash
npm run db:backup        # 创建备份
npm run db:restore       # 恢复最新备份
npm run db:list-backups  # 查看所有备份
npm run db:seed          # 填充测试数据
npm run db:reset         # 重置数据库
npm run db:verify        # 验证数据完整性
```

### 云同步命令（新）
```bash
npm run sync:push        # 备份并上传到云盘
npm run sync:pull        # 从云盘下载并恢复
```

---

## 🎯 常见场景

### 场景1：每天在不同电脑工作

**在 macOS 上结束工作：**
```bash
npm run sync:push
```

**在 Windows 上开始工作：**
```bash
npm run sync:pull
npm run dev
```

### 场景2：一次性迁移所有数据

**方案 A：使用云盘（推荐）**
```bash
# 源电脑
npm run sync:push

# 目标电脑
npm run sync:pull
```

**方案 B：使用 Git（一次性）**
```bash
# 源电脑
npm run db:backup
git add data/backups/app-*.db
git commit -m "temp: 数据迁移"
git push

# 目标电脑
git pull
npm run db:restore

# 清理（任一电脑）
git rm data/backups/app-*.db
git commit -m "chore: 清理临时备份"
git push
```

### 场景3：测试前保存数据

```bash
# 测试前
npm run db:backup

# 测试后恢复
npm run db:restore
```

---

## 🔧 初次设置

### macOS 用户

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/Personal-Chatbox.git
cd Personal-Chatbox

# 2. 安装依赖
pnpm install

# 3. 设置云盘路径（可选）
echo 'export CHATBOX_CLOUD_BACKUP="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"' >> ~/.zshrc
source ~/.zshrc

# 4. 首次设置数据库
npm run db:setup

# 或从其他电脑同步
npm run sync:pull
```

### Windows 用户

```powershell
# 1. 克隆项目
git clone https://github.com/你的用户名/Personal-Chatbox.git
cd Personal-Chatbox

# 2. 安装依赖
pnpm install

# 3. 设置云盘路径（可选）
# 在 PowerShell Profile 中添加：
# $env:CHATBOX_CLOUD_BACKUP="$env:OneDrive\ChatboxBackup"

# 4. 首次设置数据库
npm run db:setup

# 或从其他电脑同步
npm run sync:pull
```

---

## 🔍 验证迁移

运行验证脚本检查数据完整性：

```bash
npm run db:verify
```

**成功输出示例：**
```
✅ 系统用户: 1
✅ 普通用户: 4
✅ 对话: 5
✅ 所有检查通过！数据库迁移成功
```

---

## ⚠️ 常见问题

### 问题：sync:push 失败，提示未检测到云盘

**解决方案：**

**macOS:**
```bash
# 设置云盘路径
export CHATBOX_CLOUD_BACKUP="$HOME/OneDrive/ChatboxBackup"
# 或
export CHATBOX_CLOUD_BACKUP="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"

# 永久设置
echo 'export CHATBOX_CLOUD_BACKUP="..."' >> ~/.zshrc
```

**Windows:**
```powershell
# 临时设置
$env:CHATBOX_CLOUD_BACKUP="$env:OneDrive\ChatboxBackup"

# 永久设置（添加到 PowerShell Profile）
# 运行: notepad $PROFILE
# 添加: $env:CHATBOX_CLOUD_BACKUP="$env:OneDrive\ChatboxBackup"
```

### 问题：git pull 提示有未提交的更改

```bash
git stash
git pull
git stash pop
```

### 问题：恢复后无法登录

```bash
# 1. 验证数据
npm run db:verify

# 2. 如果失败，尝试其他备份
npm run db:list-backups
npm run db:restore <时间戳>

# 3. 最后手段：使用测试数据
npm run db:reset
# 登录: test@example.com / test123
```

---

## 🧪 测试账号

使用测试数据时的默认账号：

| 邮箱 | 密码 | 用途 |
|------|------|------|
| test@example.com | test123 | 普通测试 |
| admin@example.com | test123 | 管理员测试 |
| demo@example.com | test123 | 演示账号 |
| developer@example.com | test123 | 开发测试 |

---

## 📚 完整文档

- 📖 [完整迁移指南](docs/CROSS_PLATFORM_DATA_MIGRATION.md) - 详细步骤和高级用法
- 📦 [数据库管理系统](docs/DATABASE_TEST_DATA_SYSTEM.md) - 测试数据管理

---

## 🎉 完成！

现在你可以轻松地在 macOS 和 Windows 间同步数据了！

**日常工作流：**

```bash
# 早上开始工作
npm run sync:pull

# 工作...

# 晚上结束工作
npm run sync:push
```

就这么简单！🚀
