#!/bin/bash

# 快速 Git 推送脚本
# 用法: ./quick-push.sh "你的提交信息"

set -e

# 颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取提交信息
if [ -z "$1" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo -e "${BLUE}📦 Git 快速推送${NC}"
echo "================================"
echo ""

# 显示状态
echo -e "${BLUE}📋 当前状态:${NC}"
git status -s
echo ""

# 添加所有更改
echo -e "${BLUE}➕ 添加更改...${NC}"
git add -A

# 提交
echo -e "${BLUE}💾 提交更改: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG" || echo "无新更改需要提交"

# 推送
echo ""
echo -e "${BLUE}🚀 推送到 GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ 推送完成！${NC}"
