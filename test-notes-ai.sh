#!/bin/bash

echo "🔍 测试笔记 AI 功能"
echo "===================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试文本
TEST_TEXT="这是一段测试文本，用于验证AI改写功能是否正常工作。"

echo -e "\n${YELLOW}1. 测试 AI 改写功能${NC}"
echo "-------------------"
echo "请求: POST /api/ai/notes/rewrite"
echo "文本: $TEST_TEXT"

REWRITE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:3001/api/ai/notes/rewrite \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d "{\"text\":\"$TEST_TEXT\",\"style\":\"professional\"}")

HTTP_STATUS=$(echo "$REWRITE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$REWRITE_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ 状态码: $HTTP_STATUS${NC}"
  echo "响应: $RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
  echo -e "${RED}❌ 状态码: $HTTP_STATUS${NC}"
  echo "响应: $RESPONSE_BODY"
fi

echo -e "\n${YELLOW}2. 测试 AI 问答功能${NC}"
echo "-------------------"
echo "请求: POST /api/ai/notes/qa"
echo "问题: 这段笔记的主要内容是什么？"

QA_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:3001/api/ai/notes/qa \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d "{\"question\":\"这段笔记的主要内容是什么？\",\"content\":\"$TEST_TEXT\"}")

HTTP_STATUS=$(echo "$QA_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$QA_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ 状态码: $HTTP_STATUS${NC}"
  echo "响应: $RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
  echo -e "${RED}❌ 状态码: $HTTP_STATUS${NC}"
  echo "响应: $RESPONSE_BODY"
fi

echo -e "\n${YELLOW}3. 检查路由注册${NC}"
echo "-------------------"
curl -s http://localhost:3001/api/ai/notes/rewrite \
  -X OPTIONS -I | grep -E "HTTP|Allow|Access-Control"

echo -e "\n===================="
echo "测试完成"
