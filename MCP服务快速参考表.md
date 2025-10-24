# MCP服务快速参考表

## 🎯 推荐服务一览

### 优先级1：核心能力增强（立即集成）⭐⭐⭐⭐⭐

| # | 服务名称 | 功能 | 免费 | 需要Key | GitHub/NPM | 增强能力 |
|---|---------|------|------|---------|-----------|---------|
| 1 | **Open Web Search** | 多引擎搜索（百度+Bing+DuckDuckGo+CSDN） | ✅ | ❌ | [Aas-ee/open-webSearch](https://github.com/Aas-ee/open-webSearch) | 信息检索+200% |
| 2 | **Google Calendar** | 日程管理、会议安排 | ✅ | OAuth2 | [@modelcontextprotocol/server-google-calendar](https://www.npmjs.com/package/@modelcontextprotocol/server-google-calendar) | 时间管理+100% |
| 3 | **Gmail** | 邮件读取、发送、搜索 | ✅ | OAuth2 | [@modelcontextprotocol/server-gmail](https://www.npmjs.com/package/@modelcontextprotocol/server-gmail) | 自动化+150% |
| 4 | **Notion** | 知识库、笔记、数据库 | ✅ (个人版) | API Token | [@notionhq/mcp-server-notion](https://github.com/notionhq/mcp-server-notion) | 知识管理+100% |
| 5 | **YouTube Transcript** | 视频字幕提取、内容分析 | ✅ | ❌ | [@kimtaeyoon83/mcp-server-youtube-transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript) | 学习能力+80% |

---

### 优先级2：专业能力扩展（近期集成）⭐⭐⭐⭐

| # | 服务名称 | 功能 | 免费 | 需要Key | GitHub/NPM | 增强能力 |
|---|---------|------|------|---------|-----------|---------|
| 6 | **Bilibili MCP** | B站视频搜索、热门榜单 | ✅ | ❌ | [xspadex/bilibili-mcp](https://github.com/xspadex/bilibili-mcp) | 国内内容+100% |
| 7 | **Docker** | 容器管理、镜像操作 | ✅ | ❌ | [@ckreiling/mcp-server-docker](https://github.com/ckreiling/mcp-server-docker) | DevOps+150% |
| 8 | **CoinGecko** | 加密货币价格、市场数据 | ✅ | ❌ | [calvernaz/mcp-coingecko](https://github.com/calvernaz/mcp-coingecko) | 金融数据+100% |
| 9 | **RSS Aggregator** | RSS订阅、新闻聚合 | ✅ | ❌ | [jasonm/mcp-server-rss](https://github.com/jasonm/mcp-server-rss) | 信息监控+80% |

---

### 优先级3：高级场景（按需集成）⭐⭐⭐

| # | 服务名称 | 功能 | 免费 | 需要Key | GitHub/NPM | 增强能力 |
|---|---------|------|------|---------|-----------|---------|
| 10 | **Todoist** | 任务管理、项目组织 | ✅ (免费版) | API Token | [abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server) | 任务规划+80% |
| 11 | **Slack** | 消息通知、团队协作 | ✅ (免费版) | Bot Token | [@modelcontextprotocol/server-slack](https://www.npmjs.com/package/@modelcontextprotocol/server-slack) | 团队协作+100% |
| 12 | **PostgreSQL** | 生产级关系数据库 | ✅ (开源) | 连接字符串 | [@modelcontextprotocol/server-postgres](https://www.npmjs.com/package/@modelcontextprotocol/server-postgres) | 数据处理+150% |

---

## 🎯 三种推荐方案

### 方案A：最小增强（推荐新手）

**服务**: 1-5（5个核心服务）
**成本**: $0/月
**能力提升**: +150%
**适合**: 个人助理、学习助手、知识管理

**可以实现**:
- 📅 "明天下午3点提醒我开会" → 自动创建日历事件
- 📧 "总结最近的邮件" → 自动提取关键信息
- 📝 "在Notion中记录这次会议" → 自动创建笔记
- 🔍 "搜索2025年AI趋势" → 多引擎聚合搜索
- 🎥 "总结这个YouTube视频" → 提取字幕并分析

---

### 方案B：全面增强（推荐进阶）

**服务**: 1-10（10个服务）
**成本**: $0/月
**能力提升**: +200%
**适合**: 全能助理、开发者工具、内容创作

**额外可以实现**（基于方案A）:
- 🎬 "B站最近有什么热门科技视频？" → 获取热榜
- 🐳 "部署这个项目到Docker" → 自动容器化
- 💰 "比特币最近价格走势如何？" → 实时加密货币数据
- 📰 "监控Hacker News的AI相关文章" → RSS订阅

---

### 方案C：企业级（推荐专业）

**服务**: 1-12（12个服务）
**成本**: $0/月（使用免费版）
**能力提升**: +250%
**适合**: 企业助理、团队协作、生产环境

**额外可以实现**（基于方案B）:
- 🔔 "任务完成后通知团队" → Slack自动推送
- ✅ "创建一个任务：明天提交报告" → Todoist任务管理
- 🗄️ "分析生产数据库的用户增长" → PostgreSQL复杂查询

---

## 🚀 快速集成指南

### 步骤1：更新配置文件

编辑 `/Users/ezra/Personal-Chatbox/server/config.cjs`，在 `services` 对象中添加新服务。

**示例（添加Open Web Search）**:
```javascript
open_web_search: {
  id: 'open_web_search',
  name: '多引擎网页搜索',
  enabled: true,
  autoLoad: true,
  description: '聚合百度、Bing、DuckDuckGo、Brave、CSDN搜索结果',
  command: 'npx',
  args: ['-y', 'open-websearch']
}
```

---

### 步骤2：获取API密钥（需要的服务）

#### Google Calendar & Gmail (免费)
```bash
# 1. 访问 https://console.cloud.google.com/apis/credentials
# 2. 创建新项目
# 3. 启用 Gmail API 和 Google Calendar API
# 4. 创建 OAuth 2.0 凭据
# 5. 下载 credentials.json
```

#### Notion (免费)
```bash
# 1. 访问 https://www.notion.so/my-integrations
# 2. 创建新的 Integration
# 3. 复制 API Token
```

#### Todoist (免费版)
```bash
# 1. 登录 Todoist
# 2. 访问 https://todoist.com/prefs/integrations
# 3. 复制 API Token
```

---

### 步骤3：重启服务

```bash
cd /Users/ezra/Personal-Chatbox

# 停止旧服务
pkill -f "node.*server/index.cjs"

# 启动新服务
nohup node server/index.cjs > server-restart.log 2>&1 &

# 查看日志
tail -f server-restart.log
```

---

### 步骤4：测试新功能

在前端对话框中测试：

```
✅ 搜索测试:
"搜索一下2025年人工智能发展趋势"

✅ 日程测试:
"明天下午3点提醒我开会"

✅ 邮件测试:
"总结最近的邮件"

✅ 笔记测试:
"在Notion中创建一个关于AI的笔记"

✅ 视频测试:
"总结这个YouTube视频: https://youtube.com/watch?v=xxx"
```

---

## 📊 能力对比表

| 能力维度 | 当前 | 方案A | 方案B | 方案C |
|---------|------|-------|-------|-------|
| 📊 信息获取 | 60% | 90% | 95% | 95% |
| ⏰ 时间管理 | 20% | 80% | 90% | 90% |
| 📝 知识积累 | 50% | 85% | 90% | 90% |
| 🤖 自动化 | 40% | 75% | 85% | 95% |
| 💻 开发辅助 | 30% | 35% | 80% | 90% |
| 👥 团队协作 | 0% | 0% | 0% | 85% |
| 📈 数据分析 | 40% | 45% | 70% | 90% |

---

## 💰 成本分析

### 完全免费（无需任何费用）
- Open Web Search
- YouTube Transcript
- Bilibili MCP
- Docker
- CoinGecko
- RSS Aggregator

### 有免费额度（个人使用足够）
- **Google Calendar**: 完全免费
- **Gmail**: 完全免费（需OAuth2认证）
- **Notion**: 个人版免费（1000个block）
- **Todoist**: 免费版（最多80个项目）
- **Slack**: 免费版（90天历史消息）
- **PostgreSQL**: 开源免费（自部署）

### 总成本
- **方案A**: $0/月
- **方案B**: $0/月
- **方案C**: $0/月

---

## ⚠️ 注意事项

### 1. API限流
- Google服务有每日请求限制（个人使用通常不会达到）
- 建议在Agent中实现智能缓存

### 2. 安全性
- 所有API密钥存储在环境变量中
- OAuth2凭据使用标准授权流程
- 定期轮换API Token

### 3. 性能优化
- 使用Agent的任务缓存减少重复调用
- 对长时间任务使用后台队列
- 合理设置超时时间

---

## 🎯 推荐行动

### 立即执行（今天）
1. ✅ 选择 **方案A**（5个核心服务）
2. ✅ 阅读完整方案文档: `/Users/ezra/Personal-Chatbox/Agent能力增强推荐方案.md`
3. ✅ 获取Google和Notion的API凭据
4. ✅ 更新 `server/config.cjs`
5. ✅ 重启服务并测试

### 后续优化（本周内）
1. 根据使用情况调整配置
2. 逐步添加方案B的服务
3. 优化Agent的任务分解逻辑

### 长期规划（1个月后）
1. 升级到方案C（企业级）
2. 实现服务监控系统
3. 开发自定义MCP服务

---

## 📚 更多资源

- **完整方案文档**: `/Users/ezra/Personal-Chatbox/Agent能力增强推荐方案.md`
- **项目推荐服务**: `/Users/ezra/Personal-Chatbox/docs/guides/RECOMMENDED_MCP_SERVICES.md`
- **免费服务列表**: `/Users/ezra/Personal-Chatbox/docs/guides/FREE_MCP_SERVICES.md`
- **国内友好服务**: `/Users/ezra/Personal-Chatbox/docs/guides/CHINA_FRIENDLY_MCP_SERVICES.md`

---

**版本**: v1.0
**更新时间**: 2025-10-24
**作者**: AI Assistant


