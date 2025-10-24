# SQLite 数据库迁移说明

## 📋 当前状态

**当前使用**: JSON 文件数据库 (`data/database.json`)
**推荐使用**: SQLite (更好的性能和并发支持)

---

## ⚠️ 迁移前的问题

在 Windows 系统上，`better-sqlite3` 需要**编译本地模块**，这需要以下工具：

### 必需的开发工具

1. **Windows SDK** (缺失)
2. **Visual Studio Build Tools**（已安装但缺少 Windows SDK）
3. **Python** (已安装 ✅)

---

## 🛠️ 解决方案

### 方案 1: 安装 Windows SDK（推荐）

1. 打开 **Visual Studio Installer**

2. 修改已安装的 **Visual Studio Build Tools 2022**

3. 在"单个组件"中勾选：
   - ✅ Windows 10 SDK (10.0.19041.0 或更高版本)
   - ✅ Windows 11 SDK (10.0.22000.0 或更高版本)

4. 点击"修改"并等待安装完成

5. 重新编译 better-sqlite3:
   ```powershell
   cd D:\Personal-Chatbox
   pnpm rebuild better-sqlite3
   ```

6. 运行迁移脚本（需要创建）

### 方案 2: 继续使用 JSON 数据库（当前方案）

**优点**：
- ✅ 无需额外配置
- ✅ 数据文件易于查看和备份
- ✅ 适合当前数据量（26KB）

**缺点**：
- ⚠️ 并发性能较差
- ⚠️ 不支持复杂查询
- ⚠️ 数据量大时效率低

**当前数据**：
- 用户: 1 个
- 笔记: 24 条
- AI Agents: 16 个
- 会话: 7 个
- 文件大小: 26.41 KB

对于当前数据量，**JSON 数据库完全够用**，性能影响微乎其微。

### 方案 3: 使用 PostgreSQL（生产环境）

如果要部署到生产环境或需要更高性能：

1. 安装 PostgreSQL 数据库

2. 设置环境变量:
   ```powershell
   $env:POSTGRES_URL = "postgresql://user:password@host:5432/database"
   ```

3. 系统会自动使用 PostgreSQL（无需编译）

---

## 📊 性能对比

| 数据库 | 查询速度 | 写入速度 | 并发支持 | 安装难度 |
|--------|----------|----------|----------|----------|
| JSON | ⭐⭐ | ⭐ | ❌ | ⭐⭐⭐⭐⭐ (最简单) |
| SQLite | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ (需要编译) |
| PostgreSQL | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ (需要服务器) |

---

## 💡 建议

**当前情况（Windows + 小数据量）**：
- ✅ **继续使用 JSON 数据库**即可
- 性能完全足够日常使用
- 无需折腾 Windows SDK

**如果遇到性能问题**：
- 数据量 > 1000 条笔记
- 多用户同时使用
- 需要复杂查询

→ 再考虑安装 Windows SDK 并迁移到 SQLite

**如果要部署到生产环境**：
→ 直接使用 PostgreSQL（推荐）

---

## 🎯 当前登录信息

**前端**: http://localhost:5174
**后端**: http://localhost:3001

**登录凭据**:
- 邮箱: `test@example.com`
- 密码: `test@example.com123`

**数据库**: JSON (`data/database.json`)
**数据备份**:
- `data/database.backup-1761288927994.json`
- `data/database.backup-1761289083630.json`
- `data/database.json.backup-1761289790959`

---

## 📝 总结

1. ✅ **当前系统正常运行**（使用 JSON 数据库）
2. ⚠️ **无法迁移到 SQLite**（缺少 Windows SDK）
3. 💡 **建议**：对于当前数据量，JSON 数据库完全够用
4. 🔧 **如需 SQLite**：安装 Windows SDK 后再迁移
5. 🚀 **如需生产部署**：使用 PostgreSQL

---

**现状**: 系统运行正常，无需立即迁移 ✅

