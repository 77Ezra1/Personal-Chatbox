# Personal Chatbox UI 快速启动指南

## 快速开始

本指南将帮助你在10分钟内集成已完成的UI组件到项目中。

---

## 第一步：安装依赖 (如已安装可跳过)

```bash
# 确保已安装所有必需的包
npm install

# 或使用pnpm (推荐)
pnpm install
```

核心依赖已在 package.json 中，无需额外安装。

---

## 第二步：集成Agent系统

### 1. 添加路由

编辑 `/src/App.jsx`，添加Agent路由：

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AgentsPage from '@/pages/AgentsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 现有路由 */}
        <Route path="/" element={<ChatContainer />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* 新增：Agent路由 */}
        <Route path="/agents" element={<AgentsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 2. 更新侧边栏导航

编辑 `/src/components/sidebar/Sidebar.jsx`：

```jsx
import { Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

// 在导航项中添加
<Link
  to="/agents"
  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
>
  <Bot className="size-5" />
  <span>AI Agents</span>
</Link>
```

### 3. 测试Agent页面

启动开发服务器：

```bash
npm run dev
```

访问 `http://localhost:5173/agents`，你应该看到Agent管理界面。

---

## 第三步：连接后端API

### 创建API客户端

创建 `/src/lib/apiClient.js`：

```javascript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 自动添加认证token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Agent API
export const agentAPI = {
  // 列表
  list: (params) => apiClient.get('/agents', { params }),

  // 获取单个
  get: (id) => apiClient.get(`/agents/${id}`),

  // 创建
  create: (data) => apiClient.post('/agents', data),

  // 更新
  update: (id, data) => apiClient.put(`/agents/${id}`, data),

  // 删除
  delete: (id) => apiClient.delete(`/agents/${id}`),

  // 执行任务
  execute: (id, task) => apiClient.post(`/agents/${id}/execute`, { task }),

  // 停止执行
  stop: (id) => apiClient.post(`/agents/${id}/stop`),

  // 获取统计
  getStats: (id) => apiClient.get(`/agents/${id}/stats`),

  // 获取执行历史
  getExecutions: (id) => apiClient.get(`/agents/${id}/executions`)
}

export default apiClient
```

### 更新AgentsPage使用API客户端

编辑 `/src/pages/AgentsPage.jsx`：

```jsx
import { agentAPI } from '@/lib/apiClient'

export default function AgentsPage() {
  // 替换直接使用axios的地方
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await agentAPI.list()
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSaveAgent = async (agentData) => {
    try {
      if (selectedAgent) {
        await agentAPI.update(selectedAgent.id, agentData)
        toast.success('Agent updated successfully')
      } else {
        await agentAPI.create(agentData)
        toast.success('Agent created successfully')
      }
      setEditorOpen(false)
      fetchAgents()
    } catch (error) {
      console.error('Failed to save agent:', error)
      toast.error(error.response?.data?.message || 'Failed to save agent')
    }
  }
}
```

---

## 第四步：集成工作流系统 (可选)

### 1. 安装React Flow

```bash
npm install reactflow

# 或
pnpm add reactflow
```

### 2. 添加工作流路由

```jsx
import WorkflowsPage from '@/pages/WorkflowsPage'

<Route path="/workflows" element={<WorkflowsPage />} />
```

### 3. 创建WorkflowsPage

创建 `/src/pages/WorkflowsPage.jsx`：

```jsx
import { useState, useEffect, useCallback } from 'react'
import { WorkflowList } from '@/components/workflows/WorkflowList'
import { toast } from 'sonner'
import { agentAPI } from '@/lib/apiClient'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      const response = await workflowAPI.list()
      setWorkflows(response.data.workflows || [])
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
      toast.error('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <WorkflowList
        workflows={workflows}
        loading={loading}
        onCreateWorkflow={() => console.log('Create workflow')}
        onExecute={(workflow) => console.log('Execute', workflow)}
        onEdit={(workflow) => console.log('Edit', workflow)}
        onDelete={(workflow) => console.log('Delete', workflow)}
        onDuplicate={(workflow) => console.log('Duplicate', workflow)}
        onViewDetails={(workflow) => console.log('View', workflow)}
        onImport={() => console.log('Import')}
        onExport={() => console.log('Export')}
      />
    </div>
  )
}
```

### 4. 添加Workflow API

在 `/src/lib/apiClient.js` 中添加：

```javascript
export const workflowAPI = {
  list: (params) => apiClient.get('/workflows', { params }),
  get: (id) => apiClient.get(`/workflows/${id}`),
  create: (data) => apiClient.post('/workflows', data),
  update: (id, data) => apiClient.put(`/workflows/${id}`, data),
  delete: (id) => apiClient.delete(`/workflows/${id}`),
  run: (id) => apiClient.post(`/workflows/${id}/run`),
  getLogs: (id) => apiClient.get(`/workflows/${id}/logs`),
  getStats: (id) => apiClient.get(`/workflows/${id}/stats`),
  import: (data) => apiClient.post('/workflows/import', data),
  export: (ids) => apiClient.get('/workflows/export', { params: { ids } })
}
```

---

## 第五步：配置主题和样式

### 确保Tailwind配置正确

编辑 `tailwind.config.js`：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

### 确保CSS变量定义正确

编辑 `src/index.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 47.4% 11.2%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --card: 224 71% 4%;
    --card-foreground: 213 31% 91%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 222.2 47.4% 11.2%;
    --secondary-foreground: 210 40% 98%;
    --muted: 223 47% 11%;
    --muted-foreground: 215.4 16.3% 56.9%;
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 216 34% 17%;
    --input: 216 34% 17%;
    --ring: 216 34% 17%;
  }
}
```

---

## 测试清单

完成上述步骤后，测试以下功能：

### Agent系统
- [ ] 访问 `/agents` 页面正常显示
- [ ] 点击"Create Agent"打开编辑器
- [ ] 填写表单，创建新Agent
- [ ] Agent卡片正确显示
- [ ] 点击"Execute"打开任务执行器
- [ ] 搜索和过滤功能正常
- [ ] 编辑和删除Agent功能正常

### 工作流系统
- [ ] 访问 `/workflows` 页面正常显示
- [ ] 工作流列表正确显示
- [ ] 搜索和筛选功能正常
- [ ] 卡片点击事件正常

### 主题
- [ ] 亮色模式显示正常
- [ ] 暗色模式显示正常
- [ ] 主题切换流畅

### 响应式
- [ ] 移动端 (375px) 显示正常
- [ ] 平板 (768px) 显示正常
- [ ] 桌面 (1024px+) 显示正常

---

## 常见问题

### 1. 组件样式不正确

**问题**: 组件没有显示预期的样式

**解决方案**:
```bash
# 1. 检查Tailwind是否正确配置
npm run dev

# 2. 清除缓存并重新构建
rm -rf node_modules/.vite
npm run dev
```

### 2. 图标不显示

**问题**: Lucide图标不显示

**解决方案**:
```bash
# 确保安装了lucide-react
npm install lucide-react

# 检查导入路径
import { Bot, Play, Edit } from 'lucide-react'
```

### 3. 路由不工作

**问题**: 访问 `/agents` 显示404

**解决方案**:
```jsx
// 确保使用了BrowserRouter
import { BrowserRouter } from 'react-router-dom'

<BrowserRouter>
  <Routes>
    {/* 路由配置 */}
  </Routes>
</BrowserRouter>
```

### 4. API请求失败

**问题**: 后端API返回错误

**解决方案**:
```javascript
// 1. 检查后端是否运行
// 2. 检查API基础URL
const apiClient = axios.create({
  baseURL: '/api',  // 或 'http://localhost:3000/api'
})

// 3. 检查token是否正确设置
console.log('Token:', localStorage.getItem('token'))
```

### 5. TypeScript错误

**问题**: 如果使用TypeScript，可能遇到类型错误

**解决方案**:
```bash
# 安装类型定义
npm install --save-dev @types/react @types/react-dom

# 或者在tsconfig.json中添加
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

## 下一步

### 立即可用的功能
- ✅ Agent管理界面
- ✅ Agent创建和编辑
- ✅ 任务执行监控
- ✅ 工作流列表管理

### 需要开发的功能
1. **工作流可视化编辑器** - 核心功能，需要集成React Flow
2. **上下文管理系统** - 记忆管理界面
3. **总结系统增强** - 模板管理和导出
4. **模板市场** - 模板浏览和使用

### 参考文档
- [UI开发指南](./UI_DEVELOPMENT_GUIDE.md) - 完整的开发文档
- [实施报告](./UI_OPTIMIZATION_IMPLEMENTATION.md) - 已完成工作总结
- [shadcn/ui文档](https://ui.shadcn.com/) - 组件库文档

---

## 获取帮助

遇到问题？

1. 检查浏览器控制台错误
2. 查看 [UI开发指南](./UI_DEVELOPMENT_GUIDE.md) 的详细说明
3. 检查后端API是否正常运行
4. 确保所有依赖已正确安装

---

**快速启动指南版本**: 1.0
**最后更新**: 2025-10-16
