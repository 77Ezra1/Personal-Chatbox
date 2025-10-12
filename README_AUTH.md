# Personal Chatbox - 用户认证系统

## 🎉 新功能

Personal Chatbox现已支持用户认证系统!主要特性包括:

- ✅ **用户注册与登录**: 支持邮箱密码注册和登录
- ✅ **邀请码系统**: 通过邀请码控制用户注册
- ✅ **数据隔离**: 每个用户拥有独立的对话空间
- ✅ **安全保障**: 密码加密、JWT认证、HTTP-Only Cookie
- ✅ **会话管理**: 自动登录、记住登录状态、安全登出

## 🚀 快速开始

### 方式一: 使用启动脚本(推荐)

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh
```

### 方式二: 手动启动

```bash
# 1. 启动后端服务器
npm run server

# 2. 启动前端开发服务器(新终端)
npm run dev
```

### 访问应用

打开浏览器访问: http://localhost:5173

## 📋 首次使用

### 1. 获取邀请码

当前可用的邀请码:

| 邀请码 | 剩余次数 | 用途 |
|--------|---------|------|
| TEST2025 | 8/10 | 测试使用 |
| WELCOME | 4/5 | 新用户欢迎 |
| ADMIN001 | 1/1 | 管理员专用 |

查看所有邀请码:
```bash
node scripts/manage-invite-codes.cjs list
```

### 2. 注册账号

1. 访问 http://localhost:5173
2. 点击"注册"按钮
3. 填写信息:
   - 邮箱: your@email.com
   - 用户名: 你的名字(可选)
   - 密码: 至少8位,包含大小写字母、数字和特殊字符
   - 邀请码: 从上面选择一个
4. 点击"注册"完成

### 3. 开始使用

注册成功后会自动登录,你可以:
- 创建新对话
- 与AI聊天
- 查看历史对话
- 管理个人数据

## 🔑 邀请码管理

### 查看邀请码
```bash
node scripts/manage-invite-codes.cjs list
```

### 添加邀请码
```bash
# 基本用法
node scripts/manage-invite-codes.cjs add MYCODE 10

# 带描述
node scripts/manage-invite-codes.cjs add MYCODE 10 "给朋友的邀请码"
```

### 禁用/启用邀请码
```bash
# 禁用
node scripts/manage-invite-codes.cjs disable MYCODE

# 启用
node scripts/manage-invite-codes.cjs enable MYCODE
```

### 删除邀请码
```bash
node scripts/manage-invite-codes.cjs delete MYCODE
```

## 📚 文档

- [用户使用指南](./AUTH_README.md) - 详细的使用说明
- [完整实现报告](./AUTH_SYSTEM_REPORT.md) - 技术实现细节

## 🔐 安全说明

### 密码要求
- 至少8个字符
- 包含大写字母
- 包含小写字母
- 包含数字
- 包含特殊字符

示例: `Test123456!`

### 数据安全
- 密码使用bcrypt加密,无法反向解密
- JWT Token存储在HTTP-Only Cookie中
- 每个用户的数据完全隔离
- 会话自动过期(7天)

## 🛠️ 管理工具

### 查看用户列表
```bash
sqlite3 data/app.db "SELECT id, email, username, created_at FROM users;"
```

### 查看对话统计
```bash
sqlite3 data/app.db "SELECT user_id, COUNT(*) as conv_count FROM conversations GROUP BY user_id;"
```

### 备份数据库
```bash
cp data/app.db data/app.db.backup
```

## 🔧 故障排除

### 无法注册
- 检查邀请码是否正确
- 确认密码符合要求
- 检查邮箱是否已被使用

### 无法登录
- 确认邮箱和密码正确
- 清除浏览器Cookie后重试
- 检查后端服务器是否运行

### 看不到数据
- 确认已登录
- 检查是否使用了正确的账号
- 查看浏览器控制台错误信息

### 查看日志
```bash
# 后端日志
tail -f /tmp/server.log

# 前端日志
tail -f /tmp/frontend.log
```

## 📊 系统架构

```
┌─────────────────┐
│   前端 (React)   │
│   Port: 5173    │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │ JWT Token
         │
┌────────▼────────┐
│  后端 (Express)  │
│   Port: 3001    │
└────────┬────────┘
         │
         │ SQL
         │
┌────────▼────────┐
│  数据库 (SQLite) │
│   app.db        │
└─────────────────┘
```

## 🎯 功能特性

### 已实现
- ✅ 用户注册(邮箱+密码)
- ✅ 用户登录
- ✅ 用户登出
- ✅ 邀请码系统
- ✅ 数据隔离
- ✅ 会话管理
- ✅ 密码加密
- ✅ JWT认证
- ✅ 自动登录

### 计划中
- ⏳ 忘记密码
- ⏳ 邮箱验证
- ⏳ OAuth登录(Google, GitHub)
- ⏳ 用户个人资料编辑
- ⏳ 管理员后台
- ⏳ 两步验证(2FA)

## 📞 获取帮助

如遇到问题:

1. 查看文档:
   - [用户指南](./AUTH_README.md)
   - [技术报告](./AUTH_SYSTEM_REPORT.md)

2. 检查日志:
   ```bash
   tail -f /tmp/server.log
   tail -f /tmp/frontend.log
   ```

3. 检查数据库:
   ```bash
   sqlite3 data/app.db
   ```

## 📝 更新日志

### v1.0.0 (2025-10-12)
- ✨ 新增用户认证系统
- ✨ 新增邀请码注册
- ✨ 新增数据隔离功能
- ✨ 新增会话管理
- ✨ 新增管理工具脚本
- 🔒 增强安全性(密码加密、JWT认证)

---

**开发者**: Personal Chatbox Team  
**最后更新**: 2025-10-12  
**版本**: 1.0.0

