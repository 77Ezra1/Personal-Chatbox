#!/bin/bash

# 清理重复数据并生成最终报告

echo "🧹 清理重复数据..."

sqlite3 data/app.db <<'EOF'
-- 清理登录历史重复数据
DELETE FROM login_history
WHERE id NOT IN (
    SELECT MIN(id)
    FROM login_history
    GROUP BY user_id, ip_address, login_at, success
);

-- 清理 AI 代理重复数据  
DELETE FROM agents
WHERE id NOT IN (
    SELECT MIN(id)
    FROM agents
    GROUP BY user_id, name, model_id
);
EOF

echo "✅ 重复数据已清理"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 最终数据迁移报告"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sqlite3 data/app.db <<'EOF'
.mode column
.headers on
SELECT 
    '用户' as 数据类型,
    (SELECT COUNT(*) FROM users) as 数量
UNION ALL SELECT '笔记', (SELECT COUNT(*) FROM notes)
UNION ALL SELECT '分类', (SELECT COUNT(*) FROM note_categories)
UNION ALL SELECT 'Sessions', (SELECT COUNT(*) FROM sessions)
UNION ALL SELECT '登录历史', (SELECT COUNT(*) FROM login_history)
UNION ALL SELECT '邀请码', (SELECT COUNT(*) FROM invite_codes)
UNION ALL SELECT 'AI代理', (SELECT COUNT(*) FROM agents)
UNION ALL SELECT '用户配置', (SELECT COUNT(*) FROM user_configs)
UNION ALL SELECT 'MCP配置', (SELECT COUNT(*) FROM user_mcp_configs);
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ 数据迁移完成！数据库状态："
echo ""
sqlite3 data/app.db <<'EOF'
SELECT '   数据库路径: ' || 'data/app.db';
SELECT '   数据库大小: ' || (page_count * page_size / 1024.0) || ' KB' 
FROM pragma_page_count(), pragma_page_size();
SELECT '   WAL 模式: ' || (SELECT journal_mode FROM pragma_journal_mode());
EOF

echo ""
echo "🚀 现在可以重启服务并测试了："
echo "   ./start.sh"
echo ""
