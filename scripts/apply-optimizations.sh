#!/bin/bash

# Personal Chatbox - 一键应用优化脚本
# 自动备份、安装依赖、应用优化

set -e

echo "======================================"
echo "Personal Chatbox 优化应用"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 创建备份
echo "1. 创建备份..."
echo "-----------------------------------"

if [ ! -f "src/components/markdown-renderer.jsx.backup" ]; then
    cp src/components/markdown-renderer.jsx src/components/markdown-renderer.jsx.backup
    echo -e "${GREEN}✓${NC} 已备份 markdown-renderer.jsx"
else
    echo -e "${YELLOW}ℹ${NC} 备份文件已存在,跳过"
fi

if [ ! -f "src/App.css.backup" ]; then
    cp src/App.css src/App.css.backup
    echo -e "${GREEN}✓${NC} 已备份 App.css"
else
    echo -e "${YELLOW}ℹ${NC} 备份文件已存在,跳过"
fi

echo ""

# 2. 安装依赖
echo "2. 安装依赖包..."
echo "-----------------------------------"

echo "安装 Markdown 增强依赖..."
npm install remark-math rehype-katex katex --legacy-peer-deps

echo -e "${GREEN}✓${NC} 依赖安装完成"
echo ""

# 3. 应用代码优化
echo "3. 应用代码优化..."
echo "-----------------------------------"

if [ -f "src/components/markdown-renderer-optimized.jsx" ]; then
    cp src/components/markdown-renderer-optimized.jsx src/components/markdown-renderer.jsx
    echo -e "${GREEN}✓${NC} 已应用优化的 markdown-renderer.jsx"
else
    echo -e "${YELLOW}⚠${NC} 未找到 markdown-renderer-optimized.jsx,请手动应用优化"
fi

echo ""

# 4. 应用CSS优化
echo "4. 应用CSS优化..."
echo "-----------------------------------"

if [ -f "src/styles/markdown-optimization.css" ]; then
    # 在App.css中导入优化样式
    if ! grep -q "markdown-optimization.css" src/App.css; then
        echo "@import './styles/markdown-optimization.css';" >> src/App.css
        echo -e "${GREEN}✓${NC} 已导入CSS优化"
    else
        echo -e "${YELLOW}ℹ${NC} CSS优化已导入,跳过"
    fi
    
    # 创建styles目录(如果不存在)
    mkdir -p src/styles
    
    echo -e "${GREEN}✓${NC} CSS优化已应用"
else
    echo -e "${YELLOW}⚠${NC} 未找到 markdown-optimization.css"
fi

echo ""

# 5. 验证
echo "5. 验证优化..."
echo "-----------------------------------"

if grep -q "remarkMath" src/components/markdown-renderer.jsx; then
    echo -e "${GREEN}✓${NC} LaTeX支持已添加"
fi

if grep -q "useMemo" src/components/markdown-renderer.jsx; then
    echo -e "${GREEN}✓${NC} 性能优化已添加"
fi

if grep -q "loading=\"lazy\"" src/components/markdown-renderer.jsx; then
    echo -e "${GREEN}✓${NC} 图片懒加载已添加"
fi

echo ""

# 6. 完成
echo "======================================"
echo -e "${GREEN}✓ 优化应用完成!${NC}"
echo "======================================"
echo ""
echo "下一步:"
echo "1. 运行测试: ./scripts/test-optimizations.sh"
echo "2. 启动开发服务器: npm run dev"
echo "3. 测试新功能:"
echo "   - 代码块语法高亮"
echo "   - 表格渲染"
echo "   - LaTeX公式 (使用 \$...\$ 或 \$\$...\$\$)"
echo "   - 深色模式"
echo ""
echo "如需回滚:"
echo "./scripts/rollback-optimizations.sh"
echo ""

