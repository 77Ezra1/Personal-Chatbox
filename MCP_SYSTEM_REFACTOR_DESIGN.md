# MCP系统重构设计文档

## 📋 需求分析

### 用户需求
1. 系统内置一些MCP服务
2. 前端提供配置页面，用户可以添加新的MCP服务
3. 所有MCP服务（包括内置的）都可以开启/关闭
4. 数据库表之间关系清晰
5. 项目内很多功能依赖MCP服务

### 现有架构分析

```
┌─────────────────────────────────────────────┐
│          现有MCP系统架构                     │
├─────────────────────────────────────────────┤
│                                             │
│  1. server/config.cjs                       │
│     - 定义内置MCP服务配置                   │
│     - 硬编码，不灵活                        │
│                                             │
│  2. user_mcp_configs 表                     │
│     - 存储用户MCP配置                       │
│     - 已有完整字段设计                      │
│                                             │
│  3. config-storage.cjs                      │
│     - 文件系统配置存储                      │
│     - 用于API keys等敏感信息                │
│                                             │
│  4. mcp-manager.cjs                         │
│     - MCP服务管理器                         │
│     - 启动/停止/调用服务                    │
│                                             │
└─────────────────────────────────────────────┘
```

## 🎯 重构目标

### 新架构设计

```
┌──────────────────────────────────────────────────────────┐
│               新MCP系统架构                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. 数据库层                                      │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  mcp_templates (可选，系统级)                    │   │
│  │  ├─ id                                          │   │
│  │  ├─ mcp_id (unique)                             │   │
│  │  ├─ name, description, category                 │   │
│  │  ├─ command, args, env_vars                     │   │
│  │  ├─ official, popularity                        │   │
│  │  └─ features, documentation                     │   │
│  │                                                  │   │
│  │  user_mcp_configs (用户级，已存在)              │   │
│  │  ├─ id                                          │   │
│  │  ├─ user_id → users(id)                         │   │
│  │  ├─ mcp_id                                      │   │
│  │  ├─ enabled (是否启用)                          │   │
│  │  ├─ name, description, category                 │   │
│  │  ├─ command, args, env_vars, config_data       │   │
│  │  ├─ official, popularity, features              │   │
│  │  └─ created_at, updated_at                      │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2. 后端API层                                     │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  GET    /api/mcp/services          获取列表     │   │
│  │  GET    /api/mcp/services/:id      获取详情     │   │
│  │  POST   /api/mcp/services          创建服务     │   │
│  │  PUT    /api/mcp/services/:id      更新服务     │   │
│  │  DELETE /api/mcp/services/:id      删除服务     │   │
│  │  POST   /api/mcp/services/:id/toggle  启用/禁用 │   │
│  │  GET    /api/mcp/templates         获取模板     │   │
│  │  POST   /api/mcp/services/from-template 从模板创建│   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 3. 业务逻辑层                                    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  MCPManager (重构)                               │   │
│  │  ├─ 从数据库加载用户的MCP配置                    │   │
│  │  ├─ 只启动enabled=true的服务                    │   │
│  │  ├─ 支持热重载（启用/禁用时重启）                │   │
│  │  ├─ 与工具调用系统集成                          │   │
│  │  └─ 与动态Prompt系统集成                        │   │
│  │                                                  │   │
│  │  MCPService (新建)                               │   │
│  │  ├─ CRUD操作                                    │   │
│  │  ├─ 初始化默认服务                              │   │
│  │  ├─ 验证配置                                    │   │
│  │  └─ 环境变量注入                                │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 4. 前端UI层                                      │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  MCP配置页面                                     │   │
│  │  ├─ 服务列表（内置+自定义）                      │   │
│  │  ├─ 启用/禁用开关                               │   │
│  │  ├─ 添加自定义服务表单                          │   │
│  │  ├─ 编辑服务配置                                │   │
│  │  ├─ 删除自定义服务                              │   │
│  │  ├─ 服务状态监控                                │   │
│  │  └─ 工具列表预览                                │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 📊 数据库设计

### 方案选择

**决定：不创建新的`mcp_templates`表，直接使用`user_mcp_configs`表**

原因：
1. `user_mcp_configs`表已经设计完善，字段充足
2. 避免表冗余和数据同步问题
3. 简化系统架构

### user_mcp_configs表（已存在）

```sql
CREATE TABLE IF NOT EXISTS user_mcp_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- MCP服务基本信息
  mcp_id TEXT NOT NULL,                    -- 服务ID(如github, slack等)
  enabled BOOLEAN DEFAULT 0,                -- 是否启用 ⭐核心字段
  name TEXT NOT NULL,                       -- 服务显示名称
  description TEXT,                         -- 服务描述
  category TEXT,                            -- 分类(development, database等)
  icon TEXT,                                -- 图标emoji

  -- 配置信息
  command TEXT NOT NULL,                    -- 执行命令(如npx, node等)
  args TEXT,                                -- 命令参数(JSON数组格式)
  env_vars TEXT,                            -- 环境变量(JSON对象格式)
  config_data TEXT,                         -- 其他配置数据(JSON格式)

  -- 元数据
  official BOOLEAN DEFAULT 0,               -- 是否官方服务
  popularity TEXT DEFAULT 'medium',         -- 热门程度
  features TEXT,                            -- 功能列表(JSON数组)
  setup_instructions TEXT,                  -- 安装说明
  documentation TEXT,                       -- 文档链接

  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  UNIQUE(user_id, mcp_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `mcp_id` | TEXT | 服务唯一标识 | `github`, `brave_search`, `my_custom_mcp` |
| `enabled` | BOOLEAN | 是否启用该服务 | `true` / `false` ⭐ |
| `official` | BOOLEAN | 是否为系统内置服务 | `true` (内置) / `false` (用户自定义) |
| `args` | TEXT (JSON) | 命令参数数组 | `["-y", "@brave/brave-search-mcp-server"]` |
| `env_vars` | TEXT (JSON) | 环境变量对象 | `{"BRAVE_API_KEY": "xxx"}` |
| `config_data` | TEXT (JSON) | 其他配置 | `{"allowedDirectories": ["/home"]}` |

## 🔄 数据流设计

### 1. 用户注册时

```
注册新用户
    ↓
创建user记录
    ↓
为该用户初始化默认MCP服务配置
    ↓
从server/config.cjs读取内置服务列表
    ↓
批量插入到user_mcp_configs表
    ↓
enabled=false (默认禁用，让用户手动启用)
```

### 2. 启动MCP服务

```
用户登录
    ↓
从user_mcp_configs查询该用户的MCP配置
    ↓
WHERE user_id=? AND enabled=true
    ↓
遍历配置列表
    ↓
MCPManager.startService(config)
    ↓
启动子进程，连接工具
```

### 3. 启用/禁用服务

```
用户点击开关
    ↓
POST /api/mcp/services/:id/toggle
    ↓
更新数据库 enabled字段
    ↓
如果 enabled=true: MCPManager.startService()
如果 enabled=false: MCPManager.stopService()
    ↓
通知工具调用系统重新加载工具列表
    ↓
通知动态Prompt系统重新生成Prompt
```

### 4. 添加自定义服务

```
用户填写表单
    ↓
POST /api/mcp/services
    ↓
验证配置（command, args等）
    ↓
插入到user_mcp_configs表
  (official=false, enabled=false)
    ↓
返回新创建的服务ID
    ↓
前端显示新服务（禁用状态）
```

## 🔌 集成点

### 与现有系统的集成

#### 1. 工具调用系统 (chat.cjs)

```javascript
// server/routes/chat.cjs

// 获取所有可用工具
let allTools = [];

// 1. 获取MCP工具（已启用的）
const mcpTools = mcpManager ? mcpManager.getAllTools() : [];
allTools.push(...mcpTools);

// MCPManager内部逻辑：
// - 只返回enabled=true的服务的工具
// - 从user_mcp_configs读取
```

#### 2. 动态Prompt系统 (dynamic-prompt-generator.cjs)

```javascript
// 动态Prompt会根据实际可用的工具生成
const dynamicSystemPrompt = generateDynamicSystemPrompt(enhancedTools);

// 如果用户禁用了brave_search
// → mcpManager不会启动该服务
// → getAllTools()不会返回brave_search的工具
// → dynamicPrompt不会包含brave_search
// → AI不会尝试调用不存在的工具 ✅
```

#### 3. 配置系统 (config-storage.cjs)

```javascript
// 环境变量注入
// 当MCP服务需要API Key时：

// 1. 从user_mcp_configs读取env_vars字段
const config = await db.prepare(`
  SELECT env_vars FROM user_mcp_configs
  WHERE user_id=? AND mcp_id=? AND enabled=true
`).get(userId, 'brave_search');

// 2. 解析JSON
const envVars = JSON.parse(config.env_vars);
// envVars = { "BRAVE_API_KEY": "encrypted_value" }

// 3. 解密敏感信息
envVars.BRAVE_API_KEY = decrypt(envVars.BRAVE_API_KEY);

// 4. 传递给子进程
spawn(command, args, { env: { ...process.env, ...envVars } });
```

## 📝 实施计划

### Phase 1: 数据库和初始化 (已完成)
- [x] user_mcp_configs表已存在
- [ ] 创建MCP服务初始化脚本
- [ ] 用户注册时自动初始化MCP配置

### Phase 2: 后端API
- [ ] 创建 /api/mcp/services 路由
- [ ] 实现CRUD操作
- [ ] 实现启用/禁用逻辑
- [ ] 实现从模板创建服务

### Phase 3: MCP Manager重构
- [ ] 从数据库读取配置（而不是config.cjs）
- [ ] 支持热重载
- [ ] 集成到工具调用系统
- [ ] 集成到动态Prompt系统

### Phase 4: 前端UI
- [ ] 创建MCP配置页面组件
- [ ] 服务列表展示
- [ ] 添加/编辑/删除表单
- [ ] 启用/禁用开关
- [ ] 状态监控

### Phase 5: 测试和文档
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户文档
- [ ] 开发文档

## 🎨 前端UI设计草图

```
┌─────────────────────────────────────────────────────────┐
│  MCP服务管理                                🔄 刷新      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 官方服务                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔍 Brave Search                    ✅ 已启用 [●] │  │
│  │ 高质量网页搜索，速度快、结果准确                  │  │
│  │ 🔧 配置  📊 工具(3)  📖 文档                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📁 Filesystem                      ❌ 已禁用 [ ] │  │
│  │ 文件系统操作，读写、编辑、搜索文件                │  │
│  │ 🔧 配置  📊 工具(5)  📖 文档                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🧠 Memory                          ✅ 已启用 [●] │  │
│  │ 知识图谱记忆系统，持久化存储实体和关系            │  │
│  │ 🔧 配置  📊 工具(4)  📖 文档                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  👤 自定义服务                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔌 My Custom Service               ✅ 已启用 [●] │  │
│  │ 我的自定义MCP服务                                 │  │
│  │ ✏️ 编辑  🗑️ 删除  📊 工具(2)                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [➕ 添加自定义服务]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 💡 关键设计决策

### 1. 为什么不分离templates表？

**决策**：所有配置存储在`user_mcp_configs`表

**原因**：
- ✅ 简化架构，减少表关联
- ✅ 避免数据同步问题
- ✅ 用户可以自由修改任何服务的配置
- ✅ `official`字段区分内置/自定义服务

### 2. 如何处理敏感信息（API Keys）？

**决策**：在`env_vars`字段中加密存储

**流程**：
```javascript
// 保存时
const encrypted = encrypt(apiKey);
await db.prepare(`
  UPDATE user_mcp_configs
  SET env_vars = ?
  WHERE id = ?
`).run(JSON.stringify({ BRAVE_API_KEY: encrypted }), id);

// 启动服务时
const envVars = JSON.parse(config.env_vars);
const decrypted = decrypt(envVars.BRAVE_API_KEY);
spawn(command, args, {
  env: { ...process.env, BRAVE_API_KEY: decrypted }
});
```

### 3. 如何确保数据一致性？

**约束**：
- `UNIQUE(user_id, mcp_id)` - 同一用户不能有重复的mcp_id
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` - 用户删除时级联删除配置

### 4. 如何处理服务启动失败？

**策略**：
```javascript
try {
  await mcpManager.startService(config);
  // 更新数据库状态
  await db.prepare(`
    UPDATE user_mcp_configs
    SET status = 'running'
    WHERE id = ?
  `).run(config.id);
} catch (error) {
  // 记录错误，但不影响其他服务
  logger.error(`[MCP] 启动服务失败: ${config.mcp_id}`, error);
  await db.prepare(`
    UPDATE user_mcp_configs
    SET status = 'failed', error_message = ?
    WHERE id = ?
  `).run(error.message, config.id);
}
```

## 📈 性能优化

### 1. 缓存策略

```javascript
class MCPService {
  constructor() {
    this.cache = new Map(); // 缓存用户的MCP配置
    this.cacheTTL = 60000; // 1分钟过期
  }

  async getUserMCPConfigs(userId) {
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // 从数据库查询
    const configs = await db.prepare(`
      SELECT * FROM user_mcp_configs
      WHERE user_id = ?
      ORDER BY official DESC, name ASC
    `).all(userId);

    this.cache.set(cacheKey, {
      data: configs,
      timestamp: Date.now()
    });

    return configs;
  }

  // 更新时清除缓存
  async updateService(userId, serviceId, updates) {
    await db.prepare(`...`).run(...);
    this.cache.delete(`user_${userId}`); // 清除缓存
  }
}
```

### 2. 批量操作

```javascript
// 用户注册时批量初始化MCP服务
async function initializeDefaultMCPServices(userId) {
  const builtInServices = getBuiltInServices(); // 从config.cjs读取

  const stmt = db.prepare(`
    INSERT INTO user_mcp_configs
    (user_id, mcp_id, name, description, category, command, args,
     env_vars, official, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 使用事务批量插入
  db.transaction(() => {
    builtInServices.forEach(service => {
      stmt.run(
        userId,
        service.id,
        service.name,
        service.description,
        service.category,
        service.command,
        JSON.stringify(service.args),
        JSON.stringify(service.env || {}),
        true, // official
        false // enabled (默认禁用)
      );
    });
  })();
}
```

## 🔒 安全考虑

### 1. API Key加密

```javascript
// 使用config-storage.cjs的加密方法
const configStorage = require('./config-storage.cjs');

// 保存时加密
const encrypted = configStorage.encrypt(apiKey);

// 使用时解密
const decrypted = configStorage.decrypt(encrypted);
```

### 2. 权限控制

```javascript
// 每个用户只能操作自己的MCP配置
router.put('/api/mcp/services/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const serviceId = req.params.id;

  // 验证该服务属于当前用户
  const service = await db.prepare(`
    SELECT * FROM user_mcp_configs
    WHERE id = ? AND user_id = ?
  `).get(serviceId, userId);

  if (!service) {
    return res.status(404).json({ error: '服务不存在或无权访问' });
  }

  // 继续更新...
});
```

### 3. 命令注入防护

```javascript
// 验证command和args
function validateMCPConfig(config) {
  const allowedCommands = ['npx', 'node', 'python', 'python3'];

  if (!allowedCommands.includes(config.command)) {
    throw new Error(`不允许的命令: ${config.command}`);
  }

  // 检查args中是否有危险字符
  const dangerousPatterns = [';', '&&', '||', '|', '>', '<', '`', '$'];
  const argsStr = JSON.stringify(config.args);

  for (const pattern of dangerousPatterns) {
    if (argsStr.includes(pattern)) {
      throw new Error(`参数中包含危险字符: ${pattern}`);
    }
  }

  return true;
}
```

## 📚 下一步

阅读此文档后，我们将开始实施：

1. **创建MCP服务初始化脚本** - 从config.cjs读取内置服务并准备导入
2. **实现后端API** - CRUD操作和启用/禁用逻辑
3. **重构MCP Manager** - 从数据库读取配置
4. **创建前端UI** - 配置页面
5. **集成测试** - 确保所有部分协同工作

让我们开始吧！🚀
