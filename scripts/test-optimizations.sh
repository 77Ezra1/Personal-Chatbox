#!/bin/bash

# Personal Chatbox - 优化测试脚本
# 用于验证Markdown渲染、深色模式和性能优化

set -e

echo "======================================"
echo "Personal Chatbox 优化测试"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

test_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 1. 检查依赖包
echo "1. 检查依赖包..."
echo "-----------------------------------"

if npm list remark-math > /dev/null 2>&1; then
    test_pass "remark-math 已安装"
else
    test_fail "remark-math 未安装"
fi

if npm list rehype-katex > /dev/null 2>&1; then
    test_pass "rehype-katex 已安装"
else
    test_fail "rehype-katex 未安装"
fi

if npm list katex > /dev/null 2>&1; then
    test_pass "katex 已安装"
else
    test_fail "katex 未安装"
fi

echo ""

# 2. 检查文件存在性
echo "2. 检查优化文件..."
echo "-----------------------------------"

if [ -f "src/components/markdown-renderer.jsx" ]; then
    test_pass "markdown-renderer.jsx 存在"
else
    test_fail "markdown-renderer.jsx 不存在"
fi

if [ -f "src/App.css" ]; then
    test_pass "App.css 存在"
else
    test_fail "App.css 不存在"
fi

if [ -f "src/components/markdown-renderer.jsx.backup" ]; then
    test_info "发现备份文件 markdown-renderer.jsx.backup"
fi

echo ""

# 3. 检查代码内容
echo "3. 检查代码优化..."
echo "-----------------------------------"

if grep -q "remarkMath" src/components/markdown-renderer.jsx; then
    test_pass "LaTeX支持已添加 (remarkMath)"
else
    test_fail "LaTeX支持未添加"
fi

if grep -q "rehypeKatex" src/components/markdown-renderer.jsx; then
    test_pass "LaTeX渲染已添加 (rehypeKatex)"
else
    test_fail "LaTeX渲染未添加"
fi

if grep -q "useMemo" src/components/markdown-renderer.jsx; then
    test_pass "性能优化已添加 (useMemo)"
else
    test_fail "性能优化未添加"
fi

if grep -q "loading=\"lazy\"" src/components/markdown-renderer.jsx; then
    test_pass "图片懒加载已添加"
else
    test_fail "图片懒加载未添加"
fi

if grep -q "table:" src/components/markdown-renderer.jsx; then
    test_pass "表格组件已添加"
else
    test_fail "表格组件未添加"
fi

echo ""

# 4. 检查CSS样式
echo "4. 检查CSS优化..."
echo "-----------------------------------"

if grep -q "markdown-table" src/App.css; then
    test_pass "表格样式已添加"
else
    test_fail "表格样式未添加"
fi

if grep -q "\.katex" src/App.css; then
    test_pass "LaTeX样式已添加"
else
    test_fail "LaTeX样式未添加"
fi

if grep -q "\.dark \.markdown-code-block" src/App.css; then
    test_pass "深色模式代码块样式已添加"
else
    test_fail "深色模式代码块样式未添加"
fi

if grep -q "markdown-image" src/App.css; then
    test_pass "图片样式已添加"
else
    test_fail "图片样式未添加"
fi

echo ""

# 5. 构建测试
echo "5. 构建测试..."
echo "-----------------------------------"

test_info "开始构建项目..."

if npm run build > /tmp/build.log 2>&1; then
    test_pass "项目构建成功"
    
    # 检查构建产物
    if [ -d "dist" ]; then
        test_pass "dist目录已生成"
        
        # 检查文件大小
        DIST_SIZE=$(du -sh dist | cut -f1)
        test_info "构建大小: $DIST_SIZE"
    else
        test_fail "dist目录未生成"
    fi
else
    test_fail "项目构建失败"
    test_info "查看构建日志: cat /tmp/build.log"
fi

echo ""

# 6. 语法检查
echo "6. 语法检查..."
echo "-----------------------------------"

if command -v eslint &> /dev/null; then
    if npx eslint src/components/markdown-renderer.jsx --quiet; then
        test_pass "markdown-renderer.jsx 语法检查通过"
    else
        test_fail "markdown-renderer.jsx 存在语法问题"
    fi
else
    test_info "ESLint未安装,跳过语法检查"
fi

echo ""

# 7. 生成测试报告
echo "======================================"
echo "测试报告"
echo "======================================"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过!${NC}"
    echo ""
    echo "建议:"
    echo "1. 启动开发服务器: npm run dev"
    echo "2. 访问应用并测试以下功能:"
    echo "   - 代码块语法高亮"
    echo "   - 表格渲染"
    echo "   - LaTeX公式"
    echo "   - 深色模式切换"
    echo "   - 长对话滚动性能"
    exit 0
else
    echo -e "${RED}✗ 存在失败的测试${NC}"
    echo ""
    echo "请检查:"
    echo "1. 是否正确安装了所有依赖"
    echo "2. 是否正确应用了代码修改"
    echo "3. 查看上述失败的测试项"
    exit 1
fi

