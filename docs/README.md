# Personal Chatbox 文档目录

> 📚 项目文档组织结构

## 📁 目录结构

```
docs/
├── README.md                    # 本文件
├── features/                    # 功能文档
│   ├── notes/                  # 笔记管理 (50+ 文档)
│   ├── analytics/              # 数据分析 (15+ 文档)
│   ├── ai-agent/               # AI Agent (10+ 文档)
│   ├── documents/              # 文档管理 (3 文档)
│   └── MCP_*.md                # MCP 集成文档
├── guides/                      # 使用指南
│   ├── api/                    # API 配置指南
│   ├── i18n/                   # 国际化指南
│   └── *.md                    # 其他指南
├── reports/                     # 报告文档
│   ├── fixes/                  # 修复报告 (20+ 文档)
│   ├── tests/                  # 测试报告 (10+ 文档)
│   └── *.md                    # 优化报告
├── quickstart/                  # 快速开始
│   └── *_QUICKSTART.md         # 各功能快速入门
├── ui/                          # UI/UX 文档
│   └── *.md                    # UI 开发指南
├── database/                    # 数据库文档
│   └── *.md                    # 数据库设置和迁移
├── setup/                       # 设置指南
│   └── *.md                    # 环境和服务设置
├── startup/                     # 启动指南
│   └── *.md                    # 项目启动文档
└── archive/                     # 归档文档
    └── 2025-01/                # 2025年1月归档
        └── *.md                # 已完成/过时文档
```

## 🔍 快速查找

### 我想学习如何使用...

**笔记功能**
- 快速开始: [quickstart/](quickstart/)
- 详细文档: [features/notes/](features/notes/)
- AI 助手: [features/notes/NOTES_AI_*.md](features/notes/)

**数据分析**
- 快速开始: [quickstart/](quickstart/)
- 功能文档: [features/analytics/](features/analytics/)
- 智能洞察: [features/analytics/ANALYTICS_INSIGHTS_*.md](features/analytics/)

**AI Agent**
- 配置指南: [features/ai-agent/AI_AGENT_CONFIG_GUIDE.md](features/ai-agent/)
- 使用指南: [features/ai-agent/AI_AGENT_GUIDE.md](features/ai-agent/)
- 测试报告: [features/ai-agent/](features/ai-agent/)

### 我遇到了问题...

**配置问题**
- API 配置: [guides/api/](guides/api/)
- 数据库设置: [database/](database/)
- 环境配置: [setup/](setup/)

**功能 Bug**
- 修复记录: [reports/fixes/](reports/fixes/)
- 已知问题: [reports/fixes/](reports/fixes/)

**测试失败**
- 测试报告: [reports/tests/](reports/tests/)
- 测试指南: [reports/tests/](reports/tests/)

### 我想开发...

**UI 组件**
- UI 开发指南: [ui/UI_DEVELOPMENT_GUIDE.md](ui/)
- 组件文档: [ui/](ui/)
- 颜色系统: [ui/GLOBAL_COLOR_*.md](ui/)

**新功能**
- 功能示例: [features/](features/)
- 开发路线图: [reports/](reports/)

## 📊 文档统计

- **总文档数**: 116 个 markdown 文件
- **功能文档**: 70+ 个
- **指南文档**: 15+ 个
- **报告文档**: 30+ 个
- **归档文档**: 13 个

## 🔗 重要链接

- [项目主 README](../README.md)
- [文档索引](../DOCUMENTATION.md)
- [更新日志](../CHANGELOG.md)
- [完整功能列表](features/)

## 📝 文档维护

### 添加新文档
1. 确定文档类别
2. 放到对应目录
3. 更新本 README 或主 DOCUMENTATION.md

### 归档文档
- 已完成的任务 → `archive/{year-month}/`
- 过时的文档 → `archive/{year-month}/`

---

最后更新: 2025-01-21
