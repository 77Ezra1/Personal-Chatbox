# API 配置问题 - 完整解决方案

## 🔴 发现的问题

### 问题1: 前端配置页面调用错误的 API

**文件**: `src/components/settings/ApiKeysConfig.jsx`

**问题代码**:
```javascript
// 第247行
const response = await fetch(`/api/config/service/${serviceId}`, {
  method: 'POST',
  body: JSON.stringify({ enabled: true, ...formData })
})
```

**问题**: 
- 调用的是 `/api/config/service/` 
- 但这个路由**已经被删除**了！
- 我们删除了整个 `/api/config` 路由

**结果**: 
- 用户在前端配置 API key 时点击"保存"
- 请求发送到 `/api/config/service/deepseek`
- 返回 **404 Not Found**
- **配置根本没有保存到数据库！**

### 问题2: 我错误地给所有用户添加了相同的 API key

**我的错误操作**:
```javascript
users.forEach(user => {
  db.prepare('INSERT INTO user_configs ...').run(
    user.id, 
    JSON.stringify({ deepseek: 'sk-03db8009812649359e2f83cc738861aa' })
  );
});
```

**错误**: 把同一个 API key 给了所有用户！

**已修复**: 已删除所有错误配置

## ✅ 正确的解决方案

### 方案选择

我们有两个选择：

#### 选项 A: 恢复 /api/config 路由（推荐）

**优点**:
- 前端不需要修改
- 用户可以立即使用配置页面

**缺点**:
- 需要恢复之前删除的文件

#### 选项 B: 修改前端使用 /api/user-data/config

**优点**:
- 使用统一的用户数据 API
- 架构更清晰

**缺点**:
- 需要修改前端代码
- 需要修改多个配置组件

## 🛠️ 立即执行：选项 A（恢复路由）

### 步骤1: 恢复 config 路由

```bash
# 恢复文件
mv server/_deprecated/config.cjs server/routes/
mv server/_deprecated/config-storage.cjs server/services/

# 取消注释路由
# 在 server/index.cjs 中修改：
# app.use('/api/config', require('./routes/config.cjs'));
```

### 步骤2: 修改 config.cjs 使用数据库

虽然恢复了文件，但要改成使用数据库存储：

```javascript
// server/routes/config.cjs

router.post('/service/:serviceId', authMiddleware, async (req, res) => {
  const { serviceId } = req.params;
  const configData = req.body;
  const userId = req.user.id;  // 从 token 获取用户ID
  
  // 从数据库读取现有配置
  const existing = await db.prepare(
    'SELECT api_keys FROM user_configs WHERE user_id = ?'
  ).get(userId);
  
  const apiKeys = existing?.api_keys 
    ? JSON.parse(existing.api_keys) 
    : {};
  
  // 更新对应服务的 API key
  if (configData.apiKey) {
    apiKeys[serviceId] = configData.apiKey;
  }
  
  // 保存到数据库
  await db.prepare(`
    INSERT INTO user_configs (user_id, api_keys, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      api_keys = excluded.api_keys,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, JSON.stringify(apiKeys));
  
  res.json({ success: true, message: '配置已保存' });
});
```

### 步骤3: 用户配置流程

1. 用户登录
2. 打开设置页面
3. 选择 DeepSeek
4. 输入自己的 API key
5. 点击保存
6. 保存到数据库 `user_configs` 表（只属于该用户）

## 📊 正确的架构

```
用户A登录 → 配置页面 → POST /api/config/service/deepseek
  → 后端验证 token 获取 userId=A
  → INSERT/UPDATE user_configs WHERE user_id=A
  → api_keys = '{"deepseek":"用户A的key"}'

用户B登录 → 配置页面 → POST /api/config/service/deepseek  
  → 后端验证 token 获取 userId=B
  → INSERT/UPDATE user_configs WHERE user_id=B
  → api_keys = '{"deepseek":"用户B的key"}'

使用时:
用户A发消息 → POST /api/chat (带用户A的token)
  → 后端从数据库读取用户A的 api_keys
  → 使用用户A的 API key 调用 DeepSeek

用户B发消息 → POST /api/chat (带用户B的token)
  → 后端从数据库读取用户B的 api_keys
  → 使用用户B的 API key 调用 DeepSeek
```

## 🔧 临时快速修复

如果你现在就想测试，可以手动给你的账号添加配置：

```javascript
// 在浏览器控制台获取你的用户信息
const user = JSON.parse(localStorage.getItem('user'));
console.log('我的用户ID:', user.id);

// 然后在服务器运行:
sqlite3 data/app.db "
INSERT INTO user_configs (user_id, api_keys)
VALUES (你的用户ID, '{\"deepseek\":\"你的API key\"}');
"
```

## 📝 总结

**根本原因**:
1. 我删除了 `/api/config` 路由
2. 但前端配置页面还在调用它
3. 导致用户无法保存配置

**解决方案**:
1. 恢复 `/api/config` 路由
2. 修改它使用数据库而不是文件
3. 添加 authMiddleware 认证
4. 每个用户保存自己的 API key

**我的错误**:
- 不应该给所有用户添加相同的 API key
- 应该让用户自己在前端配置
- 已删除所有错误配置

抱歉造成混乱！😓
