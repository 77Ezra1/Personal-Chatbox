#!/bin/bash

# Personal Chatbox - 一键启动脚本 (增强版)
# 版本: 2.0
# 更新日期: 2025-06-13

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"
STARTUP_LOG="$LOG_DIR/startup.log"

# 记录启动日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$STARTUP_LOG"
}

log "========== 启动开始 =========="

cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    log "收到停止信号，开始清理..."
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            kill "$BACKEND_PID"
            echo -e "${GREEN}✓${NC} 后端服务已停止 (PID: $BACKEND_PID)"
            log "后端服务已停止 (PID: $BACKEND_PID)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill "$FRONTEND_PID"
            echo -e "${GREEN}✓${NC} 前端服务已停止 (PID: $FRONTEND_PID)"
            log "前端服务已停止 (PID: $FRONTEND_PID)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    echo -e "${GREEN}✓ 所有服务已停止${NC}"
    log "========== 启动结束 =========="
    exit 0
}

trap cleanup SIGINT SIGTERM

# 检查关键依赖
check_dependencies() {
    local missing_deps=()
    
    echo -e "${CYAN}检查关键依赖包...${NC}"
    log "开始检查依赖包..."
    
    # 检查必需的包
    local required_packages=(
        "react-markdown"
        "remark-math"
        "rehype-katex"
        "katex"
        "express"
        "axios"
        "openai"
    )
    
    for pkg in "${required_packages[@]}"; do
        if ! grep -q "\"$pkg\"" package.json; then
            missing_deps+=("$pkg")
            echo -e "${RED}  ✗ 缺失: $pkg${NC}"
            log "ERROR: 缺失依赖包 $pkg"
        else
            if [ ! -d "node_modules/$pkg" ]; then
                echo -e "${YELLOW}  ⚠ 未安装: $pkg${NC}"
                log "WARNING: $pkg 未安装"
                return 1
            else
                echo -e "${GREEN}  ✓ $pkg${NC}"
            fi
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}错误: 发现缺失的依赖包${NC}"
        echo -e "${YELLOW}请运行: pnpm add ${missing_deps[*]}${NC}"
        log "ERROR: 缺失依赖包: ${missing_deps[*]}"
        exit 1
    fi
    
    log "依赖检查完成"
    return 0
}

# 验证前端编译
verify_frontend() {
    echo -e "${CYAN}验证前端编译状态...${NC}"
    log "开始验证前端编译..."
    
    # 等待前端编译完成
    sleep 5
    
    # 检查日志中是否有错误
    if grep -qi "error\|failed\|TypeError" "$LOG_DIR/frontend.log" 2>/dev/null; then
        echo -e "${RED}✗ 前端编译失败！${NC}"
        echo -e "${YELLOW}错误日志:${NC}"
        tail -30 "$LOG_DIR/frontend.log" | grep -i "error\|failed" --color=never
        log "ERROR: 前端编译失败"
        return 1
    fi
    
    # 检查是否成功启动
    if grep -q "ready in\|Local:" "$LOG_DIR/frontend.log" 2>/dev/null; then
        echo -e "${GREEN}✓ 前端编译成功${NC}"
        log "前端编译成功"
        return 0
    fi
    
    echo -e "${YELLOW}⚠ 前端编译状态未知${NC}"
    log "WARNING: 前端编译状态未知"
    return 0
}


echo "======================================"
echo "  Personal Chatbox - 一键启动 v2.0"
echo "======================================"
echo ""

echo -e "${BLUE}[1/6] 检查环境...${NC}"
log "检查环境..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装${NC}"
    log "ERROR: Node.js 未安装"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
log "Node.js 版本: $NODE_VERSION"

if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo -e "${RED}✗ npm/pnpm 未安装${NC}"
    log "ERROR: npm/pnpm 未安装"
    exit 1
fi

echo -e "${GREEN}✓${NC} 包管理器: $PKG_MANAGER"
log "包管理器: $PKG_MANAGER"

echo ""
echo -e "${BLUE}[2/6] 安装依赖...${NC}"
log "检查依赖安装..."

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ 正在安装依赖...${NC}"
    log "开始安装依赖..."
    $PKG_MANAGER install --legacy-peer-deps
    log "依赖安装完成"
else
    # 检查关键依赖
    if ! check_dependencies; then
        echo -e "${YELLOW}⚠ 正在重新安装依赖...${NC}"
        log "开始重新安装依赖..."
        $PKG_MANAGER install --legacy-peer-deps
        log "依赖重新安装完成"
        
        # 再次检查
        if ! check_dependencies; then
            echo -e "${RED}✗ 依赖安装失败${NC}"
            log "ERROR: 依赖安装失败"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}✓${NC} 依赖就绪"

echo ""
echo -e "${BLUE}[3/6] 检查数据库...${NC}"
log "检查数据库..."

if [ ! -f "data/app.db" ]; then
    echo -e "${YELLOW}⚠ 正在初始化数据库...${NC}"
    log "开始初始化数据库..."
    node server/db/init.cjs
    log "数据库初始化完成"
fi

echo -e "${GREEN}✓${NC} 数据库就绪"

echo ""
echo -e "${BLUE}[4/6] 启动后端服务...${NC}"
log "启动后端服务..."

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 端口 3001 已被占用，正在清理...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

nohup node server/index.cjs > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
log "后端进程启动 (PID: $BACKEND_PID)"

echo -n "等待后端启动"
BACKEND_READY=false
for i in {1..15}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓${NC} 后端服务已启动 (PID: $BACKEND_PID)"
        log "后端服务启动成功"
        BACKEND_READY=true
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    echo ""
    echo -e "${RED}✗ 后端启动超时${NC}"
    echo -e "${YELLOW}查看日志: tail -50 $LOG_DIR/backend.log${NC}"
    log "ERROR: 后端启动超时"
    cleanup
fi

echo ""
echo -e "${BLUE}[5/6] 启动前端服务...${NC}"
log "启动前端服务..."

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 端口 5173 已被占用，正在清理...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

nohup $PKG_MANAGER run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
log "前端进程启动 (PID: $FRONTEND_PID)"

echo -n "等待前端启动"
FRONTEND_READY=false
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓${NC} 前端服务已启动 (PID: $FRONTEND_PID)"
        log "前端服务启动成功"
        FRONTEND_READY=true
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$FRONTEND_READY" = false ]; then
    echo ""
    echo -e "${RED}✗ 前端启动超时${NC}"
    echo -e "${YELLOW}查看日志: tail -50 $LOG_DIR/frontend.log${NC}"
    log "ERROR: 前端启动超时"
    cleanup
fi

echo ""
echo -e "${BLUE}[6/6] 验证服务状态...${NC}"
log "验证服务状态..."

# 验证前端编译
verify_frontend

# 检查浏览器访问
if curl -s http://localhost:5173 | grep -q "Personal Chatbox"; then
    echo -e "${GREEN}✓${NC} 前端页面可访问"
    log "前端页面验证成功"
else
    echo -e "${YELLOW}⚠ 前端页面可能存在问题${NC}"
    log "WARNING: 前端页面验证失败"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Personal Chatbox 启动成功!${NC}"
echo "======================================"
echo ""
echo -e "${CYAN}服务信息:${NC}"
echo -e "  ${BLUE}前端:${NC} http://localhost:5173 (PID: $FRONTEND_PID)"
echo -e "  ${BLUE}后端:${NC} http://localhost:3001 (PID: $BACKEND_PID)"
echo ""
echo -e "${CYAN}日志文件:${NC}"
echo -e "  ${BLUE}启动日志:${NC} $STARTUP_LOG"
echo -e "  ${BLUE}前端日志:${NC} $LOG_DIR/frontend.log"
echo -e "  ${BLUE}后端日志:${NC} $LOG_DIR/backend.log"
echo ""
echo -e "${CYAN}快速命令:${NC}"
echo -e "  ${BLUE}查看日志:${NC} tail -f logs/backend.log"
echo -e "  ${BLUE}停止服务:${NC} ./stop.sh 或按 Ctrl+C"
echo ""
echo -e "${BLUE}默认邀请码:${NC} WELCOME2025"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 停止所有服务${NC}"
echo ""

log "所有服务启动成功"

sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &> /dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &> /dev/null &
fi

wait
