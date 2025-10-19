# MCP 服务自定义模块 - 完整实现文档

## 📋 项目概述

本文档描述了 Personal Chatbox 项目中 **MCP 服务自定义模块** 的完整实现。该模块允许用户通过直观的卡片式 UI 自主配置和管理 MCP (Model Context Protocol) 服务，遵循 v0.dev 设计风格。

## 🎯 核心功能

### 1. 服务模板库
- ✅ 预置 20+ 优质 MCP 服务模板
- ✅ 涵盖开发工具、数据库、云服务、自动化等多个类别
- ✅ 包含官方和社区流行服务
- ✅ 详细的服务描述和配置说明

### 2. 用户友好的配置界面
- ✅ 卡片式布局，清晰展示服务信息
- ✅ 分类筛选和搜索功能
- ✅ 一键添加服务
- ✅ 可视化环境变量配置
- ✅ 服务状态管理（启用/禁用）

### 3. 开箱即用体验
- ✅ 大部分服务无需 API Key
- ✅ 需要配置的服务提供详细指引
- ✅ 支持测试连接功能
- ✅ 实时状态反馈

### 4. 自定义服务支持
- ✅ 允许用户手动添加自定义 MCP 服务
- ✅ 灵活的参数配置
- ✅ JSON 格式环境变量
- ✅ 完整的服务生命周期管理

## 🏗️ 架构设计

### 技术栈
- **前端**: React + shadcn/ui + Tailwind CSS
- **后端**: Node.js + Express
- **数据库**: SQLite
- **设计风格**: v0.dev (shadcn + Tailwind)

### 目录结构
```
Personal-Chatbox/
├── src/
│   ├── pages/
│   │   ├── McpCustomPage.jsx         # MCP 服务管理页面
│   │   └── McpCustomPage.css         # 页面样式
│   ├── components/
│   │   ├── mcp/
│   │   │   ├── McpServiceConfig.jsx  # 服务配置组件
│   │   │   └── McpPathConfig.jsx     # 路径配置组件
│   │   └── ui/                       # shadcn/ui 组件库
│   └── hooks/
│       └── useMcpManager.js          # MCP Manager Hook
├── server/
│   ├── routes/
│   │   └── mcp.cjs                   # MCP API 路由
│   ├── services/
│   │   ├── mcp-manager.cjs           # MCP 服务管理器
│   │   └── config-storage.cjs        # 配置存储
│   ├── data/
│   │   └── mcp-templates.json        # 服务模板数据
│   └── db/
│       └── migrations/
│           └── 022-add-user-mcp-configs.sql  # 数据库迁移
└── docs/
    └── MCP_SERVICE_CUSTOM_MODULE.md  # 本文档
```

## 📊 数据模型

### 服务模板 (mcp-templates.json)
```json
{
  "id": "github",
  "name": "GitHub",
  "description": "与 GitHub 仓库交互，浏览代码、创建 Issue、管理 PR",
  "icon": "🐙",
  "category": "development",
  "official": true,
  "popularity": "high",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": ""
  },
  "features": ["浏览和搜索代码", "创建和更新 Issue"],
  "setupInstructions": {
    "zh": "...",
    "en": "..."
  },
  "documentation": "https://..."
}
```

### 用户配置 (user_mcp_configs 表)
```sql
CREATE TABLE user_mcp_configs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  mcp_id TEXT,              -- 服务 ID
  enabled BOOLEAN,          -- 是否启用
  name TEXT,                -- 服务名称
  command TEXT,             -- 执行命令
  args TEXT,                -- JSON: 命令参数
  env_vars TEXT,            -- JSON: 环境变量
  config_data TEXT,         -- JSON: 其他配置
  -- ... 更多字段
)
```

## 🎨 设计系统 (v0.dev 风格)

### 颜色系统
基于 CSS 变量的语义化颜色：
- `--background`: 页面背景
- `--card`: 卡片背景
- `--primary`: 主色调
- `--border`: 边框颜色
- `--muted-foreground`: 次要文字颜色

### 组件设计原则
1. **清晰的视觉层次**: 使用阴影、边框、间距建立层次
2. **流畅的交互动画**: 所有交互都有 200ms 的过渡效果
3. **响应式布局**: 自适应不同屏幕尺寸
4. **无障碍支持**: 键盘导航、焦点状态、ARIA 属性
5. **深色模式优化**: 完整的深色模式支持

### 卡片设计
```css
.mcp-card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mcp-card:hover {
  border-color: var(--input-focus);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

## 🔌 API 接口

### 1. 获取服务模板
```
GET /api/mcp/templates
Response: {
  success: true,
  templates: [...],
  categories: {...}
}
```

### 2. 获取用户配置
```
GET /api/mcp/user-configs
Response: {
  success: true,
  configs: [...]
}
```

### 3. 添加服务配置
```
POST /api/mcp/user-configs
Body: {
  mcp_id, name, description, command, args, env_vars, ...
}
```

### 4. 从模板添加
```
POST /api/mcp/user-configs/from-template
Body: {
  templateId: "github",
  customEnvVars: { ... }
}
```

### 5. 切换服务状态
```
POST /api/mcp/user-configs/:id/toggle
```

### 6. 测试服务连接
```
POST /api/mcp/user-configs/:id/test
Response: {
  success: true,
  latency: 123
}
```

### 7. 删除服务配置
```
DELETE /api/mcp/user-configs/:id
```

## 🌟 预置服务模板

### 开发工具 (Development)
- **GitHub** 🐙: 代码仓库管理
- **Git** 🔀: 版本控制
- **Filesystem** 📁: 文件系统访问

### 数据库 (Database)
- **PostgreSQL** 🐘: 关系型数据库
- **SQLite** 🗄️: 轻量级数据库
- **MongoDB** 🍃: NoSQL 数据库

### 搜索服务 (Search)
- **Brave Search** 🦁: 隐私保护搜索
- **Google Maps** 🗺️: 地图服务

### 生产力工具 (Productivity)
- **Slack** 💬: 团队协作
- **Notion** 📝: 笔记管理
- **Jira** 📋: 项目管理
- **Linear** ⚡: Issue 追踪

### 自动化 (Automation)
- **Puppeteer** 🎪: 浏览器自动化
- **Zapier** ⚙️: 工作流自动化

### 云服务 (Cloud)
- **AWS** ☁️: 亚马逊云服务
- **Cloudflare** ☁️: CDN 和 DNS

### 其他服务
- **Stripe** 💳: 支付处理
- **Sentry** 🐛: 错误监控
- **Figma** 🎨: 设计工具
- **Docker** 🐳: 容器管理

## 🚀 使用指南

### 1. 浏览服务模板
1. 进入 "MCP 服务" 页面
2. 浏览 "服务模板" 标签页
3. 使用搜索框或分类筛选查找服务
4. 点击服务卡片查看详情

### 2. 添加服务
#### 方式一：从模板添加
1. 在服务卡片上点击 "添加服务"
2. 如需配置环境变量，填写相应值
3. 点击确认，服务自动启用

#### 方式二：自定义添加
1. 点击 "自定义添加" 按钮
2. 填写服务信息：
   - 服务 ID (唯一标识)
   - 服务名称
   - 描述
   - 命令 (如 `npx`)
   - 参数 (如 `-y @modelcontextprotocol/server-xxx`)
   - 环境变量 (JSON 格式)
3. 保存配置

### 3. 管理服务
1. 切换到 "我的服务" 标签页
2. 查看已添加的服务
3. 可以进行以下操作：
   - 启用/禁用服务
   - 测试连接
   - 查看详情
   - 删除服务

## 🎯 开箱即用服务

以下服务无需 API Key 即可使用：
- SQLite
- Filesystem
- Git
- Puppeteer
- Memory
- Sequential Thinking
- Fetch

## 🔐 需要配置的服务

以下服务需要 API Key：
1. **GitHub** - Personal Access Token
2. **Brave Search** - API Key (每月 2000 次免费)
3. **Google Maps** - API Key
4. **Slack** - Bot Token
5. **AWS** - Access Key 和 Secret Key
6. **Notion** - Integration Token
7. **Stripe** - Secret Key

每个服务都提供详细的获取 API Key 指引。

## 💡 最佳实践

### 1. 服务选择
- 优先选择官方服务
- 根据实际需求添加服务
- 注意服务的资源消耗

### 2. 安全配置
- API Key 存储在本地数据库，加密处理
- 定期更新 API Key
- 遵循最小权限原则

### 3. 性能优化
- 禁用不常用的服务
- 监控服务响应时间
- 合理设置请求频率

### 4. 故障排查
- 使用 "测试连接" 功能验证配置
- 查看服务日志定位问题
- 参考官方文档解决问题

## 🔄 工作流程

```
用户浏览服务模板
       ↓
选择合适的服务
       ↓
配置环境变量 (如需要)
       ↓
添加到我的服务
       ↓
自动启动服务
       ↓
AI 可以调用服务工具
       ↓
用户可管理服务状态
```

## 📈 未来规划

### 短期
- [ ] 添加更多服务模板
- [ ] 服务使用统计
- [ ] 批量操作支持
- [ ] 导入/导出配置

### 中期
- [ ] 服务依赖管理
- [ ] 自动更新服务
- [ ] 服务性能监控
- [ ] 社区服务市场

### 长期
- [ ] 可视化工作流编排
- [ ] 服务编排引擎
- [ ] 多用户协作
- [ ] 云端同步配置

## 🐛 已知问题

1. Windows 系统下部分服务可能需要额外配置
2. 首次启动服务可能需要较长时间
3. 某些服务在国内网络环境下可能无法访问

## 🤝 贡献指南

欢迎贡献新的服务模板！

### 添加新模板步骤
1. 在 `server/data/mcp-templates.json` 添加模板
2. 确保包含完整的配置信息
3. 提供中英文说明
4. 测试服务可用性
5. 提交 Pull Request

### 模板规范
```json
{
  "id": "unique-service-id",
  "name": "Service Name",
  "description": "Clear description",
  "icon": "😀",
  "category": "category-name",
  "official": true/false,
  "popularity": "high/medium/low",
  "command": "npx",
  "args": ["-y", "package-name"],
  "env": {},
  "features": [],
  "setupInstructions": {
    "zh": "中文说明",
    "en": "English instruction"
  },
  "documentation": "https://..."
}
```

## 📚 参考资源

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [v0.dev 设计系统](https://v0.dev/)
- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [MCP 服务器列表](https://github.com/modelcontextprotocol/servers)

## 📞 支持与反馈

如有问题或建议，请：
1. 查看本文档
2. 搜索已有 Issue
3. 创建新的 Issue
4. 联系项目维护者

## 📄 许可证

本项目遵循 MIT 许可证。

---

**最后更新**: 2025年10月19日
**版本**: 1.0.0
**维护者**: Personal Chatbox Team
