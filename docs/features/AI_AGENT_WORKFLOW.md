# AI Agent 工作流程详解

## 📊 整体架构流程图

```mermaid
graph TB
    subgraph "前端层 Frontend"
        A[用户界面] --> B[AgentsPage]
        B --> C[AgentList]
        B --> D[AgentEditor]
        B --> E[AgentTaskExecutor]
    end
    
    subgraph "API层 REST API"
        F[/api/agents]
        G[/api/agents/:id/execute]
        H[/api/agents/:id/progress]
    end
    
    subgraph "服务层 Services"
        I[AgentEngine]
        J[TaskDecomposer]
        K[AIService]
        L[AgentExecutionQueue]
    end
    
    subgraph "数据层 Database"
        M[(agents)]
        N[(agent_tasks)]
        O[(agent_subtasks)]
        P[(agent_executions)]
        Q[(agent_tools)]
    end
    
    subgraph "外部服务 External"
        R[OpenAI API]
        S[DeepSeek API]
    end
    
    A -->|创建/编辑 Agent| F
    A -->|执行任务| G
    A -->|查询进度| H
    
    F --> I
    G --> I
    H --> I
    
    I -->|任务分解| J
    J -->|AI分析| K
    K --> R
    K --> S
    
    I -->|队列管理| L
    I -->|数据持久化| M
    I -->|数据持久化| N
    I -->|数据持久化| O
    I -->|数据持久化| P
    I -->|工具调用| Q
    
    E -->|轮询进度| H
    
    style A fill:#e1f5ff
    style I fill:#fff4e6
    style M fill:#f3e5f5
    style R fill:#e8f5e9
```

---

## 🔄 核心流程详解

### 1️⃣ Agent 创建流程

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant UI as 🎨 AgentEditor
    participant API as 🌐 API /agents
    participant Engine as ⚙️ AgentEngine
    participant DB as 💾 Database
    
    User->>UI: 填写 Agent 配置
    Note over UI: - 名称、描述<br/>- 能力选择<br/>- 工具选择<br/>- 系统提示词
    
    UI->>UI: 表单验证 (Zod Schema)
    
    UI->>API: POST /api/agents
    Note over API: 携带 JWT Token
    
    API->>API: 认证中间件验证
    
    API->>Engine: createAgent(userId, agentData)
    
    Engine->>Engine: 生成 UUID
    Engine->>Engine: 构建 Agent 对象
    Note over Engine: {<br/>  id, userId, name,<br/>  capabilities, tools,<br/>  systemPrompt, config<br/>}
    
    Engine->>DB: INSERT INTO agents
    DB-->>Engine: ✅ 插入成功
    
    Engine-->>API: 返回 Agent 对象
    API-->>UI: 200 OK + Agent 数据
    
    UI->>UI: 更新本地状态
    UI->>User: 🎉 显示成功提示
```

---

### 2️⃣ 任务执行流程（核心）

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant Executor as 🎯 AgentTaskExecutor
    participant API as 🌐 API /execute
    participant Engine as ⚙️ AgentEngine
    participant Queue as 📦 ExecutionQueue
    participant Decomposer as 🧩 TaskDecomposer
    participant AI as 🤖 AI Service
    participant DB as 💾 Database
    
    User->>Executor: 输入任务标题和描述
    Executor->>API: POST /agents/:id/execute
    
    API->>Engine: startTaskExecution()
    
    Engine->>Engine: prepareExecution()
    Note over Engine: 检查并发槽位
    
    Engine->>DB: INSERT agent_tasks
    DB-->>Engine: taskId
    
    Engine->>DB: INSERT agent_executions
    Note over DB: status='queued'
    DB-->>Engine: executionId
    
    Engine->>Queue: enqueue(job)
    Queue-->>API: 202 Accepted
    API-->>Executor: executionId, taskId
    
    Executor->>Executor: 启动进度轮询
    loop 每2秒轮询
        Executor->>API: GET /agents/:id/progress
        API->>DB: 查询最新状态
        DB-->>API: progress, status, currentStep
        API-->>Executor: 进度数据
        Executor->>Executor: 更新 UI
    end
    
    Queue->>Engine: processTaskExecution()
    
    Engine->>DB: UPDATE status='running'
    
    Engine->>Decomposer: decomposeTask(task, agent)
    
    Decomposer->>AI: 生成任务分解 Prompt
    Note over AI: "将任务分解为子任务<br/>根据 Agent 能力和工具"
    
    AI->>AI: 调用 OpenAI/DeepSeek
    AI-->>Decomposer: JSON 子任务数组
    
    Decomposer->>Decomposer: 验证依赖关系
    Decomposer->>Decomposer: 拓扑排序优化顺序
    
    Decomposer->>DB: INSERT agent_subtasks
    
    Decomposer-->>Engine: subtasks[]
    
    loop 执行每个子任务
        Engine->>Engine: executeSubtask()
        
        alt 子任务类型: AI分析
            Engine->>AI: 调用 AI 分析
            AI-->>Engine: 分析结果
        else 子任务类型: 数据处理
            Engine->>Engine: 本地数据处理
        else 子任务类型: Web搜索
            Engine->>Engine: 调用搜索工具
        else 子任务类型: 文件操作
            Engine->>Engine: 读写文件
        end
        
        Engine->>DB: UPDATE subtask status='completed'
        Engine->>DB: UPDATE execution progress
    end
    
    Engine->>Engine: generateFinalResult()
    
    Engine->>DB: UPDATE task status='completed'
    Engine->>DB: UPDATE execution status='completed'
    
    Executor->>API: GET /agents/:id/progress
    API-->>Executor: status='completed', progress=1.0
    
    Executor->>API: GET /agents/:id/tasks/:taskId/subtasks
    API-->>Executor: 子任务列表
    
    Executor->>Executor: 显示完成状态
    Executor->>User: 🎉 任务完成！
```

---

### 3️⃣ 任务分解详细流程

```mermaid
flowchart TD
    Start([接收任务]) --> A{AI 可用?}
    
    A -->|是| B[构建分解 Prompt]
    A -->|否| Z[生成默认子任务]
    
    B --> C[调用 AI API]
    C --> D{响应成功?}
    
    D -->|是| E[解析 JSON 响应]
    D -->|否| Z
    
    E --> F{JSON 有效?}
    F -->|否| G[尝试提取 JSON]
    F -->|是| H[创建子任务对象]
    
    G --> H
    G -->|失败| Z
    
    H --> I[依赖关系验证]
    
    I --> J{依赖有效?}
    J -->|否| Error([抛出错误])
    J -->|是| K[拓扑排序]
    
    K --> L[优化执行顺序]
    
    Z --> L
    
    L --> M[持久化到数据库]
    M --> End([返回子任务列表])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style Error fill:#ffcdd2
    style B fill:#fff9c4
    style K fill:#f3e5f5
```

---

### 4️⃣ 并发控制机制

```mermaid
stateDiagram-v2
    [*] --> Idle: Agent 创建
    
    Idle --> CheckingSlot: 收到执行请求
    
    CheckingSlot --> Queued: 槽位已满
    CheckingSlot --> Running: 槽位可用
    
    Queued --> Running: 前序任务完成
    
    Running --> SubtaskExec: 开始执行子任务
    
    SubtaskExec --> SubtaskExec: 处理下一个子任务
    
    SubtaskExec --> Completed: 所有子任务成功
    SubtaskExec --> Failed: 子任务失败
    SubtaskExec --> Cancelled: 用户停止
    
    Completed --> Idle: 释放槽位
    Failed --> Idle: 释放槽位
    Cancelled --> Idle: 释放槽位
    
    note right of CheckingSlot
        acquireExecutionSlot()
        检查并发数量
        maxConcurrentTasks
    end note
    
    note right of Running
        executionManager.set()
        active++
    end note
    
    note right of Idle
        releaseSlot()
        active--
    end note
```

---

### 5️⃣ 数据流转图

```mermaid
graph LR
    subgraph "用户输入"
        A[任务标题]
        B[任务描述]
        C[输入数据]
    end
    
    subgraph "任务分解"
        D[AI 分析]
        E[生成子任务]
        F[依赖排序]
    end
    
    subgraph "子任务执行"
        G[子任务1: 研究]
        H[子任务2: 分析]
        I[子任务3: 生成]
    end
    
    subgraph "结果汇总"
        J[收集结果]
        K[生成报告]
        L[最终输出]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    
    F --> G
    G --> H
    H --> I
    
    G --> J
    H --> J
    I --> J
    
    J --> K
    K --> L
    
    style A fill:#e3f2fd
    style D fill:#fff3e0
    style G fill:#f3e5f5
    style J fill:#e8f5e9
    style L fill:#c8e6c9
```

---

### 6️⃣ 前端组件交互图

```mermaid
graph TB
    subgraph "AgentsPage 主页面"
        A[状态管理]
        A1[agents: Agent[]]
        A2[loading: boolean]
        A3[dialogs: Object]
        
        A --> A1
        A --> A2
        A --> A3
    end
    
    subgraph "AgentList 列表组件"
        B[搜索过滤]
        B1[searchQuery]
        B2[statusFilter]
        B3[sortBy]
        
        B --> B1
        B --> B2
        B --> B3
        
        C[视图切换]
        C1[Grid View]
        C2[List View]
        
        C --> C1
        C --> C2
    end
    
    subgraph "AgentCard 卡片组件"
        D[Agent 信息]
        D1[名称/描述]
        D2[状态徽章]
        D3[能力标签]
        D4[统计数据]
        
        D --> D1
        D --> D2
        D --> D3
        D --> D4
        
        E[操作菜单]
        E1[执行]
        E2[编辑]
        E3[删除]
        
        E --> E1
        E --> E2
        E --> E3
    end
    
    subgraph "AgentEditor 编辑器"
        F[表单验证]
        F1[React Hook Form]
        F2[Zod Schema]
        
        F --> F1
        F --> F2
        
        G[配置标签页]
        G1[基本信息]
        G2[能力选择]
        G3[高级配置]
        
        G --> G1
        G --> G2
        G --> G3
    end
    
    subgraph "AgentTaskExecutor 执行器"
        H[任务控制]
        H1[开始按钮]
        H2[停止按钮]
        H3[重试按钮]
        
        H --> H1
        H --> H2
        H --> H3
        
        I[实时显示]
        I1[进度条]
        I2[子任务列表]
        I3[执行日志]
        I4[结果展示]
        
        I --> I1
        I --> I2
        I --> I3
        I --> I4
    end
    
    A --> B
    B --> D
    E1 --> I
    E2 --> G
    
    style A fill:#e1f5ff
    style B fill:#f3e5f5
    style D fill:#fff9c4
    style F fill:#e8f5e9
    style H fill:#ffecb3
    style I fill:#c8e6c9
```

---

### 7️⃣ 错误处理流程

```mermaid
flowchart TD
    Start([任务执行开始]) --> Try{执行}
    
    Try -->|成功| Success[更新状态 completed]
    Try -->|失败| Catch[捕获错误]
    
    Catch --> CheckType{错误类型?}
    
    CheckType -->|取消| Cancel[status='cancelled']
    CheckType -->|网络错误| Network[记录网络错误]
    CheckType -->|AI错误| AI[回退默认分解]
    CheckType -->|其他| General[记录通用错误]
    
    Cancel --> UpdateDB1[更新 execution]
    Network --> Retry{重试次数<max?}
    AI --> Fallback[使用默认子任务]
    General --> UpdateDB2[更新错误信息]
    
    Retry -->|是| Delay[延迟后重试]
    Retry -->|否| Failed[status='failed']
    
    Delay --> Try
    
    Fallback --> Try
    
    UpdateDB1 --> Release[释放槽位]
    UpdateDB2 --> Release
    Failed --> Release
    Success --> Release
    
    Release --> Notify[通知前端]
    Notify --> End([结束])
    
    style Start fill:#e1f5ff
    style Success fill:#c8e6c9
    style Catch fill:#ffecb3
    style Failed fill:#ffcdd2
    style Cancel fill:#fff9c4
    style End fill:#b2dfdb
```

---

## 🎯 关键技术要点

### 1. 并发控制
```javascript
// 槽位管理
acquireExecutionSlot(agent) {
  const maxConcurrent = agent.config.maxConcurrentTasks || 3;
  const entry = this.executionManager.get(agent.id) || { active: 0 };
  
  if (entry.active >= maxConcurrent) {
    throw new Error('并发上限');
  }
  
  entry.active += 1;
  return () => { entry.active -= 1; }; // 释放函数
}
```

### 2. 任务分解
```javascript
// AI 驱动的任务分解
async decomposeTask(task, agent) {
  const prompt = `
    任务: ${task.title}
    能力: ${agent.capabilities}
    工具: ${agent.tools}
    
    请生成子任务列表 JSON
  `;
  
  const response = await aiService.generateResponse(prompt);
  const subtasks = parseJsonResponse(response);
  
  // 验证依赖 + 拓扑排序
  validateDependencies(subtasks);
  return optimizeExecutionOrder(subtasks);
}
```

### 3. 进度跟踪
```javascript
// 前端轮询
useEffect(() => {
  if (status === 'running') {
    const interval = setInterval(async () => {
      const progress = await fetchProgress(executionId);
      setProgress(progress.progress);
      setCurrentStep(progress.currentStep);
      
      if (progress.status === 'completed') {
        clearInterval(interval);
        loadSubtasks();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }
}, [status]);
```

### 4. 数据持久化
```javascript
// 执行记录完整保存
await db.run(`
  INSERT INTO agent_executions (
    id, agent_id, task_id, user_id,
    status, progress, current_step,
    started_at, completed_at, duration_ms
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
```

---

## 📝 使用示例

### 创建一个研究 Agent
```javascript
const researchAgent = {
  name: "Research Assistant",
  description: "帮助进行信息研究和分析",
  capabilities: ["research", "analysis", "writing"],
  tools: ["web_search", "read_file"],
  config: {
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: "你是一个专业的研究助手...",
    maxConcurrentTasks: 2
  }
};
```

### 执行任务
```javascript
const task = {
  title: "分析竞品特性",
  description: "研究市场上前3名竞品的核心功能",
  inputData: {
    competitors: ["Product A", "Product B", "Product C"]
  }
};

const result = await executeTask(agentId, task);
```

---

## 🔧 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 任务一直 queued | 并发槽位已满 | 等待或增加 maxConcurrentTasks |
| AI 分解失败 | API 密钥未配置 | 检查 .env 配置，或使用默认分解 |
| 进度不更新 | 前端轮询停止 | 检查网络连接，重新执行 |
| 子任务失败 | 工具调用错误 | 查看执行日志，检查工具配置 |

---

## 📚 相关文档
- [API 文档](./agent-implementation.md)
- [数据库设计](../../server/migrations/009-add-agent-support.sql)
- [组件文档](./agent-summary.md)

---

*最后更新: 2025-10-23*
