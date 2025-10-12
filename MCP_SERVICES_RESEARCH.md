# MCP 服务集成研究文档 - 第二批

**日期:** 2025年10月12日
**作者:** Manus AI

## 1. 服务列表

根据用户需求,第二批需要集成的 MCP 服务包括:

### 1.1 免费服务(无需 API Key)
- **Git** - Git 版本控制
- **Wikipedia** - 维基百科

### 1.2 需要 API Key 的服务
- **Brave Search** - 搜索服务(替代 DuckDuckGo)
- **GitHub** - GitHub 集成
- **Notion** - Notion 笔记
- **Gmail** - Gmail 邮件
- **Google Calendar** - Google 日历

## 2. 官方文档和安装命令

### 2.1 Git MCP Server

**官方包:** `@modelcontextprotocol/server-git` (已归档,现在推荐使用 `@mseep/git-mcp-server`)

**NPM 链接:** https://www.npmjs.com/package/@mseep/git-mcp-server

**安装命令:**
```bash
npx -y @mseep/git-mcp-server
```

**功能:**
- Git 仓库状态查询
- 查看未暂存或已暂存的更改
- Git 操作自动化

**无需 API Key:** ✅

---

### 2.2 Wikipedia MCP Server

**官方包:** `@modelcontextprotocol/server-wikipedia` (需要确认)

**安装命令:** (待确认)
```bash
npx -y @modelcontextprotocol/server-wikipedia
```

**功能:**
- 搜索维基百科文章
- 获取文章内容
- 提取摘要信息

**无需 API Key:** ✅

---

### 2.3 Brave Search MCP Server

**官方包:** `@modelcontextprotocol/server-brave-search`

**NPM 链接:** https://www.npmjs.com/package/@modelcontextprotocol/server-brave-search

**GitHub:** https://github.com/brave/brave-search-mcp-server

**安装命令:**
```bash
npx -y @modelcontextprotocol/server-brave-search
```

**功能:**
- 网页搜索
- 本地商业搜索
- 综合搜索能力

**需要 API Key:** ✅ (Brave Search API Key)

**API Key 获取:** https://brave.com/search/api/

---

### 2.4 GitHub MCP Server

**官方包:** `@modelcontextprotocol/server-github`

**NPM 链接:** https://www.npmjs.com/package/@modelcontextprotocol/server-github

**安装命令:**
```bash
npx -y @modelcontextprotocol/server-github
```

**功能:**
- 文件操作
- 仓库管理
- 搜索功能
- PR 和 Issue 管理

**需要 API Key:** ✅ (GitHub Personal Access Token)

**API Key 获取:** https://github.com/settings/tokens

---

### 2.5 Notion MCP Server

**官方包:** `@modelcontextprotocol/server-notion` (需要确认)

**安装命令:** (待确认)
```bash
npx -y @modelcontextprotocol/server-notion
```

**功能:**
- 页面管理
- 数据库操作
- 内容搜索

**需要 API Key:** ✅ (Notion Integration Token)

**API Key 获取:** https://www.notion.so/my-integrations

---

### 2.6 Gmail MCP Server

**官方包:** `@modelcontextprotocol/server-gmail` (需要确认)

**安装命令:** (待确认)
```bash
npx -y @modelcontextprotocol/server-gmail
```

**功能:**
- 邮件搜索
- 发送邮件
- 邮件管理

**需要 API Key:** ✅ (Gmail OAuth 凭据)

**API Key 获取:** Google Cloud Console

---

### 2.7 Google Calendar MCP Server

**官方包:** `@modelcontextprotocol/server-google-calendar` (需要确认)

**安装命令:** (待确认)
```bash
npx -y @modelcontextprotocol/server-google-calendar
```

**功能:**
- 日历事件管理
- 事件搜索
- 日程安排

**需要 API Key:** ✅ (Google Calendar OAuth 凭据)

**API Key 获取:** Google Cloud Console

---

## 3. 集成优先级

根据是否需要 API Key,建议按以下顺序集成:

### 第一阶段:免费服务
1. Git
2. Wikipedia

### 第二阶段:需要 API Key 的服务
3. Brave Search
4. GitHub
5. Notion
6. Gmail
7. Google Calendar

## 4. 下一步行动

1. ✅ 完成官方文档研究
2. ⏳ 集成 Git 和 Wikipedia 服务
3. ⏳ 向用户确认是否已准备好所需的 API Keys
4. ⏳ 集成需要 API Key 的服务
5. ⏳ 全面测试所有新服务
6. ⏳ 编写集成文档和测试报告

