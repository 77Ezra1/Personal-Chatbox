#!/bin/bash

# Git 推送辅助脚本
# 自动添加 SSH 密钥到 agent 并推送

echo "🚀 准备推送到 GitHub..."
echo ""

# 检查 SSH agent 是否运行
if ! pgrep -x "ssh-agent" > /dev/null; then
    echo "启动 SSH agent..."
    eval "$(ssh-agent -s)"
fi

# 添加 SSH 密钥（会提示输入密码）
echo "添加 SSH 密钥..."
ssh-add ~/.ssh/id_ed25519

# 推送到 GitHub
echo ""
echo "推送到 GitHub..."
git push origin main --verbose

echo ""
echo "✅ 推送完成！"
