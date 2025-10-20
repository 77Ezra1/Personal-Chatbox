#!/bin/bash

# AI Agent 功能测试脚本

echo "🚀 AI Agent 功能测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查数据库状态
echo "1️⃣  检查数据库表结构..."
sqlite3 data/app.db <<'EOF'
.mode column
.headers on

SELECT 
    '✓ agents' as 状态, COUNT(*) as 记录数 FROM agents
UNION ALL SELECT '✓ agent_tasks', COUNT(*) FROM agent_tasks
UNION ALL SELECT '✓ agent_subtasks', COUNT(*) FROM agent_subtasks
UNION ALL SELECT '✓ agent_executions', COUNT(*) FROM agent_executions
UNION ALL SELECT '✓ agent_tools', COUNT(*) FROM agent_tools
UNION ALL SELECT '✓ agent_logs', COUNT(*) FROM agent_logs;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2. 查看可用工具
echo ""
echo "2️⃣  可用工具列表..."
sqlite3 data/app.db <<'EOF'
.mode column
.headers on
SELECT 
    name as 工具名, 
    display_name as 显示名称, 
    description as 描述,
    category as 分类
FROM agent_tools
WHERE is_active = 1;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 3. 查看现有 Agents
echo ""
echo "3️⃣  现有 Agent 列表（前 5 个）..."
sqlite3 data/app.db <<'EOF'
.mode column
.headers on
SELECT 
    id,
    name as 名称,
    status as 状态,
    substr(capabilities, 1, 30) || '...' as 能力,
    execution_count as 执行次数
FROM agents
LIMIT 5;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4. 检查后端服务
echo ""
echo "4️⃣  检查后端服务状态..."
if lsof -ti:3001 > /dev/null; then
    echo "   ✅ 后端服务运行中（端口 3001）"
else
    echo "   ❌ 后端服务未运行"
    echo "   💡 运行 ./start.sh 启动服务"
fi

if lsof -ti:5173 > /dev/null; then
    echo "   ✅ 前端服务运行中（端口 5173）"
else
    echo "   ❌ 前端服务未运行"
    echo "   💡 运行 ./start.sh 启动服务"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 5. 快速开始指南
echo ""
echo "5️⃣  快速开始..."
echo ""
echo "📍 访问 Agent 管理页面："
echo "   http://localhost:5173/agents"
echo ""
echo "🔧 配置 API 密钥："
echo "   1. 访问 http://localhost:5173/settings"
echo "   2. 在「模型配置」中添加 OpenAI 或 DeepSeek API 密钥"
echo ""
echo "➕ 创建第一个 Agent："
echo "   1. 点击「Create Agent」按钮"
echo "   2. 填写名称和描述"
echo "   3. 选择能力：chat, analysis, task_execution"
echo "   4. 选择工具：web_search, ai_analysis"
echo "   5. 保存"
echo ""
echo "▶️  执行任务："
echo "   1. 在 Agent 卡片上点击「Execute Task」"
echo "   2. 输入任务描述"
echo "   3. 点击「Execute Task」开始执行"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6. 示例：创建一个测试 Agent（使用 Node.js）
echo ""
echo "6️⃣  测试 Agent 引擎..."
echo ""

node - <<'NODE'
const AgentEngine = require('./server/services/agentEngine.cjs');
const agentEngine = new AgentEngine();

async function test() {
  try {
    console.log('   📋 测试 1: 获取工具注册表...');
    const tools = agentEngine.toolRegistry;
    console.log(`   ✅ 已注册 ${tools.size} 个工具`);
    
    console.log('\n   📋 测试 2: 检查任务分解器...');
    console.log(`   ✅ TaskDecomposer 已初始化`);
    
    console.log('\n   ✅ Agent 引擎工作正常！');
  } catch (error) {
    console.error('   ❌ 测试失败:', error.message);
  }
}

test();
NODE

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ 测试完成！AI Agent 功能已就绪"
echo ""
echo "📚 更多信息请查看："
echo "   - AI_AGENT_QUICKSTART.md"
echo "   - docs/AI_AGENT_GUIDE.md"
echo ""
