#!/bin/bash

echo "🧹 正在清理旧数据库文件..."

# 删除所有 SQLite 数据库文件
find ./server/db -name "*.db" -type f -delete

echo "✅ 数据库文件已清空。"

# 重新启动服务
echo "🚀 启动服务器中..."
npm run server
