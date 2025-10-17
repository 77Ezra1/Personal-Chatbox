# PostgreSQL 数据库配置指南

## 📋 目录
1. [安装PostgreSQL](#步骤1-安装postgresql)
2. [创建数据库](#步骤2-创建数据库和用户)
3. [运行迁移脚本](#步骤3-运行迁移脚本)
4. [配置项目](#步骤4-配置项目环境变量)
5. [启动项目](#步骤5-启动项目)
6. [验证配置](#步骤6-验证配置)

---

## 步骤1: 安装PostgreSQL

### Windows系统

1. **下载安装程序**
   - 访问：https://www.postgresql.org/download/windows/
   - 或者直接下载：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - 选择最新稳定版本（推荐 15.x 或 16.x）

2. **运行安装程序**
   - 双击运行下载的安装程序
   - 安装路径：使用默认路径 `C:\Program Files\PostgreSQL\16`
   - **重要**：设置超级用户(postgres)密码 - 请记住这个密码！
   - 端口：保持默认 **5432**
   - 区域设置：选择 **Chinese, China** 或 **Default locale**
   - 完成安装，安装程序会自动启动PostgreSQL服务

3. **验证安装**
   ```bash
   # 在命令提示符或PowerShell中运行
   psql --version
   ```

   应该看到类似输出：
   ```
   psql (PostgreSQL) 16.x
   ```

---

## 步骤2: 创建数据库和用户

### 方式A: 使用pgAdmin（图形界面，推荐新手）

1. **打开pgAdmin**
   - 开始菜单 → PostgreSQL 16 → pgAdmin 4
   - 输入主密码（第一次运行会要求设置）

2. **连接到数据库服务器**
   - 左侧树形菜单 → Servers → PostgreSQL 16
   - 输入你设置的postgres用户密码

3. **创建用户**
   - 右键点击 `Login/Group Roles` → Create → Login/Group Role
   - General标签：Name = `chatbox_user`
   - Definition标签：Password = `chatbox2025`
   - Privileges标签：勾选 `Can login?`
   - 点击 Save

4. **创建数据库**
   - 右键点击 `Databases` → Create → Database
   - General标签：
     - Database: `personal_chatbox`
     - Owner: `chatbox_user`
   - 点击 Save

### 方式B: 使用命令行（推荐）

1. **打开命令提示符或PowerShell**

2. **连接到PostgreSQL**
   ```bash
   psql -U postgres
   ```
   输入postgres用户的密码

3. **执行SQL命令**
   ```sql
   -- 创建用户
   CREATE USER chatbox_user WITH PASSWORD 'chatbox2025';

   -- 创建数据库
   CREATE DATABASE personal_chatbox OWNER chatbox_user;

   -- 授予所有权限
   GRANT ALL PRIVILEGES ON DATABASE personal_chatbox TO chatbox_user;

   -- 在PostgreSQL 15+中，还需要授予schema权限
   \c personal_chatbox
   GRANT ALL ON SCHEMA public TO chatbox_user;

   -- 退出
   \q
   ```

4. **测试连接**
   ```bash
   psql -U chatbox_user -d personal_chatbox
   ```
   输入密码: `chatbox2025`

   如果成功连接，你会看到：
   ```
   personal_chatbox=>
   ```

---

## 步骤3: 运行迁移脚本

### 自动运行迁移（推荐）

在项目根目录下运行：

```bash
# Windows PowerShell
$env:PGPASSWORD="chatbox2025"
psql -U chatbox_user -d personal_chatbox -f server/db/postgres-migration.sql

# 或者在Git Bash中
PGPASSWORD=chatbox2025 psql -U chatbox_user -d personal_chatbox -f server/db/postgres-migration.sql
```

### 手动运行迁移

1. **连接到数据库**
   ```bash
   psql -U chatbox_user -d personal_chatbox
   ```

2. **在psql中执行迁移脚本**
   ```sql
   \i D:/Personal-Chatbox/server/db/postgres-migration.sql
   ```

3. **验证表结构**
   ```sql
   -- 查看所有表
   \dt

   -- 应该看到以下表：
   -- users
   -- sessions
   -- conversations
   -- messages
   -- user_configs
   -- ... 等等
   ```

---

## 步骤4: 配置项目环境变量

1. **编辑 `.env` 文件**

找到文件：`D:\Personal-Chatbox\.env`

2. **启用PostgreSQL配置**

将以下内容**取消注释**（删除开头的 `#`）：

```bash
# 从这样：
# DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
# PostgreSQL暂时禁用，使用JSON数据库

# 改成这样：
DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
# PostgreSQL已启用
```

3. **确认其他配置**

确保这些配置也存在：

```bash
# 数据库连接池配置
PG_POOL_MAX=20
PG_POOL_MIN=2

# Node环境
NODE_ENV=development
PORT=3001
```

---

## 步骤5: 启动项目

### 方式A: 使用启动脚本

```bash
cd D:\Personal-Chatbox
bash start-dev.sh
```

### 方式B: 手动启动

```bash
# 启动后端
cd D:\Personal-Chatbox
NODE_ENV=development node server/index.cjs

# 在新的终端窗口启动前端
cd D:\Personal-Chatbox
npm run dev
```

### 检查启动日志

查看后端日志中的数据库连接信息：

```bash
tail -f logs/backend.log
```

你应该看到：
```
[DB Init] ✅ Using PostgreSQL (Production Mode)
[DB Init] Connected to database: PostgreSQL driver= pg
```

如果看到这个，说明PostgreSQL配置成功！

---

## 步骤6: 验证配置

### 测试1: 检查数据库连接

```bash
# 访问健康检查端点
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"ok","timestamp":"2025-10-17T..."}
```

### 测试2: 注册新用户

打开浏览器访问：http://localhost:5173/login

尝试注册一个新用户，如果成功则配置正确。

### 测试3: 查看数据库中的数据

```bash
psql -U chatbox_user -d personal_chatbox
```

```sql
-- 查看用户表
SELECT id, email, username, created_at FROM users;

-- 查看会话
SELECT COUNT(*) FROM sessions;

-- 退出
\q
```

---

## 常见问题

### Q1: 无法连接到PostgreSQL

**错误**: `ECONNREFUSED`

**解决方案**:
1. 检查PostgreSQL服务是否运行
   ```bash
   # Windows
   services.msc
   # 查找 "postgresql-x64-16" 服务，确保状态为"正在运行"
   ```

2. 或使用命令重启服务
   ```bash
   # PowerShell (管理员权限)
   Restart-Service postgresql-x64-16
   ```

### Q2: 认证失败

**错误**: `password authentication failed`

**解决方案**:
1. 确认密码正确：`chatbox2025`
2. 重置密码：
   ```sql
   psql -U postgres
   ALTER USER chatbox_user WITH PASSWORD 'chatbox2025';
   ```

### Q3: 数据库不存在

**错误**: `database "personal_chatbox" does not exist`

**解决方案**:
重新创建数据库：
```sql
psql -U postgres
CREATE DATABASE personal_chatbox OWNER chatbox_user;
GRANT ALL PRIVILEGES ON DATABASE personal_chatbox TO chatbox_user;
```

### Q4: 端口被占用

**错误**: `port 5432 is already in use`

**解决方案**:
1. 检查是否有其他PostgreSQL实例
2. 修改PostgreSQL端口：
   - 编辑 `postgresql.conf`
   - 修改 `port = 5433`
   - 更新 `.env` 中的 `DATABASE_URL`

---

## 性能优化建议

### 1. 创建索引

```sql
-- 连接数据库
psql -U chatbox_user -d personal_chatbox

-- 为常用查询创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- 为全文搜索创建GIN索引（如果使用笔记和文档功能）
CREATE INDEX notes_fts_idx ON notes
USING GIN (to_tsvector('english', title || ' ' || content));

CREATE INDEX documents_fts_idx ON documents
USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 2. 配置连接池

在 `.env` 中调整：

```bash
# 最大连接数（根据你的服务器配置）
PG_POOL_MAX=20

# 最小连接数
PG_POOL_MIN=2

# 连接超时（毫秒）
DB_CONNECTION_TIMEOUT=2000
```

---

## 切换回JSON数据库

如果你想临时切换回JSON数据库：

1. **注释 `.env` 中的 DATABASE_URL**
   ```bash
   # DATABASE_URL=postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox
   # PostgreSQL暂时禁用，使用JSON数据库
   ```

2. **重启项目**
   ```bash
   bash start-dev.sh
   ```

---

## 备份和恢复

### 备份数据库

```bash
# 备份整个数据库
pg_dump -U chatbox_user personal_chatbox > backup_$(date +%Y%m%d).sql

# 或者只备份数据（不包括表结构）
pg_dump -U chatbox_user --data-only personal_chatbox > data_backup.sql
```

### 恢复数据库

```bash
# 恢复数据库
psql -U chatbox_user personal_chatbox < backup_20251017.sql
```

---

## 卸载PostgreSQL

如果需要完全卸载：

1. **停止服务**
   - 控制面板 → 管理工具 → 服务
   - 停止所有PostgreSQL相关服务

2. **卸载程序**
   - 控制面板 → 程序和功能
   - 卸载 "PostgreSQL 16"

3. **删除数据目录**（可选）
   - 删除：`C:\Program Files\PostgreSQL`
   - 删除：`C:\Users\你的用户名\AppData\Local\PostgreSQL`

---

## 参考资料

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [PostgreSQL Windows安装指南](https://www.postgresql.org/download/windows/)
- [项目PostgreSQL修复指南](docs/POSTGRESQL_FIX_GUIDE.md)

---

## 需要帮助？

- 查看后端日志：`logs/backend.log`
- 查看PostgreSQL日志：`C:\Program Files\PostgreSQL\16\data\log`
- GitHub Issues: 提交问题到项目仓库

---

**配置完成后，你就可以享受PostgreSQL的强大功能了！** 🎉

主要优势：
- ✅ 更好的并发性能
- ✅ 完整的ACID支持
- ✅ 强大的全文搜索
- ✅ 适合生产环境
