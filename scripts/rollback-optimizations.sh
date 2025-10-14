#!/bin/bash

# Personal Chatbox - 优化回滚脚本
# 恢复到优化前的状态

set -e

echo "======================================"
echo "Personal Chatbox 优化回滚"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 确认回滚
echo -e "${YELLOW}警告: 此操作将撤销所有优化${NC}"
echo -n "确认回滚? (y/N): "
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "已取消回滚"
    exit 0
fi

echo ""

# 1. 恢复文件
echo "1. 恢复备份文件..."
echo "-----------------------------------"

if [ -f "src/components/markdown-renderer.jsx.backup" ]; then
    mv src/components/markdown-renderer.jsx.backup src/components/markdown-renderer.jsx
    echo -e "${GREEN}✓${NC} 已恢复 markdown-renderer.jsx"
else
    echo -e "${RED}✗${NC} 未找到备份文件 markdown-renderer.jsx.backup"
fi

if [ -f "src/App.css.backup" ]; then
    mv src/App.css.backup src/App.css
    echo -e "${GREEN}✓${NC} 已恢复 App.css"
else
    echo -e "${RED}✗${NC} 未找到备份文件 App.css.backup"
fi

echo ""

# 2. 卸载依赖(可选)
echo "2. 卸载优化依赖..."
echo "-----------------------------------"

echo -n "是否卸载优化依赖包? (y/N): "
read -r UNINSTALL

if [ "$UNINSTALL" = "y" ] || [ "$UNINSTALL" = "Y" ]; then
    npm uninstall remark-math rehype-katex katex
    echo -e "${GREEN}✓${NC} 已卸载依赖包"
else
    echo -e "${YELLOW}ℹ${NC} 保留依赖包"
fi

echo ""

# 3. 清理
echo "3. 清理临时文件..."
echo "-----------------------------------"

if [ -f "src/components/markdown-renderer-optimized.jsx" ]; then
    rm src/components/markdown-renderer-optimized.jsx
    echo -e "${GREEN}✓${NC} 已删除 markdown-renderer-optimized.jsx"
fi

if [ -f "src/styles/markdown-optimization.css" ]; then
    rm src/styles/markdown-optimization.css
    echo -e "${GREEN}✓${NC} 已删除 markdown-optimization.css"
fi

echo ""

# 4. 重新构建
echo "4. 重新构建项目..."
echo "-----------------------------------"

npm run build

echo -e "${GREEN}✓${NC} 构建完成"
echo ""

# 5. 完成
echo "======================================"
echo -e "${GREEN}✓ 回滚完成!${NC}"
echo "======================================"
echo ""
echo "项目已恢复到优化前的状态"
echo ""

