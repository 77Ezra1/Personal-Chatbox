# Agent 工具选择过滤优化

**日期**: 2025-10-26
**需求**: 优化 AIAgent，确保工具选择时只显示已配置且可用的 MCP 服务
**状态**: ✅ 已完成

---

## 📋 需求背景

用户反馈：在 Agent 编辑器中选择可用工具时，会显示所有启用的 MCP 服务的工具，包括那些需要 API Key 但尚未配置的服务。这导致：

1. **用户困惑**：看到很多工具，但实际上无法使用
2. **运行时错误**：Agent 选择了未配置的工具，执行时失败
3. **体验不佳**：需要用户手动判断哪些工具真正可用

**期望行为**：
- 只显示已正确配置（包含必需 API Keys）的服务的工具
- 用户自主添加的服务默认认为已配置
- 未配置 key 的服务不应出现在工具选择列表中

---

## 🔧 实现方案

### 方案概述

添加服务配置状态检查，通过 `isConfigured` 字段标识服务是否已配置必需的环境变量。

### 实现步骤

1. **后端添加配置检查逻辑** ([server/services/mcp-manager.cjs](server/services/mcp-manager.cjs))
   - 添加 `_isServiceConfigured()` 方法检查服务是否已配置
   - 在 `getInfo()` 返回的服务对象中添加 `isConfigured` 字段

2. **前端过滤未配置的服务** ([src/hooks/useMcpTools.js](src/hooks/useMcpTools.js))
   - 修改服务过滤条件：`enabled === true && isConfigured !== false && toolCount > 0`
   - 自动过滤掉未配置服务的工具

---

## 💻 代码修改详情

### 1. 后端：添加 config.cjs 引入

**文件**: [server/services/mcp-manager.cjs:6](server/services/mcp-manager.cjs#L6)

```javascript
const config = require('../config.cjs');
```

### 2. 后端：添加配置检查方法

**文件**: [server/services/mcp-manager.cjs:583-629](server/services/mcp-manager.cjs#L583-L629)

```javascript
/**
 * 检查服务是否已正确配置（有必需的 API Keys）
 * @param {string} serviceId - 服务ID
 * @param {Object} userEnvVars - 用户配置的环境变量
 * @returns {boolean} 是否已配置
 */
_isServiceConfigured(serviceId, userEnvVars) {
  // 获取服务的配置模板
  const serviceTemplate = config.services[serviceId];

  // 如果服务不存在于 config.cjs 中，认为是用户自定义服务，默认已配置
  if (!serviceTemplate) {
    return true;
  }

  // 如果服务不需要配置，直接返回 true
  if (!serviceTemplate.requiresConfig) {
    return true;
  }

  // 检查必需的环境变量是否已配置
  const requiredEnvKeys = Object.keys(serviceTemplate.env || {});

  // 如果没有必需的环境变量，返回 true
  if (requiredEnvKeys.length === 0) {
    return true;
  }

  // 解析用户配置的环境变量
  let parsedEnvVars = {};
  try {
    parsedEnvVars = typeof userEnvVars === 'string' ? JSON.parse(userEnvVars) : (userEnvVars || {});
  } catch (e) {
    return false;
  }

  // 检查所有必需的环境变量是否都有值
  for (const key of requiredEnvKeys) {
    const value = parsedEnvVars[key];
    // 如果值为空字符串或 undefined/null，认为未配置
    if (!value || value.trim() === '') {
      return false;
    }
  }

  return true;
}
```

**逻辑说明**：
1. 从 `config.cjs` 读取服务模板配置
2. 如果服务不在 config.cjs 中，认为是用户自定义服务，默认已配置
3. 检查服务是否标记为 `requiresConfig: true`
4. 检查用户配置的环境变量中是否包含所有必需的 key 且值非空

### 3. 后端：在 getInfo() 中使用配置检查

**文件**: [server/services/mcp-manager.cjs:653-664](server/services/mcp-manager.cjs#L653-L664)

```javascript
// ✅ 检查服务是否已正确配置（有必需的 API Keys）
const isConfigured = this._isServiceConfigured(serviceId, serviceConfig.env_vars);

allConfiguredServices.push({
  id: serviceId,
  dbId: serviceConfig.id,
  name: serviceConfig.name,
  description: serviceConfig.description || '',
  enabled: serviceConfig.enabled,
  status: status,
  loaded: status === 'running',
  isConfigured: isConfigured, // ✅ 新增：是否已配置必需的环境变量
  official: serviceConfig.official,
  // ... 其他字段
});
```

**返回数据示例**：

```json
{
  "success": true,
  "services": [
    {
      "id": "memory",
      "name": "Memory记忆系统",
      "enabled": true,
      "isConfigured": true,
      "status": "running",
      "toolCount": 9
    },
    {
      "id": "github",
      "name": "GitHub仓库管理",
      "enabled": true,
      "isConfigured": false,  // ❌ 未配置 GITHUB_PERSONAL_ACCESS_TOKEN
      "status": "stopped",
      "toolCount": 0
    }
  ]
}
```

### 4. 前端：过滤未配置的服务

**文件**: [src/hooks/useMcpTools.js:40-50](src/hooks/useMcpTools.js#L40-L50)

```javascript
if (servicesData.success) {
  // 只保留已启用、已配置且有工具的服务
  // 这样确保显示的服务都是真正可用的
  const enabledServices = servicesData.services.filter(s => {
    // 已启用 且 已配置（有必需的API Keys）且 有工具（toolCount > 0）
    return s.enabled === true && s.isConfigured !== false && s.toolCount > 0
  })
  setServices(enabledServices)

  logger.info(`Loaded ${enabledServices.length} enabled and configured services with tools (total ${servicesData.services.length} services)`)
}
```

**过滤条件说明**：
- `s.enabled === true`：用户在设置中启用了该服务
- `s.isConfigured !== false`：服务已配置必需的 API Keys（或不需要配置）
- `s.toolCount > 0`：服务正在运行且提供了工具

### 5. 前端：自动过滤工具列表

由于 `toolsByService` 和 `flatTools` 这两个 useMemo 依赖于已过滤的 `services` 列表（第77行和第118行），它们会自动过滤掉未配置服务的工具，**无需额外修改**。

```javascript
// toolsByService 自动只包含已配置服务的工具
const toolsByService = useMemo(() => {
  const enabledServiceIds = new Set(services.map(s => s.id)) // ✅ services 已过滤
  // ...
}, [services, tools])

// flatTools 自动只包含已配置服务的工具
const flatTools = useMemo(() => {
  const enabledServiceIds = new Set(services.map(s => s.id)) // ✅ services 已过滤
  // ...
}, [tools, services])
```

---

## 🎯 效果验证

### 测试场景 1：未配置 GitHub 服务

**配置前**：
- GitHub 服务已启用
- 但未配置 `GITHUB_PERSONAL_ACCESS_TOKEN`
- Agent 编辑器中显示 GitHub 相关工具（如 create_issue, search_repositories 等）

**配置后**：
- `isConfigured: false`
- GitHub 工具 **不再显示** 在 Agent 编辑器的工具列表中

### 测试场景 2：已配置 Brave Search 服务

**配置前**：
- Brave Search 服务已启用
- 已配置 `BRAVE_API_KEY`
- Agent 编辑器中显示 Brave Search 工具

**配置后**：
- `isConfigured: true`
- Brave Search 工具 **正常显示** 在 Agent 编辑器中

### 测试场景 3：用户自定义服务

**配置前**：
- 用户添加了自定义 MCP 服务（如 custom_service）
- 该服务不在 config.cjs 中

**配置后**：
- `isConfigured: true`（默认认为已配置）
- 自定义服务的工具 **正常显示** 在 Agent 编辑器中

### 测试场景 4：免费服务（无需配置）

**示例服务**：memory, filesystem, wikipedia, youtube_transcript, bilibili, coingecko

**配置后**：
- `isConfigured: true`（`requiresConfig: false`）
- 所有工具 **正常显示** 在 Agent 编辑器中

---

## 📊 影响范围

### 受影响的组件

1. **Agent 编辑器** ([src/components/agents/AgentEditor.jsx](src/components/agents/AgentEditor.jsx))
   - 使用 `useMcpTools()` hook 获取工具列表
   - 自动过滤掉未配置服务的工具

2. **MCP 服务管理页面** (间接影响)
   - `/api/mcp/services` 返回的数据现在包含 `isConfigured` 字段
   - 可以在 UI 中显示服务配置状态

### 需要配置的服务列表

根据 [server/config.cjs](server/config.cjs)，以下服务需要配置：

| 服务 ID | 服务名称 | 必需环境变量 | 获取方式 |
|---------|----------|-------------|---------|
| brave_search | Brave Search网页搜索 | BRAVE_API_KEY | [Brave Search API](https://brave.com/search/api/) |
| github | GitHub仓库管理 | GITHUB_PERSONAL_ACCESS_TOKEN | [GitHub Settings](https://github.com/settings/tokens) |
| google_maps | Google Maps位置服务 | GOOGLE_MAPS_API_KEY | [Google Cloud Console](https://console.cloud.google.com) |
| everart | EverArt图像生成 | EVERART_API_KEY | [EverArt官网](https://everart.ai) |
| slack | Slack消息服务 | SLACK_BOT_TOKEN | [Slack API](https://api.slack.com/apps) |
| postgresql | PostgreSQL数据库 | POSTGRES_CONNECTION_STRING | 本地安装或Docker |
| notion | Notion知识管理 | NOTION_API_KEY | [Notion Integrations](https://www.notion.so/my-integrations) |
| google_calendar | Google Calendar日程管理 | GOOGLE_CALENDAR_CREDENTIALS | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| gmail | Gmail邮件服务 | GMAIL_CREDENTIALS | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

---

## ✅ 优势

1. **用户体验提升**
   - 只看到真正可用的工具
   - 减少选择困惑
   - 避免运行时错误

2. **智能过滤**
   - 自动识别服务配置状态
   - 无需用户手动判断
   - 支持用户自定义服务

3. **配置引导**
   - 清晰标识哪些服务需要配置
   - 可以在 UI 中添加配置提示
   - 引导用户完成必要配置

4. **代码简洁**
   - 后端统一管理配置检查逻辑
   - 前端只需简单过滤条件
   - 易于维护和扩展

---

## 🔄 后续改进建议

### 1. UI 增强

在 MCP 服务管理页面显示配置状态：

```jsx
<ServiceCard service={service}>
  {!service.isConfigured && (
    <Badge variant="warning">
      需要配置 API Key
    </Badge>
  )}
  {service.isConfigured && service.enabled && (
    <Badge variant="success">
      已就绪
    </Badge>
  )}
</ServiceCard>
```

### 2. 配置引导

添加快捷配置入口：

```jsx
{!service.isConfigured && (
  <Button onClick={() => openConfigDialog(service)}>
    配置服务
  </Button>
)}
```

### 3. 批量检测

添加 API 接口检测所有服务的配置状态：

```javascript
// GET /api/mcp/check-config
{
  "services": [
    { "id": "github", "isConfigured": false, "missingKeys": ["GITHUB_PERSONAL_ACCESS_TOKEN"] },
    { "id": "brave_search", "isConfigured": true }
  ]
}
```

### 4. 实时验证

在用户输入 API Key 时实时验证：

```javascript
// POST /api/mcp/validate-config
{
  "serviceId": "github",
  "envVars": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
  }
}

// Response
{
  "valid": true,
  "message": "GitHub token is valid"
}
```

---

## 📝 相关文档

- [MCP_AUTO_ENABLE_ALL_SERVICES.md](MCP_AUTO_ENABLE_ALL_SERVICES.md) - MCP 服务默认启用配置
- [MCP_FRONTEND_AUTH_FIX.md](MCP_FRONTEND_AUTH_FIX.md) - 前端认证修复
- [MCP_AGENT_COMPATIBILITY_FIX.md](MCP_AGENT_COMPATIBILITY_FIX.md) - Agent 兼容性修复
- [MCP_SYSTEM_REFACTOR_FINAL.md](MCP_SYSTEM_REFACTOR_FINAL.md) - MCP 系统重构

---

## 🚀 部署说明

### 已完成

- [x] 后端代码修改（mcp-manager.cjs）
- [x] 前端代码修改（useMcpTools.js）
- [x] 服务器重启验证

### 测试验证

1. 打开 Agent 编辑器
2. 切换到 "Capabilities" 标签
3. 查看 "Tools" 部分的 MCP 工具列表
4. 验证只显示已配置服务的工具

### 回滚方案

如需回滚，恢复以下修改：

```bash
# 后端
git diff server/services/mcp-manager.cjs
git checkout server/services/mcp-manager.cjs

# 前端
git diff src/hooks/useMcpTools.js
git checkout src/hooks/useMcpTools.js
```

---

**修改时间**: 2025-10-26
**修改者**: Claude Code Assistant
**测试状态**: ✅ 服务器启动成功，等待用户验证
**影响用户**: 所有使用 Agent 功能的用户

---

## 🎉 完成确认

- [x] 添加 `_isServiceConfigured()` 方法
- [x] 在 `getInfo()` 中返回 `isConfigured` 字段
- [x] 前端过滤未配置的服务
- [x] 服务器重启成功
- [x] 生成文档
- [ ] 用户验证功能（待用户测试）

