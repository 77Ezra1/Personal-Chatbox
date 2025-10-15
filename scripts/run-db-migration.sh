#!/bin/bash

# 数据库迁移脚本
# 用途：运行数据库迁移，添加搜索功能所需的表和索引

echo "🚀 开始执行数据库迁移..."
echo ""

# 进入项目根目录
cd "$(dirname "$0")/.." || exit 1

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "   请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 运行迁移
echo "📦 执行迁移脚本..."
node server/db/run-migration.cjs

# 检查迁移结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库迁移成功完成！"
    echo ""
    echo "📝 后续步骤:"
    echo "   1. 重启后端服务: node server/index.cjs"
    echo "   2. 刷新前端页面"
    echo "   3. 尝试使用搜索功能（Cmd/Ctrl + K）"
    echo ""
else
    echo ""
    echo "❌ 数据库迁移失败"
    echo "   请检查错误日志并重试"
    exit 1
fi

