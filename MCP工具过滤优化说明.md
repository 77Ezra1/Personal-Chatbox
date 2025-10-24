# MCP 工具过滤优化 - 只显示已配置且启用的服务

## 🎯 问题

之前的实现会显示所有可能的 MCP 工具，包括**未配置**和**未启用**的服务，导致用户看到一大堆不可用的工具。

## ✅ 解决方案

优化了 `useMcpTools` Hook 的过滤逻辑，确保**只显示用户已配置且已启用并正在运行**的 MCP 服务的工具。

---

## 📝 修改内容

### 文件: `src/hooks/useMcpTools.js`

#### 1. 服务过滤优化

**之前**:
```javascript
// 只保留已启用的服务
const enabledServices = servicesData.services.filter(s => s.enabled)
```

**现在**:
```javascript
// 只保留已启用且正在运行的服务
const enabledServices = servicesData.services.filter(s => {
  // 必须同时满足：enabled=true 且 status=running
  return s.enabled === true && s.status === 'running'
})

logger.info(`Loaded ${enabledServices.length} enabled and running services`)
```

#### 2. 工具过滤优化

**按服务分组的工具**:
```javascript
// 创建已启用服务的 ID 集合，用于快速查找
const enabledServiceIds = new Set(services.map(s => s.id))

tools.forEach(tool => {
  const serviceId = tool._serviceId || toolName.split('_')[0]

  // 只处理已启用且运行中的服务的工具
  if (!enabledServiceIds.has(serviceId)) {
    return  // 跳过未启用服务的工具
  }

  // ... 添加工具
})
```

**扁平化工具列表**:
```javascript
return tools
  .filter(tool => {
    const serviceId = tool._serviceId || tool.function.name.split('_')[0]
    return enabledServiceIds.has(serviceId)  // 只保留已启用服务的工具
  })
  .map(tool => ({
    value: tool.function.name,
    // ...
  }))
```

---

## 🔍 过滤条件

工具必须满足以下**所有条件**才会显示：

1. ✅ **服务已配置**: 用户在 MCP Services 中已添加该服务
2. ✅ **服务已启用**: `enabled = true`
3. ✅ **服务正在运行**: `status = 'running'`
4. ✅ **工具可用**: 工具在后端的 `getAllTools()` 中被返回

---

## 📊 过滤流程

```
后端: MCP Manager
  ↓
getAllTools() - 只返回 status='running' 的服务的工具
  ↓
API: GET /api/mcp/tools
  ↓
前端: useMcpTools Hook
  ↓
过滤服务: enabled=true && status='running'
  ↓
过滤工具: 只保留已启用服务的工具
  ↓
显示在 Agent Editor
```

---

## 🎨 用户体验改进

### 之前的问题

```
工具列表显示:
- token (未配置服务)
- search_nodes (未配置服务)
- search_files (未配置服务)
- findPage (未配置服务)
- ... 还有很多未配置的工具
```

用户困惑：
- ❌ 为什么有这么多工具？
- ❌ 这些工具能用吗？
- ❌ 我需要配置什么？

### 现在的体验

```
工具列表只显示:
- wikipedia_findPage (已配置且运行中)
- wikipedia_getPage (已配置且运行中)
- filesystem_read_file (已配置且运行中)
- filesystem_write_file (已配置且运行中)
```

用户清晰：
- ✅ 只看到真正可用的工具
- ✅ 所有显示的工具都可以立即使用
- ✅ 如果需要更多工具，去 MCP Services 启用

---

## 🧪 测试场景

### 场景 1: 没有启用任何 MCP 服务

**预期**:
- 工具列表为空
- 显示提示："暂无可用的 MCP 工具，请先在设置中启用 MCP Services"

### 场景 2: 启用了 Wikipedia 服务

**预期**:
- 只显示 Wikipedia 的工具（findPage, getPage 等）
- 不显示其他未启用服务的工具

### 场景 3: 启用了多个服务

**预期**:
- 显示所有已启用服务的工具
- 按类别正确分组
- 每个工具都可以正常使用

### 场景 4: 服务启用但未运行

**预期**:
- 不显示该服务的工具（因为 status !== 'running'）
- 用户需要在 MCP Services 中检查服务状态

---

## 📋 验证清单

- [x] 只显示 `enabled=true` 的服务
- [x] 只显示 `status='running'` 的服务
- [x] 工具列表过滤掉未启用服务
- [x] `toolsByService` 只包含已启用服务
- [x] `flatTools` 只包含已启用服务的工具
- [x] `toolsByCategory` 只包含已启用服务的工具
- [x] 添加日志记录服务和工具数量
- [x] 无 linter 错误

---

## 🔄 与后端的配合

### 后端已有的过滤

**`server/services/mcp-manager.cjs`**:

```javascript
getAllTools() {
  const allTools = [];

  for (const [serviceId, service] of this.services) {
    if (service.status !== 'running') continue;  // 只返回运行中的服务

    for (const tool of service.tools) {
      allTools.push({
        // ...
      });
    }
  }

  return allTools;
}
```

**`server/services/mcp-manager.cjs` - startService()**:

```javascript
async startService(serviceConfig) {
  const { id, enabled = true, autoLoad = true } = serviceConfig;

  if (!enabled || !autoLoad) {
    console.log(`跳过服务: ${id}`);
    return;  // 不启动未启用的服务
  }

  // ... 启动服务
}
```

### 前端的额外过滤

即使后端已经过滤，前端仍然进行**双重检查**：

1. 检查服务的 `enabled` 和 `status`
2. 只显示已启用服务 ID 集合中的工具
3. 确保数据一致性和安全性

---

## 💡 设计原则

### 1. 防御性编程
- 前后端都进行过滤
- 即使后端数据有误，前端也能正确显示

### 2. 用户友好
- 只显示可用的工具
- 减少用户困惑
- 提供清晰的空状态提示

### 3. 性能优化
- 使用 `Set` 进行快速查找
- 只在数据变化时重新计算 (`useMemo`)
- 减少不必要的渲染

---

## 🎯 总结

### 优化前
- ❌ 显示所有可能的工具（包括未配置的）
- ❌ 用户不知道哪些工具可用
- ❌ 选择了不可用的工具会导致执行失败

### 优化后
- ✅ 只显示已配置且启用的服务的工具
- ✅ 所有显示的工具都可以立即使用
- ✅ 用户体验更清晰、更可靠

---

**状态**: ✅ 已完成并测试
**修改时间**: 2025-01-15
**影响范围**: Agent Editor 工具选择功能

