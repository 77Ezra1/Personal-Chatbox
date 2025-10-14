# 🚀 高级MCP服务 - 10分钟快速开始

## 概述

本指南帮助您在10分钟内完成4个高级MCP服务的安装和配置:

- ✅ **Magg元服务器** - AI自主管理工具
- ✅ **Slack消息服务** - 团队协作通知
- ✅ **Qdrant向量数据库** - RAG应用
- ✅ **PostgreSQL数据库** - 生产级数据库

---

## 前置要求

- ✅ Node.js 18+
- ✅ Docker(推荐)
- ✅ Python 3.12+(可选,用于Magg)

---

## 一键安装

### 方式1: 自动安装脚本(推荐)

```bash
# 1. 进入项目目录
cd Personal-Chatbox

# 2. 运行安装脚本
./scripts/install-advanced-mcp-services.sh

# 3. 按照提示完成配置
```

脚本会自动完成:
- ✅ 环境检查
- ✅ 安装Magg(如果Python 3.12+可用)
- ✅ 配置Slack
- ✅ 启动Qdrant Docker容器
- ✅ 启动PostgreSQL Docker容器
- ✅ 创建配置文件

### 方式2: 手动安装

如果自动脚本失败,请按照以下步骤手动安装。

---

## 手动安装步骤

### 1. Magg元服务器(2分钟)

```bash
# 安装uv包管理器
curl -LsSf https://astral.sh/uv/install.sh | sh

# 重新加载shell配置
source ~/.bashrc  # 或 source ~/.zshrc

# 安装Magg
uv tool install magg

# 验证安装
magg --version

# 创建配置目录
mkdir -p .magg

# 启用Magg服务
# 编辑 server/config.cjs,将 magg.enabled 改为 true
```

### 2. Slack消息服务(3分钟)

```bash
# 步骤1: 创建Slack App
# 访问 https://api.slack.com/apps
# 点击 "Create New App" → "From scratch"

# 步骤2: 配置权限
# 在 "OAuth & Permissions" 添加以下scopes:
# - channels:read
# - chat:write
# - files:write

# 步骤3: 安装到工作区
# 点击 "Install to Workspace"

# 步骤4: 复制Token
# 复制 "Bot User OAuth Token" (以xoxb-开头)

# 步骤5: 配置环境变量
echo "SLACK_BOT_TOKEN=xoxb-your-token-here" >> .env

# 步骤6: 启用Slack服务
# 编辑 server/config.cjs,将 slack.enabled 改为 true
```

### 3. Qdrant向量数据库(2分钟)

```bash
# 启动Qdrant容器
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v $(pwd)/data/qdrant:/qdrant/storage \
  qdrant/qdrant

# 验证安装
curl http://localhost:6333/collections

# 配置环境变量
echo "QDRANT_URL=http://localhost:6333" >> .env

# 启用Qdrant服务
# 编辑 server/config.cjs,将 qdrant.enabled 改为 true

# (可选)访问Web UI
# 打开浏览器: http://localhost:6333/dashboard
```

### 4. PostgreSQL数据库(3分钟)

```bash
# 启动PostgreSQL容器
docker run -d \
  --name postgres-chatbox \
  -e POSTGRES_PASSWORD=chatbox123 \
  -e POSTGRES_DB=chatbox \
  -p 5432:5432 \
  -v $(pwd)/data/postgres:/var/lib/postgresql/data \
  postgres:16-alpine

# 验证安装
docker exec postgres-chatbox pg_isready

# 配置环境变量
echo "POSTGRES_CONNECTION_STRING=postgresql://postgres:chatbox123@localhost:5432/chatbox" >> .env

# 启用PostgreSQL服务
# 编辑 server/config.cjs,将 postgresql.enabled 改为 true
```

---

## 启用服务

编辑 `server/config.cjs`,将以下服务的 `enabled` 改为 `true`:

```javascript
// 找到对应的服务配置,修改enabled字段

magg: {
  enabled: true,  // ← 改这里
  // ...
},

slack: {
  enabled: true,  // ← 改这里(需要先配置SLACK_BOT_TOKEN)
  // ...
},

qdrant: {
  enabled: true,  // ← 改这里
  // ...
},

postgresql: {
  enabled: true,  // ← 改这里
  // ...
}
```

---

## 启动服务

```bash
# 1. 安装依赖(如果还没安装)
npm install --legacy-peer-deps

# 2. 启动后端服务
npm run server

# 3. 启动前端服务(新终端)
npm run dev

# 4. 访问应用
# 打开浏览器: http://localhost:5173
```

---

## 验证安装

### 方法1: 在AI对话中测试

```
# 测试Magg
"列出所有可用的MCP工具"
"搜索计算器相关的MCP服务"

# 测试Slack
"发送测试消息到#general: Hello!"

# 测试Qdrant
"创建一个测试向量集合"

# 测试PostgreSQL
"连接到PostgreSQL数据库并列出所有表"
```

### 方法2: 查看日志

```bash
# 查看服务器日志
tail -f logs/server.log

# 查看Docker容器状态
docker ps

# 查看Qdrant日志
docker logs qdrant

# 查看PostgreSQL日志
docker logs postgres-chatbox
```

---

## 常见问题

### Q1: Magg安装失败

**问题**: `uv: command not found`

**解决**:
```bash
# 重新安装uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 添加到PATH
export PATH="$HOME/.cargo/bin:$PATH"

# 重新加载shell
source ~/.bashrc
```

### Q2: Slack无法连接

**问题**: `Invalid token`

**解决**:
1. 确认Token以`xoxb-`开头
2. 检查App是否已安装到工作区
3. 确认Bot Token Scopes是否正确
4. 在Slack App管理页面重新生成Token

### Q3: Qdrant容器无法启动

**问题**: `port 6333 already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :6333

# 停止旧容器
docker stop qdrant
docker rm qdrant

# 重新启动
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### Q4: PostgreSQL连接失败

**问题**: `Connection refused`

**解决**:
```bash
# 检查容器状态
docker ps | grep postgres

# 重启容器
docker restart postgres-chatbox

# 检查连接字符串
echo $POSTGRES_CONNECTION_STRING

# 测试连接
docker exec postgres-chatbox pg_isready
```

---

## 下一步

### 立即尝试

1. **使用Magg添加新工具**
   ```
   "搜索天气相关的MCP服务并添加"
   ```

2. **发送Slack通知**
   ```
   "发送消息到#dev: 新服务已上线!"
   ```

3. **创建向量集合**
   ```
   "创建一个名为'文档库'的Qdrant集合"
   ```

4. **查询PostgreSQL**
   ```
   "在PostgreSQL中创建一个用户表"
   ```

### 深入学习

- 📖 [完整集成指南](./ADVANCED_MCP_INTEGRATION.md)
- 💰 [成本分析](./mcp-services-pricing.md)
- 🎯 [集成建议](./recommended-integration-plan.md)
- ⚡ [高级功能](./advanced-mcp-features.md)

---

## 获取帮助

### 文档

- 完整文档: `docs/ADVANCED_MCP_INTEGRATION.md`
- 配置示例: `.env.example`
- 安装脚本: `scripts/install-advanced-mcp-services.sh`

### 故障排查

```bash
# 运行诊断脚本
./scripts/install-advanced-mcp-services.sh

# 查看服务器日志
tail -f logs/server.log

# 检查Docker容器
docker ps -a

# 查看环境变量
cat .env
```

### 社区支持

- GitHub Issues: [提交问题](https://github.com/77Ezra1/Personal-Chatbox/issues)
- 文档: `docs/` 目录

---

## 总结

✅ **完成时间**: 10分钟

✅ **新增功能**:
- AI自主管理工具(Magg)
- 团队协作通知(Slack)
- 语义搜索(Qdrant)
- 生产级数据库(PostgreSQL)

✅ **成本**: $0/月(全部自托管)

✅ **下一步**: 开始使用新功能,探索更多可能性!

---

**祝您使用愉快!** 🎉

如有问题,请查看 [完整文档](./ADVANCED_MCP_INTEGRATION.md) 或提交Issue。

