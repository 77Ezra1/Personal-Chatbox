# AI Agent 功能使用指南

## 概述

AI Agent 是一个智能任务执行系统，可以将复杂任务分解为多个子任务，并自动执行这些子任务以完成目标。

## 功能特性

### 1. Agent 管理
- 创建和配置多个 AI Agent
- 每个 Agent 可以有不同的能力和工具
- 支持自定义系统提示词和配置

### 2. 任务执行
- 自动任务分解
- 子任务并行/串行执行
- 进度跟踪和实时日志
- 错误处理和重试机制

### 3. 工具集成
- Web 搜索
- 文件操作（读取、写入）
- 数据处理和转换
- AI 分析
- 数据验证

## 数据库表结构

已创建以下表：

- `agents` - Agent 配置
- `agent_tasks` - 任务记录
- `agent_subtasks` - 子任务记录
- `agent_executions` - 执行历史
- `agent_tools` - 工具注册表

## API 端点

### Agent 管理

```bash
# 获取 Agent 列表
GET /api/agents

# 获取单个 Agent
GET /api/agents/:id

# 创建 Agent
POST /api/agents
{
  "name": "研究助手",
  "description": "专业的学术研究助手",
  "systemPrompt": "你是一个专业的学术研究助手...",
  "capabilities": ["research", "analysis", "writing"],
  "tools": ["web_search", "ai_analysis", "write_file"],
  "config": {
    "maxConcurrentTasks": 3,
    "stopOnError": false,
    "retryAttempts": 2
  }
}

# 更新 Agent
PUT /api/agents/:id

# 删除 Agent
DELETE /api/agents/:id
```

### 任务执行

```bash
# 执行任务
POST /api/agents/:id/execute
{
  "taskData": {
    "title": "研究人工智能的最新发展",
    "description": "收集并分析2024年AI领域的重要进展",
    "inputData": {}
  }
}

# 停止执行
POST /api/agents/:id/stop

# 获取执行进度
GET /api/agents/:id/progress

# 获取任务列表
GET /api/agents/:id/tasks

# 获取执行历史
GET /api/agents/:id/executions
```

## 前端使用

### 1. 访问 Agent 页面

在应用中导航到 `/agents` 路由即可访问 Agent 管理页面。

### 2. 创建 Agent

1. 点击"Create Agent"按钮
2. 填写基本信息（名称、描述、类型）
3. 选择能力（Capabilities）
4. 配置工具（Tools）
5. 设置高级选项（模型、温度、系统提示词等）
6. 保存

### 3. 执行任务

1. 在 Agent 列表中点击"Execute Task"
2. 输入任务描述
3. 点击"Execute Task"开始执行
4. 查看进度、子任务和日志
5. 等待任务完成或手动停止

## 组件架构

### 后端服务

1. **AgentEngine** (`server/services/agentEngine.cjs`)
   - Agent 核心引擎
   - 负责任务执行和管理

2. **TaskDecomposer** (`server/services/taskDecomposer.cjs`)
   - 任务分解器
   - 使用 AI 将复杂任务分解为子任务

3. **AIService** (`server/services/aiService.cjs`)
   - AI 服务接口
   - 支持 OpenAI、DeepSeek 等

4. **Agent Routes** (`server/routes/agents.cjs`)
   - API 路由处理

### 前端组件

1. **AgentsPage** (`src/pages/AgentsPage.jsx`)
   - Agent 管理主页面

2. **AgentList** (`src/components/agents/AgentList.jsx`)
   - Agent 列表展示
   - 支持搜索、过滤、排序

3. **AgentCard** (`src/components/agents/AgentCard.jsx`)
   - 单个 Agent 卡片
   - 显示状态、能力、统计信息

4. **AgentEditor** (`src/components/agents/AgentEditor.jsx`)
   - Agent 创建/编辑对话框
   - 多标签页配置界面

5. **AgentTaskExecutor** (`src/components/agents/AgentTaskExecutor.jsx`)
   - 任务执行界面
   - 实时进度和日志显示

## 配置说明

### API 密钥配置（重要！）

**无需修改配置文件！** 所有API密钥配置都在前端界面完成：

1. 打开设置页面（点击右上角⚙️图标）
2. 选择 **"API Keys"** 标签页
3. 配置您的 OpenAI 或 DeepSeek API 密钥
4. 启用加密保护（推荐）
5. 保存配置

Agent会自动使用您配置的API密钥！

详细说明：[AI_AGENT_CONFIG_GUIDE.md](AI_AGENT_CONFIG_GUIDE.md)

### Agent 配置选项

```javascript
{
  name: string,                    // Agent 名称
  description: string,             // 描述
  systemPrompt: string,            // 系统提示词
  capabilities: string[],          // 能力列表
  tools: string[],                 // 工具列表
  config: {
    maxConcurrentTasks: number,    // 最大并发任务数（默认3）
    stopOnError: boolean,          // 遇错停止（默认false）
    retryAttempts: number,         // 重试次数（默认2）
    model: string,                 // AI 模型
    temperature: number,           // 温度参数（0-2）
    maxTokens: number             // 最大 token 数
  }
}
```

### 可用能力（Capabilities）

- `research` - 研究调查
- `analysis` - 数据分析
- `writing` - 内容写作
- `data_processing` - 数据处理
- `coding` - 代码生成
- 或自定义能力

### 可用工具（Tools）

- `web_search` - 网络搜索
- `read_file` - 读取文件
- `write_file` - 写入文件
- `validate_data` - 数据验证
- `ai_analysis` - AI 分析
- `data_transform` - 数据转换

## 示例用例

### 1. 研究助手 Agent

```json
{
  "name": "学术研究助手",
  "description": "帮助进行文献调研和数据分析",
  "systemPrompt": "你是一个专业的学术研究助手。请帮助用户进行文献调研、数据分析和报告撰写。",
  "capabilities": ["research", "analysis", "writing"],
  "tools": ["web_search", "ai_analysis", "write_file"],
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "maxConcurrentTasks": 3
  }
}
```

**任务示例**：
```
研究"大语言模型在医疗诊断中的应用"这个主题，
收集最新文献，分析研究现状，并生成一份综述报告。
```

### 2. 数据分析师 Agent

```json
{
  "name": "数据分析师",
  "description": "专业的数据处理和分析",
  "systemPrompt": "你是一个数据分析专家。请帮助用户处理数据、生成统计分析和可视化建议。",
  "capabilities": ["data_analysis", "statistics", "visualization"],
  "tools": ["read_file", "data_transform", "ai_analysis", "write_file"],
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "maxConcurrentTasks": 2
  }
}
```

**任务示例**：
```
读取 sales_data.csv 文件，
进行销售趋势分析，
生成包含统计结果和可视化建议的报告。
```

### 3. 内容创作者 Agent

```json
{
  "name": "内容创作者",
  "description": "创意文案和内容策划",
  "systemPrompt": "你是一个专业的内容创作者。请帮助用户创作高质量的文案和内容。",
  "capabilities": ["writing", "creativity", "marketing", "seo"],
  "tools": ["ai_analysis", "web_search", "write_file"],
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.8,
    "maxConcurrentTasks": 4
  }
}
```

**任务示例**：
```
为我们的新产品"智能手表X1"创作一份营销文案，
包括产品介绍、卖点提炼和社交媒体推广方案。
```

## 注意事项

1. **API 配置**：确保在 `.env` 文件中配置了 OpenAI 或其他 AI 服务的 API 密钥

2. **数据库迁移**：Agent 功能需要运行数据库迁移 `009-add-agent-support.sql`

3. **认证要求**：所有 Agent API 需要有效的认证 token

4. **性能考虑**：
   - 复杂任务可能需要较长执行时间
   - 建议合理设置 `maxConcurrentTasks`
   - 注意 API 调用限制

5. **错误处理**：
   - 任务失败会记录详细错误信息
   - 可以配置自动重试
   - 支持手动停止执行

## 开发计划

- [ ] 添加 WebSocket 支持实时进度更新
- [ ] 增强工具系统，支持自定义工具
- [ ] 添加 Agent 模板市场
- [ ] 支持 Agent 协作（多 Agent 系统）
- [ ] 添加更多内置工具
- [ ] 优化任务分解算法
- [ ] 添加任务调度和定时执行
- [ ] 支持工作流编排

## 故障排除

### 问题：Agent 创建失败

**解决方案**：
1. 检查数据库连接
2. 确认迁移已执行
3. 验证输入数据格式

### 问题：任务执行超时

**解决方案**：
1. 检查 AI API 配置
2. 简化任务描述
3. 增加超时时间限制

### 问题：子任务分解失败

**解决方案**：
1. 检查 AI 服务是否可用
2. 提供更清晰的任务描述
3. 查看日志了解具体错误

## 技术支持

如有问题，请查看：
- 服务器日志：`/tmp/backend.log`
- 浏览器控制台
- 数据库记录：`agent_executions` 表

## 更新日志

### v1.0.0 (2025-10-17)
- 初始版本发布
- 支持基本的 Agent 管理
- 任务执行和分解
- 内置 7 种工具
- 前端完整界面
