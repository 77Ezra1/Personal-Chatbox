# 工作流 Agent 集成

**日期**: 2025-10-26
**需求**: 优化工作流模式，确保 Agent 可以被工作流调用
**状态**: ✅ 已完成

---

## 📋 需求背景

用户要求："优化工作流模式，确保Agent可以被工作流调用"

**期望行为**：
- 工作流中可以添加 Agent 节点
- Agent 节点可以执行已配置的 AI Agent
- 工作流可以将数据传递给 Agent
- Agent 执行结果可以传递给下一个节点

---

## 🔧 实现方案

### 方案概述

在工作流引擎中添加新的 `agent` 节点类型，支持调用 AgentEngine 执行 AI Agent 任务。

### 节点配置

```javascript
{
  type: 'agent',
  config: {
    agentId: '123',           // Agent ID
    taskDescription: '分析数据',  // 任务描述
    timeout: 300000            // 超时时间（毫秒）
  }
}
```

---

## 💻 代码实现

### 1. 添加 Agent 节点类型

**文件**: [server/services/workflowEngine.cjs:636-646](server/services/workflowEngine.cjs#L636-L646)

在 `loadNodeTypes()` 方法中添加 agent 节点定义：

```javascript
agent: {
  name: 'Agent 执行',
  icon: '🤖',
  inputs: ['data'],
  outputs: ['result'],
  config: {
    agentId: '',
    taskDescription: '',
    timeout: 300000 // 5分钟默认超时
  }
}
```

**字段说明**：
- `name`: 节点显示名称
- `icon`: 节点图标
- `inputs`: 输入端口列表
- `outputs`: 输出端口列表
- `config.agentId`: 要执行的 Agent ID（必需）
- `config.taskDescription`: 任务描述模板（必需）
- `config.timeout`: 任务执行超时时间（可选，默认5分钟）

### 2. 添加 Agent 执行分支

**文件**: [server/services/workflowEngine.cjs:183-185](server/services/workflowEngine.cjs#L183-L185)

在 `executeNode()` 的 switch 语句中添加 agent case：

```javascript
case 'agent':
  result = await this.executeAgent(node, inputData, executionId);
  break;
```

### 3. 实现 executeAgent 方法

**文件**: [server/services/workflowEngine.cjs:366-410](server/services/workflowEngine.cjs#L366-L410)

```javascript
/**
 * 执行 Agent 节点
 * @param {Object} node - 节点定义
 * @param {Object} inputData - 输入数据
 * @param {string} executionId - 执行ID
 */
async executeAgent(node, inputData, executionId) {
  const { agentId, taskDescription, timeout } = node.config;

  // 验证配置
  if (!agentId) {
    throw new Error('Agent 节点必须配置 Agent ID');
  }

  if (!taskDescription) {
    throw new Error('Agent 节点必须配置任务描述');
  }

  // 获取执行上下文以获取 userId
  const execution = this.executions.get(executionId);
  if (!execution) {
    throw new Error('无法找到工作流执行上下文');
  }

  const userId = execution.userId;

  // 导入 Agent Engine
  const agentEngine = require('./agentEngine.cjs');

  // 将输入数据转换为任务描述的上下文
  const taskWithContext = typeof inputData === 'string'
    ? `${taskDescription}\n\n上下文数据：${inputData}`
    : `${taskDescription}\n\n上下文数据：${JSON.stringify(inputData, null, 2)}`;

  // 创建 Agent 任务数据
  const taskData = {
    name: `工作流任务：${taskDescription}`,
    description: taskWithContext,
    timeout: timeout || 300000 // 默认5分钟
  };

  // 执行 Agent 任务
  const result = await agentEngine.executeTask(agentId, taskData, userId);

  return result;
}
```

**逻辑流程**：

1. **配置验证**
   - 检查 agentId 是否配置
   - 检查 taskDescription 是否配置

2. **获取用户上下文**
   - 从 executions Map 获取执行上下文
   - 提取 userId 用于 Agent 执行

3. **数据转换**
   - 将工作流输入数据格式化为任务上下文
   - 支持字符串和对象两种数据类型
   - 使用 JSON.stringify 格式化对象数据

4. **调用 AgentEngine**
   - 创建任务数据对象
   - 调用 `agentEngine.executeTask(agentId, taskData, userId)`
   - 等待 Agent 执行完成

5. **返回结果**
   - 将 Agent 执行结果传递给下一个节点

---

## 🎯 使用示例

### 示例 1：数据分析工作流

```javascript
{
  "name": "数据分析工作流",
  "definition": {
    "nodes": [
      {
        "id": "start1",
        "type": "start",
        "config": {}
      },
      {
        "id": "agent1",
        "type": "agent",
        "config": {
          "agentId": "data-analyst-001",
          "taskDescription": "分析以下数据并生成报告",
          "timeout": 600000 // 10分钟
        }
      },
      {
        "id": "end1",
        "type": "end",
        "config": {}
      }
    ],
    "connections": [
      { "sourceNodeId": "start1", "targetNodeId": "agent1" },
      { "sourceNodeId": "agent1", "targetNodeId": "end1" }
    ]
  }
}
```

**执行流程**：
1. 工作流启动，接收输入数据（如 CSV 数据）
2. Agent 节点执行，调用 `data-analyst-001` Agent
3. Agent 分析数据并生成报告
4. 结果传递到结束节点

### 示例 2：多 Agent 协作工作流

```javascript
{
  "name": "文章创作工作流",
  "definition": {
    "nodes": [
      {
        "id": "start1",
        "type": "start",
        "config": {}
      },
      {
        "id": "agent1",
        "type": "agent",
        "config": {
          "agentId": "researcher-001",
          "taskDescription": "研究以下主题并收集资料"
        }
      },
      {
        "id": "agent2",
        "type": "agent",
        "config": {
          "agentId": "writer-001",
          "taskDescription": "基于研究资料撰写文章"
        }
      },
      {
        "id": "agent3",
        "type": "agent",
        "config": {
          "agentId": "editor-001",
          "taskDescription": "编辑和润色文章"
        }
      },
      {
        "id": "end1",
        "type": "end",
        "config": {}
      }
    ],
    "connections": [
      { "sourceNodeId": "start1", "targetNodeId": "agent1" },
      { "sourceNodeId": "agent1", "targetNodeId": "agent2" },
      { "sourceNodeId": "agent2", "targetNodeId": "agent3" },
      { "sourceNodeId": "agent3", "targetNodeId": "end1" }
    ]
  }
}
```

**执行流程**：
1. 输入文章主题
2. Researcher Agent 收集资料
3. Writer Agent 撰写文章
4. Editor Agent 编辑润色
5. 输出最终文章

### 示例 3：混合节点工作流

```javascript
{
  "name": "智能数据处理",
  "definition": {
    "nodes": [
      {
        "id": "start1",
        "type": "start",
        "config": {}
      },
      {
        "id": "transform1",
        "type": "data_transform",
        "config": {
          "transformType": "json_parse"
        }
      },
      {
        "id": "agent1",
        "type": "agent",
        "config": {
          "agentId": "data-processor-001",
          "taskDescription": "处理和清洗数据"
        }
      },
      {
        "id": "condition1",
        "type": "condition",
        "config": {
          "condition": "data.valid === true"
        }
      },
      {
        "id": "agent2",
        "type": "agent",
        "config": {
          "agentId": "data-validator-001",
          "taskDescription": "验证处理后的数据"
        }
      },
      {
        "id": "end1",
        "type": "end",
        "config": {}
      }
    ],
    "connections": [
      { "sourceNodeId": "start1", "targetNodeId": "transform1" },
      { "sourceNodeId": "transform1", "targetNodeId": "agent1" },
      { "sourceNodeId": "agent1", "targetNodeId": "condition1" },
      { "sourceNodeId": "condition1", "targetNodeId": "agent2" },
      { "sourceNodeId": "agent2", "targetNodeId": "end1" }
    ]
  }
}
```

---

## 📊 数据流转

### 输入数据格式

工作流可以传递任意数据给 Agent 节点：

```javascript
// 字符串数据
"分析这段文本：这是一个示例"

// 对象数据
{
  "type": "csv",
  "content": "name,age,city\nJohn,25,NYC\nJane,30,LA",
  "columns": ["name", "age", "city"]
}

// 数组数据
[
  { "id": 1, "value": 100 },
  { "id": 2, "value": 200 }
]
```

### 上下文组装

Agent 节点会将输入数据附加到任务描述中：

```
任务描述模板：分析以下数据并生成报告

上下文数据：{
  "type": "csv",
  "content": "name,age,city\nJohn,25,NYC\nJane,30,LA"
}
```

### 输出数据格式

Agent 执行结果会作为节点输出，传递给下一个节点：

```javascript
{
  "status": "completed",
  "result": "数据分析完成。共有2条记录...",
  "data": {
    "totalRecords": 2,
    "averageAge": 27.5,
    "cities": ["NYC", "LA"]
  }
}
```

---

## 🔄 与现有节点对比

| 节点类型 | 功能 | 输入 | 输出 | 使用场景 |
|---------|------|------|------|---------|
| `start` | 开始 | 工作流输入 | 原始数据 | 工作流入口 |
| `ai_analysis` | AI分析 | 数据 + 提示词 | AI响应 | 简单AI任务 |
| `agent` | Agent执行 | 数据 + Agent配置 | Agent结果 | 复杂AI任务 |
| `data_transform` | 数据转换 | 原始数据 | 转换后数据 | 数据格式化 |
| `condition` | 条件判断 | 数据 + 条件 | 布尔值 | 流程分支 |
| `api_call` | API调用 | 数据 + URL | API响应 | 外部服务集成 |
| `end` | 结束 | 最终数据 | - | 工作流出口 |

### AI Analysis vs Agent 节点

| 对比项 | AI Analysis | Agent |
|--------|-------------|-------|
| **复杂度** | 简单 | 复杂 |
| **功能** | 单次 AI 调用 | 多步骤任务执行 |
| **工具使用** | 不支持 | 支持 MCP 工具 |
| **任务分解** | 不支持 | 自动分解 |
| **状态跟踪** | 简单 | 详细（数据库记录） |
| **适用场景** | 文本生成、分类、摘要 | 数据分析、研究、自动化 |

**建议**：
- 简单 AI 任务（如文本分类、摘要）使用 `ai_analysis`
- 复杂 AI 任务（如数据分析、研究、多步骤操作）使用 `agent`

---

## ⚠️ 注意事项

### 1. Agent 必须已创建

使用 Agent 节点前，必须先在 Agent 管理页面创建 Agent：

```javascript
// ❌ 错误：Agent 不存在
{
  "agentId": "non-existent-agent",
  "taskDescription": "执行任务"
}

// ✅ 正确：使用已创建的 Agent
{
  "agentId": "data-analyst-001",  // 已在 Agent 页面创建
  "taskDescription": "分析数据"
}
```

### 2. 任务描述必须清晰

任务描述应该简洁明确，说明 Agent 需要做什么：

```javascript
// ❌ 不好的任务描述
{
  "taskDescription": "处理数据"
}

// ✅ 好的任务描述
{
  "taskDescription": "分析CSV数据，计算平均值和标准差，并生成可视化报告"
}
```

### 3. 超时设置

根据任务复杂度设置合理的超时时间：

```javascript
// 简单任务：1-5 分钟
{ "timeout": 300000 }  // 5分钟

// 复杂任务：5-15 分钟
{ "timeout": 900000 }  // 15分钟

// 超长任务：15-30 分钟
{ "timeout": 1800000 }  // 30分钟
```

### 4. 错误处理

Agent 执行失败会抛出异常，导致工作流执行失败：

```javascript
try {
  result = await this.executeAgent(node, inputData, executionId);
} catch (error) {
  // 工作流会标记为 failed 状态
  throw error;
}
```

**建议**：在工作流中添加条件节点处理失败情况。

---

## 🚀 部署说明

### 代码修改

1. **添加节点类型** - `loadNodeTypes()` ✅
2. **添加执行分支** - `executeNode()` ✅
3. **实现执行方法** - `executeAgent()` ✅
4. **服务器重启** - ✅ 已完成

### 验证步骤

1. 创建一个测试 Agent
2. 创建一个包含 Agent 节点的工作流
3. 执行工作流并查看结果
4. 检查执行日志和错误信息

---

## 📈 性能考虑

### 1. 并发控制

AgentEngine 内部有并发控制机制：

```javascript
// agentEngine.cjs
acquireExecutionSlot(agent) {
  // 限制并发执行数量
  // 默认：每个 Agent 最多 3 个并发任务
}
```

**影响**：多个工作流同时调用同一个 Agent 时，会排队执行。

### 2. 资源管理

Agent 执行会消耗以下资源：
- CPU（AI 模型推理）
- 内存（上下文数据存储）
- 网络（API 调用、MCP 工具）
- 数据库（执行记录）

**建议**：
- 合理设置超时时间
- 限制同时运行的工作流数量
- 监控系统资源使用情况

### 3. 日志和监控

工作流执行会记录详细日志：

```javascript
// 节点执行记录
{
  executionId: 'xxx',
  nodeId: 'agent1',
  status: 'completed',
  inputData: {...},
  outputData: {...},
  durationMs: 15000
}
```

可以通过日志分析：
- 节点执行时间
- 失败率和错误类型
- 数据流转情况

---

## 🔄 未来改进

### 1. 可视化工作流编辑器

前端添加拖拽式工作流编辑器：
- 拖拽添加 Agent 节点
- 可视化连接节点
- 实时预览数据流

### 2. Agent 选择器

在节点配置中添加 Agent 选择下拉框：

```jsx
<Select value={agentId} onChange={setAgentId}>
  {agents.map(agent => (
    <Option key={agent.id} value={agent.id}>
      {agent.name}
    </Option>
  ))}
</Select>
```

### 3. 流式输出支持

支持 Agent 实时输出：

```javascript
// 流式执行
await executeAgent(node, inputData, executionId, {
  onProgress: (chunk) => {
    // 实时推送进度到前端
    sseManager.send(userId, 'workflow_progress', chunk);
  }
});
```

### 4. 批量执行

支持一次执行多个 Agent：

```javascript
{
  "type": "agent_batch",
  "config": {
    "agents": [
      { "agentId": "agent1", "taskDescription": "任务1" },
      { "agentId": "agent2", "taskDescription": "任务2" }
    ],
    "parallel": true  // 并行或串行执行
  }
}
```

---

## 📝 相关文档

- [AGENT_TOOL_FILTER_OPTIMIZATION.md](AGENT_TOOL_FILTER_OPTIMIZATION.md) - Agent 工具过滤优化
- [MCP_AUTO_ENABLE_ALL_SERVICES.md](MCP_AUTO_ENABLE_ALL_SERVICES.md) - MCP 服务默认启用
- [MCP_FRONTEND_AUTH_FIX.md](MCP_FRONTEND_AUTH_FIX.md) - 前端认证修复
- [MCP_AGENT_COMPATIBILITY_FIX.md](MCP_AGENT_COMPATIBILITY_FIX.md) - Agent 兼容性修复

---

**修改时间**: 2025-10-26
**修改者**: Claude Code Assistant
**测试状态**: ✅ 服务器启动成功，等待用户测试
**影响用户**: 所有使用工作流功能的用户

---

## ✅ 完成确认

- [x] 添加 agent 节点类型定义
- [x] 实现 executeAgent 方法
- [x] 支持 userId 传递
- [x] 支持数据上下文组装
- [x] 服务器重启成功
- [x] 生成文档
- [ ] 前端工作流编辑器支持（待实现）
- [ ] 用户验证功能（待用户测试）

