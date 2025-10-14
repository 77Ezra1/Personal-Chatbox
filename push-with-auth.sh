#!/bin/bash

# Git 智能推送脚本 v1.0
# 功能：自动处理 SSH 密钥认证和推送

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在 git 仓库中
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
    print_success "Git 仓库检查通过"
}

# 检查是否有未提交的更改
check_status() {
    if [[ -n $(git status -s) ]]; then
        print_warning "检测到未提交的更改："
        git status -s
        echo ""
        read -p "是否要先提交这些更改？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            return 0
        else
            print_info "跳过提交，直接推送已有的 commits"
            return 1
        fi
    fi
    return 1
}

# 自动提交更改
auto_commit() {
    print_info "准备提交更改..."
    
    # 显示未暂存的文件
    git status -s
    echo ""
    
    read -p "输入提交信息 (回车使用默认信息): " commit_msg
    
    if [[ -z "$commit_msg" ]]; then
        commit_msg="Auto commit: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    print_info "添加所有更改到暂存区..."
    git add -A
    
    print_info "提交更改..."
    git commit -m "$commit_msg"
    
    print_success "提交完成"
}

# 方案1: 使用 ssh-agent 缓存密钥（推荐）
setup_ssh_agent() {
    print_info "检查 SSH Agent 状态..."
    
    # 检查 ssh-agent 是否运行
    if ! pgrep -x ssh-agent > /dev/null; then
        print_info "启动 SSH Agent..."
        eval "$(ssh-agent -s)"
    fi
    
    # 检查密钥是否已添加
    if ! ssh-add -l > /dev/null 2>&1; then
        print_info "添加 SSH 密钥到 agent (只需输入一次密码)..."
        ssh-add ~/.ssh/id_ed25519
        
        if [ $? -eq 0 ]; then
            print_success "SSH 密钥已添加到 agent，本次会话内不再需要输入密码"
        else
            print_warning "SSH 密钥添加失败，将使用正常推送流程"
        fi
    else
        print_success "SSH 密钥已在 agent 中"
    fi
}

# 推送到远程仓库
push_to_remote() {
    local branch=$(git branch --show-current)
    print_info "当前分支: $branch"
    
    print_info "推送到远程仓库..."
    
    if git push origin "$branch"; then
        print_success "推送成功！"
        
        # 显示推送信息
        echo ""
        print_info "推送摘要："
        git log origin/"$branch"..HEAD --oneline 2>/dev/null || echo "无新提交"
        
        return 0
    else
        print_error "推送失败"
        return 1
    fi
}

# 主函数
main() {
    echo "========================================="
    echo "   Git 智能推送脚本 v1.0"
    echo "========================================="
    echo ""
    
    # 1. 检查 Git 仓库
    check_git_repo
    
    # 2. 设置 SSH Agent（避免重复输入密码）
    setup_ssh_agent
    
    # 3. 检查并提交更改
    if check_status; then
        auto_commit
    fi
    
    # 4. 推送到远程
    push_to_remote
    
    echo ""
    print_success "✨ 所有操作完成！"
}

# 运行主函数
main
