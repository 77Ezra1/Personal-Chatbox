# Agent任务执行报告显示位置说明

## 📍 报告显示位置

Agent任务执行完成后，报告显示在 **AgentTaskExecutor弹窗** 中的**绿色成功框**内。

---

## 🖼️ 界面布局

```
┌─────────────────────────────────────────────────────┐
│  ⚡ 执行任务 - 获取天气                              │
│  Run tasks using your AI agent's capabilities       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  任务描述：                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ 查一下广州今天的天气                          │ │
│  └───────────────────────────────────────────────┘ │
│                                                      │
│  [▶ 执行任务]  或  [■ 停止执行]  或  [↻ 重试]     │
│                                                      │
│  进度: ████████████████████████████ 100%            │
│                                                      │
│  ✓ 已完成  |  Task: b1603038  |  0.15秒            │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ✓ 任务执行成功                               │  │
│  │                                               │  │
│  │  ← 这里显示 result.summary 的内容             │  │
│  │                                               │  │
│  │  **任务完成报告**                            │  │
│  │  任务概述：获取广州市的实时天气数据...        │  │
│  │                                               │  │
│  │  子任务执行详情：                            │  │
│  │  1. 获取广州天气数据 - 已完成                │  │
│  │  2. 分析天气状况 - 已完成                    │  │
│  │                                               │  │
│  │  Tokens: prompt_tokens=123, total_tokens=456  │  │
│  │                                               │  │
│  │  [查看原始JSON]  ← 点击查看完整result对象    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  [子任务 2] | [日志 15]                      │  │
│  ├──────────────────────────────────────────────┤  │
│  │  1 ✓ 获取广州天气数据                       │  │
│  │  2 ✓ 分析天气状况                           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📊 数据流向

### 后端生成报告

**文件**: [agentEngine.cjs:1489-1521](server/services/agentEngine.cjs#L1489-L1521)

```javascript
async generateFinalResult(subtaskResults, agent) {
  // ... 调用AI生成报告

  return {
    summary: finalResponse?.content || '',  // ← 这是显示的主要内容
    usage: finalResponse?.usage || null,     // ← Token统计
    model: finalResponse?.model || model,    // ← 使用的模型
    subtaskResults,                          // ← 子任务结果
    completedAt: new Date().toISOString(),
    totalSubtasks: subtaskResults.length,
    successfulSubtasks: ...
  };
}
```

### 前端接收和显示

**文件**: [AgentTaskExecutor.jsx:574-583](src/components/agents/AgentTaskExecutor.jsx#L574-L583)

```javascript
// 1. 提取summary字段
const displayResult = useMemo(() => {
  if (!result) return null
  if (typeof result === 'string') return result
  if (typeof result.summary === 'string') return result.summary  // ← 关键行
  try {
    return JSON.stringify(result.summary || result)
  } catch {
    return String(result)
  }
}, [result])
```

**文件**: [AgentTaskExecutor.jsx:709-743](src/components/agents/AgentTaskExecutor.jsx#L709-L743)

```jsx
// 2. 在绿色成功框中显示
{displayResult && status === TaskStatus.COMPLETED && (
  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
    <CheckCircle2 className="size-5 text-green-600" />
    <h4 className="font-semibold text-green-900">
      任务执行成功
    </h4>
    <p className="text-sm whitespace-pre-wrap">
      {displayResult}  {/* ← 这里显示 result.summary */}
    </p>
    {usageSummary && (
      <p className="text-xs">Tokens: {usageSummary}</p>
    )}
    <Button onClick={() => setShowRawResult(prev => !prev)}>
      查看原始JSON  {/* ← 点击可查看完整result对象 */}
    </Button>
  </div>
)}
```

---

## 🔍 显示内容说明

### 1. 主要显示内容（summary字段）

**来源**: `result.summary`
**格式**: Markdown格式的文本
**内容**: AI生成的任务完成报告，包括：
- 任务概述
- 子任务执行详情
- 分析结果
- 建议或结论

**示例**:
```
**任务完成报告**

**任务概述**
本任务旨在获取广州市的实时天气数据，并基于获取的数据进行天气状况分析。

### **子任务执行详情**

1. **获取广州天气数据**
   - 状态: 已完成
   - 结果: 温度25°C，天气晴朗

2. **分析天气状况**
   - 状态: 已完成
   - 分析: 天气适宜出行，建议携带防晒用品
```

### 2. Token使用统计

**来源**: `result.usage`
**显示**: 在报告下方的小字
**格式**: `prompt_tokens=123, completion_tokens=456, total_tokens=579`

### 3. 原始JSON数据（可选显示）

**触发**: 点击"查看原始JSON"按钮
**内容**: 完整的 `result` 对象，包括：
```json
{
  "summary": "任务完成报告...",
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  },
  "model": "deepseek-chat",
  "subtaskResults": [...],
  "completedAt": "2025-01-28T...",
  "totalSubtasks": 4,
  "successfulSubtasks": 4
}
```

---

## 🎯 如何查看完整报告

### 方法1：在执行窗口查看

1. 打开Agents页面
2. 选择一个Agent
3. 点击"执行任务"按钮
4. 输入任务描述
5. 点击"执行任务"
6. 等待任务完成
7. 在**绿色成功框**中查看报告

### 方法2：查看历史记录

1. 打开Agents页面
2. 选择一个Agent
3. 点击"执行历史"标签
4. 点击某个历史任务
5. 在详情中查看报告

---

## 🐛 常见问题

### Q1: 为什么报告显示为空？

**可能原因**:
- ❌ `generateFinalResult` 使用了错误的模型（如未配置的gpt-4o-mini）
- ❌ API调用失败，返回了mock响应
- ❌ `result.summary` 字段缺失

**解决方法**:
- ✅ 确保Agent配置的模型有对应的API密钥
- ✅ 检查 `result` 对象中是否有 `summary` 字段
- ✅ 查看日志中的错误信息

### Q2: 报告显示乱码或JSON字符串？

**可能原因**:
- ❌ `summary` 是JSON对象而不是字符串
- ❌ 前端解析逻辑错误

**解决方法**:
- ✅ 确保后端返回 `summary` 为字符串类型
- ✅ 点击"查看原始JSON"检查数据结构

### Q3: 报告显示 "Unexpected token '甲'"？

**原因**:
- ❌ **已修复**！这是 `generateFinalResult` 硬编码模型的bug

**解决方法**:
- ✅ 重启服务器应用修复
- ✅ 确保使用最新的 [agentEngine.cjs](server/services/agentEngine.cjs)

---

## 📝 总结

### 显示位置
- **主位置**: AgentTaskExecutor弹窗 → 绿色成功框
- **字段**: `result.summary`
- **格式**: Markdown文本

### 数据来源
- **生成器**: `agentEngine.generateFinalResult()`
- **AI模型**: Agent配置的模型（如deepseek-chat）
- **内容**: AI根据子任务结果生成的综合报告

### 查看方式
1. 实时查看：任务执行窗口
2. 历史查看：执行历史列表
3. 原始数据：点击"查看原始JSON"按钮

---

**最后更新**: 2025-01-28
**相关文件**:
- 前端: [AgentTaskExecutor.jsx](src/components/agents/AgentTaskExecutor.jsx)
- 后端: [agentEngine.cjs](server/services/agentEngine.cjs)
