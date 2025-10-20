# API 密钥管理新架构 - 完全前端化

> 修改时间: 2025-10-20
> 架构变更: 后端不存储 API key，完全由前端管理

## 🎯 架构变更

### ❌ 旧架构（已废弃）

```
前端配置 API key
    ↓
保存到数据库 (user_configs.api_keys)
    ↓
后端从数据库读取 API key
    ↓
后端调用 AI API
```

**问题**:
- API key 存储在后端数据库
- 用户担心密钥泄露
- 需要后端管理敏感信息

### ✅ 新架构（当前）

```
前端配置 API key (存储在浏览器 localStorage/内存)
    ↓
每次请求时，前端传递 API key 到后端
    ↓
后端使用前端传递的 API key
    ↓
后端调用 AI API（不存储 API key）
```

**优点**:
- ✅ 后端不存储任何 API key
- ✅ 用户完全控制自己的密钥
- ✅ 更安全，符合零信任原则
- ✅ 后端变成无状态的代理

## 📝 代码修改详情

### 1. 后端修改 (server/routes/chat.cjs)

#### 删除数据库相关代码

```javascript
// ❌ 删除
const { authMiddleware } = require('../middleware/auth.cjs');
const { db } = require('../db/init.cjs');

async function getUserApiKey(userId, provider) {
  // 从数据库读取...
}
```

#### 简化为接收前端传递的 API key

```javascript
// ✅ 新代码
function createOpenAIClient(apiKey, baseURL = 'https://api.deepseek.com') {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL
  });
}
```

#### 修改 POST 路由

```javascript
// ❌ 旧代码
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const apiKey = await getUserApiKey(userId, 'deepseek');
  // ...
});

// ✅ 新代码
router.post('/', async (req, res) => {
  const { messages, model, apiKey, baseURL } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({
      error: 'API key is required'
    });
  }
  
  const openai = createOpenAIClient(apiKey, baseURL);
  // ...
});
```

### 2. 前端修改 (src/lib/aiClient.js)

#### callDeepSeekMCP 函数

```javascript
// ✅ 传递 API key 到后端
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: formattedMessages,
    model,
    temperature,
    max_tokens: maxTokens,
    stream: useStream,
    apiKey,             // ✅ 传递 API key
    baseURL: endpoint   // ✅ 传递自定义端点
  }),
  signal
});
```

#### generateAIResponse 函数

```javascript
// ✅ 所有服务商都需要前端 API key
if (!apiKey) {
  throw new Error('Please configure the API key for the selected provider first.');
}
```

## 🔐 前端 API Key 存储方案

### 方案 1: localStorage（当前推荐）

```javascript
// 保存 API key
localStorage.setItem('modelConfig', JSON.stringify({
  provider: 'deepseek',
  apiKey: 'sk-xxxxx',
  model: 'deepseek-chat'
}));

// 读取 API key
const modelConfig = JSON.parse(localStorage.getItem('modelConfig'));
```

**优点**:
- 简单易用
- 刷新页面不丢失
- 浏览器级别隔离

**缺点**:
- 存储在明文
- XSS 攻击可能读取

### 方案 2: sessionStorage（更安全）

```javascript
// 只在当前标签页有效
sessionStorage.setItem('modelConfig', JSON.stringify({
  apiKey: 'sk-xxxxx'
}));
```

**优点**:
- 关闭标签页自动清除
- 更安全

**缺点**:
- 关闭页面需要重新配置

### 方案 3: 内存 + 会话（最安全，未实现）

```javascript
// 仅存储在内存中
let apiKeyCache = null;

// 每次刷新需要重新输入
function setApiKey(apiKey) {
  apiKeyCache = apiKey;
}
```

**优点**:
- 最安全，刷新页面即清除
- 不会被 XSS 读取（如果正确实现）

**缺点**:
- 用户体验差
- 每次刷新都要输入

## 📊 数据流图

### 配置 API Key

```
用户在设置页面输入 API key
    ↓
存储到 localStorage
    ↓
(可选) 测试连接验证有效性
```

### 发送消息

```
1. 用户发送消息
    ↓
2. App.jsx 读取 localStorage 中的 modelConfig
    ↓
3. 调用 generateAIResponse({ 
     messages, 
     modelConfig: { apiKey, provider, model }
   })
    ↓
4. aiClient.js 从 modelConfig 提取 apiKey
    ↓
5. 根据 provider 选择调用方式:
   - deepseek → callDeepSeekMCP
   - openai → callOpenAI
   - 其他 → 相应的函数
    ↓
6. fetch('/api/chat', {
     body: JSON.stringify({
       messages,
       model,
       apiKey,      // ✅ 传递到后端
       baseURL
     })
   })
    ↓
7. 后端接收 apiKey
    ↓
8. 后端使用 apiKey 调用 AI API
    ↓
9. 返回结果给前端
```

## 🧪 测试步骤

### 1. 清除旧数据

```javascript
// 在浏览器控制台运行
localStorage.clear();
sessionStorage.clear();
```

### 2. 配置 API Key

1. 打开设置页面
2. 选择 DeepSeek 服务商
3. 输入 API key: `sk-your-api-key`
4. 保存配置

### 3. 验证存储

```javascript
// 在浏览器控制台查看
console.log(localStorage.getItem('modelConfig'));
// 应该输出: {"provider":"deepseek","apiKey":"sk-xxx",...}
```

### 4. 发送测试消息

1. 打开聊天页面
2. 发送消息: "你好"
3. 打开 Network 标签
4. 查看 `/api/chat` 请求

**期望的请求体**:
```json
{
  "messages": [{"role": "user", "content": "你好"}],
  "model": "deepseek-chat",
  "stream": true,
  "apiKey": "sk-your-api-key",
  "baseURL": "https://api.deepseek.com"
}
```

### 5. 检查后端日志

```
收到对话请求: model=deepseek-chat, messages=1条
MCP工具数量: X
总工具数量: X
调用 DeepSeek API...
```

**不应该看到**:
- ❌ "从数据库读取 API key"
- ❌ "使用用户配置的 API key"

**应该看到**:
- ✅ 正常的 API 调用日志

## 🔒 安全考虑

### 1. HTTPS 传输

确保生产环境使用 HTTPS:
```javascript
// 前端请求始终使用 HTTPS
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api/chat'
  : 'http://localhost:3001/api/chat';
```

### 2. 不记录 API Key

后端日志中不应该记录 API key:

```javascript
// ❌ 不要这样
logger.info('API key:', apiKey);

// ✅ 这样
logger.info('API key:', apiKey ? 'present' : 'missing');
```

### 3. 前端加密存储（可选增强）

```javascript
// 使用简单的加密存储
function encryptApiKey(apiKey) {
  // 简单的 base64 编码（不是真正的加密！）
  return btoa(apiKey);
}

function decryptApiKey(encrypted) {
  return atob(encrypted);
}

// 保存
localStorage.setItem('apiKey', encryptApiKey('sk-xxx'));

// 读取
const apiKey = decryptApiKey(localStorage.getItem('apiKey'));
```

**注意**: 这只是轻微的混淆，不是真正的安全加密！

### 4. XSS 防护

确保后端设置了安全头:

```javascript
// server/middleware/security.cjs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      // ...
    }
  }
}));
```

## 📋 检查清单

完成以下检查确保迁移成功:

```
后端修改:
[✅] 删除 authMiddleware 依赖
[✅] 删除 db 依赖
[✅] 删除 getUserApiKey 函数
[✅] 修改 createOpenAIClient 接收 apiKey 参数
[✅] 修改 POST 路由从 req.body 读取 apiKey
[✅] 验证 apiKey 存在性

前端修改:
[✅] 修改 callDeepSeekMCP 传递 apiKey
[✅] 修改 generateAIResponse 验证所有服务商都需要 apiKey
[✅] 确认 apiKey 从 modelConfig 正确提取

测试:
[ ] localStorage 中有 API key 配置
[ ] 发送消息时 Network 请求包含 apiKey
[ ] 后端正确接收并使用 apiKey
[ ] 后端日志没有报错
[ ] 消息正常返回
```

## 🎉 迁移完成

恭喜！你的应用现在使用完全前端化的 API key 管理：

- ✅ 后端不存储任何 API key
- ✅ 用户完全控制自己的密钥
- ✅ 更符合现代 Web 应用安全实践
- ✅ 后端变成无状态的 API 代理

## 📚 相关文档

- [文件系统使用审计报告.md](文件系统使用审计报告.md)
- [API配置迁移完成.md](API配置迁移完成.md)
- [配置API密钥指南.md](配置API密钥指南.md)
