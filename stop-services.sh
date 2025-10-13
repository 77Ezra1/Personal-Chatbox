#!/bin/bash

# ========================================
# Personal Chatbox 停止服务脚本
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  停止 Personal Chatbox 服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 停止后端服务
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        
        # 检查是否成功停止
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_warning "进程未响应，强制停止..."
            kill -9 $BACKEND_PID
        fi
        
        log_success "后端服务已停止 ✓"
    else
        log_warning "后端服务进程不存在 (PID: $BACKEND_PID)"
    fi
    rm -f backend.pid
else
    log_info "未找到 backend.pid 文件，尝试通过端口查找..."
    
    if command -v lsof >/dev/null 2>&1; then
        BACKEND_PID=$(lsof -ti:3001)
        if [ ! -z "$BACKEND_PID" ]; then
            log_info "找到后端进程 (PID: $BACKEND_PID)，正在停止..."
            kill $BACKEND_PID
            sleep 2
            log_success "后端服务已停止 ✓"
        else
            log_info "未找到运行在端口 3001 的进程"
        fi
    else
        log_warning "lsof 命令不可用，无法通过端口查找进程"
    fi
fi

# 停止前端服务
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        
        # 检查是否成功停止
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_warning "进程未响应，强制停止..."
            kill -9 $FRONTEND_PID
        fi
        
        log_success "前端服务已停止 ✓"
    else
        log_warning "前端服务进程不存在 (PID: $FRONTEND_PID)"
    fi
    rm -f frontend.pid
else
    log_info "未找到 frontend.pid 文件，尝试通过端口查找..."
    
    if command -v lsof >/dev/null 2>&1; then
        FRONTEND_PID=$(lsof -ti:5173)
        if [ ! -z "$FRONTEND_PID" ]; then
            log_info "找到前端进程 (PID: $FRONTEND_PID)，正在停止..."
            kill $FRONTEND_PID
            sleep 2
            log_success "前端服务已停止 ✓"
        else
            log_info "未找到运行在端口 5173 的进程"
        fi
    else
        log_warning "lsof 命令不可用，无法通过端口查找进程"
    fi
fi

echo ""
log_success "所有服务已停止"
echo ""

