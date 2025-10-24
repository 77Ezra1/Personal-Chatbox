# 🧠 AI如何智能选择工具 - 技术原理详解

## 📚 核心概念：Function Calling

AI并不是"猜测"，而是通过**OpenAI Function Calling协议**进行精准的工具选择。

---

## 🔄 完整流程图

```
用户提问: "帮我查一下ETH的价格"
    ↓
① 后端收到请求，获取所有可用工具
    ↓
② 将工具列表和用户消息一起发送给AI模型
    ↓
③ AI模型分析用户意图 + 工具描述
    ↓
④ AI决定调用 search_token(query: "ETH")
    ↓
⑤ 后端执行工具调用
    ↓
⑥ 获取结果（ETH价格数据）
    ↓
⑦ 将结果发回AI
    ↓
⑧ AI整理数据，生成用户友好的回复
    ↓
用户收到: "ETH当前价格为 $3,892.31 USD..."
```

---

## 1️⃣ 工具列表注册

### 代码实现 (`server/routes/chat.cjs`)

```javascript
// 第1步：收集所有可用工具
let allTools = [];

// 获取MCP工具（43个）
const mcpTools = mcpManager.getAllTools();
allTools.push(...mcpTools);

// 获取内置服务工具（22个）
for (const [serviceId, service] of Object.entries(allServices)) {
  if (service && service.enabled && service.getTools) {
    const serviceTools = service.getTools();
    allTools.push(...serviceTools);
  }
}
// 现在 allTools 包含 65 个工具
```

### 工具定义格式

每个工具都遵循OpenAI的JSON Schema标准：

```javascript
{
  type: 'function',
  function: {
    name: 'search_token',  // 工具名称
    description: '[加密货币实时数据] 搜索加密货币代币,获取价格和交易对信息。适用于：查询加密货币价格、市场数据...',  // 增强描述
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询词,可以是代币名称、符号或地址,例如: BTC, ETH, SOL'
        }
      },
      required: ['query']
    }
  }
}
```

---

## 2️⃣ 工具描述增强

这是关键！我们对每个工具的描述进行**语义增强**，帮助AI更好地理解：

### 增强策略

```javascript
// 原始描述
"搜索加密货币代币,获取价格和交易对信息"

// 增强后描述
"[加密货币实时数据] 搜索加密货币代币,获取价格和交易对信息。
适用于：查询加密货币价格、市场数据、热门代币、交易对信息等。
使用Dexscreener API。"
```

### 增强代码

```javascript
if (tool.function.name.includes('search_token')) {
  enhancedDescription = `[加密货币实时数据] ${enhancedDescription}。
    适用于：查询加密货币价格、市场数据、热门代币、交易对信息等。
    使用Dexscreener API。`;
}
```

### 为什么要增强？

1. **明确分类**: `[加密货币实时数据]` 告诉AI这是什么类型的工具
2. **具体场景**: `适用于：...` 列出所有可能的使用场景
3. **技术细节**: `使用Dexscreener API` 提供实现信息

---

## 3️⃣ 发送给AI模型

### API请求结构

```javascript
const apiParams = {
  model: 'deepseek-chat',
  messages: [
    { role: 'user', content: '帮我查一下ETH的价格' }
  ],
  tools: [
    // 65个工具定义
    { type: 'function', function: { name: 'search_token', ... } },
    { type: 'function', function: { name: 'get_weather', ... } },
    // ... 其他63个工具
  ],
  tool_choice: 'auto'  // 🔑 关键：让AI自动决定
};

const response = await openai.chat.completions.create(apiParams);
```

### `tool_choice` 参数说明

| 值 | 行为 |
|----|------|
| `'auto'` | ✅ AI自动决定是否调用工具以及调用哪个 |
| `'none'` | AI不会调用任何工具 |
| `{type: 'function', function: {name: 'xxx'}}` | 强制调用指定工具 |

我们使用 `'auto'`，让AI根据上下文智能选择！

---

## 4️⃣ AI的决策过程

### AI模型内部分析（简化版）

```
输入：
- 用户消息: "帮我查一下ETH的价格"
- 可用工具: 65个

AI内部推理：
1. 分析用户意图:
   - 关键词: "ETH", "价格", "查"
   - 意图: 查询加密货币价格信息

2. 匹配工具:
   扫描所有65个工具的描述...

   ✅ search_token:
      - 描述包含 "加密货币"、"价格"
      - 参数需要 query 字符串
      - 适用场景匹配！

   ❌ get_weather:
      - 描述是"天气查询"
      - 不匹配

   ❌ wikipedia_findPage:
      - 描述是"维基百科"
      - 不匹配

3. 决定调用:
   调用 search_token(query: "ETH")
```

### AI返回的响应

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "search_token",
          "arguments": "{\"query\":\"ETH\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"  // 🔑 表示需要调用工具
  }]
}
```

---

## 5️⃣ 后端执行工具

### 智能路由代码

```javascript
// 解析工具调用
const toolName = toolCall.function.name;  // "search_token"
const toolArgs = JSON.parse(toolCall.function.arguments);  // {query: "ETH"}

// 智能判断工具类型
if (toolName.includes('_')) {
  // 可能是MCP工具（如 "memory_create_entities"）
  try {
    const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);
    toolResult = await mcpManager.callTool(serviceId, actualToolName, toolArgs);
  } catch (error) {
    // MCP调用失败，尝试内置服务
    toolResult = await callLegacyServiceTool(toolName, toolArgs);
  }
} else {
  // 直接作为内置服务工具调用
  toolResult = await callLegacyServiceTool(toolName, toolArgs);
}
```

### 工具执行结果

```javascript
{
  success: true,
  content: `**代币搜索结果: "ETH"**

  找到 5 个交易对:

  1. **ETH/USDC**
     💰 价格: $3892.31
     📊 24h交易量: $20.66M
     📈 24h涨跌: 0.22%
     🔗 链: ethereum
     💧 流动性: $3.40M
     ...`
}
```

---

## 6️⃣ 结果反馈给AI

### 构造tool消息

```javascript
apiParams.messages.push({
  role: 'assistant',
  tool_calls: [{
    id: "call_abc123",
    function: { name: "search_token", arguments: '{"query":"ETH"}' }
  }]
});

apiParams.messages.push({
  role: 'tool',
  tool_call_id: "call_abc123",
  content: JSON.stringify(toolResult)  // 工具执行结果
});

// 再次调用AI，让它整理数据
const finalResponse = await openai.chat.completions.create(apiParams);
```

---

## 7️⃣ AI生成最终回复

### AI收到工具结果后

```
AI看到：
- 用户问: "帮我查一下ETH的价格"
- 我调用了: search_token(query: "ETH")
- 工具返回: ETH价格 $3892.31，24h交易量 $20.66M...

AI生成最终回复:
"ETH (以太坊) 当前价格为 $3,892.31 USD

根据 Dexscreener 的实时数据:
- 24小时涨跌: +0.22%
- 24小时交易量: $20.66M
- 主要交易对: ETH/USDC (Uniswap)
- 流动性: $3.40M

价格相对稳定，略有上涨。"
```

---

## 🎯 关键设计要点

### 1. 工具描述的质量决定选择准确度

**差的描述**:
```javascript
description: "搜索代币"  // 太简短，AI难以判断
```

**好的描述**:
```javascript
description: "[加密货币实时数据] 搜索加密货币代币,获取价格和交易对信息。适用于：查询加密货币价格、市场数据、热门代币、交易对信息等。使用Dexscreener API。"
```

### 2. 参数定义要清晰

```javascript
parameters: {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: '搜索查询词,可以是代币名称、符号或地址,例如: BTC, ETH, SOL'  // 🔑 提供示例
    }
  },
  required: ['query']  // 🔑 明确必需参数
}
```

### 3. 工具命名要语义化

✅ 好的命名:
- `search_token` - 清楚表达功能
- `get_weather_forecast` - 知道是天气预报
- `wikipedia_findPage` - 知道是维基百科搜索

❌ 差的命名:
- `tool1` - 完全不知道是什么
- `fetch` - 太模糊
- `query` - 查询什么？

---

## 🔬 实际案例分析

### 案例1: 加密货币价格查询

```
用户: "帮我查一下ETH的价格"

AI分析:
- 关键词: ETH (加密货币符号), 价格
- 匹配工具: search_token ✅
  - 描述包含 "加密货币价格"
  - 参数需要 query
- 决定: search_token(query: "ETH")

结果: ✅ 成功返回ETH价格
```

### 案例2: 天气查询

```
用户: "今天天气怎么样?"

AI分析:
- 关键词: 天气
- 匹配工具: get_weather ✅
  - 描述包含 "天气查询"
  - 适用场景: "查询当前天气、天气预报"
- 决定: get_weather()

结果: ✅ 成功返回天气信息
```

### 案例3: 多工具组合

```
用户: "帮我查一下ETH的价格，然后保存到记忆里"

AI分析:
- 第一步: 查询价格
  - 调用: search_token(query: "ETH")
- 第二步: 保存到记忆
  - 调用: memory_create_entities(entities: [{name: "ETH价格", observations: [...]}])

结果: ✅ 两个工具顺序执行
```

---

## 📊 不同模型的支持情况

| 模型 | Function Calling支持 | 工具选择准确度 | 说明 |
|------|---------------------|---------------|------|
| **DeepSeek Chat** | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | 非常准确，推荐 |
| **DeepSeek Reasoner** | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | 带推理过程 |
| **GPT-4** | ✅ 原生支持 | ⭐⭐⭐⭐⭐ | 业界标杆 |
| **GPT-3.5** | ✅ 原生支持 | ⭐⭐⭐⭐ | 良好 |
| **Claude 3.5** | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | 非常智能 |
| **Gemini Pro** | ✅ 完全支持 | ⭐⭐⭐⭐ | 良好 |

---

## 🛠️ 优化技巧

### 1. 工具描述优化

```javascript
// 添加分类标签
"[类别] 功能描述。适用于：具体场景1、场景2、场景3。"

// 示例
"[加密货币实时数据] 搜索加密货币代币。适用于：价格查询、市值分析、交易对查找。"
```

### 2. 参数说明优化

```javascript
parameters: {
  properties: {
    query: {
      type: 'string',
      description: '搜索词 (示例: BTC, ETH, SOL)',  // 提供示例
      examples: ['BTC', 'ETH', 'SOL']  // OpenAI支持
    }
  }
}
```

### 3. 避免工具冲突

如果有两个功能相似的工具，在描述中明确区分：

```javascript
// 工具1
{
  name: 'brave_search',
  description: '[网页搜索-Brave-首选] 高质量网络搜索。速度快、稳定、推荐首选。'
}

// 工具2
{
  name: 'search_web',
  description: '[网页搜索-DuckDuckGo-备用] 网络搜索。容易限流，仅在Brave不可用时使用。'
}
```

---

## 🔍 调试技巧

### 查看AI选择的工具

```javascript
// 后端日志
logger.info(`AI选择了工具: ${toolCall.function.name}`);
logger.info(`参数: ${toolCall.function.arguments}`);
```

### 测试工具描述是否清晰

问自己：
1. ✅ 看到工具名称，能猜到功能吗？
2. ✅ 看到描述，知道什么时候该用吗？
3. ✅ 看到参数，知道怎么传值吗？

---

## 🎓 总结

### AI选择工具的关键因素

1. **工具描述** (50%)
   - 语义清晰、场景明确

2. **用户意图** (30%)
   - 关键词匹配

3. **参数匹配** (15%)
   - 参数类型和描述

4. **上下文** (5%)
   - 对话历史

### 最佳实践

✅ **DO:**
- 提供详细的工具描述
- 使用分类标签
- 列出具体适用场景
- 参数说明清晰
- 提供示例

❌ **DON'T:**
- 工具描述太简短
- 工具名称不语义化
- 参数说明模糊
- 多个工具功能重复

---

**核心理念**: AI不是"猜测"，而是基于**精确的工具描述和参数定义**进行智能匹配！

工具描述质量 = AI选择准确度 🎯

