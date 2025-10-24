# MCP 服务显示问题 - 解决方案

## 🔍 问题分析

用户反馈："为什么是暂无可用的 MCP 工具？系统不是有内置了14个MCP服务吗？"

### 现状

1. **配置文件中有17个 `enabled: true` 的服务**
2. **实际只有4个MCP服务正在运行**：
   - Memory记忆系统
   - Filesystem文件系统
   - Sequential Thinking推理增强
   - Wikipedia维基百科

3. **其他13个启用的服务没有运行**：
   - 5个是**原有内置服务**（weather, time, fetch, playwright等）- 不通过MCP Manager管理
   - 8个是**MCP服务但未启动**（可能需要依赖、API Key等）

---

## 🎯 根本原因

### 1. 混合架构

系统中有两种类型的服务：

**类型A: MCP Services（新架构）**
- 通过 MCP Manager 启动和管理
- 使用 stdio 协议通信
- 例如：memory, filesystem, wikipedia

**类型B: 原有内置服务（旧架构）**
- 直接在 Node.js 中实现
- 不需要启动外部进程
- 例如：weather, time, fetch, playwright

### 2. 状态映射问题

```javascript
// 当前逻辑
if (s.enabled === true && s.status === 'running') {
  // 显示服务
}

// 问题：
// - MCP Services: status = 'running' 或 'stopped'
// - 原有服务: status = '' (空字符串)
```

### 3. 工具可用性

- **MCP Services的工具**：只有 `status === 'running'` 时才有工具
- **原有服务的工具**：始终可用（如果 `enabled === true`）

---

## ✅ 解决方案

### 方案1: 分离显示逻辑（推荐）

在 Agent Editor 中：
- **显示所有已启用且有工具的服务**
- 不关心 `status`，只关心工具是否存在

```javascript
// 修改前
const enabledServices = servicesData.services.filter(s => {
  return s.enabled === true && s.status === 'running'
})

// 修改后
const enabledServices = servicesData.services.filter(s => {
  // 只要服务已启用且有工具，就显示
  return s.enabled === true && s.toolCount > 0
})
```

### 方案2: 修复原有服务的状态

为原有服务添加正确的 `status`：

```javascript
// 在各个原有服务的 getInfo() 中
getInfo() {
  return {
    id: 'weather',
    name: '天气服务',
    enabled: true,
    status: 'running',  // ⭐ 添加这个
    toolCount: 2,
    tools: [...]
  }
}
```

### 方案3: 统一通过工具数量判断（最简单）

```javascript
// 工具过滤逻辑
const availableTools = tools.filter(tool => {
  const serviceId = tool._serviceId || tool.function.name.split('_')[0]
  const service = services.find(s => s.id === serviceId)

  // 只要服务存在、已启用、且有工具，就认为可用
  return service && service.enabled && service.toolCount > 0
})
```

---

## 🔧 实施步骤

### 第1步: 修改前端过滤逻辑

**文件**: `src/hooks/useMcpTools.js`

```javascript
// 修改服务过滤
const enabledServices = servicesData.services.filter(s => {
  // 已启用 且 有工具
  return s.enabled === true && s.toolCount > 0
})
```

### 第2步: 工具列表只保留有实际工具的

```javascript
// 按服务分组时，跳过没有工具的服务
tools.forEach(tool => {
  const serviceId = tool._serviceId || toolName.split('_')[0]

  // 确保服务存在且已启用
  if (!enabledServiceIds.has(serviceId)) {
    return
  }

  // ... 添加工具
})
```

### 第3步: 在 Agent Editor 显示提示

如果服务已启用但没有工具：

```jsx
{enabledServices.length > 0 && flatTools.length === 0 ? (
  <div className="text-sm text-muted-foreground text-center py-8">
    <p>找到 {enabledServices.length} 个已启用的服务</p>
    <p>但暂时没有可用的工具</p>
    <p className="text-xs mt-2">
      可能原因：服务正在启动中，或需要配置 API Key
    </p>
  </div>
) : null}
```

---

## 📊 当前服务状态

### 正在运行的 MCP 服务 (4个)

1. ✅ **Memory记忆系统** - 2个工具
2. ✅ **Filesystem文件系统** - 10+个工具
3. ✅ **Sequential Thinking** - 1个工具
4. ✅ **Wikipedia维基百科** - 2个工具

### 原有内置服务 (5个)

1. ✅ **天气服务** - 2个工具
2. ✅ **时间服务** - 2个工具
3. ✅ **Fetch网页抓取** - 1个工具
4. ✅ **Playwright浏览器** - 6+个工具
5. ✅ **多引擎搜索** - 3个工具

### 未启动的 MCP 服务 (8个)

原因可能是：
- ❌ 需要 API Key（brave_search, github等）
- ❌ 缺少依赖（git需要Python模块）
- ❌ 启动失败（检查后端日志）

---

## 🎯 最终效果

修改后，用户在 Agent Editor 中应该看到：

```
工具 (约30+个可用工具)

[搜索和检索]
- memory_create_entities
- memory_search_entities
- wikipedia_findPage
- wikipedia_getPage
- search_web (来自原有搜索服务)

[文件操作]
- filesystem_read_file
- filesystem_write_file
- filesystem_list_directory
- ...

[浏览器自动化]
- playwright_navigate
- playwright_click
- playwright_screenshot
- ...

已选工具: (显示选中的工具Badges)
```

---

## 🔍 验证步骤

1. **刷新前端页面**
2. **进入 AI Agents → 创建代理 → 能力标签页**
3. **查看工具列表**

预期结果：
- ✅ 看到约30+个工具（来自4个MCP服务 + 5个原有服务）
- ✅ 工具按类别正确分组
- ✅ 可以选择和使用这些工具

---

**状态**: 📝 待实施
**优先级**: 🔴 高（影响用户体验）

