# 🎯 动态Prompt自适应系统

## 问题

你提了一个非常好的问题：

> "当用户需要关闭某个工具时，提示词还能正常响应吗？"

### 原有系统的问题

之前的Prompt中硬编码了工具名称，比如：

```javascript
// 旧版Prompt片段
const PROMPT = `
可用工具：
• dexscreener_searchPairs - 查询代币价格
• brave_search_web - 搜索网页
• fetch_url - 获取网页内容
...
`
```

**问题**：
- 如果用户禁用了 `brave_search_web`，但Prompt还在推荐使用它
- AI会尝试调用一个不存在的工具
- 调用失败，用户体验差
- Prompt中的示例变成了错误示例

---

## 解决方案：动态Prompt生成系统

### 核心理念

**Prompt应该根据实际可用的工具动态生成**

```
用户启用的工具 → 动态生成Prompt → AI看到正确的工具列表
```

### 实现方式

#### 1️⃣ 动态Prompt生成器

**文件**：
- 前端：`src/lib/dynamicPromptGenerator.js`
- 后端：`server/utils/dynamic-prompt-generator.cjs`

**功能**：
- ✅ 分析可用工具列表
- ✅ 自动分类工具（搜索、加密货币、文件操作等）
- ✅ 生成针对性的工具描述
- ✅ 动态生成调用示例
- ✅ 生成工具选择决策树

#### 2️⃣ 工作流程

```
┌─────────────────────────────┐
│ 1. 收集所有启用的工具       │
│   - MCP工具                 │
│   - 原有服务工具            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. 分析工具                  │
│   - 按类别分组              │
│   - 识别优先级              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. 生成动态Prompt           │
│   - 只包含可用工具          │
│   - 生成针对性示例          │
│   - 设置优先级规则          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. 注入到对话               │
│   - 作为system消息          │
│   - AI看到准确的工具列表    │
└─────────────────────────────┘
```

---

## 功能演示

### 场景1：所有工具都启用

**可用工具**：
- brave_search_web
- search_web
- dexscreener_searchPairs
- filesystem_*
- fetch_url

**生成的Prompt**：
```
=== 🛠️ 当前可用工具 (共15个) ===

【搜索类工具】
├─ brave_search_web - 通用网页搜索（首选，速度快、稳定）
├─ search_web - 备用搜索（可能被限流）
└─ wikipedia_search - 百科知识查询

【加密货币工具】
├─ dexscreener_searchPairs - 搜索代币交易对
└─ get_token_price - 获取代币价格

【文件操作工具】
├─ 读取/写入/搜索文件
└─ 目录管理

...

=== 📚 工具调用示例学习 ===

【示例：网页搜索】
用户："最新的AI新闻有哪些？"
✅ 正确流程：
第1步：识别需求 → 需要搜索最新新闻
第2步：选择工具 → brave_search_web（首选）
第3步：调用工具 → brave_search_web({query: "AI 新闻 2025", count: 10})
...
```

### 场景2：用户禁用了brave_search

**可用工具**：
- ~~brave_search_web~~ (已禁用)
- search_web
- dexscreener_searchPairs
- filesystem_*

**生成的Prompt**：
```
=== 🛠️ 当前可用工具 (共14个) ===

【搜索类工具】
└─ search_web - DuckDuckGo搜索（可能被限流）

【加密货币工具】
├─ dexscreener_searchPairs - 搜索代币交易对
└─ get_token_price - 获取代币价格

...

=== 📚 工具调用示例学习 ===

【示例：网页搜索】
用户："最新的AI新闻有哪些？"
✅ 正确流程：
第1步：识别需求 → 需要搜索最新新闻
第2步：选择工具 → search_web
第3步：调用工具 → search_web({query: "AI 新闻 2025"})
...
```

**关键变化**：
- ✅ Prompt中不再提到 `brave_search_web`
- ✅ 示例改用 `search_web`
- ✅ 不再说"首选brave_search"
- ✅ AI不会尝试调用不存在的工具

### 场景3：没有任何工具

**可用工具**：无

**生成的Prompt**：
```
你是一个专业的AI助手。

⚠️ 当前系统没有可用的工具，你只能基于自己的知识回答问题。

请注意：
- 明确告知用户你无法获取实时信息
- 对于需要实时数据的问题，建议用户启用相关工具
- 基于已有知识提供帮助，但要标注信息的时效性

如果用户需要使用工具功能，请建议他们：
1. 前往设置页面
2. 启用所需的MCP服务或其他工具
3. 配置必要的API密钥
```

**效果**：
- ✅ AI知道自己没有工具
- ✅ 会主动告知用户需要启用工具
- ✅ 不会尝试调用不存在的工具

---

## 技术实现

### 后端集成 (server/routes/chat.cjs)

```javascript
// 1. 导入动态Prompt生成器
const { generateDynamicSystemPrompt } = require('../utils/dynamic-prompt-generator.cjs');

// 2. 收集可用工具
const allTools = []; // MCP工具 + 原有服务工具
const enhancedTools = toolCallOptimizer.enhanceToolDescriptions(allTools);

// 3. 生成动态Prompt
const dynamicSystemPrompt = generateDynamicSystemPrompt(enhancedTools, {
  scenario: 'general'
});

// 4. 注入到消息
if (dynamicSystemPrompt && enhancedTools.length > 0) {
  const hasSystemMessage = apiParams.messages.some(msg => msg.role === 'system');

  if (!hasSystemMessage) {
    apiParams.messages.unshift({
      role: 'system',
      content: dynamicSystemPrompt
    });
    logger.info(`[Chat] 注入动态System Prompt（${enhancedTools.length}个工具）`);
  }
}
```

### 工具分类逻辑

```javascript
const TOOL_CATEGORIES = {
  search: {
    keywords: ['search', 'brave', 'wikipedia'],
    description: '搜索类工具'
  },
  crypto: {
    keywords: ['dexscreener', 'token', 'price'],
    description: '加密货币工具'
  },
  filesystem: {
    keywords: ['filesystem', 'file', 'read', 'write'],
    description: '文件操作工具'
  },
  // ... 更多类别
}

function categorizeTools(toolName) {
  for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
    if (config.keywords.some(keyword => toolName.includes(keyword))) {
      return category;
    }
  }
  return 'other';
}
```

---

## 优势

### 1️⃣ 自动适配

| 用户操作 | 系统响应 |
|---------|---------|
| 启用新工具 | Prompt自动包含新工具 |
| 禁用工具 | Prompt自动移除该工具 |
| 更换MCP服务 | Prompt自动更新示例 |

### 2️⃣ 避免错误

**之前**：
```
用户：搜索最新新闻
AI：调用brave_search_web
系统：❌ 工具不存在（用户已禁用）
AI：抱歉，调用失败...
```

**现在**：
```
用户：搜索最新新闻
AI：（看到Prompt中只有search_web）
AI：调用search_web
系统：✅ 成功
AI：这是搜索结果...
```

### 3️⃣ 智能提示

当工具不足时，AI会主动建议：

```
用户："帮我搜索最新的AI新闻"

AI（看到没有搜索工具）：
"抱歉，当前系统没有启用搜索工具。

建议您：
1. 前往设置页面
2. 启用Brave Search或Wikipedia等MCP服务
3. 配置必要的API密钥

启用后，我就可以为您搜索最新的AI新闻了。"
```

---

## 使用示例

### 测试场景1：禁用brave_search

```bash
# 1. 在MCP管理面板禁用brave_search服务

# 2. 发起对话
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "搜索最新AI新闻"}],
    "model": "deepseek-chat"
  }'

# 3. 查看后端日志
# 你会看到：
# [Chat] 注入动态System Prompt（14个工具）  <- 少了1个
# [DynamicPrompt] 生成动态Prompt: 14个工具, 场景: general
# 【搜索类工具】
# └─ search_web - DuckDuckGo搜索  <- 不再提brave_search
```

### 测试场景2：只启用加密货币工具

```bash
# 1. 在设置中只启用dexscreener相关服务

# 2. 发起对话
# AI会看到的Prompt：
# 【加密货币工具】
# ├─ dexscreener_searchPairs
# └─ get_token_price
#
# （没有搜索、文件等其他工具的描述）

# 3. 用户问："搜索最新新闻"
# AI回答："抱歉，当前没有启用搜索工具..."
```

---

## 配置选项

### 场景模式

可以根据对话内容动态调整场景：

```javascript
// 后端chat.cjs中可以修改
const dynamicSystemPrompt = generateDynamicSystemPrompt(enhancedTools, {
  scenario: 'crypto'  // 'general', 'crypto', 'research', 'development'
});
```

**场景特定增强**：
- `crypto` - 强调"绝对不要猜测价格"
- `development` - 强调"文件操作前检查路径"
- `research` - 强调"多方验证信息"

### 工具优先级

在 `dynamic-prompt-generator.cjs` 中可以自定义：

```javascript
// 自定义工具分类
const TOOL_CATEGORIES = {
  your_custom_category: {
    keywords: ['your', 'keywords'],
    description: '你的工具类别'
  }
}

// 自定义优先级规则
if (categorizedTools.your_category) {
  sections.push('【你的类别】\n└─ 优先使用这些工具\n');
}
```

---

## 监控和调试

### 查看生成的Prompt

后端日志会输出：

```
[Chat] 注入动态System Prompt（15个工具）
[DynamicPrompt] 生成动态Prompt: 15个工具, 场景: general
```

### 调试信息

在 `dynamic-prompt-generator.cjs` 中已包含详细日志：

```javascript
logger.info(`[DynamicPrompt] 生成动态Prompt: ${toolCount}个工具, 场景: ${scenario}`);
logger.warn('[DynamicPrompt] 没有可用工具，AI将无法使用Function Calling');
```

### 前端查看

可以在浏览器控制台查看实际发送的messages：

```javascript
console.log(apiParams.messages[0]); // system消息
// {
//   role: 'system',
//   content: '你是一个专业的AI助手...\n当前可用工具 (共15个)...'
// }
```

---

## 兼容性

### 向后兼容

- ✅ 如果没有传入工具列表，系统会使用旧的静态Prompt
- ✅ 用户自定义的System Prompt会被保留（不会覆盖）
- ✅ 现有的前端代码无需修改

### 用户自定义Prompt

如果用户在前端设置了自定义System Prompt：

```javascript
// 后端会检测并跳过注入
const hasSystemMessage = apiParams.messages.some(msg => msg.role === 'system');

if (!hasSystemMessage) {
  // 只有没有system消息时才注入
  apiParams.messages.unshift({...});
} else {
  logger.warn('[Chat] 消息中已存在system prompt，跳过注入');
}
```

---

## 总结

### 问题

> "当用户需要关闭某个工具时提示词还能正常响应吗？"

### 答案

**✅ 现在可以了！**

1. **动态适配** - Prompt根据可用工具自动调整
2. **避免错误** - AI不会调用不存在的工具
3. **智能提示** - 当工具不足时会主动建议用户启用
4. **零配置** - 后端自动处理，用户无感知

### 核心价值

- 🎯 **精确** - Prompt永远反映实际可用的工具
- 🔄 **灵活** - 工具变化时自动适配
- 🛡️ **安全** - 避免调用不存在的工具
- 👥 **友好** - 当工具不足时给出明确建议

### 关键文件

| 文件 | 作用 |
|------|------|
| `server/utils/dynamic-prompt-generator.cjs` | 动态Prompt生成器（后端） |
| `src/lib/dynamicPromptGenerator.js` | 动态Prompt生成器（前端，可选） |
| `server/routes/chat.cjs` | 集成点（已更新） |

---

## 下一步

1. ✅ 系统已经集成，直接使用即可
2. 💡 在MCP管理面板尝试启用/禁用不同工具
3. 👀 观察后端日志，查看动态Prompt生成情况
4. 🎭 与AI对话，验证其是否正确使用可用工具

享受你的自适应AI系统！🚀
