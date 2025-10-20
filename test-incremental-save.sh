#!/bin/bash

# 测试增量保存功能

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFpbCI6ImZpbmFsbHlfd29ya3NAdGVzdC5jb20iLCJpYXQiOjE3NjA2NDgwMzgsImV4cCI6MTc2MTI1MjgzOH0.mhGmE2KWYfYdriLkLQQqYB8INMmttwriY9HYZ8OKyMg"

echo "=== 测试 1: 检查现有数据 ==="
sqlite3 data/app.db "SELECT id, title FROM conversations WHERE user_id = 11;"

echo -e "\n=== 测试 2: 发送包含现有对话的保存请求(应该更新而不是重新插入) ==="
curl -s -X POST http://localhost:3001/api/user-data/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversations": {
      "test-1": {
        "id": "test-1",
        "title": "测试对话",
        "messages": [
          {
            "id": "msg-1",
            "role": "user",
            "content": "Hello",
            "timestamp": "2025-10-20T10:00:00.000Z"
          },
          {
            "id": "msg-2",
            "role": "assistant",
            "content": "Hi there!",
            "timestamp": "2025-10-20T10:00:01.000Z"
          },
          {
            "id": "msg-3",
            "role": "user",
            "content": "New message!",
            "timestamp": "2025-10-20T10:00:02.000Z"
          }
        ],
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:02.000Z"
      }
    }
  }' | jq '.'

echo -e "\n=== 测试 3: 检查更新后的数据(应该有3条消息) ==="
sqlite3 data/app.db "SELECT c.id, c.title, COUNT(m.id) as msg_count FROM conversations c LEFT JOIN messages m ON c.id = m.conversation_id WHERE c.user_id = 11 AND c.title = '测试对话' GROUP BY c.id;"

echo -e "\n=== 测试 4: 添加新对话 ==="
curl -s -X POST http://localhost:3001/api/user-data/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversations": {
      "test-1": {
        "id": "test-1",
        "title": "测试对话",
        "messages": [
          {
            "id": "msg-1",
            "role": "user",
            "content": "Hello",
            "timestamp": "2025-10-20T10:00:00.000Z"
          },
          {
            "id": "msg-2",
            "role": "assistant",
            "content": "Hi there!",
            "timestamp": "2025-10-20T10:00:01.000Z"
          },
          {
            "id": "msg-3",
            "role": "user",
            "content": "New message!",
            "timestamp": "2025-10-20T10:00:02.000Z"
          }
        ],
        "createdAt": "2025-10-20T10:00:00.000Z",
        "updatedAt": "2025-10-20T10:00:02.000Z"
      },
      "test-2": {
        "id": "test-2",
        "title": "另一个对话",
        "messages": [
          {
            "id": "msg-1",
            "role": "user",
            "content": "Test message",
            "timestamp": "2025-10-20T11:00:00.000Z"
          }
        ],
        "createdAt": "2025-10-20T11:00:00.000Z",
        "updatedAt": "2025-10-20T11:00:00.000Z"
      }
    }
  }' | jq '.'

echo -e "\n=== 测试 5: 检查最终数据(应该有两个对话) ==="
sqlite3 data/app.db "SELECT c.id, c.title, COUNT(m.id) as msg_count FROM conversations c LEFT JOIN messages m ON c.id = m.conversation_id WHERE c.user_id = 11 GROUP BY c.id ORDER BY c.id;"

echo -e "\n=== 完成! ==="
