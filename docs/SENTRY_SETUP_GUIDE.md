# 🔍 Sentry 错误追踪集成指南

## 📋 概述

Sentry 是一个强大的错误追踪和性能监控平台，可以帮助你：
- ✅ 实时捕获生产环境错误
- ✅ 记录用户操作轨迹（面包屑）
- ✅ 会话回放（错误时自动录制）
- ✅ 性能监控和分析
- ✅ 发布版本追踪

## 🚀 快速开始

### 1. 注册 Sentry 账号

1. 访问 https://sentry.io/signup/
2. 使用 GitHub/Google 账号或邮箱注册
3. 创建组织（Organization）

### 2. 创建项目

1. 点击 "Create Project"
2. 选择平台: **React**
3. 设置告警频率: 推荐 "Alert me on every new issue"
4. 输入项目名称: `personal-chatbox`
5. 点击 "Create Project"

### 3. 获取 DSN

创建项目后，Sentry 会显示 DSN（Data Source Name），格式如下：

```
https://examplePublicKey@o0.ingest.sentry.io/0
```

复制这个 DSN。

### 4. 配置环境变量

在项目根目录创建 `.env` 文件（如果不存在）：

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件
vim .env
```

添加 Sentry DSN：

```bash
# Sentry DSN
VITE_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id

# 应用版本（可选，用于发布追踪）
VITE_APP_VERSION=1.0.0
```

### 5. 测试 Sentry

#### 开发环境测试
在开发环境，Sentry 默认是**禁用**的，但会在控制台输出日志。

```bash
# 启动应用
pnpm dev
```

在浏览器控制台应该能看到：
```
[Sentry] Development mode - Sentry disabled
```

#### 生产环境测试
构建生产版本来测试 Sentry：

```bash
# 构建
pnpm build

# 预览
pnpm preview
```

访问 http://localhost:4173，Sentry 应该会初始化并开始工作。

### 6. 触发测试错误

在任何组件中手动触发一个错误来测试：

```javascript
import { createLogger } from '@/lib/logger'
const logger = createLogger('TestComponent')

// 触发错误
try {
  throw new Error('Test Sentry Error')
} catch (error) {
  logger.error(error) // 会自动发送到 Sentry
}
```

或者使用 Sentry 提供的测试按钮：

```javascript
import { captureMessage } from '@/lib/sentry'

// 发送测试消息
captureMessage('Test message from Personal Chatbox', 'info')
```

## 📊 查看错误报告

1. 登录 Sentry Dashboard: https://sentry.io
2. 选择你的项目
3. 查看 "Issues" 标签页
4. 点击任意错误查看详情：
   - 错误堆栈
   - 用户操作轨迹（面包屑）
   - 设备和浏览器信息
   - 会话回放（如果有）

## 🎯 高级功能

### 用户识别

当用户登录后，可以关联用户信息：

```javascript
import { setSentryUser } from '@/lib/sentry'

// 登录后
setSentryUser({
  id: user.id,
  username: user.username
})

// 登出后
setSentryUser(null)
```

### 自定义面包屑

记录用户操作以便追踪错误上下文：

```javascript
import { addBreadcrumb } from '@/lib/sentry'

addBreadcrumb({
  category: 'user-action',
  message: 'User sent a message to AI',
  level: 'info',
  data: {
    messageLength: message.length,
    modelUsed: 'gpt-4'
  }
})
```

### 性能监控

监控关键操作的性能：

```javascript
import { startTransaction } from '@/lib/sentry'

const transaction = startTransaction('send-message', 'user-interaction')

try {
  // 执行操作
  await sendMessage(content)
  transaction?.setStatus('ok')
} catch (error) {
  transaction?.setStatus('internal_error')
  throw error
} finally {
  transaction?.finish()
}
```

## ⚙️ 配置选项

### 调整采样率

在 `src/lib/sentry.js` 中修改：

```javascript
Sentry.init({
  // ...
  tracesSampleRate: 0.1,        // 10% 的事务追踪（性能）
  replaysSessionSampleRate: 0.1, // 10% 的正常会话录制
  replaysOnErrorSampleRate: 1.0, // 100% 的错误会话录制
})
```

**建议配置**:
- 小流量应用: 1.0 (100%)
- 中等流量: 0.1-0.5 (10-50%)
- 大流量应用: 0.01-0.1 (1-10%)

### 过滤敏感信息

已经配置了以下过滤规则：
- ✅ Authorization header
- ✅ Cookie header
- ✅ localStorage 中的 API keys
- ✅ localStorage 中的 passwords

如需添加更多过滤，编辑 `src/lib/sentry.js` 的 `beforeSend` 函数。

### 忽略特定错误

编辑 `ignoreErrors` 数组：

```javascript
ignoreErrors: [
  'NetworkError',
  'Failed to fetch',
  // 添加你想忽略的错误
  'Custom error to ignore',
]
```

## 🔒 安全最佳实践

1. **不要提交 DSN 到 Git**
   - ✅ DSN 放在 `.env` 文件中
   - ✅ `.env` 已在 `.gitignore` 中

2. **过滤敏感数据**
   - ✅ 已配置移除 API keys
   - ✅ 已配置移除 passwords
   - ✅ 已配置移除 tokens

3. **限制错误数量**
   - 在 Sentry 后台配置速率限制
   - Settings → Quotas → Rate Limits

4. **使用环境标识**
   - 已自动区分 development/production
   - 可在 Sentry 中按环境过滤

## 📈 监控和告警

### 配置告警规则

1. 进入项目 Settings → Alerts
2. 创建新规则:
   - 错误率突增
   - 新错误类型
   - 性能下降

### 集成通知

支持多种通知渠道：
- 📧 Email
- 💬 Slack
- 📱 Discord
- 🔔 PagerDuty
- 更多...

配置方法：Settings → Integrations

## 🐛 故障排除

### Sentry 未初始化

**症状**: 控制台显示 "Sentry disabled"

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认 `VITE_SENTRY_DSN` 已配置
3. 重启开发服务器

### 错误未发送到 Sentry

**可能原因**:
1. ❌ 在开发环境（默认禁用）
2. ❌ DSN 配置错误
3. ❌ 网络问题（检查代理）
4. ❌ 被 `ignoreErrors` 过滤

**调试步骤**:
```javascript
// 在浏览器控制台运行
localStorage.setItem('debug', 'true')
location.reload()

// 触发测试错误
throw new Error('Test')
```

### 会话回放不工作

**原因**: 需要 HTTPS 或 localhost

**解决方案**:
- 开发: 使用 localhost（已支持）
- 生产: 必须使用 HTTPS

## 💰 定价

Sentry 提供免费套餐：
- ✅ 5,000 errors/month
- ✅ 50 replays/month
- ✅ 1 user
- ✅ 30 days retention

对于小型项目完全够用！

升级到付费版获得更多：
- Developer: $26/month
- Team: $80/month
- Business: 按需定价

## 📚 相关资源

- [Sentry 官方文档](https://docs.sentry.io/)
- [React SDK 文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [最佳实践](https://docs.sentry.io/platforms/javascript/best-practices/)
- [Sentry CLI](https://docs.sentry.io/product/cli/)

## ✅ 验证清单

完成以下检查确保 Sentry 配置正确：

- [ ] 已注册 Sentry 账号
- [ ] 已创建 React 项目
- [ ] 已获取并配置 DSN
- [ ] `.env` 文件已创建并配置
- [ ] 开发环境能看到 "Sentry disabled" 日志
- [ ] 生产构建能初始化 Sentry
- [ ] 能在 Sentry Dashboard 看到测试错误
- [ ] 错误堆栈信息完整
- [ ] 已配置告警规则（可选）

## 🎉 完成！

Sentry 现已集成完成！每当应用发生错误时，你都会在 Sentry Dashboard 中收到详细报告。

---

**需要帮助?** 查看 [Sentry 官方文档](https://docs.sentry.io/) 或在项目中创建 Issue。
