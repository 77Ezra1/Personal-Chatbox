#!/bin/bash

echo "=== 测试聊天功能 ==="
echo ""

# 1. 测试登录
echo "1. 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "登录响应: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取 token"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:20}..."
echo ""

# 2. 测试聊天 API
echo "2. 测试聊天 API..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [{"role":"user","content":"你好"}],
    "model": "deepseek-chat",
    "stream": false
  }')

echo "聊天响应: $CHAT_RESPONSE"
echo ""

# 3. 检查数据库配置
echo "3. 检查数据库配置..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT user_id, api_keys FROM user_configs WHERE user_id=1;"

echo ""
echo "=== 测试完成 ==="
