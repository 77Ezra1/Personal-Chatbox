# Personal Chatbox - 高级MCP服务集成指南

## 📋 概述

本文档介绍如何为Personal Chatbox项目集成4个高级MCP服务,将您的AI助手从**基础聊天机器人**升级为**企业级智能平台**。

### 新增服务

1. **Magg元服务器** - AI自主管理MCP工具的革命性服务
2. **Slack消息服务** - 团队协作和实时通知
3. **Qdrant向量数据库** - 构建RAG(检索增强生成)应用
4. **PostgreSQL数据库** - 生产级关系数据库

### 为什么需要这些服务?

| 服务 | 解决的问题 | 价值 |
|------|-----------|------|
| **Magg** | AI工具扩展性差,需要人工配置 | AI可以自主发现和安装新工具 |
| **Slack** | 缺少团队协作和通知能力 | 实时消息推送,团队集成 |
| **Qdrant** | 无法处理大量文档和知识库 | 语义搜索,智能问答 |
| **PostgreSQL** | SQLite不适合生产环境 | 高并发,复杂查询,数据完整性 |

---

## 🚀 快速开始(10分钟)

### 一键安装

```bash
# 1. 进入项目目录
cd Personal-Chatbox

# 2. 运行安装脚本
./scripts/install-advanced-mcp-services.sh

# 3. 按照提示完成配置
```

脚本会自动:
- ✅ 检查环境依赖
- ✅ 安装Magg(如果Python 3.12+可用)
- ✅ 配置Slack(如果提供Token)
- ✅ 启动Qdrant Docker容器
- ✅ 启动PostgreSQL Docker容器
- ✅ 创建配置文件

---

## 📦 详细安装步骤

### 1. Magg元服务器

#### 什么是Magg?

Magg是一个**元MCP服务器**,它可以:
- 🔍 让AI搜索和发现新的MCP服务
- ⚡ 动态添加和配置MCP服务器
- 🎛️ 统一管理所有MCP工具
- 🔄 热重载配置,无需重启

**这意味着什么?**
> 您的AI助手可以在对话中说:"我需要一个计算器工具",然后Magg会自动搜索、安装并配置计算器MCP服务,无需人工干预!

#### 安装要求

- Python 3.12 或更高版本
- uv包管理器

#### 安装步骤

```bash
# 1. 安装uv包管理器
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 添加uv到PATH
source ~/.bashrc  # 或 source ~/.zshrc

# 3. 安装Magg
uv tool install magg

# 4. 验证安装
magg --version
```

#### 配置

Magg的配置已添加到 `server/config.cjs`:

```javascript
magg: {
  id: 'magg',
  name: 'Magg元服务器',
  enabled: false,  // 安装后改为true
  command: 'uv',
  args: ['tool', 'run', 'magg', 'serve'],
  env: {
    MAGG_CONFIG_PATH: '.magg/config.json',
    MAGG_LOG_LEVEL: 'INFO',
    MAGG_AUTO_RELOAD: 'true'
  }
}
```

#### 启用Magg

编辑 `server/config.cjs`,将 `enabled: false` 改为 `enabled: true`:

```javascript
magg: {
  enabled: true,  // ← 改这里
  // ...
}
```

#### 使用示例

启用Magg后,AI可以执行以下操作:

```
用户: "帮我添加一个天气查询工具"

AI: 
1. 使用magg_search_servers搜索天气相关的MCP服务
2. 找到@modelcontextprotocol/server-weather
3. 使用magg_add_server添加服务
4. 自动配置并启用
5. 开始使用天气工具回答问题
```

---

### 2. Slack消息服务

#### 功能

- 📤 发送消息到Slack频道
- 📥 读取频道消息
- 📎 上传文件
- 👥 管理频道成员
- 🔔 实时通知

#### 获取Slack Bot Token

1. 访问 [Slack API](https://api.slack.com/apps)
2. 点击 "Create New App" → "From scratch"
3. 输入App名称(如"Personal Chatbox")和工作区
4. 在左侧菜单选择 "OAuth & Permissions"
5. 添加以下Bot Token Scopes:
   - `channels:read` - 读取频道
   - `chat:write` - 发送消息
   - `files:write` - 上传文件
   - `users:read` - 读取用户信息
6. 点击 "Install to Workspace"
7. 复制 "Bot User OAuth Token"(以`xoxb-`开头)

#### 配置

在 `.env` 文件中添加:

```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_TEAM_ID=T01234567  # 可选
```

在 `server/config.cjs` 中启用:

```javascript
slack: {
  enabled: true,  // ← 改为true
  // ...
}
```

#### 使用示例

```javascript
// AI可以执行的操作
"发送消息到#general频道: 部署完成!"
"上传日志文件到#dev-logs"
"读取#support频道的最新10条消息"
```

---

### 3. Qdrant向量数据库

#### 什么是Qdrant?

Qdrant是一个高性能向量数据库,用于:
- 🔍 语义搜索 - 理解意图而非关键词
- 📚 知识库管理 - 存储和检索大量文档
- 🤖 RAG应用 - 检索增强生成,让AI回答基于您的数据

#### 使用场景

| 场景 | 传统搜索 | Qdrant语义搜索 |
|------|---------|---------------|
| 查询"如何重置密码" | 只匹配"重置"和"密码" | 理解意图,匹配"忘记密码"、"修改密码"等 |
| 文档检索 | 需要精确关键词 | 理解上下文,找到相关内容 |
| 多语言支持 | 需要翻译 | 自动理解不同语言的相似内容 |

#### 安装(Docker方式)

```bash
# 1. 启动Qdrant容器
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/data/qdrant:/qdrant/storage \
  qdrant/qdrant

# 2. 验证安装
curl http://localhost:6333/collections

# 3. 访问Web UI
open http://localhost:6333/dashboard
```

#### 配置

在 `.env` 文件中添加:

```bash
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=  # 本地部署不需要
```

在 `server/config.cjs` 中启用:

```javascript
qdrant: {
  enabled: true,  // ← 改为true
  // ...
}
```

#### 使用示例

```javascript
// 创建知识库
"创建一个名为'产品文档'的集合"

// 添加文档
"将docs/目录下的所有Markdown文件添加到知识库"

// 语义搜索
"在知识库中搜索'如何部署到生产环境'"
// → 即使文档中没有"部署"这个词,也能找到相关内容

// RAG问答
"基于知识库回答: 项目的技术栈是什么?"
// → AI会先检索相关文档,然后基于文档内容回答
```

---

### 4. PostgreSQL数据库

#### 为什么需要PostgreSQL?

| 特性 | SQLite | PostgreSQL |
|------|--------|-----------|
| 并发写入 | ❌ 单线程 | ✅ 多用户 |
| 数据量 | 适合<1GB | 适合TB级 |
| 复杂查询 | 基础SQL | 高级SQL,JSON,全文搜索 |
| 生产环境 | ❌ 不推荐 | ✅ 企业级 |
| 数据完整性 | 基础 | 强约束,事务 |

#### 安装(Docker方式)

```bash
# 1. 启动PostgreSQL容器
docker run -d \
  --name postgres-chatbox \
  -e POSTGRES_PASSWORD=chatbox123 \
  -e POSTGRES_DB=chatbox \
  -p 5432:5432 \
  -v $(pwd)/data/postgres:/var/lib/postgresql/data \
  postgres:16-alpine

# 2. 验证安装
docker exec postgres-chatbox pg_isready

# 3. 连接数据库
docker exec -it postgres-chatbox psql -U postgres -d chatbox
```

#### 配置

在 `.env` 文件中添加:

```bash
POSTGRES_CONNECTION_STRING=postgresql://postgres:chatbox123@localhost:5432/chatbox
```

在 `server/config.cjs` 中启用:

```javascript
postgresql: {
  enabled: true,  // ← 改为true
  // ...
}
```

#### 迁移数据(从SQLite)

```bash
# 1. 导出SQLite数据
sqlite3 data/app.db .dump > backup.sql

# 2. 转换为PostgreSQL格式(需要手动调整)
# - 替换 AUTOINCREMENT 为 SERIAL
# - 调整数据类型

# 3. 导入PostgreSQL
docker exec -i postgres-chatbox psql -U postgres -d chatbox < backup.sql
```

#### 使用示例

```sql
-- AI可以执行的复杂查询

-- 全文搜索
"搜索所有包含'AI'或'机器学习'的对话"

-- JSON查询
"查询配置中包含'enabled: true'的所有MCP服务"

-- 聚合分析
"统计每个用户本月的对话次数,按降序排列"

-- 事务操作
"批量更新所有用户的邀请码状态,确保原子性"
```

---

## 🎯 服务组合使用

### 场景1: 智能客服系统

```
用户在Slack提问 
  ↓
Qdrant语义搜索知识库
  ↓
AI基于检索结果回答
  ↓
回复发送到Slack
  ↓
对话记录存储到PostgreSQL
```

### 场景2: 自动化工作流

```
定时任务触发
  ↓
AI使用Magg搜索并添加需要的工具
  ↓
执行数据分析(PostgreSQL)
  ↓
生成报告
  ↓
发送到Slack频道
```

### 场景3: 知识库问答

```
用户提问
  ↓
Qdrant检索相关文档(Top 5)
  ↓
AI阅读文档并生成答案
  ↓
答案存储到PostgreSQL
  ↓
(可选)发送到Slack
```

---

## 🔧 配置管理

### 环境变量(.env文件)

```bash
# ========== 数据库配置 ==========
POSTGRES_CONNECTION_STRING=postgresql://postgres:password@localhost:5432/chatbox
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # 本地部署留空

# ========== 第三方服务 ==========
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_TEAM_ID=T01234567

# ========== Magg配置 ==========
MAGG_CONFIG_PATH=.magg/config.json
MAGG_LOG_LEVEL=INFO
MAGG_AUTO_RELOAD=true
MAGG_READ_ONLY=false

# ========== 其他API Key ==========
GOOGLE_MAPS_API_KEY=
EVERART_API_KEY=
BRAVE_API_KEY=
GITHUB_PERSONAL_ACCESS_TOKEN=
```

### 服务启用/禁用

编辑 `server/config.cjs`:

```javascript
services: {
  magg: {
    enabled: true,  // ← 启用/禁用
    autoLoad: true,  // ← 自动加载
    // ...
  }
}
```

---

## 📊 成本分析

| 服务 | 免费额度 | 付费价格 | 推荐方案 |
|------|---------|---------|---------|
| **Magg** | 完全免费 | - | ✅ 自托管 |
| **Slack** | 10,000条消息/月 | $8/用户/月 | ✅ 免费版 |
| **Qdrant** | 完全免费(自托管) | $70/月(云端) | ✅ Docker自托管 |
| **PostgreSQL** | 完全免费(自托管) | $15/月(托管) | ✅ Docker自托管 |

**总计**: $0/月(全部自托管)

---

## 🧪 测试验证

### 1. 测试Magg

```bash
# 启动服务器
npm run server

# 在AI对话中测试
"列出所有可用的MCP工具"
"搜索计算器相关的MCP服务"
"添加一个新的MCP服务"
```

### 2. 测试Slack

```bash
# 测试消息发送
"发送测试消息到#general: Hello from Personal Chatbox!"

# 测试文件上传
"上传README.md到#dev频道"
```

### 3. 测试Qdrant

```bash
# 测试连接
curl http://localhost:6333/collections

# 在AI对话中测试
"创建一个测试集合"
"添加一些测试数据"
"执行语义搜索"
```

### 4. 测试PostgreSQL

```bash
# 测试连接
docker exec postgres-chatbox pg_isready

# 在AI对话中测试
"连接到PostgreSQL数据库"
"创建一个测试表"
"插入一些数据"
"执行查询"
```

---

## 🐛 故障排查

### Magg无法启动

**问题**: `magg: command not found`

**解决**:
```bash
# 1. 检查uv是否安装
uv --version

# 2. 检查Magg是否安装
uv tool list | grep magg

# 3. 重新安装
uv tool install magg

# 4. 添加到PATH
export PATH="$HOME/.local/bin:$PATH"
```

### Slack连接失败

**问题**: `Invalid token`

**解决**:
1. 检查Token是否以`xoxb-`开头
2. 确认App已安装到工作区
3. 检查Bot Token Scopes是否正确
4. 重新生成Token

### Qdrant无法访问

**问题**: `Connection refused`

**解决**:
```bash
# 1. 检查容器是否运行
docker ps | grep qdrant

# 2. 检查端口是否监听
netstat -tlnp | grep 6333

# 3. 重启容器
docker restart qdrant

# 4. 查看日志
docker logs qdrant
```

### PostgreSQL连接失败

**问题**: `FATAL: password authentication failed`

**解决**:
```bash
# 1. 检查连接字符串
echo $POSTGRES_CONNECTION_STRING

# 2. 重置密码
docker exec -it postgres-chatbox psql -U postgres
ALTER USER postgres PASSWORD 'new_password';

# 3. 更新.env文件
```

---

## 📚 参考资源

### 官方文档

- [Magg GitHub](https://github.com/sitbon/magg)
- [Slack API](https://api.slack.com/)
- [Qdrant文档](https://qdrant.tech/documentation/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)

### 相关文档

- [MCP服务定价分析](./mcp-services-pricing.md)
- [推荐集成计划](./recommended-integration-plan.md)
- [高级功能推荐](./advanced-mcp-features.md)

---

## 🎉 下一步

恭喜!您已经成功集成了4个高级MCP服务。

**建议的学习路径**:

1. **本周**: 熟悉Magg的使用,让AI自主添加工具
2. **下周**: 配置Slack通知,集成到工作流
3. **第三周**: 构建RAG应用,使用Qdrant
4. **第四周**: 迁移到PostgreSQL,优化性能

**进阶功能**:

- 集成更多MCP服务(GitHub、Gmail、Google Drive)
- 构建自定义MCP服务
- 部署到生产环境
- 添加监控和日志

---

**需要帮助?**

- 查看文档: `docs/`目录
- 运行诊断: `./scripts/install-advanced-mcp-services.sh`
- 查看日志: `tail -f logs/server.log`

祝您使用愉快! 🚀

