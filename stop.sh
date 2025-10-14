#!/bin/bash

# Personal Chatbox - 停止脚本

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

echo "======================================"
echo "  Personal Chatbox - 停止服务"
echo "======================================"
echo ""

# 停止后端
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
        echo -e "${GREEN}✓${NC} 后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} 后端服务未运行"
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    echo -e "${YELLOW}⚠${NC} 未找到后端PID文件"
fi

# 停止前端
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
        echo -e "${GREEN}✓${NC} 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} 前端服务未运行"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    echo -e "${YELLOW}⚠${NC} 未找到前端PID文件"
fi

# 强制停止端口占用
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} 强制停止端口3001占用进程"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} 强制停止端口5173占用进程"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✓ 所有服务已停止${NC}"
