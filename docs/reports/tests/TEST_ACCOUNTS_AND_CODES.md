# 测试账号和邀请码

> 生成时间：2025-10-18
> 用途：开发和测试

---

## 🔐 测试账号

所有测试账号使用**统一密码**: `test123456`

### 管理员账号

| 邮箱 | 用户名 | 密码 | 用途 |
|------|--------|------|------|
| `admin@test.com` | Admin | test123456 | 管理员测试 |

### 普通用户账号

| 邮箱 | 用户名 | 密码 | 用途 |
|------|--------|------|------|
| `user1@test.com` | User1 | test123456 | 普通用户测试1 |
| `user2@test.com` | User2 | test123456 | 普通用户测试2 |
| `demo@test.com` | Demo | test123456 | 演示账号 |
| `test@example.com` | TestUser | test123456 | 通用测试 |

### 已存在的账号

| 邮箱 | 用户名 | 备注 |
|------|--------|------|
| `2915165979@qq.com` | (未设置) | 原有账号 |
| `testuser@test.com` | (未设置) | 原有账号 |

---

## 🎟️ 邀请码

### 通用邀请码（推荐）

| 邀请码 | 可用次数 | 已使用 | 说明 |
|--------|---------|--------|------|
| `WELCOME2025` | 1000 | 0 | 欢迎使用邀请码 - **推荐使用** |
| `FRIEND2025` | 1000 | 0 | 朋友邀请码 |
| `TEAM2025` | 1000 | 0 | 团队邀请码 |
| `VIP2025` | 1000 | 0 | VIP邀请码 |
| `TEST2025` | 1000 | 0 | 测试邀请码 |
| `FREE2025` | 1000 | 0 | 免费邀请码 |

### 限量邀请码

| 邀请码 | 可用次数 | 已使用 | 说明 |
|--------|---------|--------|------|
| `DEMO2025` | 50 | 0 | 演示邀请码 |
| `ADMIN2025` | 10 | 0 | 管理员邀请码 |

### 管理员生成的邀请码

| 邀请码 | 可用次数 | 已使用 | 生成日期 |
|--------|---------|--------|---------|
| `WELCOME-AD508695` | 100 | 0 | 2025-10-17 |
| `WELCOME-B2FA6733` | 100 | 0 | 2025-10-17 |
| `WELCOME-9ACF13C9` | 100 | 0 | 2025-10-17 |
| `WELCOME-362B42E1` | 100 | 0 | 2025-10-17 |
| `WELCOME-BB5A937D` | 100 | 0 | 2025-10-17 |

### 特殊邀请码

| 邀请码 | 可用次数 | 说明 |
|--------|---------|------|
| `TEST-DOCS-2025` | 无限 (-1) | 文档测试专用 |

---

## 🚀 快速开始

### 1. 注册新账号

访问：http://localhost:5173/register

1. 输入邮箱（任意格式）
2. 输入密码
3. 输入邀请码：`WELCOME2025`
4. 点击注册

### 2. 使用测试账号登录

访问：http://localhost:5173/login

**快速登录**:
- 邮箱: `demo@test.com`
- 密码: `test123456`

或使用其他测试账号：
- `admin@test.com` / `test123456`
- `user1@test.com` / `test123456`
- `user2@test.com` / `test123456`

---

## 📝 注意事项

### 安全提示
- ⚠️ 这些是**开发测试**账号，请勿在生产环境使用
- ⚠️ 统一密码 `test123456` 仅用于测试
- ⚠️ 邀请码可多次使用，直到达到限制

### 密码要求
- 最小长度：8 个字符
- 推荐：包含大小写字母、数字、特殊字符

### 邀请码使用
- 邀请码不区分大小写
- 每个邀请码都有使用次数限制
- `TEST-DOCS-2025` 为无限次数邀请码

---

## 🛠️ 管理操作

### 查看所有用户
```bash
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT id, email, username FROM users;"
```

### 查看所有邀请码
```bash
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT code, max_uses, used_count, description FROM invite_codes WHERE is_active = 1;"
```

### 重置用户密码
```bash
node /Users/ezra/Personal-Chatbox/create_test_accounts.cjs
```

### 添加新邀请码
```sql
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db
INSERT INTO invite_codes (code, max_uses, used_count, description, is_active)
VALUES ('YOUR_CODE', 100, 0, '描述', 1);
```

---

## 🎨 功能测试指南

### 测试笔记功能
1. 登录任意测试账号
2. 访问: http://localhost:5173/notes
3. 创建新笔记
4. 测试功能：
   - Slash命令（输入 `/`）
   - AI工具栏（摘要、大纲、改写等）
   - 字数统计
   - 收藏/标签/分类

### 测试文档功能
1. 访问: http://localhost:5173/documents
2. 创建文档
3. 测试CRUD操作

### 测试密码保险库
1. 访问: http://localhost:5173/password-vault
2. 设置主密码
3. 添加密码条目

### 测试分析功能
1. 访问: http://localhost:5173/analytics
2. 查看使用统计
3. 查看图表

---

## 📊 系统状态

### 服务器
- 前端: http://localhost:5173 ✅
- 后端: http://localhost:3001 ✅

### 数据库
- 类型: SQLite
- 路径: `/Users/ezra/Personal-Chatbox/data/app.db`
- 用户数: 7
- 活跃邀请码: 14

### MCP服务
- Memory记忆系统 ✅
- Sequential Thinking推理 ✅
- Filesystem文件系统 ✅
- Wikipedia维基百科 ✅

---

## 🎉 推荐测试流程

### 新用户注册流程
1. 访问 http://localhost:5173/register
2. 使用邮箱: `newuser@test.com`
3. 使用密码: `test123456`
4. 使用邀请码: `WELCOME2025`
5. 注册成功后自动登录

### 已有账号登录流程
1. 访问 http://localhost:5173/login
2. 使用: `demo@test.com` / `test123456`
3. 登录成功

### 功能测试顺序
1. ✅ 登录/注册
2. ✅ 设置页面（配置API Key等）
3. ✅ 笔记功能（创建、编辑、AI工具）
4. ✅ 文档管理
5. ✅ 密码保险库
6. ✅ 分析统计

---

**生成时间**: 2025-10-18
**文档版本**: 1.0.0
**项目状态**: ✅ 运行中
