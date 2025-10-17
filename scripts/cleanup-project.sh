#!/bin/bash

# Personal-Chatbox 项目清理脚本
# 用途: 整理项目文件结构，移动文档到正确位置

set -e

echo "=========================================="
echo "Personal-Chatbox 项目清理脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 备份当前状态
echo -e "${YELLOW}正在创建备份...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ 备份目录已创建: $BACKUP_DIR${NC}"

# 1. 创建文档目录结构
echo ""
echo "1. 创建文档目录结构..."
mkdir -p docs/{setup,guides,reports,archive,api,architecture,development}
echo -e "${GREEN}✓ 文档目录结构已创建${NC}"

# 2. 移动设置指南
echo ""
echo "2. 整理设置指南..."
for file in PHASE*.md START_HERE.md QUICK*.md ENV_SETUP_GUIDE.md INSTALL_POSTGRES.md; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        mv "$file" docs/setup/
        echo -e "${GREEN}  ✓ 已移动: $file${NC}"
    fi
done

# 3. 移动使用指南
echo ""
echo "3. 整理使用指南..."
for file in TESTING_GUIDE.md HOW_TO_TEST.md MIGRATION_GUIDE.md BROWSER_TEST_GUIDE.md PRODUCTION_DEPLOYMENT_CHECKLIST.md SECURITY_CHECKLIST.md; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        mv "$file" docs/guides/
        echo -e "${GREEN}  ✓ 已移动: $file${NC}"
    fi
done

# 4. 移动报告文件
echo ""
echo "4. 整理报告文件..."
for file in *_REPORT.md *_SUCCESS*.md *_COMPLETE*.md *_FIX*.md *_SUMMARY*.md; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        mv "$file" docs/reports/
        echo -e "${GREEN}  ✓ 已移动: $file${NC}"
    fi
done

# 5. 移动过时文档
echo ""
echo "5. 归档过时文档..."
for file in README_POSTGRES.md POSTGRES*.md README_TESTS.md; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        mv "$file" docs/archive/
        echo -e "${GREEN}  ✓ 已归档: $file${NC}"
    fi
done

# 6. 移动测试脚本
echo ""
echo "6. 整理测试脚本..."
mkdir -p tests/manual
for file in test-*.cjs; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        mv "$file" tests/manual/
        echo -e "${GREEN}  ✓ 已移动: $file${NC}"
    fi
done

# 7. 清理备份文件
echo ""
echo "7. 清理备份文件..."
backup_files=(
    "server/routes/auth.cjs.backup"
    "server/routes/auth.cjs.bak"
    "server/db/sqlite-adapter-fixed.cjs"
    "server/index-fixed.cjs"
    "start-fixed.sh"
)

for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo -e "${GREEN}  ✓ 已删除: $file${NC}"
    fi
done

# 8. 更新 .gitignore
echo ""
echo "8. 更新 .gitignore..."
cat >> .gitignore << 'EOF'

# ========================================
# 项目清理脚本添加的规则
# ========================================

# PID 文件
*.pid
.backend.pid
.frontend.pid

# 备份文件
*.backup
*.bak
*.old

# 日志文件
logs/
*.log

# 临时测试文件
test-*.cjs

# 数据备份
backup-*/

# 开发工具生成的文件
.DS_Store
Thumbs.db
EOF

echo -e "${GREEN}✓ .gitignore 已更新${NC}"

# 9. 创建文档索引
echo ""
echo "9. 创建文档索引..."
cat > docs/README.md << 'EOF'
# Personal-Chatbox 文档

欢迎来到 Personal-Chatbox 项目文档！

## 📚 文档导航

### 快速开始

- [快速开始指南](./setup/START_HERE.md) - 新用户从这里开始
- [环境设置](./setup/ENV_SETUP_GUIDE.md) - 配置开发环境
- [PostgreSQL 安装](./setup/INSTALL_POSTGRES.md) - 数据库安装指南

### 使用指南

- [功能测试指南](./guides/TESTING_GUIDE.md) - 如何测试应用功能
- [数据库迁移](./guides/MIGRATION_GUIDE.md) - 数据库迁移说明
- [生产环境部署](./guides/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - 生产部署清单
- [安全检查清单](./guides/SECURITY_CHECKLIST.md) - 安全最佳实践

### 开发文档

- [优化建议](./OPTIMIZATION_RECOMMENDATIONS.md) - 项目优化全面建议
- [代码规范](./development/coding-standards.md) - 代码编写规范
- [贡献指南](./development/contributing.md) - 如何贡献代码

### API 文档

- [认证 API](./api/auth.md) - 用户认证接口
- [聊天 API](./api/chat.md) - AI 聊天接口
- [MCP API](./api/mcp.md) - MCP 工具集成

### 架构文档

- [系统架构](./architecture/system-overview.md) - 整体架构设计
- [数据库设计](./architecture/database-schema.md) - 数据库结构
- [MCP 集成](./architecture/mcp-integration.md) - MCP 协议集成

### 历史记录

- [开发报告](./reports/) - 历史开发报告和成功记录
- [归档文档](./archive/) - 过时的文档和参考资料

## 🔧 项目结构

```
Personal-Chatbox/
├── server/              # 后端服务
│   ├── db/             # 数据库层
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑
│   └── middleware/     # 中间件
├── src/                # 前端应用
│   ├── components/     # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具库
│   └── pages/          # 页面组件
├── docs/               # 文档
├── tests/              # 测试文件
└── scripts/            # 工具脚本
```

## 🚀 快速链接

- [GitHub Issues](https://github.com/your-repo/issues)
- [项目看板](https://github.com/your-repo/projects)
- [更新日志](../CHANGELOG.md)

## 📝 维护

文档最后更新: 2025-10-16

如发现文档问题，请提交 Issue 或 PR。
EOF

echo -e "${GREEN}✓ 文档索引已创建${NC}"

# 10. 生成清理报告
echo ""
echo "10. 生成清理报告..."
REPORT_FILE="cleanup-report-$(date +%Y%m%d-%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
========================================
项目清理报告
========================================

执行时间: $(date)

1. 备份位置
   $BACKUP_DIR/

2. 移动的文件统计
   - 设置指南: $(find docs/setup -type f 2>/dev/null | wc -l) 个文件
   - 使用指南: $(find docs/guides -type f 2>/dev/null | wc -l) 个文件
   - 报告文件: $(find docs/reports -type f 2>/dev/null | wc -l) 个文件
   - 归档文件: $(find docs/archive -type f 2>/dev/null | wc -l) 个文件
   - 测试脚本: $(find tests/manual -type f 2>/dev/null | wc -l) 个文件

3. 删除的备份文件
$(for file in "${backup_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   - $file"
    fi
done)

4. 更新的文件
   - .gitignore (已添加新规则)
   - docs/README.md (已创建)

5. 下一步建议
   - 检查 docs/ 目录，确认文件位置正确
   - 运行 git status 查看变更
   - 提交变更: git add . && git commit -m "chore: 整理项目结构和文档"
   - 如有问题，从 $BACKUP_DIR/ 恢复

========================================
EOF

echo -e "${GREEN}✓ 清理报告已生成: $REPORT_FILE${NC}"

# 完成总结
echo ""
echo "=========================================="
echo -e "${GREEN}清理完成！${NC}"
echo "=========================================="
echo ""
echo "📊 清理统计:"
echo "  - 备份位置: $BACKUP_DIR/"
echo "  - 清理报告: $REPORT_FILE"
echo ""
echo "🔍 请执行以下操作:"
echo "  1. 检查文件移动是否正确: ls -la docs/"
echo "  2. 查看 Git 变更: git status"
echo "  3. 如满意，提交变更: git add . && git commit -m 'chore: 整理项目结构'"
echo ""
echo -e "${YELLOW}⚠️  如需回滚，可从 $BACKUP_DIR/ 恢复文件${NC}"
echo ""
