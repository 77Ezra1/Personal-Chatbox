#!/bin/bash

echo "🎯 Notion服务自动配置脚本"
echo "================================"
echo ""

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "📝 创建.env文件..."
    touch .env
fi

# 检查是否已有NOTION_API_KEY
if grep -q "NOTION_API_KEY" .env; then
    echo "⚠️  检测到已存在的NOTION_API_KEY配置"
    echo ""
    read -p "是否要替换现有配置？(y/n): " replace
    if [ "$replace" != "y" ]; then
        echo "❌ 取消配置"
        exit 0
    fi
    # 删除旧配置
    sed -i.bak '/NOTION_API_KEY/d' .env
fi

echo ""
echo "📋 请输入你的Notion Integration Token:"
echo "   (格式: secret_xxxxxxxxxxxxx)"
echo ""
read -p "Token: " token

# 验证Token格式
if [[ ! $token == secret_* ]]; then
    echo ""
    echo "❌ Token格式错误！必须以 'secret_' 开头"
    echo "   请重新运行脚本并输入正确的Token"
    exit 1
fi

# 添加到.env
echo "NOTION_API_KEY=$token" >> .env

echo ""
echo "✅ Notion Token已配置到.env文件"
echo ""

# 修改config.cjs启用Notion
echo "🔧 正在启用Notion服务..."

# 备份config.cjs
cp server/config.cjs server/config.cjs.backup

# 使用sed启用Notion（将enabled和autoLoad改为true）
sed -i.tmp '/notion: {/,/},/ {
    s/enabled: false/enabled: true/
    s/autoLoad: false/autoLoad: true/
}' server/config.cjs

echo "✅ Notion服务已启用"
echo ""

# 重启服务器
echo "🔄 重启服务器..."
pkill -f "node.*server/index.cjs"
sleep 2
nohup node server/index.cjs > server-restart.log 2>&1 &

echo ""
echo "⏳ 等待服务启动（5秒）..."
sleep 5

echo ""
echo "📊 检查Notion服务状态..."
if tail -100 server-restart.log | grep -i "notion.*启动成功"; then
    echo ""
    echo "🎉 Notion服务配置成功！"
    echo ""
    echo "📝 你现在可以测试以下功能："
    echo "   - 在Notion中创建一个测试页面"
    echo "   - 列出我Notion中的所有页面"
    echo "   - 搜索Notion中包含'AI'的内容"
    echo ""
else
    echo ""
    echo "⚠️  Notion服务可能还在启动中..."
    echo "   请运行以下命令查看详细日志："
    echo "   tail -100 server-restart.log | grep -i notion"
fi

echo ""
echo "================================"
echo "✅ 配置完成！"
