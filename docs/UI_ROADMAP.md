# Personal Chatbox UI 开发路线图

## 总览

本路线图规划了Personal Chatbox项目UI组件的完整开发计划，基于v0.dev设计系统。

---

## 项目状态

**当前进度**: Phase 1 已完成 (40%)

```
Phase 1: Agent系统       ████████████████████ 100% ✅
Phase 2: 工作流系统      ████████░░░░░░░░░░░░  40% 🚧
Phase 3: 上下文管理      ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 4: 总结系统        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 5: 模板市场        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

---

## Phase 1: Agent系统 ✅ 已完成

**时间**: 第1-2周
**状态**: ✅ 完成
**优先级**: 🔴 高

### 已完成的组件

| 组件 | 文件路径 | 状态 | 功能 |
|------|---------|------|------|
| AgentCard | `/src/components/agents/AgentCard.jsx` | ✅ | Agent卡片展示 |
| AgentList | `/src/components/agents/AgentList.jsx` | ✅ | Agent列表管理 |
| AgentEditor | `/src/components/agents/AgentEditor.jsx` | ✅ | Agent创建/编辑 |
| AgentTaskExecutor | `/src/components/agents/AgentTaskExecutor.jsx` | ✅ | 任务执行监控 |
| AgentsPage | `/src/pages/AgentsPage.jsx` | ✅ | Agent主页面 |

### 功能清单

- ✅ Agent CRUD操作
- ✅ 高级搜索和过滤
- ✅ 能力标签管理
- ✅ 任务执行和监控
- ✅ 子任务跟踪
- ✅ 执行日志查看
- ✅ 统计信息展示
- ✅ 响应式设计
- ✅ 暗色模式支持

### 后续优化建议

1. **性能优化**
   - 实现虚拟滚动（react-window）
   - 添加数据缓存（React Query）

2. **功能增强**
   - Agent执行历史详情页
   - Agent性能分析仪表板
   - Agent模板库

3. **用户体验**
   - 拖拽排序
   - 批量操作
   - 导出为JSON

---

## Phase 2: 工作流系统 🚧 进行中

**时间**: 第3-5周
**状态**: 🚧 进行中 (40%)
**优先级**: 🔴 高

### 已完成的组件

| 组件 | 文件路径 | 状态 | 功能 |
|------|---------|------|------|
| WorkflowCard | `/src/components/workflows/WorkflowCard.jsx` | ✅ | 工作流卡片 |
| WorkflowList | `/src/components/workflows/WorkflowList.jsx` | ✅ | 工作流列表 |

### 待开发组件

| 组件 | 文件路径 | 优先级 | 预计工作量 |
|------|---------|--------|-----------|
| WorkflowEditor | `/src/components/workflows/WorkflowEditor.jsx` | 🔴 极高 | 5-7天 |
| NodePalette | `/src/components/workflows/NodePalette.jsx` | 🔴 高 | 2天 |
| PropertiesPanel | `/src/components/workflows/PropertiesPanel.jsx` | 🔴 高 | 2天 |
| Toolbar | `/src/components/workflows/Toolbar.jsx` | 🟡 中 | 1天 |
| WorkflowExecutor | `/src/components/workflows/WorkflowExecutor.jsx` | 🔴 高 | 3天 |
| WorkflowLogs | `/src/components/workflows/WorkflowLogs.jsx` | 🟡 中 | 1天 |
| WorkflowsPage | `/src/pages/WorkflowsPage.jsx` | 🔴 高 | 2天 |

### 节点类型开发计划

#### 第一批节点（核心）
```
1. StartNode          - 开始节点
2. EndNode            - 结束节点
3. AIModelNode        - AI模型调用
4. PromptNode         - 提示词节点
5. DecisionNode       - 条件判断
```

#### 第二批节点（逻辑控制）
```
6. LoopNode           - 循环节点
7. SwitchNode         - 多路分支
8. MergeNode          - 合并节点
9. DelayNode          - 延迟节点
```

#### 第三批节点（数据操作）
```
10. DataTransformNode  - 数据转换
11. FilterNode         - 数据过滤
12. AggregateNode      - 数据聚合
13. VariableNode       - 变量存储
```

#### 第四批节点（外部集成）
```
14. APICallNode        - API调用
15. DatabaseNode       - 数据库查询
16. FileNode           - 文件操作
17. WebhookNode        - Webhook触发
```

### 开发步骤

#### 第1周：基础架构
- [ ] 安装和配置React Flow
- [ ] 创建WorkflowEditor基础结构
- [ ] 实现画布缩放和平移
- [ ] 添加MiniMap和Controls

#### 第2周：节点系统
- [ ] 开发第一批核心节点
- [ ] 实现节点拖拽功能
- [ ] 创建NodePalette组件
- [ ] 实现节点连接逻辑

#### 第3周：属性和配置
- [ ] 开发PropertiesPanel
- [ ] 实现节点属性编辑
- [ ] 添加表单验证
- [ ] 实现节点数据同步

#### 第4周：执行和测试
- [ ] 开发WorkflowExecutor
- [ ] 实现工作流执行引擎
- [ ] 添加执行日志
- [ ] 完成WorkflowsPage

#### 第5周：优化和扩展
- [ ] 开发第二批节点
- [ ] 添加导入/导出功能
- [ ] 实现撤销/重做
- [ ] 性能优化

### 技术要点

```javascript
// React Flow配置
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow'

// 自定义节点注册
const nodeTypes = {
  aiModel: AIModelNode,
  decision: DecisionNode,
  loop: LoopNode,
  // ...
}

// 边样式
const edgeOptions = {
  animated: true,
  style: { stroke: 'hsl(var(--primary))' }
}
```

---

## Phase 3: 上下文管理系统 ⏳ 待开发

**时间**: 第6-7周
**状态**: ⏳ 待开发
**优先级**: 🟡 中

### 组件规划

| 组件 | 文件路径 | 预计工作量 |
|------|---------|-----------|
| MemoryCard | `/src/components/context/MemoryCard.jsx` | 1天 |
| MemoryList | `/src/components/context/MemoryList.jsx` | 2天 |
| MemoryEditor | `/src/components/context/MemoryEditor.jsx` | 2天 |
| MemorySearch | `/src/components/context/MemorySearch.jsx` | 1天 |
| MemoryFilters | `/src/components/context/MemoryFilters.jsx` | 1天 |
| ContextCompressor | `/src/components/context/ContextCompressor.jsx` | 2天 |
| ContextAnalyzer | `/src/components/context/ContextAnalyzer.jsx` | 2天 |
| MemoryStatistics | `/src/components/context/MemoryStatistics.jsx` | 1天 |
| ContextPage | `/src/pages/ContextPage.jsx` | 1天 |

### 功能需求

#### 记忆管理
- [ ] 记忆类型分类（事实、偏好、上下文、技能、目标）
- [ ] 重要性评分系统
- [ ] 记忆关联和引用
- [ ] 标签管理
- [ ] 全文搜索

#### 上下文优化
- [ ] Token使用分析
- [ ] 上下文压缩算法
- [ ] 自动清理过期记忆
- [ ] 记忆推荐系统

#### 可视化
- [ ] Token分布图表
- [ ] 记忆时间线
- [ ] 关联图谱
- [ ] 使用率统计

### 数据结构

```typescript
interface Memory {
  id: string
  type: 'fact' | 'preference' | 'context' | 'skill' | 'goal'
  title: string
  content: string
  importance: 1 | 2 | 3 | 4 | 5
  tags: string[]
  references: string[]
  createdAt: string
  updatedAt: string
  lastAccessedAt: string
  accessCount: number
}

interface ContextAnalysis {
  tokenCount: number
  maxTokens: number
  utilizationRate: number
  distribution: {
    category: string
    tokens: number
    percentage: number
  }[]
  recommendations: string[]
}
```

---

## Phase 4: 总结系统增强 ⏳ 待开发

**时间**: 第8周
**状态**: ⏳ 待开发
**优先级**: 🟡 中

### 组件规划

| 组件 | 文件路径 | 预计工作量 |
|------|---------|-----------|
| SummaryViewer | `/src/components/summary/SummaryViewer.jsx` | 1天 |
| SummaryGenerator | `/src/components/summary/SummaryGenerator.jsx` | 2天 |
| KeyPointsList | `/src/components/summary/KeyPointsList.jsx` | 1天 |
| TemplateManager | `/src/components/summary/TemplateManager.jsx` | 2天 |
| TemplateEditor | `/src/components/summary/TemplateEditor.jsx` | 2天 |
| SummaryExporter | `/src/components/summary/SummaryExporter.jsx` | 1天 |
| SummaryPage | `/src/pages/SummaryPage.jsx` | 1天 |

### 功能需求

#### 总结生成
- [ ] 多种总结模板
  - 通用总结
  - 技术报告
  - 执行摘要
  - 行动项列表
  - 问答格式
- [ ] 自定义总结风格
  - 简洁
  - 详细
  - 要点列表
- [ ] 多语言支持

#### 模板管理
- [ ] 模板创建和编辑
- [ ] 模板变量系统
- [ ] 模板预览
- [ ] 模板评分
- [ ] 模板分享

#### 导出功能
- [ ] 导出格式
  - Markdown
  - PDF
  - HTML
  - Word
  - JSON
- [ ] 批量导出
- [ ] 自动格式化

### 模板变量系统

```
可用变量：
{{conversation.title}}    - 对话标题
{{conversation.date}}     - 对话日期
{{message.count}}         - 消息数量
{{user.name}}             - 用户名称
{{ai.model}}              - AI模型
{{summary.keyPoints}}     - 关键点列表
{{summary.actionItems}}   - 行动项
```

---

## Phase 5: 模板市场 ⏳ 待开发

**时间**: 第9-10周
**状态**: ⏳ 待开发
**优先级**: 🟢 低

### 组件规划

| 组件 | 文件路径 | 预计工作量 |
|------|---------|-----------|
| TemplateMarket | `/src/components/templates/TemplateMarket.jsx` | 2天 |
| TemplateGrid | `/src/components/templates/TemplateGrid.jsx` | 1天 |
| TemplateCard | `/src/components/templates/TemplateCard.jsx` | 1天 |
| TemplateDetail | `/src/components/templates/TemplateDetail.jsx` | 2天 |
| TemplatePreview | `/src/components/templates/TemplatePreview.jsx` | 2天 |
| TemplateRating | `/src/components/templates/TemplateRating.jsx` | 1天 |
| TemplatePublisher | `/src/components/templates/TemplatePublisher.jsx` | 2天 |
| TemplateFilters | `/src/components/templates/TemplateFilters.jsx` | 1天 |
| UserTemplateLibrary | `/src/components/templates/UserTemplateLibrary.jsx` | 1天 |
| TemplateMarketPage | `/src/pages/TemplateMarketPage.jsx` | 1天 |

### 功能需求

#### 浏览和搜索
- [ ] 分类浏览
  - Agent模板
  - 工作流模板
  - 提示词模板
  - 总结模板
- [ ] 标签筛选
- [ ] 搜索功能
- [ ] 排序选项
  - 最热门
  - 最新
  - 评分最高
  - 使用最多

#### 模板详情
- [ ] 详细描述
- [ ] 截图和预览
- [ ] 评分和评论
- [ ] 使用说明
- [ ] 更新日志
- [ ] 相关模板推荐

#### 发布和管理
- [ ] 模板发布流程
- [ ] 版本管理
- [ ] 许可证选择
- [ ] 使用统计
- [ ] 用户反馈

#### 社交功能
- [ ] 收藏模板
- [ ] 点赞和评分
- [ ] 评论系统
- [ ] 分享功能
- [ ] 关注作者

### UI设计参考

```
参考应用商店设计：
- VS Code Extensions Marketplace
- Figma Community
- Notion Templates
- GitHub Marketplace
```

---

## 跨阶段任务

### 1. 路由集成

**时间**: 持续
**文件**: `/src/App.jsx`

```jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 代码分割
const AgentsPage = lazy(() => import('@/pages/AgentsPage'))
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage'))
const ContextPage = lazy(() => import('@/pages/ContextPage'))
const SummaryPage = lazy(() => import('@/pages/SummaryPage'))
const TemplateMarketPage = lazy(() => import('@/pages/TemplateMarketPage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/context" element={<ContextPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/templates" element={<TemplateMarketPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 2. 导航菜单更新

**时间**: 持续
**文件**: `/src/components/sidebar/Sidebar.jsx`

```jsx
import {
  MessageSquare,
  Bot,
  Workflow,
  Brain,
  FileText,
  Store,
  BarChart3,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Agents', href: '/agents', icon: Bot, badge: 'New' },
  { name: 'Workflows', href: '/workflows', icon: Workflow, badge: 'New' },
  { name: 'Memory', href: '/context', icon: Brain },
  { name: 'Summary', href: '/summary', icon: FileText },
  { name: 'Templates', href: '/templates', icon: Store },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]
```

### 3. API客户端扩展

**时间**: 持续
**文件**: `/src/lib/apiClient.js`

随着每个阶段的推进，持续扩展API客户端：

```javascript
// Phase 1: Agent API ✅
export const agentAPI = { /* ... */ }

// Phase 2: Workflow API
export const workflowAPI = { /* ... */ }

// Phase 3: Context API
export const contextAPI = { /* ... */ }

// Phase 4: Summary API
export const summaryAPI = { /* ... */ }

// Phase 5: Template API
export const templateAPI = { /* ... */ }
```

---

## 性能优化计划

### 代码分割

```javascript
// 路由级别代码分割
const AgentsPage = lazy(() => import('@/pages/AgentsPage'))

// 组件级别代码分割
const WorkflowEditor = lazy(() =>
  import('@/components/workflows/WorkflowEditor')
)
```

### 数据缓存

```javascript
// 使用React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => agentAPI.list(),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}
```

### 虚拟化

```javascript
// 长列表虚拟化
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
```

---

## 测试策略

### 单元测试

```javascript
// 使用Vitest
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentCard } from './AgentCard'

describe('AgentCard', () => {
  it('renders agent name', () => {
    render(<AgentCard agent={{ name: 'Test Agent' }} />)
    expect(screen.getByText('Test Agent')).toBeInTheDocument()
  })
})
```

### 集成测试

```javascript
// 测试组件交互
import { render, fireEvent } from '@testing-library/react'

it('opens editor when clicking edit button', () => {
  const onEdit = vi.fn()
  render(<AgentCard agent={mockAgent} onEdit={onEdit} />)

  fireEvent.click(screen.getByText('Edit'))
  expect(onEdit).toHaveBeenCalledWith(mockAgent)
})
```

### E2E测试

```javascript
// 使用Playwright
import { test, expect } from '@playwright/test'

test('create new agent', async ({ page }) => {
  await page.goto('/agents')
  await page.click('text=Create Agent')
  await page.fill('input[name="name"]', 'New Agent')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=New Agent')).toBeVisible()
})
```

---

## 文档计划

### 技术文档
- [x] UI开发指南
- [x] 快速启动指南
- [x] UI实施报告
- [x] UI路线图
- [ ] API集成文档
- [ ] 组件API参考
- [ ] 故障排除指南

### 用户文档
- [ ] 用户手册
- [ ] 功能教程
- [ ] 最佳实践
- [ ] FAQ

---

## 里程碑

### Milestone 1: Agent系统完成 ✅
**日期**: 2025-10-16
**成果**:
- ✅ 5个核心组件
- ✅ 完整CRUD功能
- ✅ 任务执行监控
- ✅ 响应式设计

### Milestone 2: 工作流编辑器完成 🎯
**预计日期**: 2025-10-30
**目标**:
- [ ] 可视化编辑器
- [ ] 10种基础节点
- [ ] 节点属性配置
- [ ] 工作流执行

### Milestone 3: 核心功能完成
**预计日期**: 2025-11-15
**目标**:
- [ ] 上下文管理系统
- [ ] 总结系统增强
- [ ] 所有高优先级功能

### Milestone 4: 完整功能集
**预计日期**: 2025-11-30
**目标**:
- [ ] 模板市场
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 文档完善

---

## 资源需求

### 人力
- **前端开发**: 1-2人
- **UI/UX设计**: 0.5人（兼职）
- **测试**: 0.5人（兼职）

### 工具和服务
- 设计工具: Figma
- 图标库: Lucide React
- 图表库: Recharts
- 流程图: React Flow
- 状态管理: Zustand / React Query
- 测试: Vitest + Playwright

---

## 风险和挑战

### 技术风险

1. **React Flow性能**
   - 风险: 大型工作流性能问题
   - 缓解: 使用虚拟化，限制同时显示节点数

2. **状态管理复杂度**
   - 风险: 组件间状态同步困难
   - 缓解: 使用React Query缓存，Zustand管理全局状态

3. **浏览器兼容性**
   - 风险: 旧浏览器不支持新特性
   - 缓解: 使用polyfills，明确支持的浏览器版本

### 进度风险

1. **工作流编辑器复杂度**
   - 风险: 开发时间超出预期
   - 缓解: 分阶段开发，MVP优先

2. **API依赖**
   - 风险: 后端API延迟影响前端开发
   - 缓解: 使用Mock数据，并行开发

---

## 成功指标

### 性能指标
- [ ] 首次内容绘制 < 1.5s
- [ ] 最大内容绘制 < 2.5s
- [ ] 首次输入延迟 < 100ms
- [ ] 累积布局偏移 < 0.1

### 质量指标
- [ ] 单元测试覆盖率 > 80%
- [ ] E2E测试覆盖核心流程
- [ ] 零严重bug
- [ ] Lighthouse分数 > 90

### 用户体验
- [ ] 移动端完全响应式
- [ ] 暗色模式完美支持
- [ ] WCAG 2.1 AA标准
- [ ] 加载时间用户满意度 > 90%

---

## 总结

这个路线图提供了清晰的开发路径，从已完成的Agent系统到待开发的模板市场，涵盖了所有主要功能模块。

**关键重点**:
1. 🔴 优先完成工作流可视化编辑器（Phase 2核心）
2. 🟡 逐步实现上下文管理和总结系统
3. 🟢 最后开发模板市场的社交功能
4. ⚡ 持续进行性能优化和测试

**预计总时间**: 10周（2.5个月）

---

**路线图版本**: 1.0
**最后更新**: 2025-10-16
**维护者**: Development Team
