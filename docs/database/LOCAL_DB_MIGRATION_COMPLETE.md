# 本地开发数据库迁移完成报告

## 📅 迁移日期
2025-10-17

## 🎯 迁移目标
将项目数据库统一迁移为适合本地开发的 SQLite 形态,禁用 PostgreSQL,优化性能。

---

## ✅ 完成的工作

### 1. 数据备份
- ✅ 已备份所有现有数据库文件
- 备份位置: `data/backups/`
- 备份文件:
  - `app_20251017_145631.db` (284KB)
  - `app_20251017_145806.db` (284KB)
  - `chatbox_20251017_145631.db` (104KB)
  - `chatbox_20251017_145806.db` (104KB)
  - `database_20251017_145631.json` (1.6KB)
  - `database_20251017_145806.json` (1.6KB)

### 2. 环境配置
- ✅ 已禁用 PostgreSQL 配置
  ```bash
  # .env 文件
  # DATABASE_URL=postgresql://... (已注释)
  DATABASE_PATH=./data/app.db
  NODE_ENV=development
  ```

### 3. 数据库统一
- ✅ 主数据库: `data/app.db` (284KB)
- ✅ 使用 better-sqlite3 驱动
- ✅ 已清理空数据库文件 (`database.db`)
- ⚠️ 保留旧数据库 `chatbox.db` (如需要可手动删除)

### 4. 创建的工具脚本

#### a) 本地数据库配置脚本
**文件**: `scripts/setup-local-db.sh`

**功能**:
- 自动检测和配置本地开发环境
- 统一使用 SQLite 数据库
- 禁用 PostgreSQL 配置
- 备份现有数据
- 清理冗余文件

**使用方法**:
```bash
bash scripts/setup-local-db.sh
```

#### b) SQLite 优化脚本
**文件**: `scripts/optimize-sqlite-db.sh`

**功能**:
- 检查数据库完整性
- 配置 WAL 模式
- 优化查询性能 (ANALYZE)
- 压缩数据库 (VACUUM)
- 合并 WAL 文件
- 显示统计信息

**使用方法**:
```bash
bash scripts/optimize-sqlite-db.sh
```

**建议频率**: 每周运行一次

#### c) 数据库清理脚本
**文件**: `scripts/cleanup-old-db-files.sh`

**功能**:
- 扫描冗余数据库文件
- 交互式删除确认
- 清理旧版本数据库
- 显示文件大小

**使用方法**:
```bash
bash scripts/cleanup-old-db-files.sh
```

---

## 📊 当前数据库状态

### 数据库配置
| 配置项 | 值 |
|--------|-----|
| **数据库类型** | SQLite (better-sqlite3) |
| **数据库文件** | `data/app.db` |
| **数据库大小** | 284KB |
| **PostgreSQL** | 已禁用 ✓ |
| **运行模式** | development |

### 数据库优化设置
```sql
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging (提升并发)
PRAGMA synchronous = NORMAL;       -- 平衡性能和安全性
PRAGMA foreign_keys = ON;          -- 启用外键约束
PRAGMA busy_timeout = 5000;        -- 5秒超时
PRAGMA cache_size = -64000;        -- 64MB缓存
PRAGMA temp_store = MEMORY;        -- 临时表使用内存
```

### 文件清单
```
data/
├── app.db              # 284KB - 主数据库 ✓
├── app.db-wal          # 1.7MB - WAL日志文件
├── app.db-shm          # 32KB - 共享内存文件
├── app.db.json         # 4.7KB - JSON导出 (可选)
├── chatbox.db          # 104KB - 旧版本 (可删除)
├── database.json       # 1.6KB - JSON fallback
├── config.json         # 924B - 配置文件
├── user-config.json    # 316B - 用户配置
└── backups/            # 备份目录
    ├── app_*.db
    ├── chatbox_*.db
    └── database_*.json
```

---

## 🚀 启动开发环境

### 方式 1: 使用启动脚本 (推荐)
```bash
bash start-dev.sh
```

### 方式 2: 手动启动
```bash
# 启动后端
NODE_ENV=development node server/index.cjs

# 启动前端 (新终端)
npm run dev
```

### 验证数据库连接
启动后应该看到:
```
[Unified DB] ✅ Using better-sqlite3
[DB Init] Connected to database: data/app.db driver= better-sqlite3
```

---

## 🔧 日常维护

### 1. 定期优化数据库
```bash
# 每周运行一次
bash scripts/optimize-sqlite-db.sh
```

**优化效果**:
- 减少文件大小
- 提升查询速度
- 合并 WAL 日志
- 更新统计信息

### 2. 清理旧文件
```bash
# 按需运行
bash scripts/cleanup-old-db-files.sh
```

### 3. 备份数据
```bash
# 手动备份
cp data/app.db data/backups/app_$(date +%Y%m%d_%H%M%S).db

# 或使用 SQLite 命令
sqlite3 data/app.db ".backup data/backups/app_backup.db"
```

---

## 📋 数据库架构

### 优先级顺序
项目会按以下顺序尝试数据库:

```
1. PostgreSQL (DATABASE_URL/POSTGRES_URL)
   ↓ (如果未配置或连接失败)

2. better-sqlite3 (data/app.db)
   ↓ (如果未安装或初始化失败)

3. JSON 文件数据库 (data/database.json)
```

### 当前使用
✅ **better-sqlite3** (`data/app.db`)

---

## 🎯 优势对比

### SQLite vs PostgreSQL (本地开发)

| 特性 | SQLite | PostgreSQL |
|------|--------|------------|
| **安装复杂度** | ✅ 无需安装 | ❌ 需要安装服务 |
| **启动速度** | ✅ 秒级 | ⚠️ 需启动服务 |
| **资源占用** | ✅ 极低 (~5MB) | ⚠️ 较高 (~100MB) |
| **配置复杂度** | ✅ 零配置 | ⚠️ 需要配置用户/密码 |
| **数据库文件** | ✅ 单文件 | ❌ 复杂的数据目录 |
| **备份恢复** | ✅ 复制文件即可 | ⚠️ 需要 pg_dump |
| **并发写入** | ⚠️ 有限 | ✅ 优秀 |
| **适用场景** | ✅ 本地开发 | ✅ 生产环境 |

### better-sqlite3 vs JSON

| 特性 | better-sqlite3 | JSON |
|------|----------------|------|
| **查询性能** | ✅ 快速 (索引) | ❌ 慢 (全表扫描) |
| **事务支持** | ✅ 完整 ACID | ❌ 无 |
| **数据完整性** | ✅ 外键约束 | ❌ 无 |
| **并发控制** | ✅ 锁机制 | ❌ 文件冲突 |
| **数据量支持** | ✅ GB 级别 | ⚠️ MB 级别 |
| **适用场景** | ✅ 正常开发 | ⚠️ 仅测试/演示 |

---

## ⚠️ 注意事项

### 1. SQLite 限制
- **不适合高并发**: 多个进程同时写入会产生锁等待
- **单机部署**: 不支持网络访问
- **建议**: 本地开发 ✓ | 生产环境 ✗

### 2. WAL 模式
- **文件增加**: 会产生 `-wal` 和 `-shm` 文件
- **自动清理**: 定期运行 optimize 脚本
- **备份注意**: 备份时需要同时备份 WAL 文件

### 3. 数据迁移
如果将来需要迁移到 PostgreSQL:

```bash
# 1. 安装 PostgreSQL
# 参考: docs/database/postgresql-setup.md

# 2. 导出 SQLite 数据
sqlite3 data/app.db .dump > export.sql

# 3. 转换并导入 PostgreSQL
# 使用项目提供的迁移工具
```

---

## 📚 相关文档

- [数据库策略指南](./strategy-guide.md) - 选择合适的数据库方案
- [PostgreSQL 配置指南](./postgresql-setup.md) - 配置生产环境数据库
- [Better SQLite3 安装指南](../setup/BETTER_SQLITE3_INSTALL_GUIDE.md) - 解决编译问题

---

## 🆘 常见问题

### Q1: 如何切换回 PostgreSQL?

**答**: 编辑 `.env` 文件,取消注释 DATABASE_URL:
```bash
DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
```

### Q2: 数据库文件损坏怎么办?

**答**: 从备份恢复:
```bash
cp data/backups/app_20251017_145806.db data/app.db
```

### Q3: WAL 文件越来越大怎么办?

**答**: 运行优化脚本:
```bash
bash scripts/optimize-sqlite-db.sh
```

### Q4: better-sqlite3 安装失败?

**答**: 参考 [安装指南](../setup/BETTER_SQLITE3_INSTALL_GUIDE.md)

### Q5: 想完全删除 PostgreSQL 数据?

**答**: 只需保持 `.env` 中的 DATABASE_URL 注释即可,无需删除 PostgreSQL

---

## ✅ 验证清单

- [x] PostgreSQL 配置已禁用
- [x] 主数据库为 app.db
- [x] better-sqlite3 驱动正常
- [x] 数据已备份
- [x] 环境变量已配置
- [x] 启动脚本已测试
- [x] 优化工具已创建
- [x] 文档已更新

---

## 🎉 总结

✅ **迁移成功!** 项目现在使用 SQLite (better-sqlite3) 作为本地开发数据库。

**主要成果**:
1. ✅ 简化了本地开发流程 (无需安装 PostgreSQL)
2. ✅ 提升了启动速度 (秒级启动)
3. ✅ 降低了资源占用 (~5MB vs ~100MB)
4. ✅ 创建了完整的维护工具链
5. ✅ 所有数据已安全备份

**下一步**:
- 启动开发服务器: `bash start-dev.sh`
- 定期优化数据库: `bash scripts/optimize-sqlite-db.sh`
- 需要时切换到 PostgreSQL (生产环境)

---

**生成时间**: 2025-10-17 14:58:06
**操作人员**: Claude Code
**迁移状态**: ✅ 完成
