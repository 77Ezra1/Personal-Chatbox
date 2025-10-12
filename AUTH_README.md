# 用户认证系统使用指南

## 🚀 快速开始

### 1. 启动服务

```bash
# 启动后端服务器
npm run server

# 启动前端开发服务器
npm run dev
```

### 2. 访问应用

打开浏览器访问: `http://localhost:5173`

### 3. 注册账号

1. 点击"注册"按钮
2. 填写邮箱、用户名(可选)、密码和邀请码
3. 点击"注册"完成注册

**注意**: 需要有效的邀请码才能注册

### 4. 登录

1. 点击"登录"按钮
2. 输入邮箱和密码
3. 点击"登录"进入应用

## 🔑 邀请码管理

### 查看所有邀请码

```bash
node scripts/manage-invite-codes.cjs list
```

### 添加新邀请码

```bash
# 基本用法
node scripts/manage-invite-codes.cjs add CODE123 10

# 带描述
node scripts/manage-invite-codes.cjs add CODE123 10 "给朋友的邀请码"
```

参数说明:
- `CODE123`: 邀请码(自动转为大写)
- `10`: 最大使用次数
- `"给朋友的邀请码"`: 描述(可选)

### 禁用邀请码

```bash
node scripts/manage-invite-codes.cjs disable CODE123
```

### 启用邀请码

```bash
node scripts/manage-invite-codes.cjs enable CODE123
```

### 删除邀请码

```bash
node scripts/manage-invite-codes.cjs delete CODE123
```

**警告**: 删除操作不可恢复!

## 📋 当前可用邀请码

| 邀请码 | 剩余次数 | 描述 |
|--------|---------|------|
| TEST2025 | 8/10 | 测试邀请码 |
| WELCOME | 4/5 | 欢迎邀请码 |
| ADMIN001 | 1/1 | 管理员邀请码 |

## 🔐 密码要求

注册时密码必须满足以下条件:
- ✅ 至少8个字符
- ✅ 包含至少一个大写字母
- ✅ 包含至少一个小写字母
- ✅ 包含至少一个数字
- ✅ 包含至少一个特殊字符 (!@#$%^&*()_+-=[]{}等)

**示例**: `Test123456!`

## 👤 用户管理

### 查看所有用户

```bash
node test-check-data.cjs
```

这将显示:
- 所有注册用户
- 所有对话
- 邀请码使用情况

### 数据库位置

数据库文件: `/home/ubuntu/Personal-Chatbox/data/app.db`

**重要**: 定期备份此文件!

## 🛡️ 安全说明

### 1. JWT Token
- Token有效期: 7天
- 存储位置: HTTP-Only Cookie
- 自动过期处理

### 2. 密码安全
- 使用bcrypt加密
- Salt rounds: 10
- 无法反向解密

### 3. 会话管理
- 每次登录创建新会话
- 登出时删除会话
- 记录登录历史(IP、User-Agent)

## 🔧 故障排除

### 问题1: 无法注册

**可能原因**:
1. 邀请码无效或已过期
2. 邮箱已被注册
3. 密码不符合要求

**解决方法**:
1. 检查邀请码是否正确
2. 使用其他邮箱
3. 确保密码符合要求

### 问题2: 无法登录

**可能原因**:
1. 邮箱或密码错误
2. 账号不存在

**解决方法**:
1. 检查邮箱和密码
2. 确认账号已注册

### 问题3: 登录后立即退出

**可能原因**:
1. Token验证失败
2. 浏览器Cookie被禁用

**解决方法**:
1. 清除浏览器Cookie
2. 启用Cookie
3. 重新登录

### 问题4: 看不到自己的对话

**可能原因**:
1. 数据库连接问题
2. 用户ID不匹配

**解决方法**:
1. 检查后端服务器日志
2. 重新登录
3. 联系管理员

## 📝 开发说明

### 环境变量

建议在生产环境配置:

```bash
# .env 文件
JWT_SECRET=your-very-secret-key-change-this-in-production
NODE_ENV=production
```

### API端点

#### 认证相关
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/verify` - 验证Token

#### 用户数据
- `GET /api/user-data/conversations` - 获取对话列表
- `POST /api/user-data/conversations` - 创建对话
- `PUT /api/user-data/conversations/:id` - 更新对话
- `DELETE /api/user-data/conversations/:id` - 删除对话
- `GET /api/user-data/messages/:conversationId` - 获取消息
- `POST /api/user-data/messages` - 创建消息

### 前端路由

- `/welcome` - 欢迎页(未登录)
- `/login` - 登录页
- `/register` - 注册页
- `/` - 主页(需要登录)

## 📚 相关文档

- [完整实现报告](./AUTH_SYSTEM_REPORT.md)
- [数据库设计](./server/db/init.cjs)
- [API文档](./server/routes/)

## 🆘 获取帮助

如遇到问题:
1. 查看后端日志: `tail -f /tmp/server.log`
2. 查看前端日志: 浏览器开发者工具Console
3. 检查数据库: `node test-check-data.cjs`
4. 查看邀请码: `node scripts/manage-invite-codes.cjs list`

## 🎯 下一步

建议实现的功能:
- [ ] 忘记密码功能
- [ ] 邮箱验证
- [ ] OAuth登录(Google, GitHub)
- [ ] 用户个人资料编辑
- [ ] 管理员后台界面

---

**最后更新**: 2025-10-12  
**版本**: 1.0.0

