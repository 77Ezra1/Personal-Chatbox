#!/bin/bash

echo "=== 测试对话保存流程 ==="

# 1. 登录获取 cookie
echo -e "\n1. 登录 test123@example.com..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "TestPass123!"
  }')

echo "登录响应: $LOGIN_RESPONSE"

# 检查是否登录成功
if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
  echo "✅ 登录成功"
else
  echo "❌ 登录失败"
  exit 1
fi

# 2. 保存一个测试对话
echo -e "\n2. 保存测试对话..."
SAVE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST http://localhost:3001/api/user-data/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "conversations": {
      "test-conv-123": {
        "id": "test-conv-123",
        "title": "测试对话",
        "messages": [
          {
            "id": "msg-1",
            "role": "user",
            "content": "你好",
            "timestamp": "2025-10-21T07:00:00.000Z"
          },
          {
            "id": "msg-2",
            "role": "assistant",
            "content": "你好！很高兴见到你。",
            "timestamp": "2025-10-21T07:00:01.000Z"
          }
        ],
        "createdAt": "2025-10-21T07:00:00.000Z",
        "updatedAt": "2025-10-21T07:00:01.000Z"
      }
    }
  }')

echo "保存响应: $SAVE_RESPONSE"

# 3. 等待1秒
sleep 1

# 4. 读取对话
echo -e "\n3. 读取对话列表..."
LOAD_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:3001/api/user-data/conversations)

echo "读取响应: $LOAD_RESPONSE"

# 5. 验证数据库
echo -e "\n4. 验证数据库..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db << SQL
SELECT '对话列表:' as info;
SELECT c.id, c.title, u.email 
FROM conversations c 
JOIN users u ON c.user_id = u.id 
WHERE u.email = 'test123@example.com';

SELECT '消息列表:' as info;
SELECT m.id, m.role, m.content
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN users u ON c.user_id = u.id
WHERE u.email = 'test123@example.com';
SQL

# 清理
rm -f /tmp/cookies.txt

echo -e "\n=== 测试完成 ==="
