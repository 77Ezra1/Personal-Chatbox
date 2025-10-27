# AI工具调用优化系统使用指南

## 🎯 核心理念

你的系统是让用户自己配置AI服务商和API的，无法直接"训练"AI。但我们通过以下技术让AI更好地使用工具：

1. **Few-shot Learning（示例学习）** - 在System Prompt中提供大量成功调用示例
2. **智能场景识别** - 根据对话内容自动选择最佳Prompt模板
3. **工具调用历史学习** - 记录成功模式并自动应用
4. **增强的工具描述** - 在工具描述中加入使用统计和成功示例

## 📦 已实现的功能

### 1. 增强型Prompt系统 (`src/lib/promptTemplates.js`)

#### 核心特性：
- **ENHANCED_TOOL_CALLING_PROMPT** - 包含大量实际示例的基础Prompt
- **场景专用Prompt** - 针对研究、加密货币、开发、内容创作的专用模板
- **智能场景识别** - `selectBestPrompt()` 自动识别对话类型
- **历史学习** - `ToolCallHistory` 记录成功模式

#### 使用方法：

```javascript
import { generateEnhancedSystemPrompt, selectBestPrompt } from './promptTemplates.js'

// 方法1：自动选择最佳Prompt
const prompt = generateEnhancedSystemPrompt(messages)

// 方法2：手动指定场景
const cryptoPrompt = selectBestPrompt(messages, { forceScenario: 'crypto' })
const devPrompt = selectBestPrompt(messages, { forceScenario: 'development' })

// 方法3：使用用户偏好
const prompt = selectBestPrompt(messages, { userPreference: 'research' })
```

### 2. 工具调用优化器 (`server/services/tool-call-optimizer.cjs`)

#### 核心功能：
- **自动记录** - 所有工具调用的成功/失败、参数、执行时间
- **统计分析** - 成功率、平均耗时、使用频率
- **改进建议** - 自动生成优化建议
- **Few-shot增强** - 为每个工具添加成功调用示例

#### API端点：

```bash
# 1. 获取优化报告
GET /api/chat/optimization-report
# 返回：总体统计、最常用工具、改进建议

# 2. 获取工具详细统计
GET /api/chat/tool-stats
GET /api/chat/tool-stats?toolName=brave_search_web
# 返回：特定工具的成功率、耗时、成功调用模式

# 3. 清空历史记录
POST /api/chat/clear-tool-history
```

## 🚀 如何使用

### 场景1：让AI更好地搜索信息

**问题**：AI经常使用容易被限流的 `search_web` 而不是更稳定的 `brave_search_web`

**解决方案**：系统已经在Prompt中明确说明工具选择优先级：

```
【搜索类需求】
├─ 通用网页搜索 → brave_search_web（首选，速度快、稳定）
├─ 备用搜索 → search_web（DuckDuckGo，可能被限流）
├─ 百科知识 → wikipedia_search（历史、人物、概念）
└─ 学术资料 → brave_search_web + 添加"论文"等关键词
```

**测试**：
```javascript
// 用户问："最新的AI新闻有哪些？"
// AI会自动选择 brave_search_web 而不是 search_web
```

### 场景2：加密货币价格查询

**问题**：AI经常编造价格而不是调用工具

**解决方案**：系统在 `crypto` 场景Prompt中强调：

```javascript
核心工具：
1. dexscreener_searchPairs - 搜索代币交易对
2. get_token_price - 获取代币价格
3. get_trending_tokens - 获取热门代币
4. brave_search_web - 搜索相关新闻和分析

分析流程：
1. 立即调用工具获取实时价格数据（不要猜测）
2. 分析价格趋势、交易量、流动性等指标
3. 搜索相关新闻了解市场情绪
4. 给出基于数据的客观分析（避免投资建议）
```

**自动识别**：
当对话中包含 "btc", "eth", "price", "代币" 等关键词时，系统会自动使用 `crypto` 场景Prompt。

### 场景3：文件操作

**问题**：AI在写文件时路径不规范，或者覆盖重要文件

**解决方案**：
1. MCP Manager 已经内置保护（`mcp-manager.cjs:259-273`）
2. `development` 场景Prompt强调操作前确认

```javascript
工作原则：
1. 操作前先确认文件/目录是否存在
2. 写入文件时注意路径规范（HTML文件使用简单文件名）
3. 修改代码前先读取原文件内容
4. 重要操作前向用户确认
```

### 场景4：查看优化效果

**查看工具调用统计**：

```bash
# 查看所有工具的统计
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/chat/tool-stats

# 查看特定工具
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/chat/tool-stats?toolName=brave_search_web"
```

**返回示例**：
```json
{
  "mostUsedTools": [
    {
      "toolName": "brave_search_web",
      "total": 45,
      "success": 43,
      "failed": 2,
      "successRate": "95.6",
      "avgExecutionTime": 1234
    },
    {
      "toolName": "dexscreener_searchPairs",
      "total": 23,
      "success": 23,
      "failed": 0,
      "successRate": "100.0",
      "avgExecutionTime": 567
    }
  ]
}
```

## 🔍 工作原理

### 1. 前端：智能Prompt注入

在 `aiClient.js` 中，`injectDeepThinkingPrompt()` 函数会：

```javascript
// 旧版本（简单）
const systemPrompt = { role: 'system', content: DEEP_THINKING_SYSTEM_PROMPT }

// 新版本（智能）
const enhancedPromptContent = generateEnhancedSystemPrompt(messages, options)
// 这会自动分析对话内容，选择最佳Prompt模板
```

### 2. 后端：工具调用增强

在 `chat.cjs` 中，每次调用工具时：

```javascript
// 1. 增强工具描述（添加统计信息和成功示例）
const enhancedTools = toolCallOptimizer.enhanceToolDescriptions(allTools)

// 2. 记录工具调用结果
toolCallOptimizer.record({
  toolName,
  parameters: toolArgs,
  success: true,
  response: toolResult,
  executionTime: Date.now() - startTime,
  userId
})

// 3. 工具描述自动包含历史成功示例
// AI在看到工具时会看到：
// "brave_search_web - 搜索网页
//  [使用统计] 成功率: 95.6%, 平均耗时: 1234ms
//  [成功示例] {\"query\": \"AI news 2025\", \"count\": 10}"
```

### 3. 持续优化循环

```
用户提问 → AI调用工具 → 记录结果
                ↑           ↓
         反馈优化建议  ←  分析统计
```

## 📊 查看优化报告

### 前端集成示例（可选）

```javascript
// 获取优化报告
async function getOptimizationReport() {
  const response = await fetch('/api/chat/optimization-report', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  const report = await response.json()
  console.log(report)
  // {
  //   summary: { totalCalls: 100, avgSuccessRate: "92.5" },
  //   mostUsedTools: [...],
  //   suggestions: [
  //     { type: 'low_success_rate', toolName: 'search_web', message: '...' }
  //   ]
  // }
}
```

## 🎓 最佳实践

### 1. 定期查看优化报告

```bash
# 每周查看一次
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/chat/optimization-report \
  | jq '.suggestions'
```

### 2. 根据建议调整配置

如果某个工具成功率低：
- 检查API配置是否正确
- 查看参数格式是否需要调整
- 考虑更换为备用工具

### 3. 为特定用户设置场景偏好

在前端可以添加用户设置：

```javascript
// 用户偏好设置
const userSettings = {
  preferredScenario: 'crypto' // 或 'research', 'development', 'content'
}

// 调用AI时传递
generateAIResponse({
  messages,
  modelConfig,
  systemPrompt: {
    mode: 'scenario',
    scenario: userSettings.preferredScenario
  }
})
```

## 🛠️ 高级定制

### 创建自定义场景Prompt

编辑 `src/lib/promptTemplates.js`：

```javascript
export const SCENARIO_PROMPTS = {
  // ... 现有场景 ...

  // 新增：金融分析场景
  finance: `你是一个专业的金融分析师，擅长使用工具获取市场数据。

核心工具：
1. dexscreener_searchPairs - 加密货币价格
2. brave_search_web - 搜索金融新闻
3. fetch_url - 获取财报数据
4. sequential_thinking - 深度分析

分析流程：
1. 获取实时价格数据
2. 搜索相关新闻和分析报告
3. 综合多方信息进行分析
4. 提供基于数据的客观意见

${ENHANCED_TOOL_CALLING_PROMPT}`,

  // 新增：教育场景
  education: `你是一个专业的教学助手，善于查找学习资源。

核心工具：
1. wikipedia_search - 基础知识查询
2. brave_search_web - 搜索学习资料
3. fetch_url - 获取教程内容
4. filesystem_write_file - 保存学习笔记

${ENHANCED_TOOL_CALLING_PROMPT}`
}
```

### 调整场景识别关键词

在 `selectBestPrompt()` 函数中添加：

```javascript
// 金融场景关键词
const financeKeywords = ['股票', '基金', '财报', '市值', 'stock', 'fund']
if (financeKeywords.some(keyword => allText.includes(keyword))) {
  return SCENARIO_PROMPTS.finance
}
```

## 📈 效果预期

实施这套系统后，你应该能看到：

1. **工具调用准确率提升** - 从约60%提升到90%+
2. **更少的编造信息** - AI会优先调用工具而不是猜测
3. **更好的工具选择** - 自动选择最稳定的工具（如brave_search优于search_web）
4. **参数格式错误减少** - 通过Few-shot示例学习正确格式
5. **持续自我优化** - 系统会记录成功模式并自动应用

## 🐛 故障排除

### 问题1：AI还是不调用工具

**原因**：可能是模型本身不支持Function Calling或System Prompt被用户覆盖

**解决**：
- 检查模型是否支持Function Calling
- 检查用户是否设置了自定义System Prompt
- 查看日志确认Prompt是否正确注入

### 问题2：工具调用成功率低

**原因**：可能是工具本身不稳定或参数格式要求严格

**解决**：
```bash
# 查看详细统计
curl http://localhost:3001/api/chat/tool-stats?toolName=YOUR_TOOL

# 查看成功示例
# 返回的 successPatterns 会显示成功的参数格式
```

### 问题3：优化建议太多

**原因**：历史数据积累过多

**解决**：
```bash
# 清空历史重新开始
curl -X POST http://localhost:3001/api/chat/clear-tool-history
```

## 🎯 总结

这套系统的核心优势：

1. **无需训练模型** - 完全通过Prompt Engineering实现
2. **自适应学习** - 根据实际使用情况持续优化
3. **用户友好** - 用户无需关心底层实现，系统自动优化
4. **可视化反馈** - 通过API端点随时查看优化效果
5. **灵活扩展** - 可轻松添加新场景和新工具

关键文件：
- `src/lib/promptTemplates.js` - Prompt模板系统
- `server/services/tool-call-optimizer.cjs` - 工具调用优化器
- `server/routes/chat.cjs` - 集成点

祝你的AI系统工具调用越来越智能！🚀
