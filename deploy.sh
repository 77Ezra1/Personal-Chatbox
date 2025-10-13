#!/bin/bash

# ========================================
# Personal Chatbox 一键部署脚本
# ========================================
# 
# 功能:
# - 检查系统环境
# - 安装项目依赖
# - 配置环境变量
# - 初始化数据库
# - 启动前后端服务
# 
# 使用方法:
#   chmod +x deploy.sh
#   ./deploy.sh
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 打印标题
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Personal Chatbox 一键部署脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 版本比较函数
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# 检查 Node.js
check_nodejs() {
    log_info "检查 Node.js 环境..."
    
    if ! command_exists node; then
        log_error "未检测到 Node.js，请先安装 Node.js 18.0.0 或更高版本"
        log_info "下载地址: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    
    if version_ge "$NODE_VERSION" "$REQUIRED_VERSION"; then
        log_success "Node.js 版本: v$NODE_VERSION ✓"
    else
        log_error "Node.js 版本过低 (当前: v$NODE_VERSION, 需要: v$REQUIRED_VERSION+)"
        exit 1
    fi
}

# 检查包管理器
check_package_manager() {
    log_info "检查包管理器..."
    
    if command_exists pnpm; then
        PACKAGE_MANAGER="pnpm"
        PNPM_VERSION=$(pnpm -v)
        log_success "使用 pnpm v$PNPM_VERSION ✓"
    elif command_exists npm; then
        PACKAGE_MANAGER="npm"
        NPM_VERSION=$(npm -v)
        log_success "使用 npm v$NPM_VERSION ✓"
    else
        log_error "未检测到 npm 或 pnpm"
        exit 1
    fi
}

# 检查 Git
check_git() {
    log_info "检查 Git..."
    
    if ! command_exists git; then
        log_warning "未检测到 Git (可选)"
    else
        GIT_VERSION=$(git --version | awk '{print $3}')
        log_success "Git 版本: $GIT_VERSION ✓"
    fi
}

# 检查项目目录
check_project_dir() {
    log_info "检查项目目录..."
    
    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json，请确保在项目根目录运行此脚本"
        exit 1
    fi
    
    log_success "项目目录验证通过 ✓"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        log_info "执行: pnpm install"
        pnpm install
    else
        log_info "执行: npm install --legacy-peer-deps"
        npm install --legacy-peer-deps
    fi
    
    log_success "依赖安装完成 ✓"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."
    
    if [ -f ".env" ]; then
        log_warning ".env 文件已存在，跳过创建"
        read -p "是否要重新生成 .env 文件? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "保留现有 .env 文件"
            return
        fi
    fi
    
    if [ ! -f ".env.example" ]; then
        log_error "未找到 .env.example 文件"
        exit 1
    fi
    
    cp .env.example .env
    log_success ".env 文件创建成功 ✓"
    
    echo ""
    log_warning "请编辑 .env 文件，填入必要的 API 密钥:"
    log_info "  - DEEPSEEK_API_KEY (必需，用于 AI 对话)"
    log_info "  - BRAVE_SEARCH_API_KEY (可选，用于搜索服务)"
    log_info "  - GITHUB_TOKEN (可选，用于 GitHub 集成)"
    echo ""
    
    read -p "是否现在编辑 .env 文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists nano; then
            nano .env
        elif command_exists vim; then
            vim .env
        elif command_exists vi; then
            vi .env
        else
            log_warning "未找到文本编辑器，请手动编辑 .env 文件"
        fi
    else
        log_warning "请稍后手动编辑 .env 文件"
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    if [ -f "data/app.db" ]; then
        log_warning "数据库文件已存在，跳过初始化"
        return
    fi
    
    if [ ! -f "server/db/init.cjs" ]; then
        log_error "未找到数据库初始化脚本"
        exit 1
    fi
    
    node server/db/init.cjs
    log_success "数据库初始化完成 ✓"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    # 检查端口是否被占用
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口 3001 已被占用"
        read -p "是否要停止占用端口的进程? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            lsof -ti:3001 | xargs kill -9 2>/dev/null || true
            log_success "已停止占用端口的进程"
            sleep 2
        else
            log_error "请手动停止占用端口 3001 的进程后重试"
            exit 1
        fi
    fi
    
    # 启动后端
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        nohup pnpm run server > backend.log 2>&1 &
    else
        nohup npm run server > backend.log 2>&1 &
    fi
    
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    log_info "后端服务启动中... (PID: $BACKEND_PID)"
    sleep 3
    
    # 检查后端是否启动成功
    if curl -s http://localhost:3001/api/auth/verify > /dev/null 2>&1; then
        log_success "后端服务启动成功 ✓"
        log_info "后端地址: http://localhost:3001"
    else
        log_warning "后端服务可能未正常启动，请查看日志: tail -f backend.log"
    fi
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    # 检查端口是否被占用
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口 5173 已被占用"
        read -p "是否要停止占用端口的进程? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            lsof -ti:5173 | xargs kill -9 2>/dev/null || true
            log_success "已停止占用端口的进程"
            sleep 2
        else
            log_error "请手动停止占用端口 5173 的进程后重试"
            exit 1
        fi
    fi
    
    # 启动前端
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        nohup pnpm run dev > frontend.log 2>&1 &
    else
        nohup npm run dev > frontend.log 2>&1 &
    fi
    
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    log_info "前端服务启动中... (PID: $FRONTEND_PID)"
    sleep 5
    
    log_success "前端服务启动成功 ✓"
    log_info "前端地址: http://localhost:5173"
}

# 打印部署信息
print_deployment_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📝 访问地址:${NC}"
    echo -e "  前端: ${GREEN}http://localhost:5173${NC}"
    echo -e "  后端: ${GREEN}http://localhost:3001${NC}"
    echo ""
    echo -e "${BLUE}📊 查看日志:${NC}"
    echo -e "  后端: ${YELLOW}tail -f backend.log${NC}"
    echo -e "  前端: ${YELLOW}tail -f frontend.log${NC}"
    echo ""
    echo -e "${BLUE}🛑 停止服务:${NC}"
    echo -e "  ${YELLOW}./stop.sh${NC}"
    echo -e "  或手动执行: ${YELLOW}kill \$(cat backend.pid frontend.pid)${NC}"
    echo ""
    echo -e "${BLUE}🔧 管理命令:${NC}"
    echo -e "  查看邀请码: ${YELLOW}node scripts/manage-invite-codes.cjs list${NC}"
    echo -e "  添加邀请码: ${YELLOW}node scripts/manage-invite-codes.cjs add CODE 10${NC}"
    echo ""
    echo -e "${GREEN}✨ 祝您使用愉快！${NC}"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 环境检查
    check_nodejs
    check_package_manager
    check_git
    check_project_dir
    
    echo ""
    log_info "环境检查通过，开始部署..."
    echo ""
    
    # 安装依赖
    install_dependencies
    echo ""
    
    # 配置环境变量
    setup_env
    echo ""
    
    # 初始化数据库
    init_database
    echo ""
    
    # 启动服务
    start_backend
    echo ""
    
    start_frontend
    echo ""
    
    # 打印部署信息
    print_deployment_info
}

# 执行主函数
main

