# 📚 Claude Code 文档导航指南

> **目的**: 帮助 Claude 快速检索和理解项目文档结构
> **更新**: 2025-10-17
> **版本**: v2.0

---

## 🎯 核心文档索引

### 📌 必读文档（最高优先级）

当用户询问项目相关问题时，优先查看：

1. **[DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)**
   - 📖 90+ 文档的完整索引
   - 🔍 A-Z关键词搜索
   - 🎯 6个使用场景导航
   - **用途**: 作为文档检索的起点

2. **[README.md](../README.md)**
   - 📄 项目概览
   - 🚀 快速开始
   - 🔗 核心功能链接
   - **用途**: 了解项目整体情况

3. **[DOCUMENTATION_REORGANIZATION_COMPLETE.md](../DOCUMENTATION_REORGANIZATION_COMPLETE.md)**
   - 📋 文档重组记录
   - 🗺️ 文档迁移对照表
   - 🔗 链接更新指南
   - **用途**: 查找被移动的文档

---

## 🗂️ 文档目录结构

### 根目录核心文档

```
/
├── README.md                          # 项目主页
├── DOCUMENTATION_INDEX.md             # 📌 完整文档索引
├── CHANGELOG.md                       # 更新日志
├── START_GUIDE.md                     # 快速开始
├── QUICK_REFERENCE.md                 # 快速参考
└── NEXT_STEPS.md                      # 下一步计划
```

### 专题文档目录

```
docs/
├── 📁 features/                       # 功能文档 (12个)
│   ├── agent-implementation.md        # Agent功能实现
│   ├── notes-implementation.md        # 笔记功能
│   ├── user-profile.md                # 用户资料
│   ├── password-vault.md              # 密码保险库
│   ├── analytics-quickstart.md        # 数据分析
│   ├── i18n-quickstart.md             # 国际化
│   └── ...
│
├── 📁 ui/                             # UI/UX文档 (7个)
│   ├── chat-layout-v2.md              # 聊天布局
│   ├── color-optimization.md          # 颜色优化
│   ├── dual-view-features.md          # 双视图
│   └── ...
│
├── 📁 database/                       # 数据库文档 (4个)
│   ├── strategy-guide.md              # 🌟 数据库策略（14,000字）
│   ├── postgresql-setup.md            # PostgreSQL安装
│   ├── postgresql-fix.md              # PG兼容性修复
│   └── design.md                      # 数据库设计
│
├── 📁 configuration/                  # 配置文档 (4个)
│   ├── api-keys.md                    # API配置
│   ├── mcp-custom.md                  # MCP自定义
│   ├── git-commit.md                  # Git提交规范
│   └── ...
│
├── 📁 guides/                         # 用户指南 (15个)
│   ├── GETTING_STARTED.md             # 🌟 快速开始
│   ├── MCP_COMPLETE_USER_GUIDE.md     # 完整用户指南
│   ├── MCP_SERVICES_GUIDE.md          # MCP服务指南
│   └── ...
│
├── 📁 setup/                          # 安装配置 (7个)
│   ├── INSTALL_DEPENDENCIES.md        # 依赖安装
│   ├── BETTER_SQLITE3_INSTALL_GUIDE.md # SQLite安装排查
│   ├── GIT_CLONE_SPEEDUP.md           # Git加速
│   └── ...
│
└── 📁 reports/                        # 技术报告 (8个)
    ├── BACKEND_ARCHITECTURE.md        # 后端架构
    ├── COMPREHENSIVE_TEST_REPORT.md   # 测试报告
    └── ...
```

### 归档目录

```
archive/
├── old-reports/                       # 旧报告 (6个)
│   ├── WORK_COMPLETED.md
│   └── ...
└── README.md                          # 归档说明
```

---

## 🔍 文档查找策略

### 场景1: 用户问"如何使用XXX功能"

**查找顺序**:
1. 先查 `DOCUMENTATION_INDEX.md` 搜索关键词
2. 再查 `docs/features/` 目录
3. 最后查 `docs/guides/` 用户指南

**示例**:
```
用户: "如何使用笔记功能？"
Claude:
1. 查看 DOCUMENTATION_INDEX.md 搜索"notes"
2. 找到 docs/features/notes-implementation.md
3. 阅读并总结给用户
```

### 场景2: 用户问"如何配置XXX"

**查找顺序**:
1. `docs/configuration/` 配置目录
2. `docs/setup/` 安装配置
3. `DOCUMENTATION_INDEX.md` 关键词搜索

**示例**:
```
用户: "如何配置API密钥？"
Claude:
1. 查看 docs/configuration/api-keys.md
2. 提供配置步骤
```

### 场景3: 用户问"数据库相关问题"

**必读文档**:
1. `docs/database/strategy-guide.md` - 14,000字完整指南
2. `docs/database/postgresql-setup.md` - 安装配置
3. `docs/database/postgresql-fix.md` - 问题修复

**示例**:
```
用户: "应该用什么数据库？"
Claude:
1. 阅读 docs/database/strategy-guide.md
2. 根据用户场景推荐：
   - 开发环境: SQLite
   - 生产环境: PostgreSQL
   - 不推荐: JSON
```

### 场景4: 用户问"UI/界面相关"

**查找顺序**:
1. `docs/ui/` UI文档目录
2. `docs/UI_DEVELOPMENT_GUIDE.md` 开发指南
3. `docs/UI_ROADMAP.md` UI路线图

### 场景5: 找不到文档

**应对策略**:
1. 查看 `DOCUMENTATION_REORGANIZATION_COMPLETE.md` 的迁移对照表
2. 搜索 `archive/` 归档目录
3. 建议用户查看 `DOCUMENTATION_INDEX.md`

---

## 📊 文档分类标签

使用以下标签快速识别文档类型：

### 🌟 核心文档
- README.md
- DOCUMENTATION_INDEX.md
- START_GUIDE.md

### 📖 指南类
- `docs/guides/GETTING_STARTED.md`
- `docs/guides/MCP_COMPLETE_USER_GUIDE.md`

### 🔧 配置类
- `docs/configuration/*.md`
- `docs/setup/*.md`

### 🎨 UI类
- `docs/ui/*.md`
- `docs/UI_DEVELOPMENT_GUIDE.md`

### 💾 数据库类
- `docs/database/*.md`

### 🎯 功能类
- `docs/features/*.md`

### 📊 报告类
- `docs/reports/*.md`
- `archive/old-reports/*.md`

---

## 🎯 常见问题快速查找

### Q: 如何快速开始？
→ `docs/guides/GETTING_STARTED.md`

### Q: 如何安装依赖？
→ `docs/setup/INSTALL_DEPENDENCIES.md`

### Q: 如何配置API密钥？
→ `docs/configuration/api-keys.md`

### Q: 数据库如何选择？
→ `docs/database/strategy-guide.md`

### Q: better-sqlite3 安装失败怎么办？
→ `docs/setup/BETTER_SQLITE3_INSTALL_GUIDE.md`

### Q: 如何使用MCP服务？
→ `docs/guides/MCP_SERVICES_GUIDE.md`

### Q: UI如何开发？
→ `docs/UI_DEVELOPMENT_GUIDE.md`

### Q: 如何提交代码？
→ `docs/configuration/git-commit.md`

### Q: 后端架构是什么？
→ `docs/reports/BACKEND_ARCHITECTURE.md`

### Q: 功能列表在哪？
→ `docs/COMPLETE_FEATURES_LIST.md`

### Q: 某个文档找不到了？
→ `DOCUMENTATION_REORGANIZATION_COMPLETE.md` 查看迁移记录

---

## 📝 文档命名规范

理解文档命名模式有助于快速定位：

| 后缀 | 含义 | 示例 |
|------|------|------|
| `-guide.md` | 详细指南 | `strategy-guide.md` |
| `-quickstart.md` | 快速开始 | `analytics-quickstart.md` |
| `-implementation.md` | 实现说明 | `agent-implementation.md` |
| `-setup.md` | 安装配置 | `postgresql-setup.md` |
| `-fix.md` | 问题修复 | `postgresql-fix.md` |
| `-report.md` | 报告文档 | `test-report.md` |
| `-summary.md` | 总结文档 | `agent-summary.md` |
| `-reference.md` | 参考文档 | `dual-view-reference.md` |

---

## 🚫 避免的陷阱

### ❌ 不要做的

1. **不要引用归档文档**
   - `archive/` 中的文档已过时
   - 应引用活跃的替代文档

2. **不要假设文档位置**
   - 文档已重组，旧路径可能无效
   - 先查 `DOCUMENTATION_REORGANIZATION_COMPLETE.md`

3. **不要忽略DOCUMENTATION_INDEX**
   - 这是最权威的文档目录
   - 包含90+文档的完整索引

### ✅ 应该做的

1. **优先使用DOCUMENTATION_INDEX**
   - 作为文档检索起点
   - 使用关键词搜索

2. **理解目录结构**
   - 功能 → `docs/features/`
   - UI → `docs/ui/`
   - 数据库 → `docs/database/`
   - 配置 → `docs/configuration/`

3. **查看迁移记录**
   - 找不到文档时查 `DOCUMENTATION_REORGANIZATION_COMPLETE.md`

---

## 📌 重要提醒

### 对于Claude Code的建议

1. **遍历项目时**
   - 优先读取 `DOCUMENTATION_INDEX.md`
   - 理解文档分类结构
   - 记住常用文档路径

2. **回答用户问题时**
   - 先确定问题类型（功能/配置/UI/数据库）
   - 查找对应目录下的文档
   - 引用具体的文档路径

3. **处理文档链接时**
   - 使用相对路径
   - 验证文档是否存在
   - 如果文档已移动，查迁移记录

4. **建议用户时**
   - 引导用户查看 `DOCUMENTATION_INDEX.md`
   - 提供具体的文档路径
   - 不要引用归档文档

---

## 📅 维护说明

**更新频率**: 每次文档重组后更新
**维护者**: 项目开发团队
**版本**: v2.0 (2025-10-17)

**变更记录**:
- v2.0 (2025-10-17): 完整文档重组后更新
- v1.0 (2025-10-15): 初始版本

---

## 🔗 快速链接

- [完整文档索引](../DOCUMENTATION_INDEX.md)
- [项目主页](../README.md)
- [重组完成报告](../DOCUMENTATION_REORGANIZATION_COMPLETE.md)
- [数据库策略指南](../docs/database/strategy-guide.md)
- [快速开始](../docs/guides/GETTING_STARTED.md)

---

**提示**: 将本文件作为遍历项目时的文档检索参考。
