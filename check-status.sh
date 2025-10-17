#!/bin/bash

echo "=== Personal Chatbox 服务状态 ==="
echo ""
echo "后端服务:"
if ps aux | grep -q "[n]ode server/index.cjs"; then
    PID=$(cat .backend.pid 2>/dev/null || echo 'unknown')
    echo "✅ 运行中 (PID: $PID)"
    echo "   URL: http://localhost:3001"
    HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '"status":"[^"]*"' || echo 'N/A')
    echo "   Health: $HEALTH"
else
    echo "❌ 未运行"
fi

echo ""
echo "前端服务:"
if ps aux | grep -q "[v]ite"; then
    PID=$(cat .frontend.pid 2>/dev/null || echo 'unknown')
    echo "✅ 运行中 (PID: $PID)"
    echo "   URL: http://localhost:5173"
else
    echo "❌ 未运行"
fi

echo ""
echo "PostgreSQL:"
if psql postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 连接正常"
    TABLES=$(psql postgresql://chatbox_user:chatbox2025@localhost:5432/personal_chatbox -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | xargs)
    echo "   表数量: $TABLES"
else
    echo "❌ 连接失败"
fi

echo ""
echo "=== 测试账号 ==="
echo "邮箱: finally_works@test.com"
echo "密码: Test123456!"

echo ""
echo "=== DeepSeek API ==="
echo "Model: deepseek-chat"
echo "API Key: sk-03db8009812649359e2f83cc738861aa"

echo ""
echo "=== 访问地址 ==="
echo "🌐 前端: http://localhost:5173"
echo "🔧 后端: http://localhost:3001"
echo "📊 健康检查: http://localhost:3001/health"

echo ""
echo "=== 文档 ==="
echo "📖 启动总结: STARTUP_SUMMARY.md"
echo "📖 测试报告: TEST_REPORT.md"
echo "📖 API配置指南: API_CONFIGURATION_GUIDE.md"

echo ""
echo "✨ 项目已就绪,可以开始使用!"
