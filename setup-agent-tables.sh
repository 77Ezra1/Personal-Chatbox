#!/bin/bash

# AI Agent 数据库表结构完善脚本

SQLITE_DB="data/app.db"

echo "🔧 完善 AI Agent 数据库表结构..."
echo ""

sqlite3 "$SQLITE_DB" <<'EOF'
-- 1. 更新 agents 表，添加缺少的字段
ALTER TABLE agents ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE agents ADD COLUMN capabilities TEXT DEFAULT '[]';
ALTER TABLE agents ADD COLUMN tools TEXT DEFAULT '[]';
ALTER TABLE agents ADD COLUMN config TEXT DEFAULT '{}';
ALTER TABLE agents ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE agents ADD COLUMN execution_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN last_executed_at TEXT;

-- 2. 创建 agent_tasks 表
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  agent_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  input_data TEXT DEFAULT '{}',
  output_data TEXT,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at);

-- 3. 创建 agent_executions 表
CREATE TABLE IF NOT EXISTS agent_executions (
  id TEXT PRIMARY KEY,
  agent_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'running',
  progress REAL DEFAULT 0.0,
  current_subtask TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  error TEXT,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_task_id ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);

-- 4. 更新 agent_subtasks 表（如果需要添加字段）
-- 已经在迁移时创建，检查是否需要补充字段

-- 5. 创建 agent_tools 表（工具注册表）
CREATE TABLE IF NOT EXISTS agent_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  schema TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. 插入默认工具
INSERT OR IGNORE INTO agent_tools (id, name, display_name, description, category, schema) VALUES
('tool_web_search', 'web_search', 'Web搜索', '在互联网上搜索信息', 'data', '{"type":"object","properties":{"query":{"type":"string"},"maxResults":{"type":"number"}}}'),
('tool_ai_analysis', 'ai_analysis', 'AI分析', '使用AI进行深度分析', 'ai', '{"type":"object","properties":{"prompt":{"type":"string"},"model":{"type":"string"}}}'),
('tool_read_file', 'read_file', '读取文件', '读取文件内容', 'file', '{"type":"object","properties":{"path":{"type":"string"}}}'),
('tool_write_file', 'write_file', '写入文件', '写入内容到文件', 'file', '{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}}}'),
('tool_data_processing', 'data_processing', '数据处理', '处理和转换数据', 'data', '{"type":"object","properties":{"data":{"type":"any"},"operation":{"type":"string"}}}'),
('tool_code_execution', 'code_execution', '代码执行', '执行代码片段', 'advanced', '{"type":"object","properties":{"code":{"type":"string"},"language":{"type":"string"}}}'),
('tool_api_call', 'api_call', 'API调用', '调用外部API', 'network', '{"type":"object","properties":{"url":{"type":"string"},"method":{"type":"string"}}}');

-- 7. 创建 agent_logs 表（执行日志）
CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (execution_id) REFERENCES agent_executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_id ON agent_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(level);

EOF

echo "✅ 表结构创建/更新完成"
echo ""
echo "📊 验证表结构..."

sqlite3 "$SQLITE_DB" <<'EOF'
.mode column
.headers on

SELECT 'agents' as 表名, COUNT(*) as 记录数 FROM agents
UNION ALL SELECT 'agent_tasks', COUNT(*) FROM agent_tasks
UNION ALL SELECT 'agent_subtasks', COUNT(*) FROM agent_subtasks
UNION ALL SELECT 'agent_executions', COUNT(*) FROM agent_executions
UNION ALL SELECT 'agent_tools', COUNT(*) FROM agent_tools
UNION ALL SELECT 'agent_logs', COUNT(*) FROM agent_logs;
EOF

echo ""
echo "🔍 检查 agents 表结构..."
sqlite3 "$SQLITE_DB" "PRAGMA table_info(agents);" | head -20

echo ""
echo "✨ AI Agent 数据库表结构完善完成！"
