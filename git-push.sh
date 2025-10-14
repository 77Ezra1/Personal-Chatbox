#!/bin/bash

# Git推送脚本

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "  Personal Chatbox - Git推送"
echo "======================================"
echo ""

cd "$(dirname "$0")"

echo -e "${BLUE}1. 配置Git用户信息...${NC}"
git config user.name "Personal-Chatbox-Bot" || true
git config user.email "bot@personal-chatbox.local" || true

echo ""
echo -e "${BLUE}2. 查看修改文件...${NC}"
echo "-----------------------------------"
git status --short

echo ""
echo -e "${BLUE}3. 添加所有修改...${NC}"
git add .

echo ""
echo -e "${BLUE}4. 创建提交...${NC}"

COMMIT_MSG="feat: 添加MCP服务集成、优化和一键启动脚本

主要更新:
- 集成8个新MCP服务(Puppeteer, Fetch, Google Maps, EverArt, Magg, Slack, Qdrant, PostgreSQL)
- 添加Markdown渲染优化(代码高亮、表格、LaTeX)
- 完善深色模式
- 性能优化
- 添加一键启动脚本(start.sh/stop.sh)
- 修复注册流程(删除欢迎页面,添加邀请码验证)
- 完整的文档和测试用例

文件变更:
- 新增: MCP服务配置和集成脚本
- 新增: 优化脚本和测试用例
- 新增: 启动/停止脚本
- 修改: 路由配置和注册流程
- 新增: 详细文档(20+个MD文件)
"

git commit -m "$COMMIT_MSG"

echo ""
echo -e "${GREEN}✓ 提交已创建${NC}"

echo ""
echo -e "${BLUE}5. 推送到GitHub...${NC}"
echo -e "${YELLOW}注意: 需要GitHub访问权限${NC}"
echo ""

# 尝试推送
if git push origin main 2>&1; then
    echo ""
    echo -e "${GREEN}✓ 推送成功!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ 推送失败,可能需要:${NC}"
    echo "1. 配置GitHub认证"
    echo "2. 使用 gh auth login 登录"
    echo "3. 或手动推送: git push origin main"
fi

echo ""
echo "======================================"
echo -e "${GREEN}Git操作完成${NC}"
echo "======================================"
