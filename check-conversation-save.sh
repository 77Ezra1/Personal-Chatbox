#!/bin/bash

echo "=== 检查对话保存功能 ==="

# 1. 检查是否有用户登录
echo -e "\n1. 检查数据库中的用户..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT id, email FROM users LIMIT 5;"

# 2. 检查是否有保存的对话
echo -e "\n2. 检查数据库中的对话..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT c.id, c.title, u.email, c.created_at FROM conversations c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 5;"

# 3. 检查消息数量
echo -e "\n3. 检查消息数量..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT COUNT(*) as message_count FROM messages;"

# 4. 检查最近的消息
echo -e "\n4. 检查最近的消息..."
sqlite3 /Users/ezra/Personal-Chatbox/data/app.db "SELECT m.id, m.role, substr(m.content, 1, 50) as content_preview, m.timestamp FROM messages m ORDER BY m.timestamp DESC LIMIT 5;"

echo -e "\n=== 检查完成 ==="
