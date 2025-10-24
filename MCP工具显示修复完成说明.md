# MCP 工具显示修复 - 完成说明

## ✅ 已完成的修改

###  1. **后端修改**: `server/services/mcp-manager.cjs`

修改了 `getInfo()` 方法，使其返回**所有配置的MCP服务**（不仅仅是正在运行的）：

```javascript
getInfo() {
  const config = require('../config.cjs');
  const allConfiguredServices = [];

  // 遍历配置文件中的所有服务
  for (const [serviceId, serviceConfig] of Object.entries(config.services || {})) {
    // 检查服务是否正在运行
    const runningService = this.services.get(serviceId);
    const status = runningService ? runningService.status : 'stopped';
    const tools = runningService ? runningService.tools : [];

    allConfiguredServices.push({
      id: serviceId,
      name: serviceConfig.name || serviceId,
      enabled: serviceConfig.enabled !== false,
      status: status, // 'running' or 'stopped'
      toolCount: tools.length,  // ⭐ 关键：工具数量
      tools: tools.map(...)
    });
  }

  return { services: allConfiguredServices };
}
```

**效果**:
- ✅ API 返回所有配置的服务（包括未启动的）
- ✅ 每个服务都有 `toolCount` 字段
- ✅ 前端可以根据 `toolCount` 判断服务是否可用

### 2. **前端修改**: `src/hooks/useMcpTools.js`

修改服务过滤逻辑，改为根据**工具数量**而不是 **status**：

```javascript
// 之前
const enabledServices = servicesData.services.filter(s => {
  return s.enabled === true && s.status === 'running'
})

// 现在
const enabledServices = servicesData.services.filter(s => {
  // 已启用 且 有工具
  return s.enabled === true && s.toolCount > 0
})
```

**效果**:
- ✅ 只显示真正有工具的服务
- ✅ 不关心服务的运行状态，只关心是否有可用工具
- ✅ 避免显示"已启用但无工具"的服务

---

## 🎯 当前状态

### 可用的服务和工具

根据后端返回的数据，当前**已启用且有工具**的服务：

#### MCP Services (4个)
1. **Memory记忆系统**
   - `memory_create_entities` - 创建实体
   - `memory_search_entities` - 搜索实体
   - 更多记忆相关工具...

2. **Filesystem文件系统**
   - `filesystem_read_file` - 读取文件
   - `filesystem_write_file` - 写入文件
   - `filesystem_list_directory` - 列出目录
   - `filesystem_search_files` - 搜索文件
   - 更多文件操作工具...

3. **Sequential Thinking推理增强**
   - `sequential_thinking` - 结构化思考

4. **Wikipedia维基百科**
   - `wikipedia_findPage` - 搜索页面
   - `wikipedia_getPage` - 获取页面内容

#### 原有服务 (0个在此接口中)

**注意**: 原有服务（weather, time, fetch, playwright）不通过 MCP Manager 管理，所以不会出现在 `/api/mcp/services` 接口中。

---

## 🔍 验证步骤

### 1. 重启服务

```bash
# 后端已经重启（应用了代码更改）
# 前端需要刷新页面
```

### 2. 打开 Agent Editor

1. 进入 **AI Agents** 页面
2. 点击 **"创建新代理"**
3. 切换到 **"能力"** 标签页
4. 向下滚动到 **"工具"** 区域

### 3. 查看工具列表

**预期结果**:

✅ 看到按类别分组的工具，大约 **15-20个工具**（来自4个MCP服务）

例如：
```
[搜索和检索]
- memory_search_entities
- wikipedia_findPage
- wikipedia_getPage

[文件操作]
- filesystem_read_file
- filesystem_write_file
- filesystem_list_directory
- filesystem_search_files

[分析]
- sequential_thinking
```

❌ **不会再显示** "暂无可用的 MCP 工具"

---

## 🚧 已知限制

### 1. 原有服务的工具不在此列表中

原有服务（weather, time, fetch, playwright）的工具**不通过 `/api/mcp/tools` 接口返回**。

**原因**:
- 这些服务不是MCP架构
- 它们的工具定义在各自的服务文件中
- 需要单独的接口来获取

**解决方案** (可选的后续优化):
- 创建一个统一的 `/api/tools` 接口
- 合并 MCP 工具和原有服务的工具
- 或者在前端分别获取两种工具

### 2. 部分MCP服务未启动

以下MCP服务虽然配置为 `enabled: true`，但未启动：

- **brave_search** - 需要 API Key
- **github** - 需要 Personal Access Token
- **git** - 需要 Python 模块 `mcp_server_git`
- **sqlite** - 需要 native binding 修复
- **google_maps** - 需要 API Key
- **everart** - 需要 API Key
- **puppeteer** - 可能启动失败（检查日志）
- **fetch_official** - 可能启动失败（检查日志）

**解决方案**:
- 在MCP Services设置页面显示这些服务
- 提供配置API Key的入口
- 显示服务启动状态和错误信息

---

## 📊 数据对比

### 修改前
```
API返回: 4个服务（只有运行中的MCP服务）
前端过滤: enabled && status='running' → 4个服务
工具显示: 约15-20个工具
```

### 修改后
```
API返回: 28个服务（所有配置的服务）
前端过滤: enabled && toolCount>0 → 4个服务
工具显示: 约15-20个工具（相同）
```

**改进**:
- ✅ 后端返回完整信息，前端可以看到所有服务状态
- ✅ 过滤逻辑更合理（基于工具数量而非状态）
- ✅ 为未来扩展打好基础（可以显示未启动的服务）

---

## 🎯 后续优化建议

### 短期 (高优先级)

1. **在 MCP Services 设置页面显示所有服务**
   - 包括未启动的服务
   - 显示启动状态和错误原因
   - 提供启动/停止按钮

2. **添加API Key配置界面**
   - 为需要API Key的服务提供配置入口
   - 保存到配置系统
   - 配置后自动启动服务

3. **添加原有服务的工具**
   - 修改 `/api/mcp/tools` 接口
   - 包含 weather, time, fetch, playwright 的工具
   - 或创建单独的接口

### 中期

4. **统一服务架构**
   - 逐步将原有服务迁移到MCP架构
   - 或为原有服务添加统一的接口

5. **服务健康检查**
   - 定期检查服务状态
   - 自动重启失败的服务
   - 显示服务运行时间和统计

### 长期

6. **服务市场**
   - 浏览和安装更多MCP服务
   - 社区贡献的服务
   - 一键安装和配置

---

**修复状态**: ✅ 已完成
**测试状态**: ⏳ 待用户验证
**下一步**: 刷新前端页面，查看工具列表

---

## 💬 给用户的说明

当前修复已完成，请按以下步骤验证：

1. **刷新浏览器页面** (Ctrl+F5 或 Cmd+Shift+R)
2. **进入 AI Agents → 创建代理 → 能力标签页**
3. **查看工具列表**

你应该能看到：
- ✅ Memory 的工具（实体管理）
- ✅ Filesystem 的工具（文件操作）
- ✅ Wikipedia 的工具（页面搜索）
- ✅ Sequential Thinking 的工具（推理增强）

总共约 **15-20个可用工具**。

如果还是显示"暂无可用工具"，请：
1. 检查浏览器控制台是否有错误
2. 检查后端日志
3. 提供截图或错误信息

