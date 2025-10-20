#!/bin/bash

# 迁移遗漏的数据：note_tags 和 agent_subtasks

set -e

SQLITE_DB="data/app.db"

echo "🔍 发现遗漏的数据需要迁移..."
echo ""

# 检查当前数据
NOTE_TAGS_JSON=$(cat data/database.json | jq '.note_tags | length')
AGENT_SUBTASKS_JSON=$(cat data/database.json | jq '.agent_subtasks | length')

echo "📊 JSON 数据统计:"
echo "   - note_tags: $NOTE_TAGS_JSON"
echo "   - agent_subtasks: $AGENT_SUBTASKS_JSON"
echo ""

# 1. 创建 agent_subtasks 表
echo "🏗️  创建 agent_subtasks 表..."
sqlite3 "$SQLITE_DB" <<'EOF'
CREATE TABLE IF NOT EXISTS agent_subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  input_data TEXT,
  config TEXT,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  dependencies TEXT,
  result TEXT,
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_subtasks_task_id ON agent_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_subtasks_status ON agent_subtasks(status);
EOF

echo "   ✓ agent_subtasks 表已创建"
echo ""

# 2. 迁移数据
echo "📥 迁移数据..."

python3 - <<'PYTHON'
import json
import sqlite3

# 读取 JSON 数据
with open('data/database.json', 'r') as f:
    data = json.load(f)

# 连接到 SQLite
conn = sqlite3.connect('data/app.db')
cursor = conn.cursor()

# 迁移 note_tags
note_tags = data.get('note_tags', [])
print(f"   迁移 note_tags ({len(note_tags)} 条)...")

for tag in note_tags:
    note_id = tag.get('note_id')
    tag_name = tag.get('tag', '')
    created_at = tag.get('created_at', '')
    
    try:
        # note_tags 表没有 id 和 created_at 字段，只有 note_id 和 tag
        cursor.execute('''
            INSERT OR IGNORE INTO note_tags (note_id, tag)
            VALUES (?, ?)
        ''', (note_id, tag_name))
        print(f"      ✓ 迁移标签: {tag_name} (笔记 #{note_id})")
    except Exception as e:
        print(f"      ✗ 失败: {e}")

# 迁移 agent_subtasks
agent_subtasks = data.get('agent_subtasks', [])
print(f"\n   迁移 agent_subtasks ({len(agent_subtasks)} 条)...")

for subtask in agent_subtasks:
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO agent_subtasks 
            (id, task_id, title, description, type, input_data, config, 
             status, priority, dependencies, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            subtask.get('id'),
            subtask.get('task_id'),
            subtask.get('title'),
            subtask.get('description'),
            subtask.get('type'),
            subtask.get('input_data'),
            subtask.get('config'),
            subtask.get('status', 'pending'),
            subtask.get('priority', 0),
            subtask.get('dependencies'),
            subtask.get('created_at')
        ))
        print(f"      ✓ 迁移子任务: {subtask.get('title')}")
    except Exception as e:
        print(f"      ✗ 失败: {e}")

conn.commit()

# 验证
cursor.execute('SELECT COUNT(*) FROM note_tags')
tags_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM agent_subtasks')
subtasks_count = cursor.fetchone()[0]

print(f"\n✅ 迁移完成！")
print(f"   - note_tags: {tags_count}")
print(f"   - agent_subtasks: {subtasks_count}")

conn.close()
PYTHON

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 完整数据统计（包含新迁移的数据）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sqlite3 "$SQLITE_DB" <<'EOF'
.mode column
.headers on
SELECT 
    '用户' as 数据类型, (SELECT COUNT(*) FROM users) as 数量
UNION ALL SELECT '笔记', (SELECT COUNT(*) FROM notes)
UNION ALL SELECT '分类', (SELECT COUNT(*) FROM note_categories)
UNION ALL SELECT '标签', (SELECT COUNT(*) FROM note_tags)
UNION ALL SELECT 'Sessions', (SELECT COUNT(*) FROM sessions)
UNION ALL SELECT '登录历史', (SELECT COUNT(*) FROM login_history)
UNION ALL SELECT '邀请码', (SELECT COUNT(*) FROM invite_codes)
UNION ALL SELECT 'AI代理', (SELECT COUNT(*) FROM agents)
UNION ALL SELECT 'AI子任务', (SELECT COUNT(*) FROM agent_subtasks)
UNION ALL SELECT '用户配置', (SELECT COUNT(*) FROM user_configs)
UNION ALL SELECT 'MCP配置', (SELECT COUNT(*) FROM user_mcp_configs);
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ 所有数据迁移完成！"
echo ""
