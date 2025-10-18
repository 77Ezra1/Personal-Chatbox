#!/bin/bash

# 简单的文档管理功能测试脚本
# 使用curl直接测试API

BASE_URL="http://localhost:3001/api"
TEST_EMAIL="test-$(date +%s)@test.com"
TEST_PASSWORD="TestPass123"
INVITE_CODE="WELCOME2025"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

test_api() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=${5:-200}

  echo -n "Testing: $name... "

  if [ -n "$AUTH_TOKEN" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" -eq "$expected_code" ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    ((passed++))
    echo "$body"
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
    echo "$body"
    ((failed++))
  fi

  echo ""
}

echo "================================"
echo "文档管理功能测试"
echo "================================"
echo ""

# 1. 注册用户
echo "1. 注册测试用户..."
register_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"inviteCode\":\"$INVITE_CODE\"}"
register_response=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_data")

AUTH_TOKEN=$(echo "$register_response" | jq -r '.token // empty')

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}注册失败，尝试使用已存在的测试用户${NC}"
  # 使用固定的测试账号
  TEST_EMAIL="2915165979@qq.com"
  TEST_PASSWORD="20051216lzx"

  login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
  login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$login_data")

  AUTH_TOKEN=$(echo "$login_response" | jq -r '.token // empty')

  if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}登录失败，无法继续测试${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✓ 认证成功${NC}"
echo ""

# 2. 创建分类
echo "2. 测试创建分类..."
CAT_DATA='{"name":"Development","color":"#3b82f6","icon":"💻","description":"Dev resources"}'
test_api "创建分类" "POST" "/documents/categories" "$CAT_DATA" 201

# 3. 获取分类列表
echo "3. 测试获取分类列表..."
test_api "获取分类" "GET" "/documents/categories/list" "" 200

# 4. 创建文档
echo "4. 测试创建文档..."
DOC_DATA='{"title":"React Docs","description":"React documentation","url":"https://react.dev","category":"Development","tags":["react","frontend"],"icon":"⚛️"}'
doc_response=$(curl -s -X POST "$BASE_URL/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$DOC_DATA")

DOC_ID=$(echo "$doc_response" | jq -r '.id // empty')

if [ -n "$DOC_ID" ]; then
  echo -e "${GREEN}✓ 文档创建成功 (ID: $DOC_ID)${NC}"
  ((passed++))
else
  echo -e "${RED}✗ 文档创建失败${NC}"
  echo "$doc_response"
  ((failed++))
fi
echo ""

# 5. 获取文档列表
echo "5. 测试获取文档列表..."
test_api "获取所有文档" "GET" "/documents" "" 200

# 6. 获取单个文档
if [ -n "$DOC_ID" ]; then
  echo "6. 测试获取单个文档..."
  test_api "获取文档 $DOC_ID" "GET" "/documents/$DOC_ID" "" 200
fi

# 7. 更新文档
if [ -n "$DOC_ID" ]; then
  echo "7. 测试更新文档..."
  UPDATE_DATA='{"title":"React Docs (Updated)","is_favorite":true}'
  test_api "更新文档" "PUT" "/documents/$DOC_ID" "$UPDATE_DATA" 200
fi

# 8. 记录访问
if [ -n "$DOC_ID" ]; then
  echo "8. 测试记录访问..."
  test_api "记录访问" "POST" "/documents/$DOC_ID/visit" "" 200
fi

# 9. 搜索文档
echo "9. 测试搜索文档..."
test_api "搜索React" "GET" "/documents/search/React" "" 200

# 10. 获取标签
echo "10. 测试获取标签..."
test_api "获取标签列表" "GET" "/documents/tags/list" "" 200

# 11. 获取统计信息
echo "11. 测试获取统计..."
test_api "获取统计信息" "GET" "/documents/stats/summary" "" 200

# 12. 导出文档
echo "12. 测试导出文档..."
test_api "导出文档" "GET" "/documents/export/all" "" 200

# 13. 测试过滤
echo "13. 测试按分类过滤..."
test_api "按分类过滤" "GET" "/documents?category=Development" "" 200

echo "14. 测试按收藏过滤..."
test_api "按收藏过滤" "GET" "/documents?isFavorite=true" "" 200

# 14. 删除文档
if [ -n "$DOC_ID" ]; then
  echo "15. 测试删除文档..."
  test_api "删除文档" "DELETE" "/documents/$DOC_ID" "" 200
fi

# 结果汇总
echo ""
echo "================================"
echo "测试结果汇总"
echo "================================"
total=$((passed + failed))
echo "总计: $total"
echo -e "${GREEN}通过: $passed${NC}"
echo -e "${RED}失败: $failed${NC}"

if [ $failed -eq 0 ]; then
  echo -e "\n${GREEN}🎉 所有测试通过！${NC}"
  exit 0
else
  echo -e "\n${YELLOW}⚠️  有 $failed 个测试失败${NC}"
  exit 1
fi
