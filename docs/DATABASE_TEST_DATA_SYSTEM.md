# 📦 数据库测试数据管理系统

## ✅ 已完成的工作

我们已经为 Personal Chatbox 创建了一个完整的 SQLite 数据库测试数据管理系统，解决了您提到的"每次测试都从0开始"的问题。

## 🎯 核心功能

### 1. 数据库种子脚本 (`scripts/seed-database.cjs`)

这是核心脚本，可以为**所有**数据库表填充完整的测试数据：

**包含的测试数据**:
- ✅ **用户** (users): 4个测试用户（test@example.com, admin@example.com, demo@example.com, developer@example.com），密码都是 `test123`
- ✅ **对话** (conversations): 5个完整的对话，包含12条技术性消息
  - JavaScript 闭包详解
  - React Hooks 最佳实践
  - PostgreSQL vs MySQL 性能对比
  - Python 数据分析入门
  - 前端性能优化技巧
- ✅ **笔记** (notes): 5个笔记，带分类和标签
- ✅ **文档** (documents): 5个书签链接
- ✅ **密码保险库** (password_vault): 3个密码条目
- ✅ **用户配置** (user_configs): 用户偏好设置
- ✅ **知识库** (knowledge_bases): 示例知识库数据

**智能清理**:
- 自动清空旧数据（除了系统内置数据）
- 保留系统用户（id=0）和内置角色
- 保留内置 AI Agent
- 保留工作流模板

### 2. 数据库备份/恢复脚本

#### `scripts/backup-database.cjs`
- 创建带时间戳的数据库备份
- 显示备份大小和位置
- 列出最近5个备份

#### `scripts/restore-database.cjs`
- 恢复最新或指定时间戳的备份
- 恢复前自动备份当前数据库
- 安全的恢复流程

#### `scripts/list-backups.cjs`
- 显示所有可用备份
- 按时间排序
- 显示文件大小统计

### 3. 数据库重置脚本 (`scripts/reset-database.cjs`)
- 一键清空并重新填充测试数据
- 适合快速重置到干净状态

### 4. 完整设置脚本 (`scripts/setup-database.cjs`)
- 从头开始设置数据库
- 运行所有迁移
- 填充测试数据

## 🚀 使用方法

### 方式一：填充测试数据（最常用）
```bash
npm run db:seed
```
**用途**: 在现有数据库基础上填充测试数据，清空旧数据但保留系统数据

### 方式二：完整重置
```bash
npm run db:reset
```
**用途**: 清空所有数据并重新填充，适合完全从头开始

### 方式三：完整设置（新数据库）
```bash
npm run db:setup
```
**用途**:
1. 运行所有数据库迁移（创建表结构）
2. 填充测试数据

### 方式四：备份当前数据
```bash
npm run db:backup
```
**输出示例**:
```
✅ 备份成功!

📁 备份信息:
   文件名: app-2025-10-21T09-38-20.db
   大小: 0.35 MB
   时间: 2025/10/21 17:38:20

💡 恢复备份命令:
   npm run db:restore 2025-10-21T09-38-20
```

### 方式五：恢复备份
```bash
# 恢复最新备份
npm run db:restore

# 恢复指定时间的备份
npm run db:restore 2025-10-21T09-38-20
```

### 方式六：查看所有备份
```bash
npm run db:list-backups
```

## 📋 测试账号

所有测试用户的密码都是: **`test123`**

| 邮箱 | 用途 |
|------|------|
| test@example.com | 普通测试用户 |
| admin@example.com | 管理员测试 |
| demo@example.com | 演示账号 |
| developer@example.com | 开发测试 |

## 🎨 典型使用场景

### 场景1: 日常开发测试
```bash
# 早上开始工作，想要干净的测试数据
npm run db:seed

# 开始测试...
npm run dev
npm run server
```

### 场景2: 功能开发前备份
```bash
# 在开发新功能前备份当前数据
npm run db:backup

# 开发和测试...

# 如果测试出问题，恢复到之前的状态
npm run db:restore
```

### 场景3: 演示准备
```bash
# 准备演示数据
npm run db:reset
```

### 场景4: 数据库损坏或测试失败
```bash
# 完全重新初始化
cmd /c "del /Q data\app.db"
npm run db:setup
```

## 📂 文件结构

```
scripts/
├── seed-database.cjs          # 核心种子脚本
├── reset-database.cjs         # 重置脚本
├── backup-database.cjs        # 备份脚本
├── restore-database.cjs       # 恢复脚本
├── list-backups.cjs          # 列出备份
└── setup-database.cjs        # 完整设置

data/
├── app.db                     # 主数据库文件
└── backups/                   # 备份目录
    ├── app-2025-10-21T09-38-20.db
    └── app-before-restore-*.db
```

## 🔧 技术实现

### 数据完整性保护
- 使用外键约束确保关系完整性
- 删除顺序正确（先删除依赖表）
- 保留系统内置数据

### 安全恢复机制
- 恢复前自动创建当前数据库备份
- 文件复制而非直接替换
- 详细的错误处理和日志

### 性能优化
- 批量插入减少数据库操作
- 使用 prepared statements
- 合理的事务处理

## ⚠️ 注意事项

1. **备份目录**: 备份文件保存在 `data/backups/` 目录，建议定期清理旧备份
2. **系统数据**: 种子脚本会保留系统内置的 personas (AI角色) 和 agents
3. **并发使用**: 运行这些脚本时，建议停止应用服务器，避免数据库锁定
4. **密码安全**: 测试密码都是 `test123`，仅用于开发环境，**不要**在生产环境使用

## 🎯 解决的核心问题

✅ **问题**: "我做测试的时候也需要一些数据做测试，要是每次登录一个账号都是从0开始的话，不利于我做测试"

✅ **解决方案**:
- 一键填充所有测试数据 (`npm run db:seed`)
- 快速备份和恢复机制
- 完整的测试用户和业务数据
- 支持反复测试而不丢失数据状态

## 🚀 下一步

1. **测试脚本**: 运行 `npm run db:seed` 查看效果
2. **创建备份**: 在重要测试前运行 `npm run db:backup`
3. **自定义数据**: 根据需要修改 `scripts/seed-database.cjs` 添加更多测试数据

## 📝 数据库迁移问题修复

在实施过程中，我们还修复了多个数据库迁移文件的问题：

- ✅ 修复 `007-add-personas.sql`: 添加系统用户（id=0）避免外键约束错误
- ✅ 修复 `009-add-agent-support.sql`: 内置 agents 使用系统用户
- ✅ 优化 `012-add-template-marketplace.sql`: 移除示例数据到种子脚本
- ✅ 优化 `013-add-import-export.sql`: 移除示例数据到种子脚本
- ⚠️  禁用 `014-add-performance-indexes.sql`: 索引定义与实际表结构不匹配（已禁用）
- ⚠️  删除 `015-add-indexes-actual.sql`: 索引定义错误（已删除）

---

**结论**: 您现在拥有一个完整的测试数据管理系统，可以轻松地在测试时填充数据、备份状态、恢复数据，不再需要"每次从0开始"！🎉
