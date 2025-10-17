# MCP 自定义配置功能使用指南

## 📋 功能概述

MCP(Model Context Protocol)自定义配置功能允许用户通过可视化界面管理和配置MCP服务。您可以:

- 📦 从预置模板快速添加MCP服务
- ⚙️ 自定义配置MCP服务参数
- 🔌 启用/禁用MCP服务
- 🧪 测试MCP服务连接
- 📝 查看服务详细信息和文档

## 🎯 功能特点

### 1. 服务模板库

项目内置了20+个优质MCP服务模板,涵盖:

- **开发工具** (GitHub, Git, Filesystem)
- **数据库** (PostgreSQL, MongoDB, SQLite)
- **云服务** (AWS, Google Drive)
- **自动化** (Puppeteer, Zapier)
- **通讯协作** (Slack, Gmail)
- **生产力** (Notion, Jira, Linear)
- **其他** (搜索引擎、设计工具、支付平台等)

### 2. v0.dev 设计风格

采用现代化的设计风格,包括:
- 流畅的动画效果
- 卡片式布局
- 响应式设计
- 暗色/亮色模式支持

### 3. 完整的服务管理

- ✅ 添加服务
- 🔄 启用/禁用
- 📝 编辑配置
- 🗑️ 删除服务
- 🧪 连接测试

## 🚀 快速开始

### 访问配置页面

1. 启动应用后,访问 `/mcp-custom` 路由
2. 或在侧边栏点击"MCP服务"菜单项(如果已配置)

### 从模板添加服务

1. 进入"服务模板"标签页
2. 浏览可用的MCP服务模板
3. 点击服务卡片查看详细信息
4. 点击"添加服务"按钮
5. 如需配置环境变量,填写必要信息
6. 完成添加

### 管理已添加的服务

1. 切换到"我的服务"标签页
2. 查看所有已添加的MCP服务
3. 使用开关按钮启用/禁用服务
4. 点击测试按钮验证连接
5. 点击删除按钮移除服务

### 自定义添加服务

1. 点击右上角"自定义添加"按钮
2. 填写服务信息:
   - 服务ID (唯一标识)
   - 服务名称
   - 描述
   - 分类
   - 命令和参数
   - 环境变量(JSON格式)
3. 点击"添加"完成

## 📚 内置MCP服务模板

### 开发工具类

#### GitHub (官方)
- **功能**: 仓库管理、Issue管理、Pull Request操作、代码搜索
- **配置**: 需要 GitHub Personal Access Token
- **文档**: https://github.com/modelcontextprotocol/servers/tree/main/src/github

#### Filesystem (官方)
- **功能**: 安全的文件系统操作,读写文件、目录管理
- **配置**: 指定允许访问的目录路径
- **文档**: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

#### Git (官方)
- **功能**: Git版本控制操作,提交历史、分支管理
- **配置**: 无需额外配置
- **文档**: https://github.com/modelcontextprotocol/servers/tree/main/src/git

### 数据库类

#### PostgreSQL (官方)
- **功能**: PostgreSQL数据库查询、表结构管理、数据分析
- **配置**: 需要数据库连接字符串
- **示例**: `postgresql://user:password@localhost/dbname`

#### MongoDB
- **功能**: NoSQL数据库操作、文档查询、聚合分析
- **配置**: 需要MongoDB连接字符串
- **示例**: `mongodb://localhost:27017` 或 `mongodb+srv://...`

#### SQLite (官方)
- **功能**: 轻量级数据库访问、SQL查询
- **配置**: 指定数据库文件路径
- **示例**: `/path/to/database.db`

### 自动化类

#### Puppeteer (官方)
- **功能**: 浏览器自动化、网页截图、PDF生成、表单填写
- **配置**: 无需额外配置
- **注意**: 首次运行会自动下载Chromium

#### Zapier
- **功能**: 工作流自动化、多应用集成
- **配置**: 需要 Zapier API Key
- **获取**: https://zapier.com/app/settings/api

### 通讯协作类

#### Slack (官方)
- **功能**: 发送消息、管理频道、读取历史记录
- **配置**: 需要 Slack Bot Token
- **获取**: https://api.slack.com/apps

#### Gmail (官方)
- **功能**: 读取邮件、发送邮件、搜索邮件
- **配置**: 需要 Google OAuth 凭据

### 生产力类

#### Notion
- **功能**: 页面管理、数据库操作、块编辑
- **配置**: 需要 Notion API Key
- **获取**: https://www.notion.so/my-integrations

#### Jira
- **功能**: Issue管理、Sprint管理、看板操作
- **配置**: 需要 Jira URL、用户名、API Token
- **获取**: 在Atlassian账户设置中创建

#### Linear
- **功能**: Issue管理、项目追踪、工作流管理
- **配置**: 需要 Linear API Key
- **获取**: 在Linear设置中创建

### 云服务类

#### Google Drive (官方)
- **功能**: 文件上传下载、文件夹管理、Google文档读取
- **配置**: 需要 Google OAuth 凭据

#### AWS
- **功能**: EC2管理、S3存储、Lambda函数
- **配置**: 需要 AWS Access Key ID 和 Secret Access Key

### 其他类

#### Brave Search (官方)
- **功能**: 隐私保护的网页搜索
- **配置**: 需要 Brave API Key
- **获取**: https://brave.com/search/api/

#### Fetch (官方)
- **功能**: 网页内容抓取、HTML解析
- **配置**: 无需额外配置

## 🔧 配置详解

### 环境变量格式

环境变量使用JSON格式配置,例如:

```json
{
  "API_KEY": "your-api-key-here",
  "API_URL": "https://api.example.com",
  "TIMEOUT": "5000"
}
```

### 命令参数格式

命令参数用空格分隔,例如:

```
-y @modelcontextprotocol/server-github
```

将被解析为:
```json
["-y", "@modelcontextprotocol/server-github"]
```

### 服务分类

可选的服务分类:

- `development` - 开发工具
- `database` - 数据库
- `cloud` - 云服务
- `automation` - 自动化
- `communication` - 通讯协作
- `productivity` - 生产力
- `storage` - 存储
- `monitoring` - 监控
- `payment` - 支付
- `design` - 设计
- `system` - 系统
- `network` - 网络
- `search` - 搜索
- `devops` - DevOps
- `other` - 其他

## 🔍 使用示例

### 示例1: 添加GitHub服务

1. 在模板页面找到"GitHub"服务
2. 点击"添加服务"
3. 填写GitHub Personal Access Token:
   - 访问 https://github.com/settings/tokens
   - 创建新token,选择权限: `repo`, `workflow`, `read:org`
   - 复制token并粘贴到配置中
4. 点击"添加服务"完成
5. 在"我的服务"中启用该服务

### 示例2: 添加PostgreSQL服务

1. 在模板页面找到"PostgreSQL"服务
2. 点击"添加服务"
3. 准备数据库连接字符串:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```
4. 添加并启用服务
5. 点击"测试"按钮验证连接

### 示例3: 自定义添加服务

假设你想添加一个自定义的API服务:

1. 点击"自定义添加"
2. 填写表单:
   - 服务ID: `my-custom-api`
   - 服务名称: `我的自定义API`
   - 描述: `连接到我的自定义API服务`
   - 分类: `other`
   - 图标: `🔌`
   - 命令: `node`
   - 参数: `./my-mcp-server.js`
   - 环境变量:
     ```json
     {
       "API_KEY": "xxx",
       "BASE_URL": "https://api.myservice.com"
     }
     ```
3. 点击"添加"

## 📡 API端点

### 获取模板列表
```
GET /api/mcp/templates
```

### 获取用户配置
```
GET /api/mcp/user-configs
```

### 添加配置
```
POST /api/mcp/user-configs
Content-Type: application/json

{
  "mcp_id": "github",
  "name": "GitHub",
  "description": "...",
  "category": "development",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env_vars": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "xxx"
  }
}
```

### 从模板创建
```
POST /api/mcp/user-configs/from-template
Content-Type: application/json

{
  "templateId": "github",
  "customEnvVars": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "xxx"
  }
}
```

### 更新配置
```
PUT /api/mcp/user-configs/:id
Content-Type: application/json

{
  "enabled": true,
  "env_vars": {...}
}
```

### 切换启用状态
```
POST /api/mcp/user-configs/:id/toggle
```

### 测试连接
```
POST /api/mcp/user-configs/:id/test
```

### 删除配置
```
DELETE /api/mcp/user-configs/:id
```

## 🐛 常见问题

### Q: 添加服务后如何使用?

A: 添加并启用服务后,AI助手在对话中会自动识别需要调用的MCP工具。例如,启用GitHub服务后,你可以问"帮我查看仓库的最新提交"。

### Q: 环境变量如何保护?

A: 环境变量存储在数据库中,在UI中默认隐藏显示。建议不要在生产环境中直接暴露敏感信息。

### Q: 可以同时启用多个服务吗?

A: 可以!你可以同时启用任意多个MCP服务,AI会根据需要调用相应的服务。

### Q: 如何获取API Key?

A: 每个服务的详情页面都提供了文档链接,点击链接可以查看如何获取API Key。

### Q: 测试连接失败怎么办?

A:
1. 检查环境变量是否正确配置
2. 确认API Key是否有效
3. 检查网络连接
4. 查看服务的官方文档

## 🔐 安全建议

1. **不要共享API密钥**: API密钥应该保密,不要在公共场合分享
2. **使用最小权限**: 创建API密钥时,只授予必要的权限
3. **定期轮换密钥**: 定期更新API密钥以提高安全性
4. **监控使用情况**: 定期检查API使用情况,及时发现异常

## 📞 技术支持

如有问题或建议,请:
1. 查看项目文档
2. 提交GitHub Issue
3. 联系开发团队

## 🎉 下一步

现在你已经了解了MCP自定义配置功能,可以:

1. 🚀 开始添加你需要的MCP服务
2. 🧪 测试服务连接确保正常工作
3. 💬 在对话中体验AI调用MCP工具的强大功能
4. 📝 根据需要自定义更多服务

祝使用愉快! 🎊
