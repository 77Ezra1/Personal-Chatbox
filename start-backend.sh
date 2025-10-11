#!/bin/bash

# AI-Life-System 后端服务启动脚本

echo "正在启动AI-Life-System后端服务..."

# 进入项目目录
cd "$(dirname "$0")"

# 检查是否已有进程在运行
if [ -f server.pid ]; then
    OLD_PID=$(cat server.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "检测到已有进程运行 (PID: $OLD_PID)"
        echo "正在停止旧进程..."
        kill $OLD_PID
        sleep 2
    fi
fi

# 启动后端服务
nohup node server/index.cjs > server.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > server.pid

# 等待服务启动
sleep 3

# 检查服务是否启动成功
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo "✅ 后端服务已成功启动 (PID: $NEW_PID)"
    echo "✅ 服务地址: http://localhost:3001"
    echo "📝 日志文件: server.log"
    echo ""
    echo "查看日志: tail -f server.log"
    echo "停止服务: kill $NEW_PID"
else
    echo "❌ 后端服务启动失败"
    echo "请查看日志: cat server.log"
    exit 1
fi

