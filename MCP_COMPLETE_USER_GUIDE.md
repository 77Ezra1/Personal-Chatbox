# AI-Life-system MCP 服务完整使用教程

**版本:** 2.0  
**日期:** 2025-10-12  
**作者:** Manus AI

---

## 📖 目录

1. [系统概述](#1-系统概述)
2. [快速开始](#2-快速开始)
3. [服务配置指南](#3-服务配置指南)
4. [服务使用说明](#4-服务使用说明)
5. [常见问题](#5-常见问题)
6. [故障排查](#6-故障排查)
7. [高级配置](#7-高级配置)
8. [最佳实践](#8-最佳实践)

---

## 1. 系统概述

AI-Life-system 是一个集成了多个 MCP (Model Context Protocol) 服务的 AI 代理系统,提供了 **95个工具**,显著增强了 AI 的能力。

### 1.1. 已集成的服务

| 服务名称 | 工具数量 | 需要配置 | 主要功能 |
|:---|:---|:---|:---|
| **Memory** | 9 | ❌ 否 | 知识图谱、实体关系管理 |
| **Filesystem** | 14 | ❌ 否 | 文件和目录操作 |
| **Git** | 12 | ❌ 否 | 版本控制、代码管理 |
| **Sequential Thinking** | 1 | ❌ 否 | 结构化推理增强 |
| **SQLite** | 8 | ❌ 否 | 数据库操作 |
| **Wikipedia** | 4 | ❌ 否 | 知识查询、历史事件 |
| **Brave Search** | 6 | ✅ 是 | 网页、新闻、图片搜索 |
| **GitHub** | 26 | ✅ 是 | 仓库、Issue、PR 管理 |

**免费服务 (6个):** 无需配置,开箱即用  
**需要配置 (2个):** Brave Search, GitHub

---

## 2. 快速开始

### 2.1. 系统要求

- **Node.js:** 22.13.0 或更高版本
- **Python:** 3.11 或更高版本
- **操作系统:** Ubuntu 22.04 或 macOS/Windows

### 2.2. 安装步骤

#### 步骤 1: 克隆项目

```bash
git clone https://github.com/77Ezra1/AI-Life-system.git
cd AI-Life-system
```

#### 步骤 2: 安装依赖

**后端依赖:**

```bash
npm install
```

**MCP 服务依赖:**

```bash
# Python MCP 服务
pip3 install mcp-server-git

# Node.js MCP 服务
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @shelm/wikipedia-mcp-server
npm install -g @brave/brave-search-mcp-server
npm install -g @modelcontextprotocol/server-github
```

#### 步骤 3: 启动服务

**启动后端:**

```bash
node server/index.cjs
```

**启动前端:**

```bash
npm run dev
```

#### 步骤 4: 访问应用

打开浏览器访问: `http://localhost:5173`

---

## 3. 服务配置指南

### 3.1. 免费服务 (无需配置)

以下服务无需任何配置,系统启动后自动可用:

- ✅ Memory
- ✅ Filesystem
- ✅ Git
- ✅ Sequential Thinking
- ✅ SQLite
- ✅ Wikipedia

### 3.2. Brave Search 配置

Brave Search 提供实时网页搜索、新闻、图片、视频搜索功能。

#### 获取 API Key

1. 访问 [Brave Search API](https://brave.com/search/api/)
2. 点击 "Get Started" 注册账号
3. 创建一个新的 API Key
4. 复制 API Key (格式: `BSA...`)

#### 配置步骤

1. 打开 AI-Life-system 前端应用
2. 点击右上角的 **设置** 图标
3. 切换到 **API Keys** 标签页
4. 找到 **Brave Search** 服务
5. 点击 **配置** 按钮
6. 粘贴您的 API Key
7. 点击 **保存**
8. 点击 **测试** 验证配置是否成功

#### 可用工具

- `brave_web_search` - 网页搜索
- `brave_news_search` - 新闻搜索
- `brave_image_search` - 图片搜索
- `brave_video_search` - 视频搜索
- `brave_local_search` - 本地搜索
- `brave_summarizer` - 摘要生成

### 3.3. GitHub 配置

GitHub 服务提供仓库管理、Issue、Pull Request、代码搜索等功能。

#### 获取 Personal Access Token

1. 访问 [GitHub Settings - Tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 设置 Token 名称: `AI-Life-System MCP Server`
4. 选择过期时间: 建议 30 天或 90 天
5. 选择权限:
   - ✅ **repo** (完整仓库访问权限)
   - 或者更细粒度的权限:
     - ✅ **Contents** - Read and write
     - ✅ **Issues** - Read and write
     - ✅ **Pull requests** - Read and write
     - ✅ **Metadata** - Read-only (自动包含)
6. 点击 **Generate token**
7. 复制生成的 Token (格式: `github_pat_...`)

⚠️ **重要提示:** 
- Token 只显示一次,请立即保存
- 建议只选择需要的仓库,而不是所有仓库
- 定期更新 Token,避免使用永不过期的 Token

#### 配置步骤

1. 打开 AI-Life-system 前端应用
2. 点击右上角的 **设置** 图标
3. 切换到 **API Keys** 标签页
4. 找到 **GitHub** 服务
5. 点击 **配置** 按钮
6. 粘贴您的 Personal Access Token
7. 点击 **保存**
8. 点击 **测试** 验证配置是否成功

#### 可用工具 (部分)

**仓库管理:**
- `create_repository` - 创建仓库
- `get_repository` - 获取仓库信息
- `search_repositories` - 搜索仓库
- `fork_repository` - Fork 仓库

**文件操作:**
- `get_file_contents` - 读取文件内容
- `create_or_update_file` - 创建或更新文件
- `push_files` - 推送多个文件

**Issue 管理:**
- `create_issue` - 创建 Issue
- `update_issue` - 更新 Issue
- `add_issue_comment` - 添加评论
- `search_issues` - 搜索 Issue

**Pull Request:**
- `create_pull_request` - 创建 PR
- `merge_pull_request` - 合并 PR
- `get_pull_request` - 获取 PR 信息

**其他:**
- `search_code` - 搜索代码
- `search_users` - 搜索用户
- `get_commit` - 获取提交信息

---

## 4. 服务使用说明

### 4.1. 在对话中使用 MCP 服务

AI 代理会根据您的请求自动调用相应的 MCP 服务。以下是一些示例:

#### Memory 服务示例

**用户:** "请记住:我叫张三,是一名软件工程师,喜欢编程和阅读。"

**AI 行为:**
- 调用 `memory_create_entities` 创建实体
- 调用 `memory_create_relations` 创建关系
- 将信息存储到知识图谱中

**用户:** "我之前告诉过你什么?"

**AI 行为:**
- 调用 `memory_search_nodes` 搜索相关信息
- 返回之前存储的个人信息

#### Filesystem 服务示例

**用户:** "列出当前项目的所有文件"

**AI 行为:**
- 调用 `filesystem_list_directory` 列出目录内容
- 返回文件和文件夹列表

**用户:** "读取 README.md 文件的内容"

**AI 行为:**
- 调用 `filesystem_read_file` 读取文件
- 返回文件内容

#### Git 服务示例

**用户:** "查看 Git 仓库的当前状态"

**AI 行为:**
- 调用 `git_status` 查看状态
- 返回修改的文件列表

**用户:** "查看最近 5 次提交记录"

**AI 行为:**
- 调用 `git_log` 查看日志
- 返回提交历史

#### Brave Search 服务示例

**用户:** "搜索最新的 AI 技术新闻"

**AI 行为:**
- 调用 `brave_news_search` 搜索新闻
- 返回相关新闻列表

**用户:** "搜索 MCP 协议的相关信息"

**AI 行为:**
- 调用 `brave_web_search` 搜索网页
- 返回搜索结果

#### GitHub 服务示例

**用户:** "搜索关于 MCP server 的 GitHub 仓库"

**AI 行为:**
- 调用 `search_repositories` 搜索仓库
- 返回相关仓库列表

**用户:** "读取我的仓库 AI-Life-system 的 README.md 文件"

**AI 行为:**
- 调用 `get_file_contents` 读取文件
- 返回文件内容

**用户:** "在我的仓库创建一个新的 Issue"

**AI 行为:**
- 调用 `create_issue` 创建 Issue
- 返回创建结果

#### Wikipedia 服务示例

**用户:** "查询人工智能的维基百科信息"

**AI 行为:**
- 调用 `findPage` 搜索页面
- 调用 `getPage` 获取页面内容
- 返回维基百科内容

**用户:** "历史上的今天发生了什么?"

**AI 行为:**
- 调用 `onThisDay` 查询历史事件
- 返回今天的历史事件

### 4.2. 查看 MCP 服务调用过程

所有 MCP 服务的调用过程都会显示在 **"思考过程折叠框"** 中:

1. AI 收到您的请求
2. 在思考过程中整理需要搜索或处理的内容
3. 调用相应的 MCP 服务
4. MCP 服务的结果返回到思考过程中
5. AI 整理结果并输出给您

**思考过程折叠框默认是折叠状态**,您可以点击展开查看详细的调用过程。

---

## 5. 常见问题

### Q1: 为什么有些服务需要配置 API Key?

**A:** Brave Search 和 GitHub 等服务需要访问外部 API,这些 API 需要身份验证。每个用户都应该使用自己的 API Key,以确保:
- **安全性:** 您的 API Key 不会被他人使用
- **配额管理:** 每个 API Key 都有使用限制
- **个性化:** 访问您自己的 GitHub 仓库和数据

### Q2: API Key 存储在哪里?安全吗?

**A:** API Keys 使用 AES-256-CBC 加密后存储在本地文件 `data/config.json` 中。加密密钥存储在 `.key` 文件中。这两个文件都已加入 `.gitignore`,不会被提交到 Git 仓库。

### Q3: 如何删除已配置的 API Key?

**A:** 
1. 打开前端应用
2. 进入 **设置** → **API Keys**
3. 找到对应的服务
4. 点击 **删除** 按钮

### Q4: Notion、Gmail、Google Calendar 为什么没有集成?

**A:** 这三个服务需要复杂的 OAuth 2.0 认证流程,需要:
- 在 Google Cloud Console 创建项目
- 配置 OAuth 凭据
- 实现授权回调流程

我们计划在后续版本中完善这些服务的集成。

### Q5: 如何测试 MCP 服务是否正常工作?

**A:** 运行测试脚本:

```bash
node test-all-batch1-batch2.cjs
```

该脚本会测试所有 8 个 MCP 服务,并显示测试结果。

### Q6: MCP 服务调用失败怎么办?

**A:** 检查以下几点:
1. **服务是否启动:** 查看后端日志,确认服务已成功启动
2. **API Key 是否正确:** 在设置页面点击"测试"按钮验证
3. **网络连接:** 确保网络正常,可以访问外部 API
4. **参数是否正确:** 查看错误信息,确认参数格式正确

### Q7: 如何查看所有可用的工具?

**A:** 访问 API 端点:

```bash
curl http://localhost:3001/api/mcp/tools
```

或在前端应用中查看"思考过程折叠框",AI 会显示调用了哪些工具。

### Q8: 可以同时使用多个 MCP 服务吗?

**A:** 可以!AI 会根据您的请求自动判断需要调用哪些服务,并可以组合使用多个服务。

例如:
- "搜索 MCP 协议的信息,并将结果保存到文件中" → 使用 Brave Search + Filesystem
- "查看我的 GitHub 仓库的最新提交,并记住这些信息" → 使用 GitHub + Memory

---

## 6. 故障排查

### 6.1. 后端服务无法启动

**症状:** 运行 `node server/index.cjs` 后报错

**可能原因:**
1. 端口 3001 已被占用
2. 依赖未安装完整
3. MCP 服务未安装

**解决方案:**

```bash
# 检查端口占用
lsof -i :3001

# 重新安装依赖
npm install

# 安装 MCP 服务
pip3 install mcp-server-git
npm install -g @modelcontextprotocol/server-memory
# ... 安装其他服务
```

### 6.2. MCP 服务启动失败

**症状:** 后端日志显示 "服务启动失败"

**可能原因:**
1. MCP 服务未安装
2. Python/Node.js 版本不兼容
3. 配置文件错误

**解决方案:**

```bash
# 检查 Python 版本
python3 --version  # 应该是 3.11+

# 检查 Node.js 版本
node --version  # 应该是 22.13.0+

# 重新安装 MCP 服务
pip3 install --upgrade mcp-server-git
```

### 6.3. API Key 配置后仍然无法使用

**症状:** 配置了 API Key,但调用服务时仍然报错

**可能原因:**
1. API Key 格式错误
2. API Key 权限不足
3. 服务未重启

**解决方案:**

1. **验证 API Key:**
   - Brave Search: 访问 https://brave.com/search/api/ 检查 API Key 状态
   - GitHub: 访问 https://github.com/settings/tokens 检查 Token 权限

2. **重启服务:**
   ```bash
   # 停止后端服务 (Ctrl+C)
   # 重新启动
   node server/index.cjs
   ```

3. **查看日志:**
   ```bash
   tail -f server.log
   ```

### 6.4. 前端无法连接后端

**症状:** 前端显示 "无法连接到服务器"

**可能原因:**
1. 后端未启动
2. 端口配置错误
3. 防火墙阻止

**解决方案:**

```bash
# 检查后端是否运行
ps aux | grep "node server/index.cjs"

# 检查端口是否监听
lsof -i :3001

# 测试 API 连接
curl http://localhost:3001/api/mcp/health
```

### 6.5. Git 服务无法访问仓库

**症状:** Git 服务调用失败,提示 "not a git repository"

**可能原因:**
1. 当前目录不是 Git 仓库
2. Git 服务配置的仓库路径错误

**解决方案:**

检查 `server/config.cjs` 中 Git 服务的配置:

```javascript
git: {
  // ...
  args: ['--repository', '/home/ubuntu/AI-Life-system']  // 确保路径正确
}
```

---

## 7. 高级配置

### 7.1. 自定义 MCP 服务配置

编辑 `server/config.cjs` 文件,可以自定义服务配置:

```javascript
module.exports = {
  mcpServices: {
    memory: {
      id: 'memory',
      name: 'Memory记忆系统',
      enabled: true,  // 启用/禁用服务
      autoLoad: true,  // 是否自动加载
      // ... 其他配置
    }
  }
};
```

### 7.2. 添加新的 MCP 服务

1. 安装 MCP 服务包
2. 在 `server/config.cjs` 中添加配置
3. 如果需要 API Key,在前端 `ApiKeysConfig.jsx` 中添加服务信息
4. 重启后端服务

### 7.3. 环境变量配置

您也可以通过环境变量配置 API Keys:

1. 复制 `.env.example` 为 `.env`
2. 填入您的 API Keys
3. 重启服务

**注意:** 前端配置的 API Keys 优先级高于环境变量。

---

## 8. 最佳实践

### 8.1. API Key 管理

- ✅ 定期更新 API Keys
- ✅ 使用最小权限原则
- ✅ 为不同项目使用不同的 API Keys
- ✅ 设置合理的过期时间
- ❌ 不要将 API Keys 提交到 Git 仓库
- ❌ 不要在公开场合分享 API Keys

### 8.2. 服务使用

- ✅ 明确告诉 AI 您需要什么信息
- ✅ 查看思考过程,了解 AI 的调用逻辑
- ✅ 对于复杂任务,分步骤提问
- ❌ 不要一次性提出过多要求

### 8.3. 性能优化

- ✅ 禁用不需要的 MCP 服务
- ✅ 定期清理 Memory 服务的数据
- ✅ 使用缓存减少重复调用

---

## 9. 获取帮助

如果您遇到问题,可以:

1. **查看日志:** `tail -f server.log`
2. **运行测试:** `node test-all-batch1-batch2.cjs`
3. **查看文档:** 阅读本教程和集成报告
4. **提交 Issue:** https://github.com/77Ezra1/AI-Life-system/issues

---

**祝您使用愉快!** 🎉

