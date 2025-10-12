#!/bin/bash

# Personal Chatbox 启动脚本

echo "🚀 启动 Personal Chatbox..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查数据库是否存在
if [ ! -f "data/app.db" ]; then
    echo "📦 初始化数据库..."
    node server/db/init.cjs
    echo ""
fi

# 启动后端服务器
echo "🔧 启动后端服务器..."
npm run server > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "   后端PID: $SERVER_PID"
echo "   日志文件: /tmp/server.log"
echo ""

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:3001/api/auth/verify > /dev/null 2>&1; then
    echo "⚠️  警告: 后端服务器可能未正常启动,请检查日志"
    echo "   查看日志: tail -f /tmp/server.log"
else
    echo "✅ 后端服务器启动成功 (http://localhost:3001)"
fi
echo ""

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端PID: $FRONTEND_PID"
echo "   日志文件: /tmp/frontend.log"
echo ""

# 等待前端启动
sleep 5

echo "✅ 启动完成!"
echo ""
echo "📝 访问地址:"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo ""
echo "📋 管理命令:"
echo "   查看邀请码: node scripts/manage-invite-codes.cjs list"
echo "   添加邀请码: node scripts/manage-invite-codes.cjs add CODE 10"
echo "   查看用户: sqlite3 data/app.db 'SELECT * FROM users;'"
echo ""
echo "🛑 停止服务:"
echo "   kill $SERVER_PID $FRONTEND_PID"
echo "   或运行: pkill -f 'node.*server/index.cjs' && pkill -f 'vite'"
echo ""
echo "📊 查看日志:"
echo "   后端: tail -f /tmp/server.log"
echo "   前端: tail -f /tmp/frontend.log"
echo ""

# 保存PID到文件
echo "$SERVER_PID" > /tmp/chatbox-server.pid
echo "$FRONTEND_PID" > /tmp/chatbox-frontend.pid

echo "✨ Personal Chatbox 已启动!"

