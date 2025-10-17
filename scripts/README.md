# 项目工具脚本

本目录包含用于项目维护、优化和安全检查的各种脚本。

## 📋 脚本列表

### 1. 项目清理脚本 (`cleanup-project.sh`)

**用途**: 整理项目文件结构，将文档移动到正确位置

**功能**:
- 创建规范的文档目录结构
- 移动设置指南、使用指南、报告文件到对应目录
- 清理备份文件和过时代码
- 更新 `.gitignore`
- 生成清理报告

**使用方法**:
```bash
# 在项目根目录执行
./scripts/cleanup-project.sh

# 检查变更
git status

# 如果满意，提交
git add . && git commit -m "chore: 整理项目结构"
```

**注意事项**:
- 会自动创建备份目录 `backup-YYYYMMDD-HHMMSS/`
- 可以从备份目录恢复文件

---

### 2. Console 日志替换脚本 (`replace-console-logs.cjs`)

**用途**: 将项目中的 `console.log/error/warn/debug` 替换为规范的 logger 调用

**功能**:
- 自动查找所有 console 调用
- 替换为 logger.info/error/warn/debug
- 自动添加 logger 导入语句
- 支持预览模式和备份

**使用方法**:
```bash
# 预览模式（不实际修改）
node scripts/replace-console-logs.cjs --dry-run

# 实际修改（默认处理 server/ 目录）
node scripts/replace-console-logs.cjs

# 指定目录并创建备份
node scripts/replace-console-logs.cjs --path server/routes --backup

# 处理前端代码
node scripts/replace-console-logs.cjs --path src
```

**替换规则**:
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`
- `console.info()` → `logger.info()`
- `console.debug()` → `logger.debug()`
- `console.log()` → `logger.info()`

**注意事项**:
- 会自动添加 `const logger = require('../lib/logger.cjs');`
- 使用 `--backup` 选项会创建 `.backup` 文件
- 建议先使用 `--dry-run` 预览

---

### 3. Bundle 分析工具 (`analyze-bundle.cjs`)

**用途**: 分析打包后的文件大小，找出优化机会

**功能**:
- 分析所有 JavaScript、CSS 和资源文件
- 显示文件大小排名
- 生成优化建议
- 性能评分

**使用方法**:
```bash
# 先构建项目
npm run build

# 运行分析
node scripts/analyze-bundle.cjs
```

**输出内容**:
- JavaScript 文件大小列表
- CSS 文件大小列表
- 资源文件（图片、字体）大小
- 优化建议
- 性能评分（0-100）

**优化建议示例**:
- 大于 500KB 的 JS 文件需要拆分
- 图片大于 100KB 建议压缩
- 总包大于 3MB 建议代码分割

---

### 4. 安全审计脚本 (`security-audit.cjs`)

**用途**: 扫描项目中的潜在安全问题

**功能**:
- 检查环境变量泄露（.env 是否提交到 Git）
- 检测硬编码的密钥和密码
- 扫描 SQL 注入风险
- 检查 XSS 漏洞
- 分析依赖安全性（npm audit）
- 检查不安全的配置

**使用方法**:
```bash
# 运行完整安全审计
node scripts/security-audit.cjs

# 查看详细报告
cat security-audit-report.json
```

**检查项目**:

1. **敏感信息泄露** (🔴 严重)
   - .env 文件是否在 Git 中
   - JWT_SECRET、SESSION_SECRET 等密钥
   - API 密钥、令牌
   - 硬编码密码

2. **SQL 注入风险** (🟠 高危)
   - 字符串模板构建 SQL
   - 字符串拼接
   - 未使用参数化查询

3. **XSS 漏洞** (🟠 高危)
   - dangerouslySetInnerHTML
   - innerHTML 直接赋值
   - eval() 使用
   - new Function() 使用

4. **依赖漏洞** (根据 npm audit)
   - 严重、高危、中危依赖漏洞

5. **不安全配置** (🟡 中危)
   - CORS 允许所有源
   - 基于 NODE_ENV 的安全检查

**输出格式**:
```
🔴 严重 (2 个问题)
  1. [敏感信息泄露]
     文件: .env
     问题: .env 文件已提交到 Git 仓库
     建议: 立即执行: git rm --cached .env

🟠 高危 (5 个问题)
  ...
```

**注意事项**:
- 如有严重或高危问题，脚本会返回非零退出码
- 可集成到 CI/CD 流程中
- 生成 JSON 报告便于自动化处理

---

### 5. 数据库优化脚本 (`optimize-database.sql`)

**用途**: 为数据库添加性能优化索引

**功能**:
- 为所有核心表添加索引
- 优化查询性能
- 支持 PostgreSQL 和 SQLite

**使用方法**:

**PostgreSQL**:
```bash
# 连接到数据库并执行
psql -d personal_chatbox -U chatbox_user -f scripts/optimize-database.sql

# 或在 psql 中执行
\i scripts/optimize-database.sql

# 验证索引
\di
```

**SQLite**:
```bash
# 执行脚本
sqlite3 data/chatbox.db < scripts/optimize-database.sql

# 验证索引
sqlite3 data/chatbox.db ".indices"
```

**创建的索引**:

1. **messages 表**:
   - `idx_messages_conversation_id` - 按会话查询
   - `idx_messages_timestamp` - 按时间排序
   - `idx_messages_conversation_timestamp` - 复合索引（最优）

2. **conversations 表**:
   - `idx_conversations_user_id` - 按用户查询
   - `idx_conversations_updated_at` - 按更新时间排序
   - `idx_conversations_user_updated` - 复合索引（最优）

3. **users 表**:
   - `idx_users_email` - 登录查询（唯一）
   - `idx_users_username` - 用户名查询（唯一）

4. **sessions 表**:
   - `idx_sessions_token` - 令牌查找（唯一）
   - `idx_sessions_expires_at` - 清理过期会话

5. 其他表的优化索引...

**预期性能提升**:
- 会话列表查询: 500ms → 50ms (提升 90%)
- 消息加载: 300ms → 30ms (提升 90%)
- 用户认证: 100ms → 10ms (提升 90%)

**注意事项**:
- 索引会增加写入开销（约 5-10%）
- 但读取性能提升显著（80-90%）
- 建议在非高峰期执行
- 执行后运行 ANALYZE 更新统计信息

**验证索引效果**:

**PostgreSQL**:
```sql
-- 查看查询计划
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = 'xxx'
ORDER BY timestamp DESC;

-- 应该看到 "Index Scan using idx_messages_conversation_timestamp"
```

**SQLite**:
```sql
-- 查看查询计划
EXPLAIN QUERY PLAN
SELECT * FROM messages
WHERE conversation_id = 'xxx'
ORDER BY timestamp DESC;

-- 应该看到 "USING INDEX idx_messages_conversation_timestamp"
```

---

## 🚀 推荐使用顺序

对于新项目或需要全面优化的项目，建议按以下顺序执行：

### 第一步: 安全审计（最高优先级）
```bash
# 1. 运行安全审计
node scripts/security-audit.cjs

# 2. 立即修复所有严重和高危问题
#    - 移除 .env 从 Git
#    - 替换硬编码密钥
#    - 修复 SQL 注入和 XSS 漏洞

# 3. 更新依赖
npm audit fix
```

### 第二步: 项目清理
```bash
# 1. 整理项目结构
./scripts/cleanup-project.sh

# 2. 检查变更
git status

# 3. 提交
git add . && git commit -m "chore: 整理项目结构"
```

### 第三步: 日志系统规范化
```bash
# 1. 预览替换
node scripts/replace-console-logs.cjs --dry-run

# 2. 执行替换
node scripts/replace-console-logs.cjs --backup

# 3. 测试应用
npm run dev

# 4. 提交
git add . && git commit -m "refactor: 使用规范日志系统"
```

### 第四步: 数据库优化
```bash
# 1. 备份数据库
# PostgreSQL:
pg_dump personal_chatbox > backup.sql
# SQLite:
cp data/chatbox.db data/chatbox.db.backup

# 2. 执行优化
psql -d personal_chatbox -f scripts/optimize-database.sql
# 或
sqlite3 data/chatbox.db < scripts/optimize-database.sql

# 3. 验证性能提升
# 运行应用并观察查询速度
```

### 第五步: 性能分析
```bash
# 1. 构建生产版本
npm run build

# 2. 分析 bundle
node scripts/analyze-bundle.cjs

# 3. 根据建议优化
#    - 实现代码分割
#    - 压缩图片
#    - 优化依赖导入
```

---

## 🔧 集成到 CI/CD

### package.json 脚本配置

```json
{
  "scripts": {
    "lint:security": "node scripts/security-audit.cjs",
    "analyze:bundle": "npm run build && node scripts/analyze-bundle.cjs",
    "db:optimize": "psql -d $DATABASE_URL -f scripts/optimize-database.sql",
    "cleanup": "./scripts/cleanup-project.sh"
  }
}
```

### GitHub Actions 示例

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint:security
```

---

## 📝 维护建议

### 定期执行（每周）
- 运行安全审计
- 检查依赖更新
- 查看日志质量

### 定期执行（每月）
- 分析 bundle 大小
- 优化数据库（如有新表）
- 清理未使用的代码

### 重大更新前
- 完整运行所有脚本
- 生成性能基准
- 备份数据库

---

## 🐛 故障排除

### 脚本执行权限问题
```bash
chmod +x scripts/*.sh
```

### Node.js 模块找不到
```bash
npm install glob --save-dev
```

### 数据库连接失败
```bash
# 检查环境变量
echo $DATABASE_URL

# 检查数据库服务
pg_isready  # PostgreSQL
# 或
sqlite3 data/chatbox.db ".tables"  # SQLite
```

---

## 📚 相关文档

- [优化建议](../docs/OPTIMIZATION_RECOMMENDATIONS.md)
- [安全清单](../docs/guides/SECURITY_CHECKLIST.md)
- [数据库架构](../docs/architecture/database-schema.md)

---

## 🤝 贡献

如果您有新的优化脚本或改进建议，欢迎：

1. Fork 本项目
2. 创建功能分支
3. 提交 Pull Request

---

*最后更新: 2025-10-16*
