#!/bin/bash
# ====================================
# Personal Chatbox 停止服务脚本 (Mac/Linux)
# ====================================

# 颜色定义
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Personal Chatbox 停止服务${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# 停止标志
STOPPED=0

# 1. 通过 PID 文件停止服务 (Linux)
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}正在停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null
        rm logs/backend.pid
        STOPPED=1
    fi
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}正在停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
        rm logs/frontend.pid
        STOPPED=1
    fi
fi

# 2. 通过端口查找并停止进程
echo -e "${YELLOW}检查端口占用...${NC}"

# 停止占用 3001 端口的进程
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$PORT_3001_PID" ]; then
    echo -e "${YELLOW}  ⚠️  停止端口 3001 的进程 (PID: $PORT_3001_PID)${NC}"
    kill -9 $PORT_3001_PID 2>/dev/null
    STOPPED=1
fi

# 停止占用 5173 端口的进程
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null)
if [ -n "$PORT_5173_PID" ]; then
    echo -e "${YELLOW}  ⚠️  停止端口 5173 的进程 (PID: $PORT_5173_PID)${NC}"
    kill -9 $PORT_5173_PID 2>/dev/null
    STOPPED=1
fi

# 3. 查找并停止所有相关 Node.js 进程
NODE_PROCESSES=$(pgrep -f "node server/index.cjs|pnpm dev" 2>/dev/null)
if [ -n "$NODE_PROCESSES" ]; then
    echo -e "${YELLOW}正在停止相关 Node.js 进程...${NC}"
    echo "$NODE_PROCESSES" | while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GRAY}  停止进程 PID: $pid${NC}"
            kill -9 $pid 2>/dev/null
            STOPPED=1
        fi
    done
fi

# 等待进程完全停止
sleep 1

# 4. 验证端口是否已释放
echo ""
echo -e "${YELLOW}验证端口状态...${NC}"

PORT_3001_CHECK=$(lsof -ti:3001 2>/dev/null)
PORT_5173_CHECK=$(lsof -ti:5173 2>/dev/null)

if [ -z "$PORT_3001_CHECK" ]; then
    echo -e "${GREEN}  ✅ 端口 3001 已释放${NC}"
else
    echo -e "${RED}  ❌ 端口 3001 仍被占用${NC}"
fi

if [ -z "$PORT_5173_CHECK" ]; then
    echo -e "${GREEN}  ✅ 端口 5173 已释放${NC}"
else
    echo -e "${RED}  ❌ 端口 5173 仍被占用${NC}"
fi

echo ""
if [ $STOPPED -eq 1 ]; then
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
    echo -e "${GREEN}=====================================${NC}"
else
    echo -e "${YELLOW}=====================================${NC}"
    echo -e "${YELLOW}ℹ️  未找到运行中的服务${NC}"
    echo -e "${YELLOW}=====================================${NC}"
fi
echo ""

# 清理日志文件 (可选)
if [ -f "logs/backend.log" ] || [ -f "logs/frontend.log" ]; then
    echo -e "${GRAY}是否清理日志文件? (y/N): ${NC}"
    read -r CLEAN_LOGS
    if [ "$CLEAN_LOGS" = "y" ] || [ "$CLEAN_LOGS" = "Y" ]; then
        rm -f logs/backend.log logs/frontend.log
        echo -e "${GREEN}  ✅ 日志文件已清理${NC}"
    fi
fi

echo -e "${GRAY}按 Enter 键退出...${NC}"
read
