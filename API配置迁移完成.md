# API 配置系统迁移完成报告

## ✅ 已完成的修改

### 1. 删除了文件配置系统

**移除的文件**:
- `server/routes/config.cjs` → 移至 `server/_deprecated/`
- `server/services/configManager.cjs` → 移至 `server/_deprecated/`
- `server/services/config-storage.cjs` → 移至 `server/_deprecated/`

**移除的路由**:
- ❌ `GET/POST /api/config/*` (已注释)
- ✅ 改用 `GET/POST /api/user-data/config`

### 2. 修改了 chat.cjs 使用数据库

**文件**: `server/routes/chat.cjs`

**修改内容**:

#### A. 添加了认证中间件
```javascript
// 旧代码
router.post('/', async (req, res) => {

// 新代码
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;  // 现在可以获取用户ID
```

#### B. 添加了从数据库读取 API key 的函数
```javascript
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
```

#### C. 修改了 createOpenAIClient 函数
```javascript
// 旧代码
async function createOpenAIClient() {
  let apiKey = await configManager.getApiKey('deepseek');
  // ...
}

// 新代码
async function createOpenAIClient(userId) {
  // 从数据库读取用户配置
  let apiKey = await getUserApiKey(userId, 'deepseek');
  // ...
}
```

#### D. 调用时传递 userId
```javascript
const openai = await createOpenAIClient(userId);
```

## 📊 现在的配置流程

### 前端配置 API Key

```javascript
// 用户在设置页面配置
async function saveApiKey(provider, apiKey) {
  const response = await fetch('/api/user-data/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // 需要认证
    },
    body: JSON.stringify({
      apiKeys: {
        [provider]: apiKey
      }
    })
  });
}
```

### 后端使用 API Key

```javascript
// 1. 用户发送聊天请求
POST /api/chat
Headers: Authorization: Bearer {token}

// 2. authMiddleware 验证 token,获取 userId

// 3. 从数据库读取该用户的 API key
SELECT api_keys FROM user_configs WHERE user_id = ?

// 4. 使用 API key 调用 DeepSeek API
```

### 数据库存储格式

**表**: `user_configs`

**api_keys 字段** (JSON 格式):
```json
{
  "deepseek": "sk-03db8009812649359e2f83cc738861aa",
  "openai": "sk-xxxxxx",
  "anthropic": "sk-ant-xxxxx"
}
```

## 🧪 测试步骤

### 1. 启动服务器

```bash
cd /Users/ezra/Personal-Chatbox
npm run dev
```

### 2. 检查是否有错误

启动日志应该显示:
```
[Unified DB] ✅ Using better-sqlite3
Chat 路由已初始化
Server running on port 3001
```

### 3. 登录并获取 token

```bash
# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# 保存返回的 token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. 保存 API key 到数据库

```bash
curl -X POST http://localhost:3001/api/user-data/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "apiKeys": {
      "deepseek": "sk-your-api-key-here"
    }
  }'
```

**期望返回**:
```json
{
  "message": "配置已保存"
}
```

### 5. 验证数据库

```bash
sqlite3 data/app.db "SELECT user_id, api_keys FROM user_configs;"
```

**期望输出**:
```
1|{"deepseek":"sk-your-api-key-here"}
```

### 6. 测试聊天功能

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "你好"}],
    "model": "deepseek-chat",
    "stream": false
  }'
```

**期望返回**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "你好!有什么我可以帮助你的吗?"
      }
    }
  ]
}
```

**如果失败**,检查服务器日志:
```
[User 1] 收到对话请求: model=deepseek-chat, messages=1条
[User 1] 使用数据库中的用户配置 API key
调用 DeepSeek API...
```

## 🔄 前端需要的修改

### 旧的前端代码 (需要删除)

如果你的前端有调用 `/api/config/*` 的代码,需要删除:

```javascript
// ❌ 删除这些调用
fetch('/api/config/api-key', ...)
fetch('/api/config/current', ...)
fetch('/api/test-connection/deepseek', ...)
```

### 新的前端代码

统一使用 `/api/user-data/config`:

```javascript
// ✅ 保存配置
async function saveConfig(config) {
  return fetch('/api/user-data/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(config)
  });
}

// ✅ 读取配置
async function loadConfig() {
  return fetch('/api/user-data/config', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
}
```

### 配置页面示例

```javascript
// src/pages/SettingsPage.jsx
async function handleSaveApiKey(provider, apiKey) {
  try {
    // 获取现有配置
    const response = await fetch('/api/user-data/config', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const { config } = await response.json();
    
    // 更新 API keys
    const updatedApiKeys = {
      ...(config?.apiKeys || {}),
      [provider]: apiKey
    };
    
    // 保存到数据库
    await fetch('/api/user-data/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        ...config,
        apiKeys: updatedApiKeys
      })
    });
    
    toast.success('API 密钥已保存');
  } catch (error) {
    toast.error('保存失败: ' + error.message);
  }
}
```

## ⚠️ 重要提示

### 1. 需要登录才能使用

现在 `/api/chat` 需要认证,用户必须先登录:

- ✅ 已登录用户: 从数据库读取他们配置的 API key
- ❌ 未登录: 请求会被 authMiddleware 拦截,返回 401

### 2. 环境变量作为备用

如果用户没有配置 API key,系统会尝试使用环境变量 `DEEPSEEK_API_KEY`:

```bash
# .env 文件
DEEPSEEK_API_KEY=sk-your-fallback-key
```

### 3. 数据迁移

如果你之前在 `data/user-config.json` 中有配置,需要迁移到数据库:

```bash
# 手动迁移脚本
node -e "
const fs = require('fs');
const db = require('./server/db/init.cjs').db;

// 读取旧配置
const oldConfig = JSON.parse(fs.readFileSync('data/user-config.json', 'utf8'));

// 假设迁移给 user_id = 1
const userId = 1;
const apiKeys = {
  deepseek: oldConfig.deepseek?.apiKey,
  openai: oldConfig.openai?.apiKey
};

// 保存到数据库
db.prepare(\`
  INSERT INTO user_configs (user_id, api_keys)
  VALUES (?, ?)
  ON CONFLICT(user_id) DO UPDATE SET api_keys = excluded.api_keys
\`).run(userId, JSON.stringify(apiKeys));

console.log('迁移完成!');
"
```

## 📝 总结

✅ **完成的工作**:
- 删除了文件配置系统
- 修改 chat.cjs 使用数据库
- 添加了认证中间件
- 从数据库读取用户的 API key

🔄 **需要做的**:
- 前端删除对 `/api/config/*` 的调用
- 统一使用 `/api/user-data/config`
- 确保用户登录后才能聊天
- 测试功能是否正常

📚 **相关文档**:
- [聊天功能问题解决方案.md](聊天功能问题解决方案.md)
- [配置API密钥指南.md](配置API密钥指南.md)

现在可以测试一下是否正常工作了!
