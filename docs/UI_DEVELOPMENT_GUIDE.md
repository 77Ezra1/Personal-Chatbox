# Personal Chatbox UI开发指南
## 基于v0.dev设计系统

---

## 目录

1. [设计系统概述](#设计系统概述)
2. [v0.dev设计原则](#v0dev设计原则)
3. [技术栈](#技术栈)
4. [组件开发规范](#组件开发规范)
5. [已完成组件详解](#已完成组件详解)
6. [待开发组件指南](#待开发组件指南)
7. [最佳实践](#最佳实践)
8. [常见模式](#常见模式)

---

## 设计系统概述

Personal Chatbox 使用基于 **v0.dev/shadcn/ui** 的现代化设计系统，强调：

- **一致性**: 所有组件遵循统一的视觉语言
- **可访问性**: WCAG 2.1 AA 标准，完整的ARIA支持
- **响应式**: 移动优先，适配所有设备尺寸
- **性能**: 优化的React组件，最小化重渲染
- **可定制**: 完全控制组件源代码

---

## v0.dev设计原则

### 1. 分层架构

所有组件采用双层架构：

```
┌─────────────────────────┐
│  视觉层 (Presentation)   │  ← Tailwind CSS样式
├─────────────────────────┤
│  逻辑层 (Primitive)      │  ← Radix UI功能组件
└─────────────────────────┘
```

### 2. 组件组合

使用组合模式而非配置：

```jsx
// ❌ 避免：过多的props配置
<Card variant="elevated" shadow="lg" padding="md" />

// ✅ 推荐：组合子组件
<Card className="shadow-lg p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### 3. Copy-Paste模式

不使用npm包安装组件，而是：
1. 从shadcn/ui复制组件代码到项目
2. 根据需求自定义
3. 完全掌控组件实现

### 4. 设计令牌

使用CSS变量定义设计令牌：

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --radius: 0.5rem;
}

.dark {
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... */
}
```

### 5. 响应式设计

移动优先的断点系统：

```jsx
className="
  flex flex-col          // 移动端：垂直布局
  sm:flex-row            // 小屏幕：水平布局
  md:grid md:grid-cols-2 // 中等屏幕：网格布局
  lg:grid-cols-3         // 大屏幕：3列网格
"
```

---

## 技术栈

### 核心库

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "tailwindcss": "^4.1.7",
  "@radix-ui/react-*": "latest"
}
```

### UI组件库

- **Radix UI**: 无样式、可访问的UI原语
- **Tailwind CSS**: 实用优先的CSS框架
- **class-variance-authority**: 类型安全的变体管理
- **tailwind-merge**: 智能的类名合并

### 表单处理

```json
{
  "react-hook-form": "^7.56.3",
  "@hookform/resolvers": "^5.0.1",
  "zod": "^3.24.4"
}
```

### 可视化

```json
{
  "reactflow": "^11.11.4",      // 工作流编辑器
  "recharts": "^2.15.3",        // 图表
  "lucide-react": "^0.510.0"    // 图标
}
```

---

## 组件开发规范

### 文件结构

```
src/
├── components/
│   ├── ui/                    # shadcn/ui基础组件
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   └── ...
│   ├── agents/                # Agent功能组件
│   │   ├── AgentCard.jsx
│   │   ├── AgentList.jsx
│   │   └── ...
│   └── workflows/             # 工作流组件
│       ├── WorkflowCard.jsx
│       └── ...
├── pages/                     # 页面组件
│   ├── AgentsPage.jsx
│   └── ...
├── hooks/                     # 自定义Hooks
│   ├── useAgents.js
│   └── ...
└── lib/                       # 工具函数
    ├── utils.js
    ├── apiClient.js
    └── ...
```

### 组件模板

```jsx
import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ComponentName - 组件描述
 *
 * @param {Object} props - 组件属性
 * @param {string} props.title - 标题
 * @param {Function} props.onClick - 点击处理
 * @param {string} props.className - 自定义类名
 */
export const ComponentName = memo(({
  title,
  onClick,
  className
}) => {
  return (
    <Card className={cn("base-classes", className)}>
      {/* 组件内容 */}
    </Card>
  )
})

ComponentName.displayName = 'ComponentName'
```

### 性能优化规范

```jsx
// 1. 使用 memo 包裹组件
export const MyComponent = memo(({ data }) => {
  // ...
})

// 2. 使用 useMemo 缓存计算结果
const filteredData = useMemo(() => {
  return data.filter(item => item.active)
}, [data])

// 3. 使用 useCallback 缓存回调函数
const handleClick = useCallback(() => {
  console.log('clicked')
}, [])

// 4. 避免内联对象/数组
// ❌ 避免
<Component style={{ margin: 10 }} />

// ✅ 推荐
const styles = { margin: 10 }
<Component style={styles} />
```

### 可访问性规范

```jsx
// 1. 语义化HTML
<button> instead of <div onClick>
<nav>, <main>, <aside> for layout

// 2. ARIA属性
<button aria-label="Close dialog">
  <X className="size-4" />
</button>

// 3. 键盘导航
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>

// 4. Focus管理
<Dialog
  initialFocus={cancelButtonRef}
  onClose={handleClose}
>
```

---

## 已完成组件详解

### Agent系统

#### 1. AgentCard - Agent卡片组件

**文件**: `/src/components/agents/AgentCard.jsx`

**设计规格**:

```
┌─────────────────────────────────────┐
│ ┌─┐  Agent Name          [⋮]        │ ← Header: Icon + Title + Menu
│ │🤖│  Description text...            │
│ └─┘                                  │
├─────────────────────────────────────┤
│ Status: [Active] [3 nodes]          │ ← Status badges
│                                      │
│ Capabilities:                        │ ← Capability tags
│ [Tag1] [Tag2] [Tag3] [+2 more]      │
│                                      │
│ ┌─────────┬─────────┐                │ ← Stats grid
│ │Total:100│Success  │                │
│ │         │Rate: 95%│                │
│ └─────────┴─────────┘                │
│ 🕐 Last run: 2025-10-16              │ ← Metadata
├─────────────────────────────────────┤
│ [Execute Task]                       │ ← Footer action
└─────────────────────────────────────┘
```

**关键特性**:
- 悬停效果：`hover:shadow-md hover:border-primary/50`
- 状态指示：彩色徽章系统
- 信息密度：合理分组，易于扫描
- 操作效率：下拉菜单整合次要操作

**代码示例**:

```jsx
<AgentCard
  agent={{
    id: '1',
    name: 'Code Analyzer',
    description: 'Analyzes code quality and suggests improvements',
    status: 'active',
    capabilities: ['Code Analysis', 'Linting', 'Security Scan'],
    successRate: 95,
    totalRuns: 100,
    lastRun: '2025-10-16T10:30:00Z'
  }}
  onExecute={(agent) => console.log('Execute', agent)}
  onEdit={(agent) => console.log('Edit', agent)}
  onDelete={(agent) => console.log('Delete', agent)}
/>
```

#### 2. AgentList - Agent列表管理

**文件**: `/src/components/agents/AgentList.jsx`

**功能矩阵**:

| 功能 | 描述 | 实现方式 |
|------|------|----------|
| 搜索 | 全文搜索名称、描述 | Input + useMemo过滤 |
| 状态筛选 | 按状态筛选 | Select组件 |
| 能力筛选 | 多选能力标签 | DropdownMenu + Checkbox |
| 排序 | 多种排序选项 | Select + Array.sort |
| 视图切换 | 网格/列表视图 | Toggle按钮 + CSS Grid/Flex |
| 空状态 | 无数据时的引导 | 专用EmptyState组件 |

**响应式设计**:

```jsx
// 网格视图 - 自适应列数
<div className="
  grid
  grid-cols-1          // 移动端：1列
  md:grid-cols-2       // 平板：2列
  lg:grid-cols-3       // 桌面：3列
  gap-4
">

// 搜索栏 - 自适应宽度
<div className="
  flex
  flex-col             // 移动端：垂直排列
  sm:flex-row          // 桌面：水平排列
  gap-3
">
```

#### 3. AgentEditor - Agent创建/编辑器

**文件**: `/src/components/agents/AgentEditor.jsx`

**表单架构**:

```
[Basic Info] [Capabilities] [Advanced]  ← Tabs导航
─────────────────────────────────────
│                                    │
│  📝 Basic Information              │
│  ┌─────────────────────────┐      │
│  │ Name: [____________]    │      │
│  │ Description: [______]   │      │
│  │ Type: [Dropdown▼]       │      │
│  └─────────────────────────┘      │
│                                    │
│  🎯 Capabilities                   │
│  Selected: [Tag1] [Tag2]           │
│  Available: [Button] [Button]      │
│                                    │
│  ⚙️ Advanced Settings               │
│  Model: [GPT-4▼]                   │
│  Temperature: [━━━○━━] 0.7         │
│  System Prompt: [Textarea]         │
│                                    │
│  [Auto Retry] ◉ On  ○ Off         │
│                                    │
└────────────────────────────────────┘
[Cancel] [Save]                       ← Footer
```

**表单验证**:

```javascript
const agentSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),

  description: z.string()
    .max(500, 'Description too long')
    .optional(),

  type: z.enum([
    'conversational',
    'task-based',
    'analytical',
    'creative'
  ]),

  capabilities: z.array(z.string())
    .min(1, 'At least one capability required'),

  config: z.object({
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(100).max(100000),
    // ...
  }).optional()
})
```

**交互设计**:

1. **能力选择**: 双向同步
   - 点击"Available"区域的按钮 → 添加到"Selected"
   - 点击"Selected"标签的×按钮 → 移除

2. **滑块控件**: 实时反馈
   ```jsx
   <FormLabel>Temperature: {field.value}</FormLabel>
   <input type="range" min="0" max="2" step="0.1" />
   ```

3. **条件显示**: 根据状态显示/隐藏字段
   ```jsx
   {form.watch('config.autoRetry') && (
     <FormField name="config.maxRetries" />
   )}
   ```

#### 4. AgentTaskExecutor - 任务执行器

**文件**: `/src/components/agents/AgentTaskExecutor.jsx`

**执行流程可视化**:

```
1. 输入任务
   ┌─────────────────────────┐
   │ Task: [_____________]   │
   │ [Execute]               │
   └─────────────────────────┘

2. 执行中 (Running)
   ┌─────────────────────────┐
   │ Progress: 65%           │
   │ ▓▓▓▓▓▓▓▓▓▓▓░░░░         │
   │ [Stop]                  │
   └─────────────────────────┘

   [SubTasks] [Logs]
   ┌─────────────────────────┐
   │ 1. ✓ Analyzing task     │
   │ 2. ✓ Planning approach  │
   │ 3. ⏳ Executing task     │
   │ 4. ⏸ Validating results │
   └─────────────────────────┘

3. 完成 (Completed)
   ┌─────────────────────────┐
   │ ✓ Task Completed!       │
   │ Result: ...             │
   │ Duration: 2.5s          │
   │ [Run Another Task]      │
   └─────────────────────────┘
```

**状态管理**:

```javascript
const TaskStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped'
}

// 状态转换
IDLE → RUNNING → COMPLETED
       ↓         ↓
     STOPPED   FAILED
```

**日志系统**:

```javascript
const LogEntry = {
  timestamp: '10:30:45',
  type: 'info' | 'success' | 'warning' | 'error',
  message: 'Task started'
}

// 自动滚动到最新日志
useEffect(() => {
  logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [logs])
```

#### 5. AgentsPage - Agent主页面

**文件**: `/src/pages/AgentsPage.jsx`

**页面架构**:

```
┌─────────────────────────────────────┐
│ Container (max-w-7xl mx-auto)       │
│                                     │
│  <AgentList />                      │
│    ├─ Header + Actions              │
│    ├─ Filters                       │
│    └─ Agent Cards Grid              │
│                                     │
│  <AgentEditor /> (Dialog)           │
│  <AgentTaskExecutor /> (Dialog)     │
│  <DeleteConfirmDialog />            │
└─────────────────────────────────────┘
```

**状态管理**:

```javascript
// 主要状态
const [agents, setAgents] = useState([])
const [loading, setLoading] = useState(true)
const [editorOpen, setEditorOpen] = useState(false)
const [executorOpen, setExecutorOpen] = useState(false)
const [selectedAgent, setSelectedAgent] = useState(null)

// API集成
const fetchAgents = useCallback(async () => {
  const response = await axios.get('/api/agents', {
    headers: { Authorization: `Bearer ${token}` }
  })
  setAgents(response.data.agents)
}, [token])

// CRUD操作
const handleCreateAgent = () => { /* ... */ }
const handleEditAgent = (agent) => { /* ... */ }
const handleSaveAgent = async (data) => { /* ... */ }
const handleDeleteAgent = (agent) => { /* ... */ }
const handleExecuteAgent = (agent) => { /* ... */ }
```

---

### 工作流系统

#### 1. WorkflowCard - 工作流卡片

**文件**: `/src/components/workflows/WorkflowCard.jsx`

**与AgentCard的差异**:

| 特性 | AgentCard | WorkflowCard |
|------|-----------|--------------|
| 主图标 | 🤖 Bot | 🔄 Workflow |
| 关键指标 | 能力数量 | 节点数量 |
| 标签系统 | 能力标签 | 分类标签 |
| 主要操作 | Execute | Edit + Run |
| 次要操作 | Edit, Delete | Edit, Duplicate, Delete |

**布局差异**:

```jsx
// AgentCard Footer
<CardFooter>
  <Button>Execute Task</Button>
</CardFooter>

// WorkflowCard Footer (双按钮)
<CardFooter className="gap-2">
  <Button variant="outline">Edit</Button>
  <Button>Run</Button>
</CardFooter>
```

#### 2. WorkflowList - 工作流列表

**文件**: `/src/components/workflows/WorkflowList.jsx`

**新增功能**:

1. **导入/导出**
   ```jsx
   <div className="flex gap-2">
     <Button variant="outline" onClick={onImport}>
       <Upload /> Import
     </Button>
     <Button onClick={onCreateWorkflow}>
       <Plus /> Create
     </Button>
   </div>
   ```

2. **批量导出**
   ```jsx
   {filteredWorkflows.length > 0 && (
     <Button variant="ghost" onClick={onExport}>
       <Download /> Export All
     </Button>
   )}
   ```

---

## 待开发组件指南

### 1. WorkflowEditor - 工作流可视化编辑器 🎯 核心组件

**文件**: `/src/components/workflows/WorkflowEditor.jsx`

#### 技术选型

**React Flow** - 推荐理由:
- ✅ 最成熟的React流程图库
- ✅ 内置缩放、平移、小地图
- ✅ 自定义节点和边
- ✅ TypeScript支持
- ✅ 活跃维护

**安装**:
```bash
npm install reactflow
```

#### 编辑器布局

```
┌─────────────────────────────────────────────────────┐
│ Toolbar                                        [×]  │ ← 顶部工具栏
│ [Save] [Run] [Export] [Zoom] [Undo] [Redo]        │
├──────┬────────────────────────────────────┬────────┤
│      │                                    │        │
│ Node │         Canvas                     │ Props  │
│Panel │    ┌──────────┐                    │ Panel  │
│      │    │  Start   │                    │        │
│ 📦AI │    └────┬─────┘                    │ ⚙️Edit │
│ 📦Ops│         │                          │        │
│ 📦Log│    ┌────▼─────┐                    │ Name:  │
│ 📦Data    │AI Model  │                    │[____]  │
│      │    └────┬─────┘                    │        │
│      │         │                          │ Model: │
│      │    ┌────▼─────┐                    │[GPT4▼] │
│      │    │   End    │                    │        │
│      │    └──────────┘                    │ [Save] │
│      │                                    │        │
└──────┴────────────────────────────────────┴────────┘
```

#### 组件结构

```jsx
import { useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'

// 自定义节点类型
import { AIModelNode } from './nodes/AIModelNode'
import { DecisionNode } from './nodes/DecisionNode'
import { LoopNode } from './nodes/LoopNode'

const nodeTypes = {
  aiModel: AIModelNode,
  decision: DecisionNode,
  loop: LoopNode,
  // ... 更多节点类型
}

export function WorkflowEditor({ workflow, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || [])
  const [selectedNode, setSelectedNode] = useState(null)

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  return (
    <div className="h-screen flex">
      {/* 左侧节点面板 */}
      <NodePalette onDragStart={handleDragStart} />

      {/* 中央画布 */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />

          {/* 顶部工具栏 */}
          <Panel position="top-left">
            <Toolbar
              onSave={() => onSave({ nodes, edges })}
              onRun={handleRun}
              onExport={handleExport}
            />
          </Panel>
        </ReactFlow>
      </div>

      {/* 右侧属性面板 */}
      <PropertiesPanel
        node={selectedNode}
        onUpdate={handleNodeUpdate}
      />
    </div>
  )
}
```

#### 自定义节点示例

```jsx
// nodes/AIModelNode.jsx
import { Handle, Position } from 'reactflow'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot } from 'lucide-react'

export function AIModelNode({ data, selected }) {
  return (
    <Card className={cn(
      "min-w-[200px]",
      selected && "ring-2 ring-primary"
    )}>
      <Handle type="target" position={Position.Top} />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4" />
          <CardTitle className="text-sm">AI Model</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <Badge variant="secondary">{data.model || 'GPT-4'}</Badge>
          {data.prompt && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.prompt}
            </p>
          )}
        </div>
      </CardContent>

      <Handle type="source" position={Position.Bottom} />
    </Card>
  )
}
```

#### 节点面板组件

```jsx
// NodePalette.jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, GitBranch, Repeat, Database, Globe } from 'lucide-react'

const nodeCategories = [
  {
    title: 'AI Operations',
    nodes: [
      { type: 'aiModel', label: 'AI Model', icon: Bot },
      { type: 'prompt', label: 'Prompt', icon: MessageSquare },
    ]
  },
  {
    title: 'Logic',
    nodes: [
      { type: 'decision', label: 'Decision', icon: GitBranch },
      { type: 'loop', label: 'Loop', icon: Repeat },
    ]
  },
  {
    title: 'Data',
    nodes: [
      { type: 'database', label: 'Database', icon: Database },
      { type: 'api', label: 'API Call', icon: Globe },
    ]
  }
]

export function NodePalette({ onDragStart }) {
  return (
    <Card className="w-64 h-full rounded-none border-r">
      <CardHeader>
        <CardTitle>Nodes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-80px)]">
          {nodeCategories.map(category => (
            <div key={category.title} className="p-4">
              <h3 className="text-sm font-semibold mb-2">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.nodes.map(node => {
                  const Icon = node.icon
                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent cursor-move"
                    >
                      <Icon className="size-4" />
                      <span className="text-sm">{node.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

#### 属性面板组件

```jsx
// PropertiesPanel.jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function PropertiesPanel({ node, onUpdate }) {
  if (!node) {
    return (
      <Card className="w-80 h-full rounded-none border-l">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            Select a node to edit properties
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80 h-full rounded-none border-l">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-4">
            {/* 通用属性 */}
            <div className="space-y-2">
              <Label>Node ID</Label>
              <Input value={node.id} disabled />
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={node.data.label || ''}
                onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              />
            </div>

            {/* 节点特定属性 */}
            {node.type === 'aiModel' && (
              <>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={node.data.model}
                    onValueChange={(value) => onUpdate(node.id, { model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={node.data.prompt || ''}
                    onChange={(e) => onUpdate(node.id, { prompt: e.target.value })}
                    rows={5}
                  />
                </div>
              </>
            )}

            <Button
              onClick={() => onUpdate(node.id, node.data)}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

#### 工具栏组件

```jsx
// Toolbar.jsx
import { Button } from '@/components/ui/button'
import { Save, Play, Download, ZoomIn, ZoomOut, Undo, Redo } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Toolbar({ onSave, onRun, onExport, onUndo, onRedo, onZoom }) {
  return (
    <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
      <Button variant="ghost" size="sm" onClick={onSave}>
        <Save className="size-4" />
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={onRun}>
        <Play className="size-4" />
        Run
      </Button>
      <Button variant="ghost" size="sm" onClick={onExport}>
        <Download className="size-4" />
        Export
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="icon" onClick={() => onZoom('in')}>
        <ZoomIn className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onZoom('out')}>
        <ZoomOut className="size-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="icon" onClick={onUndo}>
        <Undo className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onRedo}>
        <Redo className="size-4" />
      </Button>
    </div>
  )
}
```

#### 数据结构

```typescript
// Workflow数据结构
interface Workflow {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  version: string
  createdAt: string
  updatedAt: string
}

interface Node {
  id: string
  type: 'aiModel' | 'decision' | 'loop' | 'api' | ...
  position: { x: number, y: number }
  data: {
    label: string
    // 节点特定数据
    model?: string
    prompt?: string
    condition?: string
    // ...
  }
}

interface Edge {
  id: string
  source: string  // 源节点ID
  target: string  // 目标节点ID
  type?: 'default' | 'step' | 'smoothstep'
  label?: string
}
```

#### 保存和加载

```javascript
// 保存工作流
const handleSave = async () => {
  const workflowData = {
    ...workflow,
    nodes,
    edges,
    updatedAt: new Date().toISOString()
  }

  await axios.put(`/api/workflows/${workflow.id}`, workflowData, {
    headers: { Authorization: `Bearer ${token}` }
  })

  toast.success('Workflow saved')
}

// 加载工作流
const loadWorkflow = async (id) => {
  const response = await axios.get(`/api/workflows/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const { nodes, edges } = response.data
  setNodes(nodes)
  setEdges(edges)
}
```

#### 样式定制

```css
/* ReactFlow自定义样式 */
.react-flow__node {
  border-radius: 0.5rem;
  font-family: inherit;
}

.react-flow__node.selected {
  box-shadow: 0 0 0 2px hsl(var(--primary));
}

.react-flow__edge-path {
  stroke: hsl(var(--primary));
  stroke-width: 2;
}

.react-flow__handle {
  width: 10px;
  height: 10px;
  background: hsl(var(--primary));
  border: 2px solid hsl(var(--background));
}
```

---

### 2. 上下文管理系统

#### MemoryCard - 记忆卡片

**文件**: `/src/components/context/MemoryCard.jsx`

**设计规格**:

```jsx
<Card>
  <CardHeader>
    <div className="flex items-start gap-3">
      {/* 类型图标 */}
      <div className="p-2 rounded-lg bg-primary/10">
        {getTypeIcon(memory.type)}
      </div>

      <div className="flex-1">
        <CardTitle>{memory.title}</CardTitle>
        <CardDescription>{memory.preview}</CardDescription>
      </div>

      {/* 重要性评分 */}
      <Badge variant={getImportanceVariant(memory.importance)}>
        {memory.importance}/5
      </Badge>
    </div>
  </CardHeader>

  <CardContent>
    {/* 元数据 */}
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">
        <Clock /> {formatDate(memory.createdAt)}
      </Badge>
      <Badge variant="outline">
        <Tag /> {memory.tags.length} tags
      </Badge>
      <Badge variant="outline">
        <Link /> {memory.references.length} refs
      </Badge>
    </div>

    {/* 标签 */}
    <div className="flex flex-wrap gap-1 mt-2">
      {memory.tags.map(tag => (
        <Badge key={tag} variant="secondary">{tag}</Badge>
      ))}
    </div>
  </CardContent>

  <CardFooter>
    <Button variant="ghost" onClick={onView}>
      View Details
    </Button>
    <Button variant="ghost" onClick={onEdit}>
      <Edit /> Edit
    </Button>
  </CardFooter>
</Card>
```

**记忆类型**:

```javascript
const MemoryType = {
  FACT: 'fact',           // 事实: "User's name is John"
  PREFERENCE: 'preference', // 偏好: "Prefers dark mode"
  CONTEXT: 'context',     // 上下文: "Working on AI project"
  SKILL: 'skill',         // 技能: "Knows Python"
  GOAL: 'goal'            // 目标: "Learn React"
}

const typeIcons = {
  fact: Info,
  preference: Heart,
  context: FileText,
  skill: Code,
  goal: Target
}
```

#### MemoryList - 记忆列表

**文件**: `/src/components/context/MemoryList.jsx`

**筛选器设计**:

```jsx
<div className="flex gap-3">
  {/* 类型筛选 */}
  <Select value={typeFilter} onValueChange={setTypeFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      <SelectItem value="fact">Facts</SelectItem>
      <SelectItem value="preference">Preferences</SelectItem>
      <SelectItem value="context">Context</SelectItem>
      <SelectItem value="skill">Skills</SelectItem>
      <SelectItem value="goal">Goals</SelectItem>
    </SelectContent>
  </Select>

  {/* 重要性筛选 */}
  <Select value={importanceFilter} onValueChange={setImportanceFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Importance" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Levels</SelectItem>
      <SelectItem value="5">⭐⭐⭐⭐⭐ Critical</SelectItem>
      <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
      <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
      <SelectItem value="2">⭐⭐ Low</SelectItem>
      <SelectItem value="1">⭐ Minimal</SelectItem>
    </SelectContent>
  </Select>

  {/* 时间筛选 */}
  <Select value={timeFilter} onValueChange={setTimeFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Time" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="week">This Week</SelectItem>
      <SelectItem value="month">This Month</SelectItem>
      <SelectItem value="year">This Year</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### ContextAnalyzer - 上下文分析器

**文件**: `/src/components/context/ContextAnalyzer.jsx`

**可视化设计**:

```jsx
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function ContextAnalyzer({ conversationId }) {
  const [analysis, setAnalysis] = useState(null)

  // 分析数据结构
  const analysis = {
    tokenCount: 12500,
    maxTokens: 32000,
    utilizationRate: 0.39,

    distribution: [
      { category: 'System Prompts', tokens: 500, percentage: 4 },
      { category: 'User Messages', tokens: 8000, percentage: 64 },
      { category: 'Assistant Messages', tokens: 3000, percentage: 24 },
      { category: 'Memories', tokens: 1000, percentage: 8 }
    ],

    recommendations: [
      'Consider compressing older messages',
      'Archive low-importance memories',
      'Summarize long conversations'
    ]
  }

  return (
    <div className="space-y-4">
      {/* Token使用概览 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Token Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {analysis.tokenCount.toLocaleString()}</span>
            <span>Limit: {analysis.maxTokens.toLocaleString()}</span>
          </div>
          <Progress value={analysis.utilizationRate * 100} />
          <div className="text-sm text-muted-foreground">
            {(analysis.utilizationRate * 100).toFixed(1)}% utilized
          </div>
        </div>
      </Card>

      {/* 分布图 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Token Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysis.distribution}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tokens" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 优化建议 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="size-4 text-green-600 mt-0.5" />
              <span className="text-sm">{rec}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
```

---

### 3. 总结系统增强

#### SummaryGenerator - 总结生成器

**文件**: `/src/components/summary/SummaryGenerator.jsx`

**功能设计**:

```jsx
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Clock, FileText } from 'lucide-react'

export function SummaryGenerator({ conversationId, onGenerate }) {
  const [template, setTemplate] = useState('general')
  const [style, setStyle] = useState('concise')
  const [language, setLanguage] = useState('en')
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState(null)

  const templates = [
    { value: 'general', label: 'General Summary', icon: FileText },
    { value: 'technical', label: 'Technical Report', icon: Code },
    { value: 'executive', label: 'Executive Summary', icon: Briefcase },
    { value: 'action-items', label: 'Action Items', icon: CheckSquare },
    { value: 'qa', label: 'Q&A Format', icon: HelpCircle }
  ]

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await axios.post(
        `/api/summary/conversations/${conversationId}/summarize`,
        { template, style, language },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSummary(response.data)
      onGenerate?.(response.data)
    } catch (error) {
      toast.error('Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 配置区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Generate Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 模板选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => {
                const Icon = t.icon
                return (
                  <Button
                    key={t.value}
                    variant={template === t.value ? 'default' : 'outline'}
                    onClick={() => setTemplate(t.value)}
                    className="justify-start"
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* 风格选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="bullet-points">Bullet Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full"
          >
            {generating ? 'Generating...' : 'Generate Summary'}
          </Button>
        </CardContent>
      </Card>

      {/* 结果区 */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Summary</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Clock className="size-3" />
                  {summary.generatedAt}
                </Badge>
                <Badge variant="outline">
                  {summary.wordCount} words
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {summary.content}
            </div>

            {/* 关键点 */}
            {summary.keyPoints && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Key Points</h4>
                <ul className="space-y-1">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(summary.content)}>
                <Copy className="size-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="size-4" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share className="size-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

#### TemplateManager - 模板管理器

**文件**: `/src/components/summary/TemplateManager.jsx`

**设计特点**:

```jsx
// 模板列表 + 编辑器
<div className="grid grid-cols-3 gap-4">
  {/* 左侧：模板列表 */}
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle>Templates</CardTitle>
      <Button onClick={onCreateTemplate}>
        <Plus /> New Template
      </Button>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[600px]">
        {templates.map(template => (
          <div
            key={template.id}
            className={cn(
              "p-3 rounded-md cursor-pointer",
              selected?.id === template.id && "bg-accent"
            )}
            onClick={() => setSelected(template)}
          >
            <div className="font-medium">{template.name}</div>
            <div className="text-xs text-muted-foreground">
              {template.usageCount} uses
            </div>
          </div>
        ))}
      </ScrollArea>
    </CardContent>
  </Card>

  {/* 右侧：模板编辑器 */}
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle>
        {selected ? 'Edit Template' : 'Select a template'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {selected && (
        <TemplateEditor
          template={selected}
          onSave={handleSave}
        />
      )}
    </CardContent>
  </Card>
</div>
```

---

### 4. 模板市场

#### TemplateMarket - 模板市场主界面

**文件**: `/src/components/templates/TemplateMarket.jsx`

**布局设计** (类似应用商店):

```
┌─────────────────────────────────────────────┐
│ 🏪 Template Marketplace                      │
│                                              │
│ [Search...] [Category▼] [Sort▼] [Filter]   │
├─────────────────────────────────────────────┤
│                                              │
│ 🔥 Featured Templates                        │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ T1   │ │ T2   │ │ T3   │ │ T4   │        │
│ │⭐4.8 │ │⭐4.9 │ │⭐4.7 │ │⭐4.6 │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
│                                              │
│ 📊 Most Popular                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ T5   │ │ T6   │ │ T7   │ │ T8   │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
│                                              │
│ 🆕 Recently Added                            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ T9   │ │ T10  │ │ T11  │ │ T12  │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────┘
```

**TemplateCard 设计**:

```jsx
<Card className="group hover:shadow-lg transition-all">
  {/* 预览图 */}
  <div className="aspect-video bg-muted relative overflow-hidden">
    <img src={template.thumbnail} alt={template.name} />
    <Badge className="absolute top-2 right-2">
      {template.category}
    </Badge>
  </div>

  <CardHeader>
    <CardTitle className="line-clamp-1">
      {template.name}
    </CardTitle>
    <CardDescription className="line-clamp-2">
      {template.description}
    </CardDescription>
  </CardHeader>

  <CardContent>
    {/* 评分和统计 */}
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1">
        <Star className="size-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{template.rating}</span>
        <span className="text-muted-foreground">
          ({template.reviewCount})
        </span>
      </div>
      <div className="text-muted-foreground">
        <Download className="size-4 inline" />
        {template.downloads}
      </div>
    </div>

    {/* 作者 */}
    <div className="flex items-center gap-2 mt-2">
      <Avatar className="size-6">
        <AvatarImage src={template.author.avatar} />
        <AvatarFallback>{template.author.initials}</AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground">
        by {template.author.name}
      </span>
    </div>
  </CardContent>

  <CardFooter className="gap-2">
    <Button
      variant="outline"
      className="flex-1"
      onClick={() => onPreview(template)}
    >
      Preview
    </Button>
    <Button
      className="flex-1"
      onClick={() => onUse(template)}
    >
      Use Template
    </Button>
  </CardFooter>
</Card>
```

#### TemplateDetail - 模板详情页

**文件**: `/src/components/templates/TemplateDetail.jsx`

**布局**:

```jsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-4xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {template.name}
        <Badge>{template.category}</Badge>
      </DialogTitle>
    </DialogHeader>

    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="reviews">
          Reviews ({template.reviewCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {/* 基本信息 */}
        <div className="space-y-4">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="rounded-lg w-full"
          />

          <div className="prose max-w-none">
            {template.longDescription}
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Rating"
              value={template.rating}
              icon={Star}
            />
            <StatCard
              label="Downloads"
              value={template.downloads}
              icon={Download}
            />
            <StatCard
              label="Reviews"
              value={template.reviewCount}
              icon={MessageSquare}
            />
            <StatCard
              label="Updated"
              value={formatDate(template.updatedAt)}
              icon={Clock}
            />
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview">
        {/* 模板预览 */}
        <TemplatePreview template={template} />
      </TabsContent>

      <TabsContent value="reviews">
        {/* 评论列表 */}
        <ReviewList reviews={template.reviews} />
      </TabsContent>
    </Tabs>

    <DialogFooter>
      <Button variant="outline" onClick={onOpenChange}>
        Close
      </Button>
      <Button onClick={() => onUse(template)}>
        Use This Template
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 最佳实践

### 1. 响应式设计

```jsx
// ✅ 移动优先
<div className="
  flex flex-col       // 默认：垂直
  sm:flex-row         // 640px+: 水平
  md:grid md:grid-cols-2  // 768px+: 2列网格
  lg:grid-cols-3      // 1024px+: 3列网格
  xl:grid-cols-4      // 1280px+: 4列网格
">

// ✅ 响应式间距
<div className="
  p-4                 // 默认: 1rem
  sm:p-6              // 640px+: 1.5rem
  lg:p-8              // 1024px+: 2rem
">

// ✅ 响应式文字
<h1 className="
  text-2xl            // 默认: 1.5rem
  sm:text-3xl         // 640px+: 1.875rem
  lg:text-4xl         // 1024px+: 2.25rem
  font-bold
">
```

### 2. 暗色模式

```jsx
// ✅ 使用语义化颜色
<div className="
  bg-background       // 自动适配
  text-foreground     // 自动适配
  border-border       // 自动适配
">

// ✅ 明确指定暗色样式
<div className="
  bg-white            // 亮色模式
  dark:bg-gray-900    // 暗色模式
  text-gray-900
  dark:text-white
">

// ❌ 避免硬编码颜色
<div className="bg-white text-black">
```

### 3. 性能优化

```jsx
// ✅ 虚拟化长列表
import { useVirtualizer } from '@tanstack/react-virtual'

function LongList({ items }) {
  const parentRef = useRef(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Item data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ✅ 代码分割
const WorkflowEditor = lazy(() => import('./components/workflows/WorkflowEditor'))

<Suspense fallback={<LoadingSpinner />}>
  <WorkflowEditor />
</Suspense>

// ✅ 图片优化
<img
  src={image.url}
  alt={image.alt}
  loading="lazy"
  decoding="async"
  className="aspect-video object-cover"
/>
```

### 4. 可访问性

```jsx
// ✅ 键盘导航
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>

// ✅ ARIA标签
<button aria-label="Close dialog">
  <X />
</button>

<input
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>

// ✅ Focus管理
const dialogRef = useRef(null)

useEffect(() => {
  if (open) {
    dialogRef.current?.focus()
  }
}, [open])

// ✅ 屏幕阅读器文本
<span className="sr-only">
  Loading...
</span>
```

### 5. 错误处理

```jsx
// ✅ 错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Card>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// ✅ API错误处理
const fetchData = async () => {
  try {
    const response = await apiClient.get('/data')
    setData(response.data)
  } catch (error) {
    if (error.response?.status === 401) {
      // 未授权
      navigate('/login')
    } else if (error.response?.status === 404) {
      // 未找到
      toast.error('Data not found')
    } else {
      // 其他错误
      toast.error('Failed to load data')
    }
  }
}
```

---

## 常见模式

### 1. 搜索和过滤

```jsx
function useFilters(data, config) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('name')

  const filtered = useMemo(() => {
    let result = data

    // 搜索
    if (search) {
      result = result.filter(item =>
        config.searchFields.some(field =>
          item[field]?.toLowerCase().includes(search.toLowerCase())
        )
      )
    }

    // 过滤
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => item[key] === value)
      }
    })

    // 排序
    result.sort((a, b) => {
      const aVal = a[sort]
      const bVal = b[sort]
      return typeof aVal === 'string'
        ? aVal.localeCompare(bVal)
        : aVal - bVal
    })

    return result
  }, [data, search, filters, sort, config])

  return {
    filtered,
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort
  }
}
```

### 2. 分页

```jsx
function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(items.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = items.slice(startIndex, endIndex)

  return {
    page,
    totalPages,
    currentItems,
    setPage,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setPage(p => Math.max(p - 1, 1)),
    goToPage: (p) => setPage(Math.max(1, Math.min(p, totalPages)))
  }
}
```

### 3. 表单处理

```jsx
// 使用React Hook Form + Zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+')
})

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      age: 0
    }
  })

  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### 4. 加载状态

```jsx
// Skeleton组件
import { Skeleton } from '@/components/ui/skeleton'

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  )
}

// 使用
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-3 gap-4">
    {items.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>
)}
```

### 5. 确认对话框

```jsx
function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  })

  const confirm = ({ title, message }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        onConfirm: () => {
          resolve(true)
          setState(s => ({ ...s, open: false }))
        }
      })
    })
  }

  const ConfirmDialog = () => (
    <AlertDialog open={state.open} onOpenChange={(open) => {
      if (!open) setState(s => ({ ...s, open: false }))
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {state.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={state.onConfirm}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirm, ConfirmDialog }
}

// 使用
function MyComponent() {
  const { confirm, ConfirmDialog } = useConfirm()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete item?',
      message: 'This action cannot be undone.'
    })

    if (confirmed) {
      // 执行删除
    }
  }

  return (
    <>
      <Button onClick={handleDelete}>Delete</Button>
      <ConfirmDialog />
    </>
  )
}
```

---

## 总结

本指南提供了完整的UI开发规范和实践指导，涵盖：

✅ **已完成** (7个组件):
- Agent系统完整UI (5个组件)
- 工作流基础UI (2个组件)

🚧 **高优先级** (待开发):
- 工作流可视化编辑器 (核心)
- 工作流主页面

⏳ **中优先级** (待开发):
- 上下文管理系统 (4-5个组件)
- 总结系统增强 (3-4个组件)
- 模板市场 (5-6个组件)

所有组件严格遵循 **v0.dev设计理念**:
- shadcn/ui组件库
- Radix UI原语
- Tailwind CSS样式
- 完整可访问性
- 响应式设计
- 暗色模式支持

---

**文档版本**: 1.0
**最后更新**: 2025-10-16
**维护者**: Development Team
