#!/bin/bash
# Personal Chatbox - 一键启动脚本（开发模式）
# 使用方法: ./start-dev.sh

set -e

echo "🚀 Personal Chatbox 启动中..."
echo "================================"

# 进入项目目录
cd "$(dirname "$0")"

# 1. 检查Node.js和pnpm
echo ""
echo "📦 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
    echo "❌ 未找到包管理器，请先安装pnpm或npm"
    exit 1
fi

# 2. 创建必要的目录
echo ""
echo "📁 创建必要目录..."
mkdir -p data logs uploads/images uploads/files uploads/voice uploads/knowledge uploads/processed
echo "✅ 目录创建完成"

# 3. 检查并创建.env文件
echo ""
echo "⚙️  配置环境变量..."
if [ ! -f .env ]; then
    echo "NODE_ENV=development
PORT=3001
HOST=0.0.0.0
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
LOG_LEVEL=info
LOG_FILE=./logs/backend.log" > .env
    echo "✅ 已创建 .env 文件"
else
    echo "✅ .env 文件已存在"
fi

# 4. 初始化数据库
echo ""
echo "🗄️  初始化数据库..."
if node server/db/init.cjs; then
    echo "✅ 数据库初始化完成"
else
    echo "⚠️  数据库初始化失败，但继续启动..."
fi

# 5. 停止已有服务
echo ""
echo "🛑 停止已有服务..."
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ 已停止旧的后端服务"
    fi
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✅ 已停止旧的前端服务"
    fi
    rm .frontend.pid
fi

# 6. 启动后端服务
echo ""
echo "🚀 启动后端服务..."
node server/index.cjs > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 检查后端是否正常运行
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"

    # 测试健康检查
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ 后端API响应正常"
    else
        echo "⚠️  后端API未响应，请检查日志"
    fi
else
    echo "❌ 后端服务启动失败，查看日志:"
    tail -20 logs/backend.log
    exit 1
fi

# 7. 启动前端服务
echo ""
echo "🎨 启动前端开发服务器..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"

# 等待前端启动
sleep 3

# 检查前端是否正常运行
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常"
else
    echo "⚠️  前端服务可能未正常启动，请检查日志"
fi

# 8. 显示服务信息
echo ""
echo "================================"
echo "🎉 启动完成！"
echo "================================"
echo ""
echo "📊 服务状态:"
echo "  后端: http://localhost:3001"
echo "  前端: http://localhost:5173"
echo "  健康检查: http://localhost:3001/health"
echo ""
echo "📝 日志文件:"
echo "  后端日志: logs/backend.log"
echo "  前端日志: logs/frontend.log"
echo ""
echo "📌 进程ID:"
echo "  后端PID: $BACKEND_PID"
echo "  前端PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务:"
echo "  运行: ./stop-dev.sh"
echo "  或: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📖 查看日志:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "🌐 打开浏览器访问: http://localhost:5173"
echo ""
echo "================================"

# 可选：自动打开浏览器
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:5173 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:5173 2>/dev/null || true
fi

