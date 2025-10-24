# AI Agent 与 MCP Services 集成 - 可视化流程

## 📊 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户界面层                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ AgentsPage   │────────▶│ AgentEditor  │                     │
│  │              │         │              │                     │
│  │ - 代理列表    │         │ - 基本信息    │                     │
│  │ - 创建/编辑   │         │ - 能力选择    │                     │
│  │ - 执行任务    │         │ - 工具选择 ⭐ │                     │
│  │              │         │ - 高级配置    │                     │
│  └──────────────┘         └──────┬───────┘                     │
│                                  │                             │
│                                  │ useMcpTools()               │
│                                  ▼                             │
│                          ┌───────────────┐                     │
│                          │  MCP 工具选择  │                     │
│                          ├───────────────┤                     │
│                          │ - 工具列表     │                     │
│                          │ - 智能分类     │                     │
│                          │ - 搜索筛选     │                     │
│                          │ - 选中管理     │                     │
│                          └───────┬───────┘                     │
│                                  │                             │
└──────────────────────────────────┼─────────────────────────────┘
                                   │
                                   │ GET /api/mcp/tools
                                   │ GET /api/mcp/services
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          后端服务层                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ MCP Router   │────────▶│ MCP Manager  │                     │
│  │              │         │              │                     │
│  │ /mcp/tools   │         │ - 服务管理    │                     │
│  │ /mcp/call    │         │ - 工具注册    │                     │
│  │              │         │ - 工具调用    │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                             │
│         │                        │ callTool()                  │
│         │                        ▼                             │
│         │                ┌───────────────┐                     │
│         │                │ MCP Services  │                     │
│         │                ├───────────────┤                     │
│         │                │ - Wikipedia   │                     │
│         │                │ - Filesystem  │                     │
│         │                │ - Playwright  │                     │
│         │                │ - Memory      │                     │
│         │                │ - ...         │                     │
│         │                └───────────────┘                     │
│         │                                                      │
│         │ POST /api/mcp/call                                   │
│         ▼                                                      │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │Agent Router  │────────▶│Agent Engine  │                     │
│  │              │         │              │                     │
│  │/agents/exec  │         │ - 任务管理    │                     │
│  │              │         │ - 工具执行 ⭐ │                     │
│  └──────────────┘         └──────┬───────┘                     │
│                                  │                             │
│                                  │ executeToolCall()           │
│                                  ▼                             │
│                          ┌───────────────┐                     │
│                          │Task Decomposer│                     │
│                          │               │                     │
│                          │ - AI 分解任务  │                     │
│                          │ - 生成子任务   │                     │
│                          │ - 选择工具 ⭐  │                     │
│                          └───────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 完整调用流程

### 阶段 1: 创建 Agent 并选择工具

```
┌─────────────┐
│   用户操作    │ 点击"创建新代理"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AgentEditor 加载                    │
│  - 初始化表单                         │
│  - 调用 useMcpTools()                │
└──────┬──────────────────────────────┘
       │
       │ GET /api/mcp/services
       │ GET /api/mcp/tools
       ▼
┌─────────────────────────────────────┐
│  后端返回数据                         │
│  - services: [wikipedia, ...]       │
│  - tools: [{name, desc, params}, ...]│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  useMcpTools 处理数据                 │
│  - 过滤已启用服务                      │
│  - 智能分类工具                        │
│  - 生成扁平列表                        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  UI 渲染工具选择器                     │
│  - 按类别分组显示                      │
│  - 用户选择工具                        │
│  - 底部显示 Badges                    │
└──────┬──────────────────────────────┘
       │
       │ 用户点击"创建代理"
       ▼
┌─────────────────────────────────────┐
│  保存 Agent                          │
│  POST /api/agents                   │
│  {                                  │
│    name: "研究助手",                  │
│    config: {                        │
│      tools: [                       │
│        "wikipedia_findPage",        │
│        "filesystem_write_file"      │
│      ]                              │
│    }                                │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  数据库存储                           │
│  agents 表                           │
│  - id: 1                            │
│  - name: "研究助手"                   │
│  - config: JSON(tools: [...])       │
└─────────────────────────────────────┘
```

---

### 阶段 2: 执行任务 - 任务分解

```
┌─────────────┐
│   用户操作    │ 点击"执行任务"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  用户输入任务信息                      │
│  - 标题: "研究人工智能历史"            │
│  - 描述: "查找并总结资料"              │
└──────┬──────────────────────────────┘
       │
       │ POST /api/agents/1/execute
       ▼
┌─────────────────────────────────────┐
│  Agent Engine 加载 Agent             │
│  - 读取数据库                         │
│  - agent.tools = [                  │
│      "wikipedia_findPage",          │
│      "filesystem_write_file"        │
│    ]                                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Task Decomposer 分解任务            │
│  - 构建上下文                         │
│    {                                │
│      agent: {                       │
│        tools: [...],        ⭐      │
│        capabilities: [...]          │
│      },                             │
│      task: { title, desc }          │
│    }                                │
│  - 生成 AI 提示词                     │
│  - 指导使用 agent.tools ⭐           │
└──────┬──────────────────────────────┘
       │
       │ 调用 AI 服务
       ▼
┌─────────────────────────────────────┐
│  AI 生成子任务                        │
│  [                                  │
│    {                                │
│      title: "搜索维基百科",           │
│      type: "tool_call",             │
│      config: {                      │
│        toolName: "wikipedia_findPage",│
│        parameters: { query: "AI" }  │
│      }                              │
│    },                               │
│    {                                │
│      title: "保存结果",               │
│      type: "tool_call",             │
│      config: {                      │
│        toolName: "filesystem_write_file",│
│        parameters: { path: "..." } │
│      }                              │
│    }                                │
│  ]                                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  保存子任务到数据库                    │
│  - subtask 1: wikipedia_findPage    │
│  - subtask 2: filesystem_write_file │
└─────────────────────────────────────┘
```

---

### 阶段 3: 执行任务 - 工具调用

```
┌─────────────────────────────────────┐
│  Agent Engine 执行子任务 1            │
│  - type: "tool_call"                │
│  - toolName: "wikipedia_findPage"   │
│  - parameters: { query: "AI" }      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  executeToolCall() 方法               │
│  1. 检查 toolName.includes('_')      │
│     ✓ "wikipedia_findPage" 包含 '_'  │
│  2. 判断为 MCP 工具 ⭐                │
│  3. 调用 callMcpTool()               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  callMcpTool() 方法                   │
│  - 构建 HTTP 请求                     │
│  - URL: /api/mcp/call                │
│  - Body: {                          │
│      toolName: "wikipedia_findPage",│
│      parameters: { query: "AI" }    │
│    }                                │
│  - Timeout: 30 秒                    │
└──────┬──────────────────────────────┘
       │
       │ axios.post()
       ▼
┌─────────────────────────────────────┐
│  MCP Router 接收请求                  │
│  - 解析 toolName                     │
│    serviceId = "wikipedia"          │
│    actualToolName = "findPage"      │
│  - 调用 mcpManager.callTool()       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  MCP Manager 处理                     │
│  - 找到 Wikipedia MCP 服务进程        │
│  - 构建 JSON-RPC 请求                 │
│  {                                  │
│    jsonrpc: "2.0",                  │
│    method: "tools/call",            │
│    params: {                        │
│      name: "findPage",              │
│      arguments: { query: "AI" }     │
│    }                                │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ 发送到 MCP 服务进程
       ▼
┌─────────────────────────────────────┐
│  Wikipedia MCP 服务                   │
│  - 接收 JSON-RPC 请求                 │
│  - 执行 findPage 工具                 │
│  - 搜索 Wikipedia API                │
│  - 返回搜索结果                        │
│  {                                  │
│    pages: [                         │
│      { title: "AI", id: 123 },      │
│      ...                            │
│    ]                                │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ 返回结果
       ▼
┌─────────────────────────────────────┐
│  MCP Manager 格式化结果               │
│  - 解析 JSON-RPC 响应                 │
│  - 返回给 MCP Router                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  MCP Router 返回 HTTP 响应            │
│  {                                  │
│    success: true,                   │
│    content: "{...}",                │
│    serviceId: "wikipedia",          │
│    actualToolName: "findPage"       │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ HTTP 响应
       ▼
┌─────────────────────────────────────┐
│  callMcpTool() 接收响应               │
│  - 格式化返回结果                      │
│  return {                           │
│    type: "mcp_tool_call",           │
│    toolName: "wikipedia_findPage",  │
│    result: "{...}",                 │
│    serviceId: "wikipedia",          │
│    actualToolName: "findPage",      │
│    timestamp: "2025-01-15T..."      │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  executeToolCall() 返回结果           │
│  - 保存子任务结果到数据库               │
│  - 更新子任务状态: completed           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Agent Engine 继续执行                │
│  - 执行子任务 2                        │
│  - 执行子任务 3                        │
│  - ...                              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  任务完成                             │
│  - 更新任务状态: completed            │
│  - 通知用户                           │
└─────────────────────────────────────┘
```

---

## 🔀 错误处理流程

### 场景 1: MCP 服务未启用

```
executeToolCall()
  ↓
callMcpTool()
  ↓
POST /api/mcp/call
  ↓
MCP Manager: Service "xxx" not found
  ↓
返回 { success: false, error: "..." }
  ↓
callMcpTool() 抛出错误
  ↓
executeToolCall() catch 错误
  ↓
console.warn("MCP 工具调用失败")
  ↓
尝试本地工具 toolRegistry.get(toolName)
  ↓
如果本地工具存在 → 执行本地工具
如果不存在 → 抛出错误
```

### 场景 2: MCP 工具调用超时

```
callMcpTool()
  ↓
axios.post(..., { timeout: 30000 })
  ↓
等待 30 秒
  ↓
超时！抛出 AxiosError
  ↓
callMcpTool() catch 错误
  ↓
throw new Error("MCP 工具调用失败: timeout")
  ↓
executeToolCall() catch 错误
  ↓
尝试本地工具（如果有）
```

### 场景 3: 工具参数错误

```
MCP 服务接收请求
  ↓
验证参数
  ↓
参数不符合 schema
  ↓
返回错误响应
  ↓
MCP Router 返回 { success: false, error: "..." }
  ↓
callMcpTool() 抛出错误
  ↓
executeToolCall() catch 错误
  ↓
记录到子任务: status = failed
  ↓
继续执行其他子任务
```

---

## 📊 数据结构图

### Agent 数据结构

```javascript
{
  id: 1,
  name: "研究助手",
  description: "帮助搜索和整理资料",
  type: "task-based",
  capabilities: ["research", "writing"],
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4000,
    tools: [                    // ⭐ MCP 工具列表
      "wikipedia_findPage",
      "wikipedia_getPage",
      "filesystem_write_file"
    ]
  },
  status: "active",
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z"
}
```

### 子任务数据结构

```javascript
{
  id: "subtask_1",
  executionId: "exec_123",
  title: "搜索维基百科",
  description: "查找关于 AI 的页面",
  type: "tool_call",           // ⭐ 工具调用类型
  config: {
    toolName: "wikipedia_findPage",  // ⭐ MCP 工具名称
    parameters: {                    // ⭐ 工具参数
      query: "Artificial Intelligence"
    }
  },
  status: "completed",
  result: {                    // ⭐ MCP 工具返回结果
    type: "mcp_tool_call",
    toolName: "wikipedia_findPage",
    result: "{\"pages\":[...]}",
    serviceId: "wikipedia",
    actualToolName: "findPage",
    timestamp: "2025-01-15T10:30:05Z"
  },
  dependencies: [],
  priority: 1,
  createdAt: "2025-01-15T10:30:00Z",
  completedAt: "2025-01-15T10:30:05Z"
}
```

### MCP 工具定义

```javascript
{
  value: "wikipedia_findPage",        // 工具 ID
  label: "Search for Wikipedia pages", // 工具描述
  serviceId: "wikipedia",             // 所属服务
  toolName: "findPage",               // 工具名称
  description: "Search for Wikipedia pages matching the query",
  parameters: {                       // 工具参数 schema
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      }
    },
    required: ["query"]
  }
}
```

---

## 🎯 关键决策点

### 1. 工具识别逻辑

```
是否包含下划线 '_' ?
  ├─ YES → MCP 工具
  │        (例如: wikipedia_findPage)
  │        ↓
  │        尝试调用 MCP API
  │        ↓
  │        成功 → 返回结果
  │        失败 → 尝试本地工具
  │
  └─ NO  → 本地工具
           (例如: web_search)
           ↓
           从 toolRegistry 获取
           ↓
           执行本地工具
```

### 2. 任务分解策略

```
Task Decomposer 收到任务
  ↓
构建上下文
  ├─ agent.tools (MCP 工具列表) ⭐
  ├─ agent.capabilities
  ├─ task.description
  └─ task.inputData
  ↓
生成 AI 提示词
  ├─ "请优先使用 agent.tools 中的工具" ⭐
  ├─ "MCP 工具格式: serviceId_toolName"
  └─ "在 config 中指定 toolName 和 parameters"
  ↓
调用 AI 服务
  ↓
AI 生成子任务 (包含正确的 toolName)
  ↓
返回子任务列表
```

### 3. 错误处理策略

```
工具调用开始
  ↓
try {
  识别工具类型
  ↓
  if (MCP 工具) {
    调用 MCP API ⭐
  }
}
catch (error) {
  ├─ 记录错误日志
  ├─ 尝试本地工具
  └─ if (本地工具不存在) {
       抛出错误
     }
}
```

---

## 🎨 UI 交互流程

### 工具选择交互

```
用户打开 Agent 编辑器
  ↓
┌─────────────────────────────┐
│ 工具选择区域                  │
│ ┌─────────────────────────┐ │
│ │ 工具    [MCP Services ✓]│ │  ← 开关
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [搜索和检索 (3)]         │ │  ← 类别标题
│ │ ┌─────────────────────┐ │ │
│ │ │ ○ wikipedia_findPage│ │ │  ← 工具（未选中）
│ │ │   Search for pages  │ │ │
│ │ └─────────────────────┘ │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ ● wikipedia_getPage │ │ │  ← 工具（已选中）
│ │ │   Get page content  │ │ │
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
│ ...                         │
│ ┌─────────────────────────┐ │
│ │ 已选工具:                │ │
│ │ [wikipedia_getPage ✕]  │ │  ← Badge (可点击移除)
│ └─────────────────────────┘ │
└─────────────────────────────┘

用户点击未选中的工具
  ↓
toggleTool(toolId) 调用
  ↓
更新 form.watch('config.tools')
  ↓
UI 重新渲染
  ├─ 工具按钮变为选中状态 (● + 高亮)
  └─ 底部添加 Badge

用户点击 Badge 上的 ✕
  ↓
toggleTool(toolId) 调用
  ↓
从 config.tools 中移除
  ↓
UI 重新渲染
  ├─ 工具按钮变为未选中状态 (○)
  └─ Badge 消失
```

---

## 📈 性能优化流程

### 1. 工具列表缓存

```
useMcpTools() 初次调用
  ↓
发起 API 请求
  ↓
接收数据
  ↓
保存到 state
  ├─ tools
  ├─ services
  └─ lastFetch (时间戳)
  ↓
1 分钟内再次调用
  ↓
检查 lastFetch
  ↓
使用缓存数据 (不发起新请求)
```

### 2. 并行工具调用

```
Agent Engine 执行任务
  ↓
分析子任务依赖关系
  ↓
找到无依赖的子任务
  ├─ subtask_1 (wikipedia_findPage)
  ├─ subtask_2 (brave_search)
  └─ subtask_3 (filesystem_read_file)
  ↓
Promise.all([
  executeToolCall(subtask_1),
  executeToolCall(subtask_2),
  executeToolCall(subtask_3)
])
  ↓
3 个工具同时调用 ⭐
  ↓
等待所有完成
  ↓
继续执行有依赖的子任务
```

---

**📝 说明**: 本文档展示了 AI Agent 与 MCP Services 集成的完整可视化流程，包括架构图、调用流程、错误处理、数据结构和 UI 交互等。

