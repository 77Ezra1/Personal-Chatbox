# AI Agent 与 MCP Services 集成 - 技术实现详解

## 📋 实现概览

本文档详细说明了如何实现 AI Agents 与 MCP Services 的完整集成，使 Agent 能够真正调用 MCP 工具执行任务。

---

## 🔄 完整调用流程

```
用户创建 Agent 并选择 MCP 工具
         ↓
保存到数据库 (agent.config.tools)
         ↓
用户给 Agent 分配任务
         ↓
Task Decomposer 分解任务
         ↓
根据 agent.tools 生成子任务 (type: tool_call)
         ↓
Agent Engine 执行子任务
         ↓
检测到 MCP 工具 (serviceId_toolName)
         ↓
调用 /api/mcp/call 执行 MCP 工具
         ↓
MCP Manager 路由到对应服务
         ↓
MCP 服务执行工具并返回结果
         ↓
Agent 继续处理后续任务
```

---

## 🛠️ 核心技术实现

### 1. 前端组件

#### 1.1 `useMcpTools` Hook

**文件**: `src/hooks/useMcpTools.js`

**功能**:
- 从 `/api/mcp/services` 获取已启用的服务列表
- 从 `/api/mcp/tools` 获取所有可用工具
- 智能分类工具（搜索、文件、数据、API等）
- 提供多种数据视图（扁平列表、按服务分组、按类别分组）

**数据结构**:

```javascript
// 工具对象格式
{
  value: 'wikipedia_findPage',           // 工具ID（用于Agent配置）
  label: 'Search for Wikipedia pages',   // 工具描述
  serviceId: 'wikipedia',                // 所属服务
  toolName: 'findPage',                  // 工具名称
  description: 'Search for...',          // 详细描述
  parameters: { /* ... */ }              // 工具参数定义
}

// 分类结构
{
  search: {
    name: '搜索和检索',
    tools: [...]
  },
  file: {
    name: '文件操作',
    tools: [...]
  },
  // ...
}
```

**智能分类算法**:

```javascript
// 基于工具名称和描述的关键词匹配
if (toolName.includes('search') || desc.includes('搜索')) {
  → 搜索和检索
} else if (toolName.includes('file') || desc.includes('文件')) {
  → 文件操作
} else if (toolName.includes('data') || toolName.includes('transform')) {
  → 数据处理
}
// ... 其他分类规则
```

#### 1.2 `AgentEditor` 组件更新

**文件**: `src/components/agents/AgentEditor.jsx`

**新增功能**:
- MCP 工具开关（可切换显示 MCP 工具或静态工具）
- 滚动工具列表（最大 300px 高度）
- 按类别分组显示
- 已选工具 Badges
- 工具选择/取消交互

**关键代码片段**:

```jsx
// 加载 MCP 工具
const { flatTools, toolsByCategory, loading: mcpToolsLoading } = useMcpTools()

// 工具列表渲染
<ScrollArea className="h-[300px]">
  {Object.entries(toolsByCategory).map(([category, { name, tools }]) => (
    <div key={category}>
      <div>{name} ({tools.length})</div>
      {tools.map(tool => (
        <Button onClick={() => toggleTool(tool.value)}>
          {tool.toolName}
        </Button>
      ))}
    </div>
  ))}
</ScrollArea>

// 已选工具展示
{selectedTools.map(toolId => (
  <Badge>
    {toolName}
    <X onClick={() => toggleTool(toolId)} />
  </Badge>
))}
```

**数据保存**:

Agent 保存时，选中的工具 ID 会存储到 `agent.config.tools` 数组中：

```json
{
  "config": {
    "tools": [
      "wikipedia_findPage",
      "wikipedia_getPage",
      "filesystem_read_file",
      "playwright_navigate"
    ]
  }
}
```

---

### 2. 后端服务

#### 2.1 MCP API 端点

**文件**: `server/routes/mcp.cjs`

**已有 API**:

1. **GET /api/mcp/services**
   - 获取所有 MCP 服务列表
   - 包含系统内置和用户自定义服务

2. **GET /api/mcp/tools**
   - 获取所有已启用服务的工具列表
   - 返回格式化的工具定义

3. **POST /api/mcp/call**
   - 调用指定的 MCP 工具
   - 解析 `serviceId_toolName` 格式
   - 路由到对应的 MCP 服务
   - 返回执行结果

**API 调用示例**:

```javascript
// 请求
POST /api/mcp/call
{
  "toolName": "wikipedia_findPage",
  "parameters": {
    "query": "Artificial Intelligence"
  }
}

// 响应
{
  "success": true,
  "content": "{ ... Wikipedia search results ... }",
  "toolName": "wikipedia_findPage",
  "serviceId": "wikipedia",
  "actualToolName": "findPage"
}
```

#### 2.2 Agent Engine 更新

**文件**: `server/services/agentEngine.cjs`

**新增功能**: MCP 工具调用支持

**关键方法**:

##### `executeToolCall(subtask, agent)`

执行工具调用的主方法，更新后支持 MCP 工具：

```javascript
async executeToolCall(subtask, agent) {
  const { toolName, parameters } = subtask.config;

  // 1. 检查是否是 MCP 工具（包含下划线）
  if (toolName && toolName.includes('_')) {
    try {
      // 2. 尝试调用 MCP 工具
      const mcpResult = await this.callMcpTool(toolName, parameters);
      return mcpResult;
    } catch (mcpError) {
      // 3. 失败则回退到本地工具
      console.warn(`MCP 工具调用失败，尝试本地工具: ${toolName}`);
    }
  }

  // 4. 使用本地注册的工具（向后兼容）
  const tool = this.toolRegistry.get(toolName);
  if (!tool) {
    throw new Error(`工具不存在: ${toolName}`);
  }

  return await tool.execute(parameters, ...);
}
```

**设计亮点**:
- ✅ **渐进式失败**: MCP 工具失败后自动尝试本地工具
- ✅ **向后兼容**: 旧的 Agent 配置仍然可用
- ✅ **简单判断**: 通过工具名称格式区分 MCP 和本地工具

##### `callMcpTool(toolName, parameters)`

新增方法，专门处理 MCP 工具调用：

```javascript
async callMcpTool(toolName, parameters = {}) {
  const axios = require('axios');
  const config = require('../config.cjs');

  const baseURL = `http://localhost:${config.server.port}`;

  try {
    // 调用 MCP API
    const response = await axios.post(`${baseURL}/api/mcp/call`, {
      toolName,
      parameters
    }, {
      timeout: 30000 // 30 秒超时
    });

    if (response.data.success) {
      // 格式化返回结果
      return {
        type: 'mcp_tool_call',
        toolName,
        parameters,
        result: response.data.content,
        serviceId: response.data.serviceId,
        actualToolName: response.data.actualToolName,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data.error || 'MCP 工具调用失败');
    }
  } catch (error) {
    console.error('[AgentEngine] MCP 工具调用错误:', error.message);
    throw new Error(`MCP 工具调用失败: ${error.message}`);
  }
}
```

**返回格式**:

```javascript
{
  type: 'mcp_tool_call',
  toolName: 'wikipedia_findPage',
  parameters: { query: 'AI' },
  result: '{ ... }',  // MCP 工具返回的内容
  serviceId: 'wikipedia',
  actualToolName: 'findPage',
  timestamp: '2025-01-15T10:30:00.000Z'
}
```

#### 2.3 Task Decomposer 更新

**文件**: `server/services/taskDecomposer.cjs`

**更新内容**: 优化任务分解提示词，指导 AI 使用 MCP 工具

**关键更新**:

```javascript
const instructions = [
  // ... 原有指令 ...
  '- 如果需要调用工具，请优先使用 agent.tools 中已配置的 MCP 工具。',
  '- 对于 type: tool_call 的子任务，请在 config 中指定：',
  '  - toolName: 工具名称（从 agent.tools 列表中选择）',
  '  - parameters: 工具参数对象',
  '- MCP 工具格式为 serviceId_toolName，例如 wikipedia_findPage、filesystem_read_file。',
  '- 所有返回内容必须是有效的 JSON，禁止包含额外文本。'
];
```

**上下文数据**:

传递给 AI 的上下文包含：

```json
{
  "agent": {
    "id": 1,
    "name": "研究助手",
    "capabilities": ["research", "writing"],
    "tools": [
      "wikipedia_findPage",
      "wikipedia_getPage",
      "filesystem_write_file"
    ],
    "config": { ... }
  },
  "task": {
    "title": "研究人工智能历史",
    "description": "查找资料并总结",
    ...
  }
}
```

**AI 生成的子任务示例**:

```json
[
  {
    "title": "搜索维基百科",
    "type": "tool_call",
    "config": {
      "toolName": "wikipedia_findPage",
      "parameters": {
        "query": "Artificial Intelligence history"
      }
    },
    "dependencies": [],
    "priority": 1
  },
  {
    "title": "获取页面内容",
    "type": "tool_call",
    "config": {
      "toolName": "wikipedia_getPage",
      "parameters": {
        "title": "Artificial Intelligence"
      }
    },
    "dependencies": ["subtask_1"],
    "priority": 2
  },
  {
    "title": "保存研究结果",
    "type": "tool_call",
    "config": {
      "toolName": "filesystem_write_file",
      "parameters": {
        "path": "/research/ai-history.md",
        "content": "..."
      }
    },
    "dependencies": ["subtask_2"],
    "priority": 3
  }
]
```

---

## 🔗 数据流详解

### 创建 Agent 流程

```
1. 用户在 AgentEditor 中选择 MCP 工具
   ↓
2. 前端: useMcpTools 获取工具列表
   GET /api/mcp/tools
   ↓
3. 用户选择工具: wikipedia_findPage, filesystem_write_file
   ↓
4. 保存 Agent
   POST /api/agents
   Body: {
     tools: ["wikipedia_findPage", "filesystem_write_file"]
   }
   ↓
5. 数据库存储 agent 记录
   tools 字段: JSON 数组
```

### 执行任务流程

```
1. 用户给 Agent 分配任务
   POST /api/agents/:id/execute
   Body: {
     title: "研究人工智能",
     description: "查找并总结资料"
   }
   ↓
2. Agent Engine 加载 Agent 配置
   包括 tools: ["wikipedia_findPage", ...]
   ↓
3. Task Decomposer 分解任务
   - AI 收到 agent.tools 列表
   - 根据任务需求选择合适的工具
   - 生成子任务（包含 toolName 和 parameters）
   ↓
4. Agent Engine 执行子任务
   subtask.type === 'tool_call'
   subtask.config.toolName === 'wikipedia_findPage'
   ↓
5. executeToolCall 方法
   - 检测到 MCP 工具（包含下划线）
   - 调用 callMcpTool
   ↓
6. callMcpTool 发起 HTTP 请求
   POST http://localhost:3001/api/mcp/call
   Body: {
     toolName: "wikipedia_findPage",
     parameters: { query: "AI" }
   }
   ↓
7. MCP Router 处理请求
   - 解析 toolName: serviceId="wikipedia", toolName="findPage"
   - 调用 mcpManager.callTool("wikipedia", "findPage", params)
   ↓
8. MCP Manager 执行工具
   - 找到 Wikipedia MCP 服务进程
   - 发送 JSON-RPC 请求
   - 接收结果
   ↓
9. 返回结果层层传递
   MCP Service → MCP Manager → MCP Router → Agent Engine → 子任务结果
   ↓
10. Agent 继续执行下一个子任务
```

---

## 🧪 测试场景

### 测试用例 1: 创建研究 Agent

**步骤**:
1. 进入 AI Agents 页面
2. 点击"创建新代理"
3. 填写信息：
   - 名称: 研究助手
   - 类型: task-based
   - 能力: Research, Writing
4. 在"能力"标签页，确保 MCP Services 开关打开
5. 选择工具:
   - `wikipedia_findPage`
   - `wikipedia_getPage`
   - `filesystem_write_file`
6. 保存

**预期结果**:
- Agent 创建成功
- 数据库中 `agent.config.tools` 包含3个工具
- 重新打开编辑器，工具仍被选中

### 测试用例 2: 执行研究任务

**步骤**:
1. 选择刚创建的 "研究助手" Agent
2. 点击"执行任务"
3. 输入任务:
   - 标题: 研究人工智能历史
   - 描述: 查找维基百科资料并保存到文件
4. 开始执行

**预期结果**:
- 任务分解生成子任务（搜索、获取、保存）
- 子任务使用 MCP 工具 (toolName 包含 wikipedia_, filesystem_)
- 工具调用成功返回结果
- 最终任务完成

**验证点**:
- 查看任务执行日志
- 检查 Wikipedia 搜索是否成功
- 检查文件是否已保存
- 查看子任务状态（全部 completed）

### 测试用例 3: 向后兼容

**步骤**:
1. 创建 Agent 时关闭 MCP Services 开关
2. 选择静态工具: web_search, read_file
3. 保存并执行任务

**预期结果**:
- Agent 仍能正常执行
- 使用本地注册的工具
- 不调用 MCP API

### 测试用例 4: 混合工具

**步骤**:
1. 创建 Agent，选择:
   - MCP 工具: `wikipedia_findPage`
   - 静态工具: `web_search` (手动添加)
2. 执行任务

**预期结果**:
- MCP 工具通过 `/api/mcp/call` 调用
- 静态工具通过本地 toolRegistry 执行
- 两种工具都能正常工作

---

## 🐛 错误处理

### 1. MCP 服务未启用

**场景**: 用户选择的 MCP 工具对应的服务已被禁用

**处理**:
```javascript
try {
  const result = await mcpManager.callTool(serviceId, toolName, params);
} catch (error) {
  // MCP Manager 返回错误: "Service not found" 或 "Service not enabled"
  return {
    success: false,
    error: `MCP 服务 ${serviceId} 未启用或不存在`
  };
}
```

**建议**: 前端在选择工具时只显示已启用服务的工具

### 2. MCP 工具调用超时

**场景**: MCP 服务响应时间过长（>30秒）

**处理**:
```javascript
const response = await axios.post('/api/mcp/call', ..., {
  timeout: 30000
});
// 超时后自动抛出错误
```

**建议**: 为长时间运行的工具增加超时配置

### 3. 工具参数错误

**场景**: 传递给 MCP 工具的参数不符合要求

**处理**:
- MCP 服务返回参数错误
- Agent Engine 捕获错误并记录到子任务
- 子任务状态设置为 failed
- 继续执行其他子任务（如果配置允许）

**建议**: 在 taskDecomposer 提示词中强调参数验证

### 4. 工具不存在

**场景**: Agent 配置的工具在 MCP 中已被删除

**处理**:
```javascript
if (!tool && !toolName.includes('_')) {
  throw new Error(`工具不存在: ${toolName}`);
}
// MCP 工具交由 MCP Manager 验证
```

**建议**: 定期验证 Agent 配置的工具是否仍然可用

---

## 🚀 性能优化

### 1. 工具列表缓存

前端缓存工具列表，减少 API 调用：

```javascript
const [tools, setTools] = useState([])
const [lastFetch, setLastFetch] = useState(null)

useEffect(() => {
  if (!lastFetch || Date.now() - lastFetch > 60000) {
    // 超过 1 分钟才重新获取
    loadTools()
  }
}, [])
```

### 2. 并行工具调用

Task Decomposer 生成的并行子任务可以同时调用多个 MCP 工具：

```javascript
// Agent Engine 执行并行子任务
const parallelTasks = subtasks.filter(t => !t.dependencies.length);
const results = await Promise.all(
  parallelTasks.map(task => this.executeToolCall(task, agent))
);
```

### 3. 工具调用重试

对于临时失败的工具调用，自动重试：

```javascript
async callMcpTool(toolName, parameters, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await this._callMcpToolOnce(toolName, parameters);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1)); // 指数退避
    }
  }
}
```

---

## 📊 监控与日志

### 关键日志点

1. **前端**:
   - `[useMcpTools] Loading tools...`
   - `[useMcpTools] Loaded X tools from Y services`

2. **后端 - MCP Router**:
   - `调用工具: wikipedia_findPage`
   - `MCP工具调用成功: wikipedia_findPage`

3. **后端 - Agent Engine**:
   - `[AgentEngine] 执行工具调用: wikipedia_findPage`
   - `[AgentEngine] MCP 工具调用成功`
   - `[AgentEngine] MCP 工具调用失败，尝试本地工具`

4. **后端 - MCP Manager**:
   - `[MCPManager] Calling tool: wikipedia/findPage`
   - `[MCPManager] Tool result: {...}`

### 性能指标

建议监控：
- 工具调用成功率
- 工具调用平均响应时间
- MCP 服务可用性
- Agent 任务完成率

---

## 🔐 安全考虑

### 1. 工具权限控制

**建议**: 为用户自定义的 MCP 服务添加权限验证

```javascript
// 检查用户是否有权使用该 MCP 服务
const userConfig = await db.get(
  'SELECT * FROM user_mcp_configs WHERE user_id = ? AND mcp_id = ?',
  [userId, serviceId]
);

if (!userConfig || !userConfig.enabled) {
  throw new Error('无权使用该 MCP 服务');
}
```

### 2. 参数验证

**建议**: 在调用 MCP 工具前验证参数

```javascript
function validateToolParameters(toolName, parameters, schema) {
  // 根据工具的参数 schema 验证
  if (!schema.validate(parameters)) {
    throw new Error('工具参数不符合要求');
  }
}
```

### 3. 输出过滤

**建议**: 过滤 MCP 工具返回的敏感信息

```javascript
function sanitizeToolResult(result) {
  // 移除可能包含的密钥、密码等
  return result.replace(/api_key|password|token/gi, '[REDACTED]');
}
```

---

## 🎯 总结

### 已实现功能

✅ **前端**:
- MCP 工具选择器 (useMcpTools Hook)
- 按类别分组显示
- Agent Editor 集成
- 工具开关和 Badges

✅ **后端**:
- MCP 工具调用 API (/api/mcp/call)
- Agent Engine MCP 支持
- Task Decomposer 优化
- 错误处理和日志

✅ **集成**:
- 完整的数据流
- 向后兼容
- 错误处理
- 性能优化

### 测试清单

- [x] 创建 Agent 并选择 MCP 工具
- [x] 保存和加载 Agent 工具配置
- [x] 执行任务时调用 MCP 工具
- [x] MCP 工具调用失败后回退到本地工具
- [x] 静态工具仍然可用
- [x] 混合使用 MCP 和静态工具

### 后续增强

- [ ] 工具参数预填充和验证
- [ ] 工具调用可视化编排
- [ ] 批量工具操作
- [ ] 工具使用统计和分析
- [ ] 智能工具推荐（根据任务自动推荐工具）

---

**🎉 集成完成！AI Agents 现在可以使用真正的 MCP 工具执行任务了！**

