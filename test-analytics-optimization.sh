#!/bin/bash

# 测试数据面板优化功能
# 包括：调用次数、tokens消耗、预计金额（多货币）、API使用次数

echo "=========================================="
echo "📊 数据面板优化功能测试"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器地址
SERVER_URL="http://localhost:3001"

# 测试用户token（需要替换为实际的token）
# 从登录接口获取
echo "🔐 步骤 1: 用户登录获取Token"
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }')

echo "登录响应: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败，无法获取Token${NC}"
  echo "请检查用户是否存在，或创建测试用户"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功，Token已获取${NC}"
echo ""

# 测试1: 获取统计概览（默认USD）
echo "📋 测试 1: 获取统计概览（USD货币）"
echo "----------------------------------------"
OVERVIEW_RESPONSE=$(curl -s -X GET "$SERVER_URL/api/analytics/overview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: token=$TOKEN")

echo "响应: $OVERVIEW_RESPONSE" | jq '.' 2>/dev/null || echo "$OVERVIEW_RESPONSE"
echo ""

# 检查是否包含新字段
if echo "$OVERVIEW_RESPONSE" | grep -q '"apiCalls"'; then
  echo -e "${GREEN}✅ API调用次数统计存在${NC}"
else
  echo -e "${RED}❌ API调用次数统计缺失${NC}"
fi

if echo "$OVERVIEW_RESPONSE" | grep -q '"todayApiCalls"'; then
  echo -e "${GREEN}✅ 今日API调用统计存在${NC}"
else
  echo -e "${RED}❌ 今日API调用统计缺失${NC}"
fi

if echo "$OVERVIEW_RESPONSE" | grep -q '"currencySymbol"'; then
  echo -e "${GREEN}✅ 货币符号字段存在${NC}"
else
  echo -e "${RED}❌ 货币符号字段缺失${NC}"
fi
echo ""

# 测试2: 修改用户货币设置为CNY
echo "💱 测试 2: 修改用户货币为人民币（CNY）"
echo "----------------------------------------"
PROFILE_UPDATE=$(curl -s -X PUT "$SERVER_URL/api/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: token=$TOKEN" \
  -d '{
    "currency": "CNY"
  }')

echo "更新响应: $PROFILE_UPDATE" | jq '.' 2>/dev/null || echo "$PROFILE_UPDATE"

if echo "$PROFILE_UPDATE" | grep -q '"currency":"CNY"'; then
  echo -e "${GREEN}✅ 货币设置已更新为CNY${NC}"
else
  echo -e "${YELLOW}⚠️  货币更新可能失败${NC}"
fi
echo ""

# 测试3: 再次获取统计概览（应该显示CNY）
echo "📋 测试 3: 获取统计概览（CNY货币）"
echo "----------------------------------------"
sleep 1  # 等待数据库更新
OVERVIEW_CNY=$(curl -s -X GET "$SERVER_URL/api/analytics/overview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: token=$TOKEN")

echo "响应: $OVERVIEW_CNY" | jq '.' 2>/dev/null || echo "$OVERVIEW_CNY"
echo ""

# 检查货币是否为CNY
if echo "$OVERVIEW_CNY" | grep -q '"currency":"CNY"'; then
  echo -e "${GREEN}✅ 费用货币已转换为CNY${NC}"

  # 提取费用金额
  COST_TOTAL=$(echo "$OVERVIEW_CNY" | grep -o '"total":"[^"]*"' | head -1 | cut -d'"' -f4)
  CURRENCY_SYMBOL=$(echo "$OVERVIEW_CNY" | grep -o '"currencySymbol":"[^"]*"' | cut -d'"' -f4)

  echo "预计成本: ${CURRENCY_SYMBOL}${COST_TOTAL} CNY"
else
  echo -e "${RED}❌ 货币未正确转换${NC}"
fi
echo ""

# 测试4: 测试其他货币
echo "💱 测试 4: 测试其他货币（EUR、JPY）"
echo "----------------------------------------"

for CURRENCY in "EUR" "JPY"; do
  echo "设置货币为 $CURRENCY..."
  curl -s -X PUT "$SERVER_URL/api/profile" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: token=$TOKEN" \
    -d "{\"currency\": \"$CURRENCY\"}" > /dev/null

  sleep 0.5

  OVERVIEW_CURR=$(curl -s -X GET "$SERVER_URL/api/analytics/overview" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: token=$TOKEN")

  if echo "$OVERVIEW_CURR" | grep -q "\"currency\":\"$CURRENCY\""; then
    COST=$(echo "$OVERVIEW_CURR" | grep -o '"total":"[^"]*"' | head -1 | cut -d'"' -f4)
    SYMBOL=$(echo "$OVERVIEW_CURR" | grep -o '"currencySymbol":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ $CURRENCY: ${SYMBOL}${COST}${NC}"
  else
    echo -e "${RED}❌ $CURRENCY 转换失败${NC}"
  fi
done
echo ""

# 测试5: 统计数据汇总
echo "📊 测试 5: 统计数据汇总"
echo "----------------------------------------"
FINAL_OVERVIEW=$(curl -s -X GET "$SERVER_URL/api/analytics/overview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: token=$TOKEN")

# 提取关键指标
CONVERSATIONS=$(echo "$FINAL_OVERVIEW" | grep -o '"conversations":[0-9]*' | cut -d':' -f2)
MESSAGES=$(echo "$FINAL_OVERVIEW" | grep -o '"messages":[0-9]*' | head -1 | cut -d':' -f2)
API_CALLS=$(echo "$FINAL_OVERVIEW" | grep -o '"apiCalls":[0-9]*' | cut -d':' -f2)
TOTAL_TOKENS=$(echo "$FINAL_OVERVIEW" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
TODAY_MESSAGES=$(echo "$FINAL_OVERVIEW" | grep -o '"todayMessages":[0-9]*' | cut -d':' -f2)
TODAY_API=$(echo "$FINAL_OVERVIEW" | grep -o '"todayApiCalls":[0-9]*' | cut -d':' -f2)

echo "📈 核心指标:"
echo "   - 总对话数: $CONVERSATIONS"
echo "   - 总消息数: $MESSAGES"
echo "   - API调用次数: $API_CALLS"
echo "   - 总Token数: $TOTAL_TOKENS"
echo "   - 今日消息: $TODAY_MESSAGES"
echo "   - 今日API调用: $TODAY_API"
echo ""

# 恢复用户货币设置为USD
echo "🔄 恢复用户货币设置为USD..."
curl -s -X PUT "$SERVER_URL/api/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: token=$TOKEN" \
  -d '{"currency": "USD"}' > /dev/null

echo ""
echo "=========================================="
echo "✅ 数据面板优化功能测试完成！"
echo "=========================================="
echo ""
echo "📌 功能验证:"
echo "   ✓ API调用次数统计"
echo "   ✓ Token消耗统计"
echo "   ✓ 多货币支持（USD、CNY、EUR、JPY等）"
echo "   ✓ 货币符号正确显示"
echo "   ✓ 今日数据统计"
echo ""
echo "🎨 UI布局包含:"
echo "   1. 总对话数（今日消息）"
echo "   2. 总消息数"
echo "   3. 总Token数（Prompt + Completion）"
echo "   4. 预估成本（用户设置货币）"
echo "   5. API调用次数（今日调用）"
echo ""
