# 为什么当前使用 JSON 数据库而不是 SQLite？

## 🔍 问题分析

虽然 `better-sqlite3` 模块已经安装且可以导入，但项目实际上可能正在使用 **JSON 文件数据库** 作为 fallback。

---

## 📊 数据库选择优先级

项目的数据库适配器有三层 fallback 机制：

```javascript
// server/db/init.cjs & server/db/unified-adapter.cjs

1. PostgreSQL (生产环境) 🟢
   ↓ (未配置或连接失败)

2. better-sqlite3 (SQLite) 🟡
   ↓ (编译失败或模块问题)

3. JSON 文件数据库 🟠 ← 当前可能在这里
```

---

## 🔍 可能的原因

### 1. **better-sqlite3 编译问题**

虽然模块存在，但可能在 **创建数据库实例时失败**：

```javascript
// server/db/unified-adapter.cjs: 35-47
try {
  const BetterSqlite3 = require('better-sqlite3');
  const db = new BetterSqlite3(DB_PATH); // ← 这里可能失败

  db.pragma('journal_mode = WAL');
  // ...
  return db; // 成功返回 SQLite
} catch (err) {
  console.warn('[Unified DB] better-sqlite3 not available:', err.message);
  // 继续尝试 JSON
}
```

**可能的失败原因**：
- ❌ Node.js 版本不匹配
- ❌ 缺少 Windows SDK（之前遇到的问题）
- ❌ 数据库文件权限问题
- ❌ 文件路径问题

### 2. **查看服务器启动日志**

检查服务器启动时的输出：

```bash
# 应该看到以下之一：

# 使用 SQLite:
[Unified DB] ✅ Using better-sqlite3, 数据库路径: d:\Personal-Chatbox\data\app.db

# 使用 JSON (fallback):
[Unified DB] ⚠️  Using JSON fallback database
```

---

## 🔬 如何确认当前使用的数据库

### 方法 1: 查看服务器启动日志

在你的终端中找到服务器启动时的输出，查找 `[Unified DB]` 或 `[DB Init]` 开头的日志。

### 方法 2: 检查数据文件

```powershell
# JSON 数据库
Get-Item data/database.json | Select-Object Length, LastWriteTime

# SQLite 数据库
Get-Item data/app.db | Select-Object Length, LastWriteTime
```

**判断标准**：
- 如果 `database.json` 文件在最近被修改 → 使用 JSON
- 如果 `app.db` 文件在最近被修改 → 使用 SQLite

### 方法 3: 添加诊断代码

在 `server/db/init.cjs` 第 47 行后添加：

```javascript
console.log('[DB Init] 当前数据库类型:', db._driver || 'unknown');
console.log('[DB Init] 数据库路径:', db._dbPath || JSON_DB_PATH);
```

---

## 📁 数据存储位置

### JSON 数据库
```
data/database.json
```
**特点**：
- ✅ 纯文本，可直接查看
- ✅ 无需编译，跨平台
- ⚠️ 性能相对较低
- ⚠️ 不支持并发写入

### SQLite 数据库
```
data/app.db
data/app.db-wal    (WAL模式)
data/app.db-shm    (共享内存)
```
**特点**：
- ✅ 性能更好
- ✅ 支持并发
- ✅ 完整的 SQL 支持
- ⚠️ 需要编译 better-sqlite3

---

## 🛠️ 如何切换到 SQLite

### 前提条件

确保 `better-sqlite3` 可以正常工作：

```powershell
# 测试 better-sqlite3
node -e "const db = require('better-sqlite3')('test.db'); console.log('OK'); db.close();"
```

如果报错，需要：

#### Windows 系统需要：
1. **安装 Windows Build Tools**
   ```powershell
   npm install --global windows-build-tools
   ```

2. **或者安装 Visual Studio**（包含 C++ 工具）
   - 下载 Visual Studio Community
   - 勾选 "Desktop development with C++"
   - 勾选 Windows 10/11 SDK

3. **重新编译 better-sqlite3**
   ```powershell
   cd d:\Personal-Chatbox
   npm rebuild better-sqlite3
   ```

### 迁移步骤

如果 `better-sqlite3` 已经可用，但仍在使用 JSON：

#### 步骤 1: 备份 JSON 数据
```powershell
Copy-Item data/database.json data/database.json.backup
```

#### 步骤 2: 删除旧的 SQLite 文件（如果存在）
```powershell
Remove-Item data/app.db* -ErrorAction SilentlyContinue
```

#### 步骤 3: 重启服务器
```powershell
npm run server
```

系统会：
1. 尝试使用 better-sqlite3
2. 创建新的 `app.db`
3. 运行所有迁移脚本
4. 创建表结构

#### 步骤 4: 迁移数据（如果需要）

从 JSON 迁移到 SQLite：

```javascript
// 创建迁移脚本: migrate-json-to-sqlite.cjs
const fs = require('fs');
const Database = require('better-sqlite3');

const jsonData = JSON.parse(fs.readFileSync('data/database.json', 'utf-8'));
const db = new Database('data/app.db');

// 迁移用户
const insertUser = db.prepare(`
  INSERT INTO users (id, email, username, password_hash, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

jsonData.users.forEach(user => {
  insertUser.run(user.id, user.email, user.username, user.password_hash, user.created_at);
});

// 迁移 MCP 配置
const insertConfig = db.prepare(`
  INSERT INTO user_mcp_configs (...)
  VALUES (?, ?, ...)
`);

jsonData.user_mcp_configs?.forEach(config => {
  insertConfig.run(...);
});

db.close();
console.log('✅ 迁移完成');
```

---

## ⚙️ JSON 数据库的优缺点

### ✅ 优点
- **零配置**：不需要编译任何东西
- **跨平台**：在任何系统都能运行
- **易于调试**：可以直接打开文件查看
- **简单备份**：复制一个 JSON 文件即可

### ⚠️ 缺点
- **性能较低**：每次读写都要解析整个 JSON
- **内存占用**：需要将整个数据库加载到内存
- **并发限制**：不支持多进程同时写入
- **缺少高级功能**：无索引、无事务、无联表查询

---

## 🎯 推荐方案

### 当前环境（开发/小规模）
✅ **继续使用 JSON**
- 数据量小（< 10MB）
- 单用户使用
- 快速原型开发

### 生产环境
🚀 **升级到 SQLite 或 PostgreSQL**
- 数据量大
- 多用户访问
- 需要更好的性能

---

## 🔍 诊断命令

运行以下命令查看当前状态：

```powershell
# 1. 检查 better-sqlite3
node -e "try { const db = require('better-sqlite3')('test.db'); console.log('SQLite OK'); db.close(); } catch(e) { console.log('SQLite Error:', e.message); }"

# 2. 查看数据文件
Get-ChildItem data/database.json, data/app.db* -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime

# 3. 重启服务器并查看日志
npm run server
# 查找输出中的 [Unified DB] 或 [DB Init] 日志
```

---

## 📊 总结

**为什么使用 JSON 数据库？**

最可能的原因是：
1. **better-sqlite3 编译失败**（虽然模块存在，但创建实例失败）
2. **系统自动 fallback 到 JSON**（按设计的三层机制）
3. **Windows SDK 缺失**（之前遇到的问题）

**当前是否有问题？**

✅ **没有问题！** JSON 数据库完全可以正常工作，所有功能都支持：
- 用户配置存储 ✅
- MCP 服务管理 ✅
- 数据持久化 ✅

**是否需要切换？**

对于当前的开发和测试环境，**JSON 数据库已经足够**。只有在以下情况才需要升级：
- 📈 数据量变大（> 10MB）
- 👥 多用户同时访问
- ⚡ 需要更好的查询性能
- 🔄 需要并发写入

---

**建议**：先使用 JSON 继续开发，等需要时再升级到 SQLite。所有功能都已经支持，可以正常使用！ 🎉

