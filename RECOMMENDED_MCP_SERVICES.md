# 推荐的 MCP 服务

基于 [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) 仓库,以下是一些特别适合你的 AI-Life-system 项目的 MCP 服务推荐。

---

## 🔥 强烈推荐

### 1. **文件系统操作**

#### `@modelcontextprotocol/server-filesystem` 🎖️ 官方
- **功能:** 安全的文件系统访问,支持读写文件、列出目录
- **用途:** 让 AI 能够管理本地文件,创建笔记、保存数据等
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-filesystem`

### 2. **GitHub 集成**

#### `@modelcontextprotocol/server-github` 🎖️ 官方
- **功能:** 
  - 创建/管理仓库
  - 提交代码、创建 PR
  - 搜索代码和 Issues
  - 管理分支
- **用途:** 让 AI 直接操作 GitHub,自动化开发工作流
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-github`

### 3. **数据库操作**

#### `@modelcontextprotocol/server-sqlite` 🎖️ 官方
- **功能:** SQLite 数据库查询和管理
- **用途:** 让 AI 能够存储和查询结构化数据
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-sqlite`

#### `@modelcontextprotocol/server-postgres` 🎖️ 官方
- **功能:** PostgreSQL 数据库集成
- **用途:** 企业级数据库操作
- **实用性:** ⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-postgres`

---

## 📊 数据分析与可视化

### 4. **Google Sheets**

#### `google-sheets-mcp-server`
- **功能:** 读写 Google Sheets,创建图表
- **用途:** 数据分析、报表生成
- **实用性:** ⭐⭐⭐⭐⭐
- **链接:** [github.com/ergut/google-sheets-mcp-server](https://github.com/ergut/google-sheets-mcp-server)

### 5. **Notion**

#### `@notionhq/mcp-server-notion` 🎖️ 官方
- **功能:** 
  - 创建/更新 Notion 页面
  - 搜索内容
  - 管理数据库
- **用途:** 知识管理、笔记整理
- **实用性:** ⭐⭐⭐⭐⭐
- **链接:** [github.com/notionhq/mcp-server-notion](https://github.com/notionhq/mcp-server-notion)

---

## 🔎 搜索与信息获取

### 6. **Brave Search** (推荐替代 DuckDuckGo)

#### `@modelcontextprotocol/server-brave-search` 🎖️ 官方
- **功能:** 
  - 网页搜索
  - 本地搜索
  - 无广告、注重隐私
- **优势:** 比 DuckDuckGo 更稳定,有官方 API
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-brave-search`
- **需要:** Brave Search API Key (免费)

### 7. **Google Maps**

#### `@modelcontextprotocol/server-google-maps` 🎖️ 官方
- **功能:** 
  - 地点搜索
  - 路线规划
  - 地理编码
- **用途:** 位置服务、旅行规划
- **实用性:** ⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-google-maps`

### 8. **Wikipedia**

#### `mcp-server-wikipedia`
- **功能:** 搜索和获取维基百科内容
- **用途:** 知识查询、背景资料
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/danhilse/mcp-server-wikipedia](https://github.com/danhilse/mcp-server-wikipedia)

---

## 💬 通信与协作

### 9. **Slack**

#### `@modelcontextprotocol/server-slack` 🎖️ 官方
- **功能:** 
  - 发送消息
  - 管理频道
  - 搜索历史消息
- **用途:** 团队协作、通知推送
- **实用性:** ⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-slack`

### 10. **Gmail**

#### `@modelcontextprotocol/server-gmail` 🎖️ 官方
- **功能:** 
  - 读取邮件
  - 发送邮件
  - 搜索邮件
  - 管理标签
- **用途:** 邮件管理、自动回复
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-gmail`

---

## 🎥 多媒体处理

### 11. **YouTube**

#### `mcp-youtube`
- **功能:** 
  - 搜索视频
  - 获取字幕
  - 视频信息
- **用途:** 视频内容分析、学习资料获取
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/kimtaeyoon83/mcp-server-youtube-transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript)

### 12. **图像生成**

#### `openai-gpt-image-mcp`
- **功能:** 使用 OpenAI DALL-E 生成图像
- **用途:** AI 绘画、图像创作
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/SureScaleAI/openai-gpt-image-mcp](https://github.com/SureScaleAI/openai-gpt-image-mcp)

---

## 🛠️ 开发工具

### 13. **Git**

#### `@modelcontextprotocol/server-git` 🎖️ 官方
- **功能:** 
  - Git 操作(commit, push, pull)
  - 查看历史
  - 分支管理
- **用途:** 版本控制自动化
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-git`

### 14. **Docker**

#### `mcp-server-docker`
- **功能:** 
  - 管理容器
  - 镜像操作
  - 容器日志
- **用途:** 容器化应用管理
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/ckreiling/mcp-server-docker](https://github.com/ckreiling/mcp-server-docker)

---

## 📈 数据与 API

### 15. **Airtable**

#### `mcp-airtable`
- **功能:** 
  - 读写 Airtable 数据
  - 创建记录
  - 查询过滤
- **用途:** 灵活的数据库管理
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/domdomegg/mcp-airtable](https://github.com/domdomegg/mcp-airtable)

### 16. **RSS Feed**

#### `mcp-server-rss`
- **功能:** 
  - 订阅 RSS 源
  - 获取最新文章
  - 内容聚合
- **用途:** 新闻聚合、内容监控
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/jasonm/mcp-server-rss](https://github.com/jasonm/mcp-server-rss)

---

## 🧠 AI 增强

### 17. **Memory**

#### `@modelcontextprotocol/server-memory` 🎖️ 官方
- **功能:** 
  - 持久化记忆存储
  - 上下文管理
  - 知识图谱
- **用途:** 让 AI 记住用户偏好和历史对话
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-memory`

### 18. **Sequential Thinking**

#### `@modelcontextprotocol/server-sequential-thinking` 🎖️ 官方
- **功能:** 
  - 动态思维链
  - 复杂推理
  - 多步骤问题解决
- **用途:** 增强 AI 的推理能力
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-sequential-thinking`

---

## 💰 金融与加密货币

### 19. **CoinGecko**

#### `mcp-coingecko`
- **功能:** 
  - 加密货币价格
  - 市场数据
  - 历史数据
- **用途:** 加密货币市场分析(比你现有的 Dexscreener 更全面)
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/calvernaz/mcp-coingecko](https://github.com/calvernaz/mcp-coingecko)

### 20. **Stripe**

#### `mcp-stripe`
- **功能:** 
  - 支付处理
  - 订阅管理
  - 发票生成
- **用途:** 电商、支付集成
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/stripe/mcp-stripe](https://github.com/stripe/mcp-stripe)

---

## 🌐 社交媒体

### 21. **Twitter/X**

#### `mcp-server-twitter`
- **功能:** 
  - 发推文
  - 搜索推文
  - 用户信息
- **用途:** 社交媒体管理、内容发布
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/keturiosakys/mcp-server-twitter](https://github.com/keturiosakys/mcp-server-twitter)

### 22. **Reddit**

#### `mcp-reddit`
- **功能:** 
  - 搜索帖子
  - 发布评论
  - 获取热门内容
- **用途:** 社区互动、内容监控
- **实用性:** ⭐⭐⭐
- **链接:** [github.com/snaggle-ai/mcp-reddit](https://github.com/snaggle-ai/mcp-reddit)

---

## 🏢 生产力工具

### 23. **Todoist**

#### `mcp-todoist`
- **功能:** 
  - 任务管理
  - 项目组织
  - 提醒设置
- **用途:** 个人任务管理
- **实用性:** ⭐⭐⭐⭐
- **链接:** [github.com/abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)

### 24. **Google Calendar**

#### `@modelcontextprotocol/server-google-calendar` 🎖️ 官方
- **功能:** 
  - 创建事件
  - 查询日程
  - 管理日历
- **用途:** 日程管理、会议安排
- **实用性:** ⭐⭐⭐⭐⭐
- **安装:** `npx @modelcontextprotocol/server-google-calendar`

---

## 🎯 特别推荐组合

### 组合 1: **完整的个人助理**
- Memory (记忆)
- Google Calendar (日程)
- Gmail (邮件)
- Todoist (任务)
- Notion (笔记)

### 组合 2: **开发者工具包**
- GitHub (代码管理)
- Git (版本控制)
- Docker (容器)
- Filesystem (文件操作)
- SQLite (数据库)

### 组合 3: **内容创作者**
- YouTube (视频)
- Twitter (社交)
- WordPress (博客)
- Image Generation (图像)
- RSS (内容聚合)

### 组合 4: **数据分析师**
- Google Sheets (表格)
- Airtable (数据库)
- Brave Search (搜索)
- Wikipedia (知识)
- PostgreSQL (数据库)

---

## 📝 集成建议

### 优先级 1 (立即集成):
1. **Brave Search** - 替代 DuckDuckGo,更稳定
2. **Memory** - 让 AI 记住用户偏好
3. **Filesystem** - 基础文件操作能力
4. **Sequential Thinking** - 增强推理能力

### 优先级 2 (近期集成):
1. **GitHub** - 你已经在用 GitHub
2. **Gmail** - 邮件管理很实用
3. **Google Calendar** - 日程管理
4. **Notion** - 知识管理

### 优先级 3 (按需集成):
1. **YouTube** - 如果需要视频内容
2. **Twitter** - 如果需要社交媒体
3. **Docker** - 如果需要容器管理
4. **Stripe** - 如果需要支付功能

---

## 🔧 集成步骤

### 1. 选择服务

从上面的推荐中选择你需要的服务。

### 2. 安装依赖

大多数官方服务可以直接通过 npx 运行:
```bash
npx @modelcontextprotocol/server-<service-name>
```

或者安装到项目:
```bash
npm install @modelcontextprotocol/server-<service-name>
```

### 3. 添加到配置

在 `server/config.cjs` 中添加新服务:

```javascript
{
  id: 'brave-search',
  name: 'Brave搜索',
  description: '使用Brave搜索引擎进行网页搜索',
  enabled: true,
  autoLoad: true,
  command: 'npx',
  args: ['@modelcontextprotocol/server-brave-search'],
  env: {
    BRAVE_API_KEY: process.env.BRAVE_API_KEY
  }
}
```

### 4. 创建服务实现

参考现有服务(如 `search.cjs`)创建新的服务文件。

### 5. 测试

在前端测试新服务是否正常工作。

---

## 🌟 最终建议

基于你的项目特点,我特别推荐:

1. **Brave Search** - 立即替代 DuckDuckGo,解决频率限制问题
2. **Memory** - 让你的 AI 助手更智能,记住用户偏好
3. **GitHub** - 你已经在用,集成后可以让 AI 直接操作仓库
4. **Filesystem** - 基础但强大,让 AI 能管理本地文件
5. **Sequential Thinking** - 增强 DeepSeek 的推理能力

这些服务都是官方维护,稳定性好,文档完善,集成难度低。

---

**参考资源:**
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP 官方文档](https://modelcontextprotocol.io)
- [Glama MCP 目录](https://glama.ai/mcp/servers)

**最后更新:** 2025-10-12

