# 本地开发快速启动指南

## 🎯 当前数据库配置

✅ **已完成迁移!** 项目现在使用本地开发友好的数据库配置。

### 当前状态
```
数据库类型: SQLite / JSON (自动降级)
主数据库: data/app.db (284KB)
PostgreSQL: 已禁用 ✓
配置文件: .env (已配置)
```

---

## 🚀 快速启动 (3种方式)

### 方式 1: 一键启动 (推荐)
```bash
bash start-dev.sh
```

### 方式 2: 使用配置脚本
```bash
# 首次运行或需要重新配置时
bash scripts/setup-local-db.sh

# 然后启动
bash start-dev.sh
```

### 方式 3: 手动启动
```bash
# 终端 1: 启动后端
export NODE_ENV=development
node server/index.cjs

# 终端 2: 启动前端
npm run dev
```

---

## 📊 数据库降级策略

项目采用三层数据库降级策略,确保在任何环境下都能启动:

```
1. PostgreSQL (生产环境)
   DATABASE_URL=postgresql://...
   ↓ (未配置或连接失败)

2. SQLite with better-sqlite3 (本地开发推荐)
   使用 data/app.db
   ↓ (better-sqlite3 编译失败)

3. JSON 文件数据库 (最后降级)
   使用 data/database.json
```

### 当前使用
根据启动日志:
- ✅ **JSON 数据库** - 如果看到 `[Unified DB] Using JSON fallback database`
- ✅ **SQLite 数据库** - 如果看到 `[Unified DB] ✅ Using better-sqlite3`

**两种方式都可以正常使用!** JSON 模式下功能完整,只是性能稍低。

---

## 🔧 Better-SQLite3 编译 (可选优化)

如果想使用 better-sqlite3 (更好的性能),需要编译原生模块:

### Windows 系统
```bash
# 1. 安装编译工具 (需要管理员权限)
npm install -g windows-build-tools

# 2. 重新编译 better-sqlite3
pnpm rebuild better-sqlite3

# 3. 验证
node -e "require('better-sqlite3')(':memory:'); console.log('✅ 编译成功');"
```

### Linux/macOS
```bash
# 通常会自动编译成功,如果失败:
pnpm rebuild better-sqlite3
```

**注意**: 如果编译失败,项目会自动降级到 JSON 数据库,不影响开发。

---

## ✅ 验证启动成功

### 后端启动成功标志
```
[Unified DB] Using JSON fallback database
# 或
[Unified DB] ✅ Using better-sqlite3

[DB Init] Connected to database: ...
[DB Init] ✓ users table created/verified
[DB Init] ✓ sessions table created/verified
...
✅ Server is running at http://localhost:3001
```

### 前端启动成功标志
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 浏览器测试
访问: http://localhost:5173

应该能看到登录页面。

---

## 📁 数据库文件说明

```
data/
├── app.db              # 主数据库 (SQLite模式)
├── app.db-wal          # WAL日志文件 (SQLite)
├── app.db-shm          # 共享内存 (SQLite)
├── database.json       # JSON数据库 (Fallback模式)
└── backups/            # 自动备份
    ├── app_*.db
    └── database_*.json
```

### 使用哪个数据库?
- **SQLite 模式**: 数据在 `app.db`
- **JSON 模式**: 数据在 `database.json`

两个文件都会保留,切换模式时数据不会自动同步!

---

## 🔄 常用操作

### 1. 优化数据库 (SQLite 模式)
```bash
bash scripts/optimize-sqlite-db.sh
```

### 2. 清理旧文件
```bash
bash scripts/cleanup-old-db-files.sh
```

### 3. 重新配置数据库
```bash
bash scripts/setup-local-db.sh
```

### 4. 备份数据
```bash
# 自动备份到 data/backups/
cp data/app.db data/backups/app_$(date +%Y%m%d_%H%M%S).db
cp data/database.json data/backups/database_$(date +%Y%m%d_%H%M%S).json
```

### 5. 恢复备份
```bash
# 从备份恢复
cp data/backups/app_20251017_145806.db data/app.db
# 或
cp data/backups/database_20251017_145806.json data/database.json
```

---

## ⚙️ 环境变量配置

当前 `.env` 配置:
```bash
NODE_ENV=development              # 开发模式
DATABASE_PATH=./data/app.db      # SQLite 路径
# DATABASE_URL=postgresql://...   # PostgreSQL 已禁用
```

### 如何切换到 PostgreSQL?
1. 安装 PostgreSQL (参考 `docs/database/postgresql-setup.md`)
2. 编辑 `.env`:
   ```bash
   DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
   ```
3. 重启服务器

---

## 📊 性能对比

| 指标 | PostgreSQL | SQLite | JSON |
|------|-----------|--------|------|
| **启动速度** | ⚠️ 需要服务 | ✅ 秒级 | ✅ 瞬时 |
| **查询速度** | ✅ 最快 | ✅ 快 | ⚠️ 慢 |
| **并发支持** | ✅ 优秀 | ⚠️ 有限 | ❌ 单线程 |
| **配置复杂度** | ⚠️ 高 | ✅ 低 | ✅ 零配置 |
| **适用场景** | 生产环境 | 本地开发 | 测试/演示 |

### 建议
- 👨‍💻 **本地开发**: SQLite (better-sqlite3) 或 JSON
- 🚀 **生产环境**: PostgreSQL
- 🧪 **快速测试**: JSON (无需编译)

---

## ❓ 常见问题

### Q1: 启动时报错 "better-sqlite3 not available"
**答**: 这是正常的!项目会自动降级到 JSON 数据库,不影响使用。
如果想用 better-sqlite3,参考上面的编译步骤。

### Q2: JSON 数据库性能够用吗?
**答**: 对于本地开发完全够用!除非:
- 数据量 > 1000 条记录
- 需要高并发测试
- 需要复杂查询优化

### Q3: 我的数据在哪个文件?
**答**: 查看启动日志:
- `[Unified DB] Using JSON fallback database` → `data/database.json`
- `[Unified DB] ✅ Using better-sqlite3` → `data/app.db`

### Q4: 切换数据库会丢失数据吗?
**答**: 不会丢失,但两个数据库独立:
- SQLite 模式数据在 `app.db`
- JSON 模式数据在 `database.json`

如需迁移,需要手动导出导入。

### Q5: 如何知道当前用的哪个数据库?
**答**: 查看后端启动日志的第一行:
```
[Unified DB] Using JSON fallback database     # JSON 模式
[Unified DB] ✅ Using better-sqlite3          # SQLite 模式
```

---

## 🎯 下一步

1. ✅ **启动开发环境**
   ```bash
   bash start-dev.sh
   ```

2. ✅ **验证功能**
   - 访问 http://localhost:5173
   - 注册新用户
   - 创建对话

3. ⭐ **可选优化**
   ```bash
   # 编译 better-sqlite3 (提升性能)
   pnpm rebuild better-sqlite3

   # 优化数据库
   bash scripts/optimize-sqlite-db.sh
   ```

4. 📚 **查看文档**
   - [完整迁移报告](./LOCAL_DB_MIGRATION_COMPLETE.md)
   - [数据库策略指南](./strategy-guide.md)
   - [PostgreSQL 配置](./postgresql-setup.md)

---

## 📝 总结

✅ **迁移完成!** 项目已配置为本地开发友好的数据库形态:

**主要特点**:
- ✅ 无需安装 PostgreSQL
- ✅ 自动降级策略 (三层)
- ✅ 支持 SQLite 和 JSON 两种模式
- ✅ 完整的备份和恢复工具
- ✅ 一键启动脚本

**当前配置**:
- 数据库: SQLite/JSON (自动选择)
- 主文件: data/app.db 或 data/database.json
- 备份: data/backups/
- PostgreSQL: 已禁用

**立即开始**:
```bash
bash start-dev.sh
```

---

**文档更新**: 2025-10-17
**版本**: v1.0
**状态**: ✅ 已完成迁移
