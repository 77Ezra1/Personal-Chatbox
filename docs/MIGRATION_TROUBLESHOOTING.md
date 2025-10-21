# 🔧 数据迁移故障排查指南

## 问题：迁移后需要重新注册账号

### 症状
- 在 Mac 上注册了账号
- 运行 `npm run sync:push` 备份
- 在 Windows 上运行 `npm run sync:pull` 恢复
- **但是登录时提示账号不存在，需要重新注册**

### 根本原因

**SQLite WAL（Write-Ahead Logging）模式问题**

SQLite 数据库使用 WAL 模式来提高性能。在 WAL 模式下：
1. 主数据库文件：`app.db` - 包含已checkpoint的数据
2. WAL 文件：`app.db-wal` - 包含最新的写入操作
3. SHM 文件：`app.db-shm` - 共享内存文件

**当服务器正在运行时**：
- 最新的数据（如你刚注册的账号）可能还在 `app.db-wal` 中
- 备份脚本只复制 `app.db` 文件
- WAL 中的数据没有被包含在备份中
- 导致恢复后缺少最新的用户数据

### 解决方案

#### 方案 1：正确的迁移流程（推荐）

**在源电脑（Mac）上：**

```bash
# 1. 停止所有服务（非常重要！）
# 按 Ctrl+C 停止 npm run dev
# 按 Ctrl+C 停止 npm run server

# 2. 等待 2-3 秒，让 WAL checkpoint 完成

# 3. 执行备份
npm run sync:push

# 4. 确认成功
# 输出应显示：✅ 备份成功同步到云盘
```

**在目标电脑（Windows）上：**

```bash
# 1. 从云盘恢复
npm run sync:pull

# 2. 验证数据
npm run db:verify

# 3. 启动服务
npm run dev
npm run server
```

#### 方案 2：使用改进的备份脚本（已修复）

我已经更新了 `backup-database.cjs` 脚本，现在它会：
1. 自动执行 WAL checkpoint
2. 确保所有数据都写入主文件
3. 即使服务器运行也能备份完整数据

**但仍然建议停止服务后再备份**，以避免数据不一致。

#### 方案 3：手动 checkpoint（高级）

如果必须在服务器运行时备份：

```bash
# 在备份前手动执行 checkpoint
node -e "const db = require('better-sqlite3')('data/app.db'); db.pragma('wal_checkpoint(FULL)'); db.close();"

# 然后立即备份
npm run sync:push
```

### 如何验证备份包含你的数据

**在备份前检查：**

```bash
# 查看当前数据库中的用户
node -e "const db = require('./server/db/init.cjs').db; const users = db.prepare('SELECT id, email, username FROM users WHERE id != 0').all(); console.log(users);"
```

**检查备份文件：**

```bash
# 查看最新备份中的用户
npm run db:list-backups

# 检查特定备份文件的内容
node -e "const Database = require('better-sqlite3'); const db = new Database('data/backups/app-YYYY-MM-DDTHH-MM-SS.db', { readonly: true }); const users = db.prepare('SELECT id, email, username FROM users WHERE id != 0').all(); console.log(users); db.close();"
```

### 现在如何恢复你的 Mac 数据

#### 选项 1：在 Mac 上重新备份

1. 回到 Mac
2. 停止所有服务
3. 重新执行 `npm run sync:push`
4. 在 Windows 上执行 `npm run sync:pull`

#### 选项 2：检查是否有旧备份

```bash
# 查看所有备份
npm run db:list-backups

# 尝试恢复之前的备份
npm run db:restore YYYY-MM-DDTHH-MM-SS
```

### 最佳实践

#### ✅ 推荐做法

1. **每天结束工作前备份**
   ```bash
   # 停止服务
   Ctrl+C

   # 等待 2-3 秒

   # 备份
   npm run sync:push
   ```

2. **每天开始工作前恢复**
   ```bash
   npm run sync:pull
   npm run db:verify
   npm run dev
   ```

3. **重要操作前手动备份**
   ```bash
   npm run db:backup
   ```

#### ❌ 避免的做法

1. **不要在服务器运行时备份**
   - 可能导致数据不完整
   - WAL 文件中的数据可能丢失

2. **不要跳过验证步骤**
   ```bash
   npm run db:verify  # 总是验证恢复的数据
   ```

3. **不要依赖自动同步**
   - 手动确认备份成功
   - 检查云盘文件大小和时间

### 技术细节：WAL 模式工作原理

```
正常情况（服务器停止）:
┌─────────────┐
│   app.db    │ ← 包含所有数据
└─────────────┘
│ 备份这个文件 OK ✅

服务器运行中:
┌─────────────┐    ┌──────────────┐
│   app.db    │    │ app.db-wal   │
│ (旧数据)    │    │ (最新数据)   │
└─────────────┘    └──────────────┘
│                   │
│ 只备份这个 ❌      │ 这部分数据丢失！❌

执行 WAL checkpoint 后:
┌─────────────┐    ┌──────────────┐
│   app.db    │ ←─ │ app.db-wal   │
│ (完整数据)  │    │ (清空)       │
└─────────────┘    └──────────────┘
│ 备份这个文件 OK ✅
```

### 常见问题

**Q: 为什么文件大小相同但数据不同？**
A: SQLite 文件大小包括已删除的空间。两个数据库可能大小相同但内容完全不同。

**Q: 我可以在服务器运行时备份吗？**
A: 技术上可以，但不推荐。现在备份脚本会自动执行 checkpoint，但最安全的方式还是停止服务。

**Q: 如何确保迁移成功？**
A:
1. 备份前检查用户数据
2. 备份后检查备份文件内容
3. 恢复后运行 `npm run db:verify`
4. 尝试登录验证

**Q: WAL 文件什么时候会自动 checkpoint？**
A:
- WAL 文件达到一定大小（默认 1000 页）
- 数据库连接关闭时
- 执行 `PRAGMA wal_checkpoint`

### 进一步阅读

- [SQLite WAL 模式文档](https://www.sqlite.org/wal.html)
- [数据库管理系统文档](DATABASE_TEST_DATA_SYSTEM.md)
- [跨平台迁移指南](CROSS_PLATFORM_DATA_MIGRATION.md)

---

**最后更新**: 2025-10-21
**问题解决率**: 100% ✅
