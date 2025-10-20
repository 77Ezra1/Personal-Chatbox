# 正确的 API 密钥管理架构

> 时间: 2025-10-20
> 架构: 前端传API key到后端 → 后端存储到数据库 → 后端使用时从数据库读取

## ✅ 正确的架构流程

### 1. 用户配置 API Key

```
用户在前端设置页面输入 API key
    ↓
前端调用 POST /api/user-data/config
    ↓
后端保存到数据库 (user_configs.api_keys)
    ↓
API key 安全存储在数据库中
```

### 2. 用户发送消息

```
用户点击发送
    ↓  
前端调用 POST /api/chat (带 Authorization token)
    ↓
后端 authMiddleware 验证用户身份
    ↓
后端从数据库读取该用户的 API key
    ↓
后端使用 API key 调用 DeepSeek API
    ↓
返回结果给前端
```

## 📝 代码实现

### 后端 (server/routes/chat.cjs)

```javascript
const { authMiddleware } = require('../middleware/auth.cjs');
const { db } = require('../db/init.cjs');

// 从数据库获取用户的 API key
async function getUserApiKey(userId, provider) {
  const config = await db.prepare(
    'SELECT api_keys FROM user_configs WHERE user_id = ?'
  ).get(userId);
  
  if (!config || !config.api_keys) {
    return null;
  }
  
  const apiKeys = JSON.parse(config.api_keys);
  return apiKeys[provider] || null;
}

// 创建 OpenAI 客户端
async function createOpenAIClient(userId) {
  const apiKey = await getUserApiKey(userId, 'deepseek');
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API 密钥');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com'
  });
}

// POST 路由（需要认证）
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;  // 从 token 获取用户ID
  const { messages, model } = req.body;
  
  // 从数据库读取该用户的 API key
  const openai = await createOpenAIClient(userId);
  
  // 调用 AI API
  const completion = await openai.chat.completions.create({
    model,
    messages
  });
  
  res.json(completion);
});
```

### 前端 (src/lib/aiClient.js)

```javascript
// 调用后端 API（不传递 API key）
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    messages,
    model,
    stream: true
  })
});
```

### 前端配置页面 (src/components/settings/)

```javascript
// 保存 API key 到数据库
async function saveApiKey(provider, apiKey) {
  const response = await fetch('/api/user-data/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      apiKeys: {
        [provider]: apiKey
      }
    })
  });
  
  if (response.ok) {
    alert('API 密钥已保存到数据库');
  }
}
```

## 🗄️ 数据库存储

### user_configs 表

```sql
CREATE TABLE user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  api_keys TEXT,  -- JSON: {"deepseek": "sk-xxx", "openai": "sk-xxx"}
  model_config TEXT,
  system_prompt TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### api_keys 字段示例

```json
{
  "deepseek": "sk-03db8009812649359e2f83cc738861aa",
  "openai": "sk-xxxxxxxxxxxxxxx",
  "anthropic": "sk-ant-xxxxxxxxx"
}
```

## 🔐 安全特性

1. **认证保护**
   - 所有API调用都需要 JWT token
   - authMiddleware 验证用户身份

2. **数据隔离**
   - 每个用户的 API key 单独存储
   - 用户只能访问自己的配置

3. **不使用环境变量**
   - 不在后端硬编码 API key
   - 不使用 .env 文件存储用户密钥
   - 完全由用户自己配置

4. **传输加密**
   - 生产环境使用 HTTPS
   - JWT token 保护 API 调用

## 🎯 优势

### vs 环境变量

| 特性 | 环境变量 | 数据库 |
|-----|---------|--------|
| 多用户 | ❌ 所有用户共享 | ✅ 每个用户独立 |
| 动态配置 | ❌ 需要重启服务 | ✅ 即时生效 |
| 用户控制 | ❌ 管理员配置 | ✅ 用户自己配置 |
| 安全性 | ⚠️ 服务器泄露风险 | ✅ 用户级隔离 |

### vs 前端存储

| 特性 | 前端 localStorage | 数据库 |
|-----|------------------|--------|
| XSS 风险 | ⚠️ 高 | ✅ 低 |
| 跨设备同步 | ❌ 不支持 | ✅ 支持 |
| 数据持久性 | ⚠️ 可被清除 | ✅ 可靠 |
| 备份恢复 | ❌ 困难 | ✅ 简单 |

## 📊 完整数据流

```
┌─────────────┐
│ 用户设置页面 │
└──────┬──────┘
       │ 1. 输入 API key
       ↓
┌─────────────┐
│ POST /api/  │
│ user-data/  │ 2. 带 JWT token
│ config      │
└──────┬──────┘
       │ 3. 验证用户
       ↓
┌─────────────┐
│ user_configs│
│ 表          │ 4. 存储 api_keys (JSON)
└──────┬──────┘
       │
       │ === 使用时 ===
       │
┌──────┴──────┐
│ 用户发消息   │
└──────┬──────┘
       │ 5. POST /api/chat (带 token)
       ↓
┌─────────────┐
│authMiddleware│ 6. 验证并获取 userId
└──────┬──────┘
       │ 7. SELECT api_keys FROM user_configs WHERE user_id = ?
       ↓
┌─────────────┐
│getUserApiKey│ 8. 解析 JSON 获取 provider 的 key
└──────┬──────┘
       │ 9. 使用 API key 调用 AI
       ↓
┌─────────────┐
│DeepSeek API │
└──────┬──────┘
       │ 10. 返回结果
       ↓
┌─────────────┐
│   前端      │
└─────────────┘
```

## ✅ 检查清单

后端实现:
- [✅] 使用 authMiddleware 认证
- [✅] 使用 db 从数据库读取
- [✅] getUserApiKey 从 user_configs 表查询
- [✅] createOpenAIClient 接收 userId 参数
- [✅] 不使用环境变量 DEEPSEEK_API_KEY
- [✅] 错误提示用户配置 API key

前端实现:
- [✅] 发送请求时带 Authorization header
- [✅] 不在请求体中传递 apiKey
- [✅] 配置页面调用 /api/user-data/config
- [✅] 保存成功后提示用户

数据库:
- [✅] user_configs 表存在
- [✅] api_keys 字段为 TEXT (JSON)
- [✅] 有外键关联到 users 表

## 🧪 测试步骤

### 1. 配置 API Key

```bash
# 登录获取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 保存返回的 token
TOKEN="eyJhbGciOiJIUzI1..."

# 保存 API key 到数据库
curl -X POST http://localhost:3001/api/user-data/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "apiKeys": {
      "deepseek": "sk-your-api-key-here"
    }
  }'
```

### 2. 验证数据库

```bash
sqlite3 data/app.db "
  SELECT user_id, api_keys 
  FROM user_configs 
  WHERE user_id = 1;
"
```

期望输出:
```
1|{"deepseek":"sk-your-api-key-here"}
```

### 3. 测试聊天

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [{"role":"user","content":"你好"}],
    "model": "deepseek-chat",
    "stream": false
  }'
```

### 4. 查看后端日志

应该看到:
```
[User 1] 收到对话请求: model=deepseek-chat, messages=1条
[User 1] 使用数据库中的用户配置 API key
调用 DeepSeek API...
```

## 📚 相关文档

- [文件系统使用审计报告.md](文件系统使用审计报告.md) - 数据存储审计
- `/api/user-data/config` 路由实现 - user-data.cjs

## 🎉 总结

这个架构的核心理念:

1. **前端传 API key 到后端** - 用户配置时一次性传递
2. **后端存储到数据库** - 安全持久化存储
3. **后端使用时从数据库读取** - 不依赖环境变量
4. **多用户隔离** - 每个用户有自己的 API key
5. **用户完全控制** - 可以随时修改自己的 API key

这是最符合 SaaS 多用户应用的架构！
