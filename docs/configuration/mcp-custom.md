# 🚀 MCP 自定义配置功能

> 通过可视化界面轻松管理和配置MCP服务

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-ready-brightgreen)

## ✨ 特点

- 📦 **20+ 服务模板** - 涵盖开发、数据库、云服务等14个分类
- 🎨 **v0.dev 设计风格** - 现代化、流畅的用户界面
- ⚙️ **灵活配置** - 支持模板添加和自定义配置
- 🔐 **安全可靠** - 环境变量加密存储,用户数据隔离
- 📱 **响应式设计** - 完美支持桌面端、平板和移动端
- 🌓 **主题支持** - 暗色/亮色模式自动适配

## 🎯 快速开始

### 1. 访问配置页面

```
http://localhost:5173/mcp-custom
```

### 2. 添加你的第一个服务

选择 **Filesystem** 服务:
1. 在"服务模板"页面找到 📁 Filesystem
2. 点击"添加服务"
3. 切换到"我的服务"启用它
4. 开始使用!

### 3. 在对话中使用

```
你: 帮我创建一个文件夹
AI: [调用Filesystem服务完成操作]
```

## 📚 文档

- 📖 [快速开始指南](docs/MCP_QUICK_START.md) - 5分钟上手
- 📘 [完整使用指南](docs/MCP_CUSTOM_CONFIGURATION_GUIDE.md) - 详细教程
- 📝 [功能实现总结](MCP_CUSTOM_FEATURE_SUMMARY.md) - 技术细节

## 🎁 内置服务模板

### 开发工具
- 🔧 GitHub - 代码仓库管理
- 📁 Filesystem - 文件系统操作
- 🔀 Git - 版本控制

### 数据库
- 🐘 PostgreSQL - 关系型数据库
- 🍃 MongoDB - NoSQL数据库
- 🗄️ SQLite - 轻量级数据库

### 团队协作
- 💬 Slack - 即时通讯
- 📧 Gmail - 邮件管理
- 📝 Notion - 笔记管理

### 自动化
- 🎭 Puppeteer - 浏览器自动化
- ⚙️ Zapier - 工作流自动化
- 🌐 Fetch - 网页抓取

**...还有更多!** 查看完整列表 →

## 🔧 核心功能

### 服务管理
- ✅ 从模板添加服务
- ✅ 自定义添加服务
- ✅ 启用/禁用服务
- ✅ 测试服务连接
- ✅ 编辑服务配置
- ✅ 删除服务

### 搜索和筛选
- 🔍 关键词搜索
- 📂 分类筛选
- 🏷️ 标签过滤
- ⭐ 热门服务

### 配置管理
- 🔑 环境变量配置
- 👁️ 显示/隐藏敏感信息
- 📋 一键复制
- 💾 自动保存

## 📸 界面预览

### 服务模板页面
```
┌─────────────────────────────────────┐
│  MCP 服务管理        [自定义添加]  │
├─────────────────────────────────────┤
│ [服务模板] [我的服务]              │
│                                     │
│ [🔍 搜索] [📂 分类筛选]            │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ 🔧  │ │ 📁  │ │ 🐘  │           │
│ │GitHub│ │File │ │PG DB│  ...     │
│ └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────┘
```

### 我的服务页面
```
┌─────────────────────────────────────┐
│  我的服务 (3)                       │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔧 GitHub          [✓ 已启用]  │ │
│ │ 代码仓库管理                    │ │
│ │ [⚡] [🔄] [ℹ️] [🗑️]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🛠️ 技术栈

### 后端
- Express.js - Web框架
- Better-SQLite3 - 数据库
- RESTful API - 接口设计

### 前端
- React 18 - UI框架
- React Router - 路由管理
- CSS Variables - 主题系统
- Lucide Icons - 图标库

## 📊 项目结构

```
Personal-Chatbox/
├── server/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 022-add-user-mcp-configs.sql
│   │   └── data/
│   │       └── mcp-templates.json
│   └── routes/
│       └── mcp.cjs
├── src/
│   └── pages/
│       ├── McpCustomPage.jsx
│       └── McpCustomPage.css
└── docs/
    ├── MCP_QUICK_START.md
    └── MCP_CUSTOM_CONFIGURATION_GUIDE.md
```

## 🔌 API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/mcp/templates` | 获取服务模板 |
| GET | `/api/mcp/user-configs` | 获取用户配置 |
| POST | `/api/mcp/user-configs` | 创建配置 |
| PUT | `/api/mcp/user-configs/:id` | 更新配置 |
| DELETE | `/api/mcp/user-configs/:id` | 删除配置 |
| POST | `/api/mcp/user-configs/:id/toggle` | 切换启用 |
| POST | `/api/mcp/user-configs/from-template` | 从模板创建 |
| POST | `/api/mcp/user-configs/:id/test` | 测试连接 |

## 🎨 设计理念

### v0.dev 风格
- 🎭 优雅的动画效果
- 🎨 精致的视觉设计
- 📐 一致的设计系统
- 🌊 流畅的用户体验

### 用户体验
- 💡 直观的操作流程
- ⚡ 快速的响应速度
- 🎯 精准的错误提示
- 🎁 贴心的使用引导

## 🔐 安全特性

- 🔒 环境变量加密存储
- 👤 用户数据隔离
- 🛡️ SQL注入防护
- 🔐 XSS攻击防护
- 🚫 CSRF保护

## 📈 性能优化

- ⚡ 页面懒加载
- 🗃️ 数据库索引
- 💾 API缓存
- 📦 代码分割
- 🎯 按需加载

## 🤝 贡献

欢迎提交Issue和Pull Request!

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下项目和资源:
- [Model Context Protocol](https://modelcontextprotocol.io)
- [v0.dev](https://v0.dev) - UI设计灵感
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)

---

**开发时间**: 2025-10-17
**版本**: v1.0.0
**状态**: ✅ 生产就绪

Happy Coding! 🎉
