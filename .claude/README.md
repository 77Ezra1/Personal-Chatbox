# 📁 Claude Code 配置目录

> **目的**: 为 Claude Code 提供项目导航和配置
> **更新**: 2025-10-17

---

## 📚 文件说明

### 📌 核心文件

| 文件 | 用途 | 重要度 |
|------|------|--------|
| **[docs-navigation.md](docs-navigation.md)** | 文档检索导航 | ⭐⭐⭐⭐⭐ |
| **[project-knowledge.md](project-knowledge.md)** | 项目知识库 | ⭐⭐⭐⭐⭐ |
| **[settings.local.json](settings.local.json)** | 权限配置 | ⭐⭐⭐⭐ |
| **[.claudeignore](../.claudeignore)** | 忽略规则 | ⭐⭐⭐ |

---

## 🎯 快速开始

### 对于 Claude Code

当你开始遍历项目时：

1. **先读取**: [docs-navigation.md](docs-navigation.md)
   - 了解文档结构
   - 学习查找策略
   - 记住常用路径

2. **再参考**: [project-knowledge.md](project-knowledge.md)
   - 理解项目架构
   - 掌握核心概念
   - 速查常见问题

3. **然后查看**: [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
   - 查找具体文档
   - 按关键词搜索
   - 按场景导航

---

## 📖 文档检索流程

### 场景1: 用户问功能问题

```
用户: "如何使用笔记功能？"

Claude 思考过程:
1. 查看 docs-navigation.md → 功能类文档在 docs/features/
2. 找到 docs/features/notes-implementation.md
3. 阅读文档内容
4. 提供详细解答
```

### 场景2: 用户问配置问题

```
用户: "如何配置API密钥？"

Claude 思考过程:
1. 查看 docs-navigation.md → 配置类文档在 docs/configuration/
2. 找到 docs/configuration/api-keys.md
3. 提供配置步骤
```

### 场景3: 用户问数据库问题

```
用户: "应该用什么数据库？"

Claude 思考过程:
1. 查看 project-knowledge.md → 了解数据库三层架构
2. 推荐查看 docs/database/strategy-guide.md
3. 根据用户场景给出建议：
   - 开发: SQLite
   - 生产: PostgreSQL
```

---

## 🗂️ 文件用途详解

### 1. docs-navigation.md

**作用**: 文档检索指南

**包含内容**:
- ✅ 完整的文档目录结构
- ✅ 文档查找策略（5个场景）
- ✅ 常见问题快速查找
- ✅ 文档命名规范
- ✅ 避免的陷阱和最佳实践

**使用时机**: 当需要查找任何文档时

### 2. project-knowledge.md

**作用**: 项目知识库

**包含内容**:
- ✅ 项目概览和基本信息
- ✅ 目录结构详解
- ✅ 数据库架构（三层降级）
- ✅ MCP服务架构
- ✅ 前后端架构说明
- ✅ 安全机制
- ✅ 核心功能模块
- ✅ 常见问题速查

**使用时机**: 当需要了解项目整体情况时

### 3. settings.local.json

**作用**: Claude Code权限配置

**包含内容**:
- Bash命令白名单
- Read权限配置
- 自动批准的操作

**说明**: 预配置了常用的开发命令权限

### 4. .claudeignore

**作用**: 文件忽略规则

**包含内容**:
- node_modules/ 等依赖目录
- data/ 数据库文件
- archive/ 归档文档
- 临时文件和缓存
- 敏感信息文件

**效果**: 减少索引负担，提升检索效率

---

## 🎯 最佳实践

### 对于 Claude Code

#### ✅ 应该做的

1. **优先使用文档导航**
   - 查问题先看 docs-navigation.md
   - 了解项目先看 project-knowledge.md

2. **理解项目结构**
   - 功能文档 → docs/features/
   - UI文档 → docs/ui/
   - 数据库文档 → docs/database/
   - 配置文档 → docs/configuration/

3. **引用准确路径**
   - 使用相对路径
   - 验证文档存在
   - 引用正确的文档版本

4. **查看迁移记录**
   - 找不到文档时查 DOCUMENTATION_REORGANIZATION_COMPLETE.md

#### ❌ 不要做的

1. **不要引用归档文档**
   - archive/ 中的文档已过时
   - 应引用活跃的替代文档

2. **不要假设旧路径**
   - 文档已重组，旧路径可能无效
   - 先查文档导航

3. **不要忽略索引**
   - DOCUMENTATION_INDEX.md 是最权威的文档目录

---

## 🔍 快速检索表

| 需求 | 查看文件 | 路径 |
|------|---------|------|
| 查找文档 | docs-navigation.md | [打开](docs-navigation.md) |
| 了解项目 | project-knowledge.md | [打开](project-knowledge.md) |
| 完整索引 | DOCUMENTATION_INDEX.md | [打开](../DOCUMENTATION_INDEX.md) |
| 数据库指南 | strategy-guide.md | [打开](../docs/database/strategy-guide.md) |
| 快速开始 | GETTING_STARTED.md | [打开](../docs/guides/GETTING_STARTED.md) |
| 后端架构 | BACKEND_ARCHITECTURE.md | [打开](../docs/reports/BACKEND_ARCHITECTURE.md) |
| UI开发 | UI_DEVELOPMENT_GUIDE.md | [打开](../docs/UI_DEVELOPMENT_GUIDE.md) |

---

## 📊 项目统计

### 文档系统

- **总文档数**: 90+
- **分类数**: 8大类
- **专题目录**: 7个
- **归档文档**: 6个

### Claude配置

- **配置文件**: 4个
- **权限规则**: 170+条
- **忽略规则**: 50+条

---

## 🔄 更新记录

### v2.0 (2025-10-17)

- ✅ 创建 docs-navigation.md - 文档导航指南
- ✅ 创建 project-knowledge.md - 项目知识库
- ✅ 创建 .claudeignore - 忽略规则
- ✅ 创建 README.md - 本文件

### v1.0 (2025-10-15)

- ✅ 创建 settings.local.json
- ✅ 配置基础权限

---

## 📞 维护说明

**更新频率**:
- 文档重组后更新
- 新增重要功能后更新
- 项目结构变化后更新

**维护者**: 项目开发团队

**反馈**: 如发现配置问题，请更新对应文件

---

## 🎉 配置完成

现在 Claude Code 可以：

✅ **快速查找文档** - 通过 docs-navigation.md
✅ **理解项目结构** - 通过 project-knowledge.md
✅ **高效索引** - 通过 .claudeignore
✅ **正确权限** - 通过 settings.local.json

**开始遍历项目吧！** 🚀

---

**提示**: 将 docs-navigation.md 和 project-knowledge.md 加入书签，方便快速访问。
