#!/bin/bash

# SSH 密钥自动认证配置脚本
# 让 macOS Keychain 记住你的 SSH 密钥密码

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "========================================="
echo "   SSH 密钥自动认证配置工具"
echo "========================================="
echo ""

print_info "这个脚本会配置 macOS Keychain 来记住你的 SSH 密钥密码"
print_info "配置后，Git 推送时不再需要每次输入密码"
echo ""

# 1. 检查 SSH 配置文件
SSH_CONFIG="$HOME/.ssh/config"

print_info "检查 SSH 配置文件..."

if [ ! -f "$SSH_CONFIG" ]; then
    print_info "创建 SSH 配置文件..."
    touch "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
fi

# 2. 添加 Keychain 配置
print_info "配置 SSH 使用 macOS Keychain..."

if ! grep -q "UseKeychain yes" "$SSH_CONFIG"; then
    cat >> "$SSH_CONFIG" << 'EOF'

# 使用 macOS Keychain 存储 SSH 密钥密码
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
EOF
    print_success "SSH 配置已更新"
else
    print_info "SSH 配置已存在，跳过"
fi

# 3. 添加密钥到 Keychain
print_info "添加 SSH 密钥到 macOS Keychain..."
echo ""
print_warning "请在下面输入你的 SSH 密钥密码（只需输入一次）："

ssh-add --apple-use-keychain ~/.ssh/id_ed25519

if [ $? -eq 0 ]; then
    echo ""
    print_success "✅ 配置完成！"
    echo ""
    echo "现在你的 SSH 密钥密码已保存在 macOS Keychain 中"
    echo "以后使用 Git 推送时将自动认证，无需再输入密码"
    echo ""
    print_info "可以使用以下命令测试："
    echo "  ssh -T git@github.com"
else
    echo ""
    print_warning "密钥添加失败，请检查："
    echo "  1. 密钥文件是否存在: ~/.ssh/id_ed25519"
    echo "  2. 密码是否正确"
    echo "  3. 密钥文件权限是否正确 (应为 600)"
fi

echo ""
print_info "提示：如果需要移除密钥，运行："
echo "  ssh-add -d ~/.ssh/id_ed25519"
