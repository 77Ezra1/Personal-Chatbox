#!/bin/bash
# 快速启用Notion服务（假设Token已配置）

echo "🔧 启用Notion服务..."

# 修改config.cjs
sed -i.bak '/notion: {/,/},/ {
    s/enabled: false/enabled: true/
    s/autoLoad: false/autoLoad: true/
}' server/config.cjs

echo "✅ Notion已启用"

# 重启服务
echo "🔄 重启服务器..."
pkill -f "node.*server/index.cjs"
sleep 2
nohup node server/index.cjs > server-restart.log 2>&1 &

echo "⏳ 等待5秒..."
sleep 5

echo "📊 服务状态："
tail -50 server-restart.log | grep -i "notion\|MCP服务启动完成"
