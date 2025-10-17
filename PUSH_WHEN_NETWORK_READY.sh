#!/bin/bash

# 网络恢复后执行此脚本推送到GitHub

echo "🌐 准备推送到GitHub..."
echo ""

# 检查网络连接
echo "检查GitHub连接..."
if ping -c 1 github.com &> /dev/null; then
    echo "✅ 网络连接正常"
else
    echo "❌ 无法连接到GitHub，请检查网络"
    exit 1
fi

echo ""
echo "📦 本地提交信息:"
git log --oneline -3

echo ""
echo "🚀 开始推送..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "查看远程仓库:"
    echo "https://github.com/77Ezra1/Personal-Chatbox"
    echo ""
    echo "本次推送包含:"
    echo "  - PostgreSQL完整修复指南 (60页)"
    echo "  - 快速参考文档"
    echo "  - 一键修复脚本"
    echo "  - 工作总结报告"
else
    echo ""
    echo "❌ 推送失败"
    echo "请检查:"
    echo "  1. GitHub认证是否有效"
    echo "  2. 仓库权限是否正确"
    echo "  3. 网络连接是否稳定"
fi
