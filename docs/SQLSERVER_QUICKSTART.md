# SQL Server 快速开始指南

这是一个快速配置 SQL Server 并迁移数据的简化版指南。完整文档请参考 [SQLSERVER_MIGRATION.md](./SQLSERVER_MIGRATION.md)。

## 📋 前提条件

- ✅ 已安装 SQL Server (Express/Developer/Standard/Enterprise)
- ✅ 已安装 SQL Server Management Studio (SSMS) - 推荐
- ✅ SQL Server 服务正在运行

## 🚀 快速开始（5 步）

### 步骤 1: 创建数据库

打开 SSMS 或使用命令行工具执行：

```sql
-- 创建数据库
CREATE DATABASE PersonalChatbox;
GO

-- 创建登录用户
CREATE LOGIN chatbox_user WITH PASSWORD = 'ChatBox2025!';
GO

-- 授权
USE PersonalChatbox;
GO
CREATE USER chatbox_user FOR LOGIN chatbox_user;
ALTER ROLE db_owner ADD MEMBER chatbox_user;
GO
```

### 步骤 2: 启用 TCP/IP（如果未启用）

1. 打开 **SQL Server Configuration Manager**
2. **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**
3. 右键 **TCP/IP** → **启用**
4. 右键 **SQL Server (MSSQLSERVER)** → **重启**

### 步骤 3: 配置防火墙（远程连接需要）

**PowerShell（管理员）:**
```powershell
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

**或手动配置:**
- Windows 防火墙 → 高级设置 → 入站规则
- 新建规则 → 端口 → TCP → 1433 → 允许连接

### 步骤 4: 配置环境变量

编辑项目根目录的 `.env` 文件：

```bash
# 本地连接（使用 SQL Server 身份验证）
DATABASE_URL=mssql://chatbox_user:ChatBox2025!@localhost:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true

# 远程连接（替换 YOUR_SERVER_IP）
# DATABASE_URL=mssql://chatbox_user:ChatBox2025!@YOUR_SERVER_IP:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true
```

### 步骤 5: 测试连接并迁移数据

```bash
# 1. 测试 SQL Server 连接
npm run db:test-sqlserver

# 如果测试通过，继续：

# 2. 创建表结构并迁移数据
npm run db:migrate-to-sqlserver

# 3. 启动应用
npm run server
```

## ✅ 验证安装

访问 `http://localhost:3001` 查看应用是否正常运行。

---

## 🔧 常见问题快速解决

### Q1: 连接被拒绝

```bash
# 检查 SQL Server 是否运行
services.msc  # 查找 SQL Server (MSSQLSERVER)

# 或使用 PowerShell
Get-Service MSSQLSERVER
```

### Q2: 登录失败

检查 SQL Server 身份验证模式：
1. SSMS → 右键服务器 → 属性
2. 安全性 → **SQL Server 和 Windows 身份验证模式**
3. 重启 SQL Server 服务

### Q3: 防火墙阻止

临时关闭防火墙测试：
```powershell
# 关闭防火墙（测试用）
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# 测试后记得重新启用
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

## 📚 进阶配置

如需更详细的配置说明，请参考：
- [完整迁移指南](./SQLSERVER_MIGRATION.md)
- [远程连接配置](./SQLSERVER_MIGRATION.md#远程连接配置)
- [安全最佳实践](./SQLSERVER_MIGRATION.md#安全最佳实践)

---

## 🆘 获取帮助

如果遇到问题：
1. 查看日志：`logs/backend.log`
2. 运行诊断：`npm run db:test-sqlserver`
3. 参考完整文档：`docs/SQLSERVER_MIGRATION.md`
4. 提交 Issue：GitHub Issues

---

**最后更新:** 2025-10-18
