# MCP 服务默认启用配置更新

**日期**: 2025-10-26
**修改**: 将所有内置 MCP 服务设置为默认启用
**状态**: ✅ 已完成

---

## 📋 修改概述

根据用户要求"把系统内置的服务全部默认启动"，修改了 [server/config.cjs](server/config.cjs)，将所有内置 MCP 服务的 `autoLoad` 属性从 `false` 改为 `true`。

### 影响范围

当新用户首次使用系统时，`mcp-service.cjs` 的 `initializeDefaultServicesForUser()` 方法会根据 `autoLoad` 属性决定服务是否启用：

```javascript
// server/services/mcp-service.cjs 第72行
enabled: service.autoLoad ? true : false
```

**修改前**: 只有部分服务（memory, filesystem, sqlite, wikipedia 等）默认启用
**修改后**: 所有内置服务都默认启用（除了已废弃的服务）

---

## 🔧 修改的服务列表

| 服务 ID | 服务名称 | 行号 | 是否需要配置 | 备注 |
|---------|----------|------|-------------|------|
| google_maps | Google Maps位置服务 | 231 | ✅ 需要 API Key | 地点搜索、路线规划 |
| everart | EverArt图像生成 | 255 | ✅ 需要 API Key | AI图像生成 |
| magg | Magg元服务器 | 281 | ⚠️ 需要 Python 3.12+ | AI自主管理MCP服务 |
| slack | Slack消息服务 | 320 | ✅ 需要 Bot Token | 消息通知和协作 |
| postgresql | PostgreSQL数据库 | 359 | ✅ 需要连接字符串 | 生产级关系数据库 |
| notion | Notion知识管理 | 402 | ✅ 需要 Integration Token | 知识库管理 |
| google_calendar | Google Calendar日程管理 | 433 | ✅ 需要 OAuth2 | 日程管理 |
| gmail | Gmail邮件服务 | 464 | ✅ 需要 OAuth2 | 邮件处理 |
| bilibili | Bilibili视频服务 | 497 | ❌ 免费 | B站视频信息 |
| coingecko | CoinGecko加密货币 | 508 | ❌ 免费 | 加密货币数据 |

**总计**: 10 个服务从 `autoLoad: false` 改为 `autoLoad: true`

---

## 📊 已启用的服务

### 第一批 - 官方 MCP 服务 (已默认启用)

| 服务 | 状态 | 描述 |
|------|------|------|
| memory | ✅ 已启用 | 知识图谱式记忆系统 |
| filesystem | ✅ 已启用 | 文件系统操作 |
| sequential_thinking | ✅ 已启用 | 推理增强 |
| sqlite | ✅ 已启用 | SQLite数据库 |
| wikipedia | ✅ 已启用 | 维基百科查询 |
| brave_search | ✅ 已启用 | 网页搜索（需要API Key） |
| github | ✅ 已启用 | GitHub仓库管理（需要Token） |

### 第二批 - 原有服务 (已默认启用)

| 服务 | 状态 | 描述 |
|------|------|------|
| weather | ✅ 已启用 | 天气信息 |
| time | ✅ 已启用 | 时间服务 |
| search | ✅ 已启用 | 多引擎搜索 |
| fetch | ✅ 已启用 | 网页内容抓取 |
| playwright | ✅ 已启用 | 浏览器自动化 |
| puppeteer | ✅ 已启用 | Puppeteer浏览器控制 |
| youtube_transcript | ✅ 已启用 | YouTube字幕提取 |

### 第三批 - 本次修改启用的服务

| 服务 | 状态 | 描述 |
|------|------|------|
| google_maps | 🆕 现已启用 | Google Maps位置服务 |
| everart | 🆕 现已启用 | EverArt图像生成 |
| magg | 🆕 现已启用 | Magg元服务器 |
| slack | 🆕 现已启用 | Slack消息服务 |
| postgresql | 🆕 现已启用 | PostgreSQL数据库 |
| notion | 🆕 现已启用 | Notion知识管理 |
| google_calendar | 🆕 现已启用 | Google Calendar日程管理 |
| gmail | 🆕 现已启用 | Gmail邮件服务 |
| bilibili | 🆕 现已启用 | Bilibili视频服务 |
| coingecko | 🆕 现已启用 | CoinGecko加密货币 |

---

## ⚠️ 重要说明

### 1. 需要配置的服务

部分服务需要 API Key 或凭据才能正常工作：

| 服务 | 配置要求 | 获取方式 |
|------|---------|---------|
| google_maps | GOOGLE_MAPS_API_KEY | [Google Cloud Console](https://console.cloud.google.com) |
| everart | EVERART_API_KEY | [EverArt官网](https://everart.ai) |
| brave_search | BRAVE_API_KEY | [Brave Search API](https://brave.com/search/api/) |
| github | GITHUB_PERSONAL_ACCESS_TOKEN | [GitHub Settings](https://github.com/settings/tokens) |
| slack | SLACK_BOT_TOKEN | [Slack API](https://api.slack.com/apps) |
| postgresql | POSTGRES_CONNECTION_STRING | 本地安装或Docker |
| notion | NOTION_API_KEY | [Notion Integrations](https://www.notion.so/my-integrations) |
| google_calendar | GOOGLE_CALENDAR_CREDENTIALS | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| gmail | GMAIL_CREDENTIALS | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

**启动行为**:
- 如果没有配置 API Key，服务会在用户配置表中显示为"已启用"
- 但实际运行时可能失败（取决于服务实现）
- 用户可以在设置页面看到所有服务，并手动配置凭据

### 2. 需要额外依赖的服务

| 服务 | 依赖 | 安装方法 |
|------|------|---------|
| magg | Python 3.12+ & uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh && uv tool install magg` |
| postgresql | PostgreSQL | `sudo apt install postgresql` 或 Docker |

### 3. 免费服务

以下服务完全免费，无需任何配置即可使用：
- bilibili (B站视频)
- coingecko (加密货币)
- wikipedia (维基百科)
- youtube_transcript (YouTube字幕)
- weather (天气)
- time (时间)
- search (搜索)
- fetch (网页抓取)

---

## 🔄 生效时间

### 对现有用户

**不影响**: 此修改只影响**新用户**的初始化配置。

现有用户的服务配置已经存储在数据库 `user_mcp_configs` 表中，不会被覆盖。

### 对新用户

**自动生效**: 新用户首次登录时，系统会调用 `initializeDefaultServicesForUser(userId)` 方法：

```javascript
// server/services/mcp-service.cjs
async initializeDefaultServicesForUser(userId) {
  const builtInServices = this.getBuiltInServices();

  services.forEach(service => {
    stmt.run(
      userId,
      service.id,
      service.name,
      service.description || '',
      JSON.stringify(service.args || []),
      JSON.stringify(service.env || {}),
      service.autoLoad ? true : false, // ✅ 这里决定是否启用
      'stopped',
      0
    );
  });
}
```

**结果**: 新用户将看到所有 24 个内置服务都已启用，可以直接使用（前提是已配置必要的凭据）。

---

## 📝 代码修改详情

### 修改文件
[server/config.cjs](server/config.cjs)

### 修改类型
将以下行从 `autoLoad: false` 改为 `autoLoad: true`:

```diff
// Google Maps
- autoLoad: false,
+ autoLoad: true,

// EverArt
- autoLoad: false,
+ autoLoad: true,

// Magg
- autoLoad: false,
+ autoLoad: true,

// Slack
- autoLoad: false,
+ autoLoad: true,

// PostgreSQL
- autoLoad: false,
+ autoLoad: true,

// Notion
- autoLoad: false,
+ autoLoad: true,

// Google Calendar
- autoLoad: false,
+ autoLoad: true,

// Gmail
- autoLoad: false,
+ autoLoad: true,

// Bilibili
- autoLoad: false,
+ autoLoad: true,

// CoinGecko
- autoLoad: false,
+ autoLoad: true,
```

### 未修改的服务

以下已废弃的服务保持 `autoLoad: false`:
- youtube (旧版，已被 youtube_transcript 替代)
- coincap (旧版，已被 coingecko 替代)

---

## ✅ 验证方法

### 方法 1: 创建新用户

1. 清空数据库或创建新测试用户
2. 登录系统
3. 打开 设置 → MCP Services
4. 应该看到所有 24 个内置服务都已启用

### 方法 2: 检查数据库

```sql
-- 查询某个用户的服务配置
SELECT id, name, enabled
FROM user_mcp_configs
WHERE user_id = 'test_user'
ORDER BY id;

-- 预期结果: enabled = 1 (true) 的服务应该有 24 个
```

### 方法 3: 查看日志

启动后端服务器时，应该看到：

```
[MCP] Initializing default services for user: test_user
[MCP] Created 24 default service configurations
```

---

## 🎯 后续建议

### 1. 用户引导

在 MCP 服务页面添加提示：
```
⚠️ 部分服务需要 API Key 才能使用
📝 点击服务卡片查看配置说明
🔗 点击"获取API Key"链接快速注册
```

### 2. 服务状态检测

考虑添加服务健康检查：
- 启用但未配置 API Key: 显示"需要配置"
- 启用且已配置: 显示"就绪"
- 启用但运行失败: 显示"错误"

### 3. 批量配置

添加批量导入功能：
```javascript
// 允许用户导入 .env 文件配置所有服务
BRAVE_API_KEY=xxx
GITHUB_PERSONAL_ACCESS_TOKEN=xxx
GOOGLE_MAPS_API_KEY=xxx
...
```

---

## 📚 相关文档

- [MCP_SYSTEM_REFACTOR_FINAL.md](MCP_SYSTEM_REFACTOR_FINAL.md) - MCP 系统重构
- [MCP_FRONTEND_AUTH_FIX.md](MCP_FRONTEND_AUTH_FIX.md) - 前端认证修复
- [MCP_AGENT_COMPATIBILITY_FIX.md](MCP_AGENT_COMPATIBILITY_FIX.md) - Agent 兼容性修复
- [MCP_DUPLICATE_PAGE_FIX.md](MCP_DUPLICATE_PAGE_FIX.md) - 重复页面修复

---

**修改时间**: 2025-10-26
**修改者**: Claude Code Assistant
**测试状态**: ⏳ 等待重启服务器验证
**影响用户**: 仅影响新用户

---

## 🚀 部署说明

### 立即生效（无需重启）

由于 `config.cjs` 在服务器启动时加载，此修改需要重启后端服务器才能生效：

```bash
# 重启后端
npm run server

# 验证服务列表
curl http://localhost:3001/api/mcp/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 建议测试步骤

1. 创建新测试用户
2. 登录并访问 MCP 服务页面
3. 验证所有 24 个服务都显示为"已启用"
4. 测试配置几个免费服务（bilibili, coingecko）
5. 验证服务能正常调用

---

**完成确认**:
- [x] 修改 config.cjs (10个服务)
- [x] 生成修复文档
- [ ] 重启后端服务器 (待用户操作)
- [ ] 创建新用户验证 (待用户操作)
- [ ] 测试服务调用 (待用户操作)
