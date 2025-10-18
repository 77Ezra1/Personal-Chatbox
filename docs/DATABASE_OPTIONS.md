# 数据库选项说明

Personal Chatbox 支持三种数据库系统，你可以根据需要选择：

## 📊 支持的数据库

| 数据库 | 推荐场景 | 优点 | 缺点 |
|--------|---------|------|------|
| **SQLite** | 本地开发、个人使用 | 零配置、轻量级、文件存储 | 不支持并发写入、性能有限 |
| **SQL Server** | Windows 服务器、企业应用 | 性能优秀、企业级特性、Windows 集成 | Windows 专属、资源占用较大 |
| **PostgreSQL** | Linux/Mac 服务器、云部署 | 开源、跨平台、性能优秀 | 需要额外安装配置 |

## 🔍 如何选择

### 选择 SQLite 如果你：
- 只是在本地开发测试
- 个人使用，不需要多用户并发
- 想要零配置快速启动
- 数据量较小（< 1GB）

### 选择 SQL Server 如果你：
- 使用 Windows 服务器
- 需要企业级特性（高可用、故障转移等）
- 已有 SQL Server 基础设施
- 数据量较大且需要高性能

### 选择 PostgreSQL 如果你：
- 使用 Linux/Mac 服务器
- 需要云部署（AWS/Azure/GCP）
- 偏好开源解决方案
- 需要跨平台兼容性

## ⚙️ 配置方法

### SQLite (默认)

无需额外配置，应用会自动创建数据库文件。

```bash
# .env
DATABASE_PATH=./data/app.db
```

### SQL Server

参考快速开始指南：[SQLSERVER_QUICKSTART.md](./SQLSERVER_QUICKSTART.md)

```bash
# .env
DATABASE_URL=mssql://username:password@localhost:1433/database?encrypt=true&trustServerCertificate=true
```

### PostgreSQL

```bash
# .env
DATABASE_URL=postgresql://username:password@localhost:5432/database
```

## 🔄 数据库迁移

### 从 SQLite 迁移到 SQL Server

```bash
npm run db:migrate-to-sqlserver
```

详细步骤参考：[SQLSERVER_MIGRATION.md](./SQLSERVER_MIGRATION.md)

### 从 SQLite 迁移到 PostgreSQL

使用第三方工具如 `pgloader` 或手动导出导入。

## 📈 性能对比

基于典型使用场景的性能参考：

| 操作 | SQLite | SQL Server | PostgreSQL |
|------|--------|------------|-----------|
| 简单查询 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 复杂查询 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 并发写入 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 大数据量 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 🔐 安全建议

### 所有数据库通用

- ✅ 使用强密码（至少12位，混合字符）
- ✅ 定期备份数据
- ✅ 不要在代码中硬编码密码
- ✅ 使用环境变量存储凭据

### SQL Server / PostgreSQL 特定

- ✅ 启用 SSL/TLS 加密
- ✅ 使用防火墙限制访问
- ✅ 定期更新数据库补丁
- ✅ 监控数据库日志

## 📚 相关文档

- [SQL Server 快速开始](./SQLSERVER_QUICKSTART.md)
- [SQL Server 完整迁移指南](./SQLSERVER_MIGRATION.md)
- [环境变量配置](./.env.example)

## 🆘 故障排查

### 无法连接到数据库

1. 检查数据库服务是否运行
2. 验证连接字符串是否正确
3. 确认防火墙设置
4. 查看应用日志 `logs/backend.log`

### 性能问题

1. 检查数据库索引
2. 优化查询语句
3. 调整连接池配置
4. 考虑升级到 SQL Server 或 PostgreSQL

---

**最后更新:** 2025-10-18
