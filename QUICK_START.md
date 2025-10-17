# 快速启动指南

## 🚀 一键启动

```bash
# 启动开发服务器
bash start-dev.sh
```

## 📊 数据库状态

✅ **已配置为本地开发模式**
- 数据库类型: SQLite / JSON (自动降级)
- PostgreSQL: 已禁用
- 配置状态: ✓ 就绪

## 📚 详细文档

- [本地开发快速启动](docs/database/QUICK_START_LOCAL_DEV.md)
- [数据库迁移完成报告](docs/database/LOCAL_DB_MIGRATION_COMPLETE.md)
- [数据库策略指南](docs/database/strategy-guide.md)

## 🔧 常用命令

```bash
# 启动开发服务器
bash start-dev.sh

# 优化数据库 (可选)
bash scripts/optimize-sqlite-db.sh

# 清理旧文件 (可选)
bash scripts/cleanup-old-db-files.sh

# 重新配置数据库
bash scripts/setup-local-db.sh
```

## ✅ 验证启动

访问: http://localhost:5173

应该能看到登录页面。

---

**最后更新**: 2025-10-17
**数据库模式**: SQLite/JSON (本地开发)
