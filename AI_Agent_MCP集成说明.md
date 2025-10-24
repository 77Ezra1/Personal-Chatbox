# AI Agent 与 MCP Services 集成 - 完整说明

## 🎯 功能概述

现在 AI Agents 可以使用真正的 MCP Services 工具了！在创建或编辑 AI Agent 时，你可以：
- ✅ 查看所有已启用的 MCP 服务工具
- ✅ 按类别浏览工具（搜索、文件、数据、API 等）
- ✅ 选择工具赋予 Agent
- ✅ Agent 执行任务时可以真正调用这些工具

---

## ✨ 新增功能

### 1. **MCP 工具集成**
- 自动加载所有已启用的 MCP 服务
- 获取每个服务提供的工具列表
- 实时同步工具状态

### 2. **智能分类显示**
工具按类别自动分组：
- 🔍 **搜索和检索** - search, find, query 相关
- 📁 **文件操作** - read_file, write_file, file 相关
- 📊 **数据处理** - data_transform, parse, process 相关
- 🌐 **API 和网络** - http, fetch, api, request 相关
- ⚙️ **自动化** - run, execute, auto 相关
- 📈 **分析** - analyze, calculate, statistics 相关
- 🔧 **其他** - 未分类的工具

### 3. **可视化工具选择器**
- **滚动区域**：最多显示 300px 高度，自动滚动
- **工具卡片**：显示工具名称和描述
- **选中状态**：圆点标记 + 高亮显示
- **已选工具**：底部显示 Badge，可快速移除

### 4. **向后兼容**
- 保留原有的静态工具选项
- 通过开关切换 MCP 工具 / 静态工具
- 已选择的工具会被保存

---

## 🔧 技术实现

### 新增文件

#### 1. `src/hooks/useMcpTools.js`
负责获取和管理 MCP 工具的 Hook

**功能**：
```javascript
const {
  services,          // MCP 服务列表
  tools,             // 所有工具
  toolsByService,    // 按服务分组的工具
  flatTools,         // 扁平化工具列表
  toolsByCategory,   // 按类别分组的工具
  loading,           // 加载状态
  error,             // 错误信息
  reload             // 重新加载
} = useMcpTools()
```

**数据流**：
```
1. 并行请求 /api/mcp/services 和 /api/mcp/tools
   ↓
2. 过滤出已启用的服务
   ↓
3. 解析工具信息（服务ID、工具名、描述、参数）
   ↓
4. 按类别自动分组
   ↓
5. 返回给组件使用
```

**智能分类逻辑**：
```javascript
// 根据工具名称和描述自动分类
if (toolName.includes('search') || desc.includes('搜索')) {
  → 搜索和检索
} else if (toolName.includes('file') || desc.includes('文件')) {
  → 文件操作
}
// ... 等等
```

### 修改文件

#### 2. `src/components/agents/AgentEditor.jsx`
在 Agent 编辑器中集成 MCP 工具选择

**新增 UI 元素**：

1. **MCP 开关**：
```jsx
<Switch
  checked={showMcpTools}
  onCheckedChange={setShowMcpTools}
/>
<span>MCP Services</span>
```

2. **工具列表滚动区域**：
```jsx
<ScrollArea className="h-[300px]">
  {/* 按类别显示工具 */}
</ScrollArea>
```

3. **工具选择按钮**：
```jsx
<Button variant={isSelected ? 'default' : 'ghost'}>
  <div className="圆点标记" />
  <div className="工具名称和描述" />
</Button>
```

4. **已选工具 Badges**：
```jsx
{selectedTools.map(tool => (
  <Badge>
    {tool.name}
    <X onClick={removeTool} />
  </Badge>
))}
```

---

## 📋 使用流程

### 步骤 1: 启用 MCP Services

在设置中启用你需要的 MCP 服务：
```
设置 → MCP Services → 启用服务
```

例如：
- ✅ Wikipedia（搜索）
- ✅ Filesystem（文件操作）
- ✅ Playwright（浏览器自动化）

### 步骤 2: 创建/编辑 AI Agent

```
AI Agents 页面 → 创建新代理 / 编辑现有代理
```

### 步骤 3: 选择工具

在 **"能力"** 标签页：

1. **确保 MCP Services 开关已打开**
   - 右上角的开关应该是启用状态

2. **浏览可用工具**
   - 工具按类别分组显示
   - 每个工具显示名称和描述

3. **选择工具**
   - 点击工具卡片选中/取消
   - 选中的工具会高亮显示
   - 底部显示已选工具的 Badges

4. **查看已选工具**
   - 底部 Badges 显示所有已选工具
   - 点击 Badge 上的 X 可以移除

### 步骤 4: 保存 Agent

点击"创建代理"或"保存"按钮，工具配置会被保存到 Agent 的 `config.tools` 数组中。

---

## 🎨 UI 设计特点

### 视觉层次

```
工具选择区域
├─ 标题栏
│  ├─ "工具" 标签
│  └─ MCP Services 开关
├─ 加载状态 / 工具列表 / 空状态
│  ├─ [类别1: 搜索和检索]
│  │  ├─ 工具1
│  │  ├─ 工具2
│  │  └─ ...
│  ├─ [类别2: 文件操作]
│  │  ├─ 工具A
│  │  └─ ...
│  └─ ...
└─ 已选工具 Badges
   ├─ Badge: 工具1 [X]
   ├─ Badge: 工具2 [X]
   └─ ...
```

### 样式特点

- **紧凑布局**：工具按钮高度自动，支持多行文字
- **清晰标识**：选中的工具有实心圆点 + 背景高亮
- **分类标题**：灰色小字，显示类别名称和工具数量
- **滚动区域**：固定高度 300px，内容过多时可滚动
- **响应式**：单列布局，适合各种屏幕宽度

---

## 🔗 数据格式

### Agent 保存的工具数据

```javascript
{
  "name": "研究助手",
  "type": "task-based",
  "config": {
    "tools": [
      "wikipedia_findPage",           // MCP 工具
      "wikipedia_getPage",
      "filesystem_read_file",
      "playwright_navigate",
      "web_search"                    // 静态工具（兼容）
    ]
  }
}
```

### 工具 ID 格式

MCP 工具使用格式：`{serviceId}_{toolName}`

示例：
- `wikipedia_findPage` - Wikipedia 服务的 findPage 工具
- `filesystem_read_file` - Filesystem 服务的 read_file 工具
- `memory_create_entities` - Memory 服务的 create_entities 工具

---

## ⚡ 工具调用流程

```
用户给 Agent 下达任务
  ↓
Agent 分析任务，决定使用哪些工具
  ↓
调用 /api/mcp/call 执行工具
  ↓
{
  toolName: "wikipedia_findPage",
  parameters: { query: "AI" }
}
  ↓
MCP Manager 解析工具名
  ↓
serviceId = "wikipedia"
toolName = "findPage"
  ↓
调用 Wikipedia MCP 服务
  ↓
返回结果给 Agent
  ↓
Agent 使用结果继续任务
```

---

## 📊 功能对比

| 功能 | 之前 | 现在 |
|------|------|------|
| 工具来源 | 静态定义 | MCP Services 动态加载 ✅ |
| 工具数量 | 5 个固定 | 无限制（取决于 MCP 服务）✅ |
| 工具更新 | 需要修改代码 | 自动同步 MCP 服务 ✅ |
| 工具分类 | 无 | 智能自动分类 ✅ |
| 工具描述 | 简单标签 | 详细描述 ✅ |
| 实际功能 | 模拟/占位符 | 真正可调用的 MCP 工具 ✅ |
| 向后兼容 | N/A | 保留静态工具选项 ✅ |

---

## 🎯 使用示例

### 示例 1: 创建研究助手

1. **选择能力**：Research, Writing
2. **选择工具**：
   - `wikipedia_findPage` - 搜索维基百科
   - `wikipedia_getPage` - 获取页面内容
   - `filesystem_write_file` - 保存研究结果
3. **效果**：Agent 可以搜索维基百科并保存结果到文件

### 示例 2: 创建数据分析助手

1. **选择能力**：Data Processing, Analysis
2. **选择工具**：
   - `filesystem_read_file` - 读取数据文件
   - 数据处理相关工具
3. **效果**：Agent 可以读取文件并进行数据分析

### 示例 3: 创建网页测试助手

1. **选择能力**：Automation
2. **选择工具**：
   - `playwright_navigate` - 打开网页
   - `playwright_click` - 点击元素
   - `playwright_screenshot` - 截图
3. **效果**：Agent 可以自动化测试网页

---

## 🔧 开发者注意事项

### 工具 ID 兼容性

Agent Editor 会自动处理新旧格式的工具：

```javascript
// 旧格式（静态工具）
tools: ["web_search", "read_file"]

// 新格式（MCP 工具）
tools: ["wikipedia_findPage", "filesystem_read_file"]

// 混合格式（兼容）
tools: ["web_search", "wikipedia_findPage"]
```

### 添加新的工具类别

在 `useMcpTools.js` 中修改 `toolsByCategory` 逻辑：

```javascript
const categories = {
  search: { name: '搜索和检索', tools: [] },
  file: { name: '文件操作', tools: [] },
  // 添加新类别
  newCategory: { name: '新类别名称', tools: [] }
}

// 添加分类规则
if (toolName.includes('关键词')) {
  categories.newCategory.tools.push(tool)
}
```

### 自定义工具显示

修改 `AgentEditor.jsx` 中的工具按钮组件：

```jsx
<Button>
  {/* 自定义图标 */}
  <CustomIcon />
  {/* 自定义标题 */}
  <div>{customTitle}</div>
</Button>
```

---

## ✅ 测试建议

### 测试用例

1. **空状态测试**
   - 禁用所有 MCP 服务
   - 验证显示"暂无可用工具"提示

2. **工具选择测试**
   - 选择多个工具
   - 验证底部 Badges 正确显示
   - 验证保存后重新打开工具仍被选中

3. **开关切换测试**
   - 切换 MCP Services 开关
   - 验证显示 MCP 工具 vs 静态工具

4. **分类测试**
   - 验证工具被正确分类
   - 验证每个类别显示工具数量

5. **兼容性测试**
   - 打开旧的 Agent（使用静态工具）
   - 验证工具仍能正常显示和编辑

---

## 🚀 后续优化建议

### 短期
- [ ] 添加工具搜索功能
- [ ] 支持按服务筛选工具
- [ ] 显示工具参数预览
- [ ] 添加工具使用示例

### 中期
- [ ] 工具依赖检查（某些工具需要其他工具）
- [ ] 推荐工具（根据 Agent 类型）
- [ ] 工具使用统计
- [ ] 批量选择/取消工具

### 长期
- [ ] 可视化工具流程编排
- [ ] 自定义工具组合
- [ ] 工具效果模拟预览
- [ ] 智能工具推荐（AI 分析任务并推荐工具）

---

## 📚 相关文档

- [MCP Services 配置说明](./MCP_用户自定义服务功能说明.md)
- [MCP 后端支持说明](./MCP_后端支持说明.md)
- [MCP 手动配置功能](./MCP_手动配置功能说明.md)

---

**✅ 集成完成！**

现在 AI Agents 可以使用真正的 MCP 工具执行任务了！🎉

你的 Agent 将拥有：
- 🔍 真实的搜索能力（Wikipedia, Brave Search 等）
- 📁 真实的文件操作（Filesystem）
- 🌐 真实的网页交互（Playwright）
- 🧠 真实的记忆能力（Memory）
- 💾 真实的数据库访问（SQLite, PostgreSQL 等）
- ...以及所有你启用的 MCP 服务提供的能力！

