# SQL Server 数据库迁移指南

本指南将帮助你将 Personal Chatbox 从 SQLite 迁移到 SQL Server，并配置远程连接。

## 目录

1. [前提条件](#前提条件)
2. [本地配置](#本地配置)
3. [数据迁移](#数据迁移)
4. [远程连接配置](#远程连接配置)
5. [常见问题](#常见问题)

---

## 前提条件

### 1. SQL Server 安装

确保你的电脑上已经安装了以下之一：
- SQL Server Express (免费版)
- SQL Server Developer (免费开发版)
- SQL Server Standard/Enterprise

### 2. 创建数据库

打开 SQL Server Management Studio (SSMS) 或使用命令行：

```sql
-- 创建数据库
CREATE DATABASE PersonalChatbox;
GO

-- 创建登录用户 (可选，推荐)
CREATE LOGIN chatbox_user WITH PASSWORD = 'YourStrongPassword123!';
GO

-- 使用新数据库
USE PersonalChatbox;
GO

-- 创建数据库用户并授权
CREATE USER chatbox_user FOR LOGIN chatbox_user;
ALTER ROLE db_owner ADD MEMBER chatbox_user;
GO
```

### 3. 启用 TCP/IP 协议

1. 打开 **SQL Server Configuration Manager**
2. 展开 **SQL Server Network Configuration**
3. 选择 **Protocols for MSSQLSERVER** (或你的实例名)
4. 右键点击 **TCP/IP** → 启用
5. 重启 SQL Server 服务

---

## 本地配置

### 1. 环境变量配置

编辑项目根目录的 `.env` 文件：

```bash
# ============================================
# 数据库配置 - SQL Server
# ============================================

# SQL Server 连接字符串格式：
# mssql://username:password@server:port/database?encrypt=true&trustServerCertificate=true

# 本地连接示例（Windows 身份验证）
# DATABASE_URL=mssql://localhost:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true

# 本地连接示例（SQL Server 身份验证）
DATABASE_URL=mssql://chatbox_user:YourStrongPassword123!@localhost:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true

# 远程连接示例
# DATABASE_URL=mssql://chatbox_user:YourStrongPassword123!@192.168.1.100:1433/PersonalChatbox?encrypt=true&trustServerCertificate=false

# 数据库连接池配置
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=2
DB_IDLE_TIMEOUT=30000
```

### 2. 连接字符串参数说明

- **server**: 服务器地址 (localhost 或 IP 地址)
- **port**: 端口号 (默认 1433)
- **database**: 数据库名称
- **encrypt**: 是否加密连接
  - `true`: 启用加密（推荐）
  - `false`: 不加密
- **trustServerCertificate**: 是否信任服务器证书
  - `true`: 本地开发环境
  - `false`: 生产环境（需要有效证书）

---

## 数据迁移

### 方式一：使用迁移脚本（推荐）

1. **确保 SQLite 数据库存在**
   ```bash
   # 检查数据库文件
   ls data/app.db
   ```

2. **配置 SQL Server 连接**
   - 在 `.env` 中设置 `DATABASE_URL` 为 SQL Server 连接串

3. **运行迁移脚本**
   ```bash
   node scripts/migrate-to-sqlserver.cjs
   ```

4. **验证迁移结果**

   脚本会自动：
   - ✅ 创建 SQL Server 表结构
   - ✅ 从 SQLite 导入所有数据
   - ✅ 显示迁移摘要和记录数

### 方式二：手动执行 SQL

1. **创建表结构**
   ```bash
   # 在 SSMS 中打开并执行
   server/db/sqlserver-schema.sql
   ```

2. **导出 SQLite 数据**
   ```bash
   sqlite3 data/app.db .dump > data/sqlite-dump.sql
   ```

3. **手动转换并导入**（需要修改 SQL 语法）

---

## 远程连接配置

### 1. SQL Server 服务器配置

#### 1.1 配置防火墙

**Windows 防火墙:**

```powershell
# 以管理员身份运行 PowerShell
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

**或者通过 GUI:**
1. 打开 **Windows Defender 防火墙**
2. 点击 **高级设置**
3. 点击 **入站规则** → **新建规则**
4. 选择 **端口** → **TCP** → **特定本地端口: 1433**
5. 允许连接 → 完成

#### 1.2 SQL Server 配置

1. 打开 **SQL Server Management Studio**
2. 右键服务器 → **属性**
3. 选择 **连接** → 勾选 **允许远程连接到此服务器**
4. 选择 **安全性** → 选择 **SQL Server 和 Windows 身份验证模式**

#### 1.3 创建远程用户

```sql
-- 创建登录
CREATE LOGIN remote_chatbox_user WITH PASSWORD = 'VeryStrongPassword456!';
GO

USE PersonalChatbox;
GO

-- 创建用户并授权
CREATE USER remote_chatbox_user FOR LOGIN remote_chatbox_user;
ALTER ROLE db_owner ADD MEMBER remote_chatbox_user;
GO
```

### 2. 客户端配置

#### 2.1 获取服务器 IP 地址

**Windows:**
```powershell
ipconfig
# 查找 IPv4 地址，例如：192.168.1.100
```

**Linux/Mac:**
```bash
ifconfig
# 或
ip addr show
```

#### 2.2 更新 .env 文件

```bash
# 远程连接配置
DATABASE_URL=mssql://remote_chatbox_user:VeryStrongPassword456!@192.168.1.100:1433/PersonalChatbox?encrypt=true&trustServerCertificate=false

# 如果使用自签名证书，设置 trustServerCertificate=true
# DATABASE_URL=mssql://remote_chatbox_user:VeryStrongPassword456!@192.168.1.100:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true
```

### 3. 测试连接

创建测试脚本 `scripts/test-sqlserver-connection.cjs`:

```javascript
require('dotenv').config();
const sql = require('mssql');

async function testConnection() {
  try {
    console.log('🔌 Testing SQL Server connection...');
    console.log('URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

    const pool = await sql.connect(process.env.DATABASE_URL);
    const result = await pool.request().query('SELECT @@VERSION as version');

    console.log('✅ Connection successful!');
    console.log('SQL Server Version:', result.recordset[0].version);

    await pool.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

运行测试：
```bash
node scripts/test-sqlserver-connection.cjs
```

---

## 安全最佳实践

### 1. 密码安全

- ✅ 使用强密码（至少12位，包含大小写、数字、特殊字符）
- ✅ 定期更换密码
- ✅ 不要在代码中硬编码密码
- ✅ 使用环境变量存储敏感信息

### 2. 网络安全

- ✅ 启用 SQL Server 加密 (`encrypt=true`)
- ✅ 使用有效的 SSL 证书（生产环境）
- ✅ 限制防火墙规则（只允许特定 IP）
- ✅ 使用 VPN 进行远程访问（推荐）

### 3. 数据库安全

- ✅ 使用最小权限原则
- ✅ 定期备份数据库
- ✅ 启用审计日志
- ✅ 及时更新 SQL Server 补丁

---

## 常见问题

### Q1: 连接超时怎么办？

**检查清单:**
1. SQL Server 服务是否运行？
2. TCP/IP 协议是否启用？
3. 防火墙是否允许 1433 端口？
4. 用户名密码是否正确？
5. 服务器 IP 地址是否正确？

### Q2: 认证失败怎么办？

```sql
-- 检查用户是否存在
USE PersonalChatbox;
SELECT * FROM sys.database_principals WHERE name = 'chatbox_user';

-- 重置密码
ALTER LOGIN chatbox_user WITH PASSWORD = 'NewPassword123!';
```

### Q3: 如何启用 Windows 身份验证？

连接字符串格式：
```bash
# Windows 身份验证（不需要用户名密码）
DATABASE_URL=mssql://localhost:1433/PersonalChatbox?encrypt=true&trustServerCertificate=true&IntegratedSecurity=true
```

### Q4: 如何备份数据库？

```sql
-- 完整备份
BACKUP DATABASE PersonalChatbox
TO DISK = 'C:\Backups\PersonalChatbox.bak'
WITH FORMAT, MEDIANAME = 'PersonalChatbox_Backup';

-- 恢复备份
RESTORE DATABASE PersonalChatbox
FROM DISK = 'C:\Backups\PersonalChatbox.bak'
WITH REPLACE;
```

### Q5: 如何查看连接池状态？

应用会自动记录连接池信息，查看日志：
```bash
tail -f logs/backend.log
```

---

## 性能优化建议

### 1. 连接池配置

```bash
# .env 配置
DB_MAX_CONNECTIONS=20      # 最大连接数
DB_MIN_CONNECTIONS=2       # 最小连接数
DB_IDLE_TIMEOUT=30000      # 空闲超时（毫秒）
```

### 2. 索引优化

Schema 已经包含了必要的索引，但你可以根据实际查询添加更多索引。

### 3. 查询优化

使用 SQL Server Profiler 分析慢查询并优化。

---

## 回滚到 SQLite

如果需要回滚到 SQLite：

```bash
# 1. 修改 .env
# DATABASE_URL=mssql://...  # 注释掉
DATABASE_PATH=./data/app.db  # 启用 SQLite

# 2. 重启服务
npm run server
```

---

## 技术支持

如果遇到问题，请：
1. 查看日志文件 `logs/backend.log`
2. 检查 SQL Server 错误日志
3. 参考本文档的常见问题部分
4. 提交 GitHub Issue

---

## 相关资源

- [SQL Server 官方文档](https://docs.microsoft.com/sql/sql-server/)
- [mssql npm 包文档](https://www.npmjs.com/package/mssql)
- [SQL Server 最佳实践](https://docs.microsoft.com/sql/relational-databases/best-practices/)

---

**最后更新:** 2025-10-18
