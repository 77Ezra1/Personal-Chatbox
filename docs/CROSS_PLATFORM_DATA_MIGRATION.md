# 🔄 跨平台数据迁移指南（macOS ↔ Windows）

本指南专为在 macOS 和 Windows 两个系统间开发的用户设计，帮助你轻松同步和迁移数据库数据。

## 📋 目录

- [快速开始](#快速开始)
- [三种迁移方案对比](#三种迁移方案对比)
- [方案一：云盘同步（推荐）](#方案一云盘同步推荐)
- [方案二：Git 临时传输](#方案二git-临时传输)
- [方案三：直接文件传输](#方案三直接文件传输)
- [常见场景](#常见场景)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 前置条件

确保两台电脑都已：
- ✅ 安装了 Node.js (v18+)
- ✅ 安装了 pnpm
- ✅ 克隆了项目仓库
- ✅ 运行过 `pnpm install`

### 30 秒快速迁移

```bash
# 在源电脑（macOS 或 Windows）
npm run db:backup

# 通过云盘或其他方式传输备份文件

# 在目标电脑（Windows 或 macOS）
npm run db:restore
```

---

## 🎯 三种迁移方案对比

| 方案 | 速度 | 安全性 | 便捷性 | 适用场景 |
|------|------|--------|--------|----------|
| **云盘同步** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **日常开发（推荐）** |
| **Git 传输** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 一次性迁移 |
| **直接传输** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | 同一网络内 |

---

## 📦 方案一：云盘同步（推荐）

### 为什么推荐？
- ✅ 最安全（数据不会进入 Git 历史）
- ✅ 最灵活（可以保留多个备份版本）
- ✅ 最简单（一次配置，长期使用）
- ✅ 跨平台无缝（macOS 和 Windows 都支持）

### 设置云盘同步

#### 使用 iCloud Drive（macOS 用户推荐）

**在 macOS 上：**
```bash
# 1. 创建备份脚本别名（可选，更方便）
echo 'alias backup-to-cloud="npm run db:backup && cp data/backups/app-*.db ~/Library/Mobile\ Documents/com~apple~CloudDocs/ChatboxBackup/"' >> ~/.zshrc
source ~/.zshrc

# 2. 备份并同步到 iCloud
npm run db:backup
cp data/backups/app-$(date +%Y-%m-%dT%H-%M-%S).db ~/Library/Mobile\ Documents/com~apple~CloudDocs/chatbox-latest.db
```

**在 Windows 上：**
```powershell
# 1. 从 iCloud 文件夹复制最新备份
# iCloud 路径通常是: C:\Users\你的用户名\iCloudDrive\
copy "C:\Users\你的用户名\iCloudDrive\chatbox-latest.db" "d:\Personal-Chatbox\data\backups\"

# 2. 恢复数据库
npm run db:restore
```

#### 使用 OneDrive（Windows 用户推荐）

**在 Windows 上：**
```bash
# 1. 备份并同步到 OneDrive
npm run db:backup
copy data\backups\app-*.db "%OneDrive%\ChatboxBackup\chatbox-latest.db"
```

**在 macOS 上：**
```bash
# 1. 从 OneDrive 复制最新备份
cp ~/OneDrive/ChatboxBackup/chatbox-latest.db data/backups/

# 2. 恢复数据库
npm run db:restore
```

#### 使用 Google Drive / Dropbox

**通用步骤：**
```bash
# 在任一系统上：

# 备份
npm run db:backup

# 手动复制最新备份文件到云盘同步文件夹
# Google Drive: ~/Google Drive/ChatboxBackup/
# Dropbox: ~/Dropbox/ChatboxBackup/

# 在另一系统上，从云盘文件夹复制到项目
cp ~/Google\ Drive/ChatboxBackup/app-*.db data/backups/

# 恢复
npm run db:restore
```

### 自动化脚本（高级）

创建 `scripts/sync-to-cloud.sh`（macOS/Linux）：

```bash
#!/bin/bash
# 自动备份并同步到云盘

# 创建备份
npm run db:backup

# 获取最新备份文件名
LATEST_BACKUP=$(ls -t data/backups/app-*.db | head -1)

# 复制到云盘（修改为你的云盘路径）
CLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"
mkdir -p "$CLOUD_PATH"
cp "$LATEST_BACKUP" "$CLOUD_PATH/chatbox-latest.db"

echo "✅ 备份已同步到 iCloud: chatbox-latest.db"
echo "📁 文件大小: $(du -h "$LATEST_BACKUP" | cut -f1)"
```

创建 `scripts/sync-to-cloud.bat`（Windows）：

```batch
@echo off
REM 自动备份并同步到云盘

call npm run db:backup

REM 获取最新备份文件
for /f "delims=" %%i in ('dir /b /o-d data\backups\app-*.db') do set LATEST_BACKUP=%%i & goto :found
:found

REM 复制到 OneDrive（修改为你的路径）
set CLOUD_PATH=%OneDrive%\ChatboxBackup
if not exist "%CLOUD_PATH%" mkdir "%CLOUD_PATH%"
copy "data\backups\%LATEST_BACKUP%" "%CLOUD_PATH%\chatbox-latest.db"

echo ✅ 备份已同步到 OneDrive: chatbox-latest.db
```

使用方法：
```bash
# macOS/Linux
chmod +x scripts/sync-to-cloud.sh
./scripts/sync-to-cloud.sh

# Windows
scripts\sync-to-cloud.bat
```

---

## 🔀 方案二：Git 临时传输

### ⚠️ 注意事项
- 仅用于**一次性迁移**
- 完成后**必须**清理 Git 历史
- 不适合频繁同步
- 可能暴露敏感数据

### 步骤

#### 在源电脑（macOS 或 Windows）

```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 创建数据库备份
npm run db:backup

# 3. 临时提交备份到 Git（仅此一次！）
git add data/backups/app-*.db
git commit -m "temp: 临时备份用于跨平台迁移"
git push origin main
```

#### 在目标电脑（Windows 或 macOS）

```bash
# 1. 拉取包含备份的代码
git pull origin main

# 2. 查看可用备份
npm run db:list-backups

# 3. 恢复最新备份
npm run db:restore

# 4. 验证数据
npm run server
# 访问 http://localhost:3001 测试
```

#### 清理 Git（重要！）

**在任一电脑上执行：**

```bash
# 1. 删除备份文件
git rm data/backups/app-*.db

# 2. 提交删除
git commit -m "chore: 移除临时数据库备份文件"

# 3. 推送到远程
git push origin main

# 4. 在另一台电脑上同步
git pull origin main
```

**完全清除 Git 历史中的备份文件（可选，彻底清理）：**

```bash
# ⚠️ 警告：这会重写 Git 历史，团队协作时慎用！

# 安装 git-filter-repo（如果没有）
# macOS: brew install git-filter-repo
# Windows: pip install git-filter-repo

# 删除历史中的所有 .db 文件
git filter-repo --path data/backups --invert-paths

# 强制推送（会覆盖远程历史）
git push origin main --force
```

---

## 🌐 方案三：直接文件传输

适用于两台电脑在同一网络时的快速传输。

### 使用 Python 简易服务器

**在源电脑上（启动文件服务器）：**

```bash
# 1. 创建备份
npm run db:backup

# 2. 进入备份目录
cd data/backups

# 3. 启动 HTTP 服务器
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# 显示本机 IP
# macOS/Linux: ifconfig | grep "inet "
# Windows: ipconfig | findstr IPv4
```

**在目标电脑上（下载备份）：**

```bash
# 1. 下载备份文件（替换 <源电脑IP> 为实际 IP）
# macOS/Linux
curl -O http://<源电脑IP>:8080/app-2025-10-21T10-22-50.db
mv app-*.db data/backups/

# Windows PowerShell
Invoke-WebRequest -Uri "http://<源电脑IP>:8080/app-2025-10-21T10-22-50.db" -OutFile "data\backups\app-2025-10-21T10-22-50.db"

# 2. 恢复数据库
npm run db:restore
```

### 使用 AirDrop（仅 macOS）

```bash
# macOS 上
# 1. 创建备份
npm run db:backup

# 2. 在 Finder 中右键点击备份文件
#    选择 "分享" -> "AirDrop" -> 选择接收设备

# 3. 接收后移动到项目目录
mv ~/Downloads/app-*.db ~/Personal-Chatbox/data/backups/

# 4. 恢复
npm run db:restore
```

### 使用 USB 驱动器

**最简单但需要物理接触：**

```bash
# 在源电脑
npm run db:backup
cp data/backups/app-*.db /Volumes/USB驱动器/  # macOS
copy data\backups\app-*.db E:\                 # Windows

# 在目标电脑
cp /Volumes/USB驱动器/app-*.db data/backups/  # macOS
copy E:\app-*.db data\backups\                # Windows

npm run db:restore
```

---

## 🎬 常见场景

### 场景 1：每天早上在不同电脑上工作

**推荐方案：云盘同步 + 快捷脚本**

创建 `package.json` 中的快捷命令：

```json
{
  "scripts": {
    "sync:push": "npm run db:backup && node scripts/push-to-cloud.cjs",
    "sync:pull": "node scripts/pull-from-cloud.cjs && npm run db:restore"
  }
}
```

**工作流程：**

```bash
# 在 macOS 上工作结束时
npm run sync:push

# 第二天在 Windows 上开始工作时
npm run sync:pull
npm run dev
npm run server
```

### 场景 2：测试某个功能前想保存当前状态

**推荐方案：本地备份**

```bash
# 1. 保存当前状态
npm run db:backup

# 2. 进行测试...
# 如果测试破坏了数据

# 3. 恢复到测试前状态
npm run db:restore

# 或指定特定备份
npm run db:list-backups  # 查看所有备份
npm run db:restore 2025-10-21T10-22-50
```

### 场景 3：在 macOS 开发新功能，在 Windows 测试

**推荐方案：Git 代码 + 云盘数据**

```bash
# 在 macOS 上开发
git add .
git commit -m "feat: 新功能开发"
git push origin feature-branch

npm run db:backup
# 手动上传备份到云盘

# 在 Windows 上测试
git pull origin feature-branch
# 从云盘下载备份到 data/backups/
npm run db:restore
npm run dev
```

### 场景 4：周末用 macOS，工作日用 Windows

**推荐方案：双向云盘同步**

在两台电脑的 `.bashrc` / `.zshrc` / PowerShell Profile 中添加：

```bash
# macOS (.zshrc)
alias work-end='npm run db:backup && cp data/backups/app-*.db ~/OneDrive/ChatboxSync/current.db && echo "✅ 数据已同步到云盘"'
alias work-start='cp ~/OneDrive/ChatboxSync/current.db data/backups/app-$(date +%Y-%m-%dT%H-%M-%S).db && npm run db:restore && echo "✅ 云盘数据已恢复"'

# Windows (PowerShell Profile)
function Work-End {
    npm run db:backup
    Copy-Item "data\backups\app-*.db" "$env:OneDrive\ChatboxSync\current.db"
    Write-Host "✅ 数据已同步到云盘" -ForegroundColor Green
}

function Work-Start {
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
    Copy-Item "$env:OneDrive\ChatboxSync\current.db" "data\backups\app-$timestamp.db"
    npm run db:restore
    Write-Host "✅ 云盘数据已恢复" -ForegroundColor Green
}
```

**使用：**
```bash
# 每天结束工作时
work-end

# 每天开始工作时
work-start
```

---

## 🔍 故障排查

### 问题 1：Git pull 提示有未提交的更改

**错误信息：**
```
error: cannot pull with rebase: You have unstaged changes.
error: Please commit or stash them.
```

**解决方案：**

```bash
# 方案 A：暂存本地更改（推荐）
git stash push -m "临时保存本地配置"
git pull origin main
git stash pop

# 方案 B：放弃本地更改（如果是配置文件）
git restore .claude/settings.local.json
git pull origin main

# 方案 C：提交本地更改
git add .
git commit -m "chore: 保存本地配置"
git pull origin main
```

### 问题 2：恢复备份后登录失败

**可能原因：**
- 备份文件损坏
- 数据库版本不兼容
- 迁移未完成

**解决方案：**

```bash
# 1. 验证备份文件完整性
npm run db:list-backups
# 检查文件大小是否合理（应该 > 100KB）

# 2. 尝试恢复其他备份
npm run db:restore 2025-10-21T09-38-20

# 3. 如果都失败，使用测试数据
npm run db:reset

# 4. 检查数据库内容
node -e "const db = require('./server/db/init.cjs').db; console.log(db.prepare('SELECT COUNT(*) as count FROM users').get());"
```

### 问题 3：备份文件无法在另一系统打开

**SQLite 备份文件是二进制文件，应该完全跨平台兼容。如果出现问题：**

```bash
# 验证文件完整性（在源系统）
# macOS/Linux
md5 data/backups/app-*.db

# Windows
certutil -hashfile data\backups\app-*.db MD5

# 传输后在目标系统验证 MD5 值是否一致

# 如果 MD5 不一致，说明传输过程中文件损坏，重新传输
```

### 问题 4：云盘文件未同步

**iCloud Drive：**
```bash
# macOS 检查同步状态
brctl log --wait --shorten

# 强制同步
killall bird
```

**OneDrive：**
```bash
# Windows 检查同步状态
# 右键点击任务栏 OneDrive 图标 -> 查看同步状态

# 重启 OneDrive
taskkill /f /im OneDrive.exe
start "" "%LocalAppData%\Microsoft\OneDrive\OneDrive.exe"
```

### 问题 5：路径包含空格导致脚本失败

**macOS/Linux：**
```bash
# 使用引号包裹路径
cp "data/backups/app-*.db" "~/Google Drive/ChatboxBackup/"

# 或使用转义
cp data/backups/app-*.db ~/Google\ Drive/ChatboxBackup/
```

**Windows：**
```batch
REM 使用引号
copy "data\backups\app-*.db" "%OneDrive%\Chatbox Backup\"
```

---

## 💡 最佳实践

### 1. 建立固定的同步习惯

**每天结束工作时（3 秒）：**
```bash
npm run db:backup
# 上传到云盘
```

**每天开始工作时（3 秒）：**
```bash
# 从云盘下载
npm run db:restore
```

### 2. 使用命名规范

**为重要备份添加描述性名称：**

```bash
# 在重要功能完成后
npm run db:backup
# 重命名备份文件
mv data/backups/app-2025-10-21T10-22-50.db data/backups/feature-auth-完成.db

# 云盘中也使用描述性名称
cp data/backups/feature-auth-完成.db ~/OneDrive/ChatboxBackup/
```

### 3. 定期清理旧备份

**保留策略建议：**
- 保留最近 7 天的每日备份
- 保留最近 4 周的每周备份
- 保留重要里程碑备份

```bash
# 清理 7 天前的备份（macOS/Linux）
find data/backups -name "app-*.db" -mtime +7 -delete

# Windows PowerShell
Get-ChildItem data\backups\app-*.db | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
```

### 4. 使用 .gitignore 防止意外提交

**确保 `.gitignore` 包含：**

```gitignore
# 数据库文件
data/app.db
data/*.db
data/app.db-*
data/chatbox.db
data/chatbox.db-*

# 数据库备份
data/backups/*.db

# 临时文件
data/*.db-shm
data/*.db-wal
*.db-journal

# 本地配置
.claude/settings.local.json
```

**验证：**
```bash
# 检查哪些文件会被 Git 跟踪
git status --ignored

# 如果看到 .db 文件，立即取消跟踪
git rm --cached data/backups/*.db
git commit -m "chore: 从 Git 移除数据库文件"
```

### 5. 创建数据快照

**在重大更改前创建命名快照：**

```bash
# 创建快照函数（添加到 .zshrc 或 .bashrc）
snapshot() {
    SNAPSHOT_NAME="$1"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    npm run db:backup
    LATEST=$(ls -t data/backups/app-*.db | head -1)
    cp "$LATEST" "data/backups/snapshot_${SNAPSHOT_NAME}_${TIMESTAMP}.db"
    echo "✅ 快照已创建: snapshot_${SNAPSHOT_NAME}_${TIMESTAMP}.db"
}

# 使用
snapshot "before-migration"
snapshot "feature-完成"
snapshot "production-ready"
```

### 6. 自动化检查脚本

**创建 `scripts/verify-sync.sh`：**

```bash
#!/bin/bash
# 验证数据同步状态

echo "🔍 检查数据同步状态..."

# 检查本地最新备份
LOCAL_LATEST=$(ls -t data/backups/app-*.db 2>/dev/null | head -1)
if [ -z "$LOCAL_LATEST" ]; then
    echo "❌ 本地没有备份"
    exit 1
fi

LOCAL_TIME=$(stat -f %m "$LOCAL_LATEST" 2>/dev/null || stat -c %Y "$LOCAL_LATEST")
LOCAL_SIZE=$(wc -c < "$LOCAL_LATEST")

echo "📁 本地最新备份:"
echo "   文件: $(basename $LOCAL_LATEST)"
echo "   时间: $(date -r $LOCAL_TIME '+%Y-%m-%d %H:%M:%S')"
echo "   大小: $(numfmt --to=iec-i --suffix=B $LOCAL_SIZE)"

# 检查云盘备份（修改为你的云盘路径）
CLOUD_PATH="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup/chatbox-latest.db"
if [ -f "$CLOUD_PATH" ]; then
    CLOUD_TIME=$(stat -f %m "$CLOUD_PATH" 2>/dev/null || stat -c %Y "$CLOUD_PATH")
    CLOUD_SIZE=$(wc -c < "$CLOUD_PATH")

    echo ""
    echo "☁️  云盘备份:"
    echo "   时间: $(date -r $CLOUD_TIME '+%Y-%m-%d %H:%M:%S')"
    echo "   大小: $(numfmt --to=iec-i --suffix=B $CLOUD_SIZE)"

    # 比较时间
    TIME_DIFF=$((LOCAL_TIME - CLOUD_TIME))
    if [ $TIME_DIFF -gt 3600 ]; then
        echo ""
        echo "⚠️  警告: 云盘备份已过期 (超过 1 小时)"
        echo "   建议运行: npm run db:backup 并上传到云盘"
    else
        echo ""
        echo "✅ 同步状态良好"
    fi
else
    echo ""
    echo "❌ 云盘中没有备份"
fi
```

### 7. 环境变量配置

**为不同系统设置环境变量：**

```bash
# macOS (.zshrc 或 .bash_profile)
export CHATBOX_CLOUD_BACKUP="$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChatboxBackup"

# Windows (PowerShell Profile)
$env:CHATBOX_CLOUD_BACKUP="$env:OneDrive\ChatboxBackup"

# Linux (.bashrc)
export CHATBOX_CLOUD_BACKUP="$HOME/Dropbox/ChatboxBackup"
```

---

## 📊 数据迁移检查清单

### 迁移前

- [ ] 在源系统创建最新备份
- [ ] 验证备份文件大小正常（> 100KB）
- [ ] 确认备份包含最新数据（查看修改时间）
- [ ] 记录当前用户数和对话数
- [ ] 停止源系统的服务器

### 迁移中

- [ ] 选择合适的传输方式
- [ ] 传输备份文件到目标系统
- [ ] 验证传输文件完整性（比对文件大小或 MD5）

### 迁移后

- [ ] 在目标系统恢复备份
- [ ] 验证用户数和对话数匹配
- [ ] 测试登录功能
- [ ] 测试基本功能（创建对话、发送消息）
- [ ] 清理临时文件（如果使用 Git 传输）

### 验证脚本

```bash
# 创建 scripts/verify-migration.cjs
const { db } = require('../server/db/init.cjs');

console.log('\n🔍 数据迁移验证\n');

const checks = [
  { name: '用户', query: 'SELECT COUNT(*) as count FROM users WHERE id != 0' },
  { name: '对话', query: 'SELECT COUNT(*) as count FROM conversations' },
  { name: '消息', query: 'SELECT COUNT(*) as count FROM messages' },
  { name: '笔记', query: 'SELECT COUNT(*) as count FROM notes', optional: true },
  { name: '文档', query: 'SELECT COUNT(*) as count FROM documents', optional: true },
];

let allPassed = true;

checks.forEach(check => {
  try {
    const result = db.prepare(check.query).get();
    const count = result.count;
    const status = count > 0 ? '✅' : (check.optional ? '⚪' : '❌');
    console.log(`${status} ${check.name}: ${count}`);
    if (!check.optional && count === 0) allPassed = false;
  } catch (error) {
    if (!check.optional) {
      console.log(`❌ ${check.name}: 表不存在`);
      allPassed = false;
    } else {
      console.log(`⚪ ${check.name}: 表不存在（可选）`);
    }
  }
});

console.log('\n' + (allPassed ? '✅ 所有检查通过' : '❌ 部分检查失败'));
process.exit(allPassed ? 0 : 1);
```

使用：
```bash
node scripts/verify-migration.cjs
```

---

## 🎓 总结

### 推荐的日常工作流

**如果你经常在两台电脑间切换：**

1. **选择云盘同步** - 最省心
2. **设置自动化脚本** - 每天开始/结束工作时自动同步
3. **保持良好习惯** - 工作结束记得备份，开始工作前先恢复

### 核心命令速查

```bash
# 备份
npm run db:backup

# 恢复
npm run db:restore

# 查看备份
npm run db:list-backups

# 验证数据
node scripts/verify-migration.cjs
```

### 紧急恢复

如果一切都失败了：
```bash
# 使用测试数据重新开始
npm run db:reset

# 测试账号: test@example.com
# 密码: test123
```

---

## 📞 获取帮助

- 📖 查看完整文档：[DATABASE_TEST_DATA_SYSTEM.md](DATABASE_TEST_DATA_SYSTEM.md)
- 🐛 遇到问题？检查 [故障排查](#故障排查) 部分
- 💬 提交 Issue：[GitHub Issues](https://github.com/你的用户名/Personal-Chatbox/issues)

---

**最后更新**: 2025-10-21
**兼容系统**: macOS, Windows, Linux
**测试环境**: macOS 14.x, Windows 11, Node.js 18+
