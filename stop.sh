#!/bin/bash

# Personal Chatbox 停止脚本

echo "🛑 停止 Personal Chatbox..."
echo ""

# 停止后端服务器
if [ -f "/tmp/chatbox-server.pid" ]; then
    SERVER_PID=$(cat /tmp/chatbox-server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "🔧 停止后端服务器 (PID: $SERVER_PID)..."
        kill $SERVER_PID
        rm /tmp/chatbox-server.pid
    else
        echo "⚠️  后端服务器未运行"
        rm /tmp/chatbox-server.pid
    fi
else
    echo "🔧 查找并停止后端服务器..."
    pkill -f "node.*server/index.cjs"
fi
echo ""

# 停止前端开发服务器
if [ -f "/tmp/chatbox-frontend.pid" ]; then
    FRONTEND_PID=$(cat /tmp/chatbox-frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🎨 停止前端开发服务器 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm /tmp/chatbox-frontend.pid
    else
        echo "⚠️  前端服务器未运行"
        rm /tmp/chatbox-frontend.pid
    fi
else
    echo "🎨 查找并停止前端开发服务器..."
    pkill -f "vite"
fi
echo ""

# 等待进程完全停止
sleep 2

# 检查是否还有残留进程
if pgrep -f "node.*server/index.cjs" > /dev/null; then
    echo "⚠️  强制停止后端残留进程..."
    pkill -9 -f "node.*server/index.cjs"
fi

if pgrep -f "vite" > /dev/null; then
    echo "⚠️  强制停止前端残留进程..."
    pkill -9 -f "vite"
fi

echo "✅ Personal Chatbox 已停止!"

