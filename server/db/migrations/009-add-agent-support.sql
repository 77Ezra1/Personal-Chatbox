-- Migration: 添加智能 Agent 支持
-- Version: 009
-- Created: 2025-10-15

-- Agent 表
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  capabilities TEXT, -- JSON 能力列表
  tools TEXT, -- JSON 工具列表
  config TEXT, -- JSON 配置
  status TEXT DEFAULT 'inactive', -- inactive, active, busy, error
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 任务表
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  input_data TEXT, -- JSON 输入数据
  output_data TEXT, -- JSON 输出数据
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 子任务表
CREATE TABLE IF NOT EXISTS agent_subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  parent_id TEXT, -- 父任务ID
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- tool_call, ai_analysis, data_processing, web_search, file_operation
  input_data TEXT, -- JSON 输入数据
  output_data TEXT, -- JSON 输出数据
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed, skipped
  priority INTEGER DEFAULT 0,
  dependencies TEXT, -- JSON 依赖关系
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES agent_subtasks(id) ON DELETE CASCADE
);

-- 执行记录表
CREATE TABLE IF NOT EXISTS agent_executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'running', -- running, completed, failed, cancelled
  progress REAL DEFAULT 0.0, -- 0.0 to 1.0
  current_step TEXT,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 工具注册表
CREATE TABLE IF NOT EXISTS agent_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  parameters TEXT, -- JSON 参数定义
  implementation TEXT, -- 实现代码或配置
  is_built_in BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_subtasks_task_id ON agent_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_subtasks_parent_id ON agent_subtasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_agent_subtasks_status ON agent_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_task_id ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);

-- 插入内置工具
INSERT OR IGNORE INTO agent_tools (id, name, description, parameters, implementation, is_built_in) VALUES
('tool-web-search', 'web_search', '搜索网络信息', '{"query": {"type": "string", "required": true}, "maxResults": {"type": "number", "default": 5}}', '{"type": "api_call", "endpoint": "/api/search", "method": "GET"}', TRUE),
('tool-read-file', 'read_file', '读取文件内容', '{"filePath": {"type": "string", "required": true}}', '{"type": "file_operation", "operation": "read"}', TRUE),
('tool-write-file', 'write_file', '写入文件内容', '{"filePath": {"type": "string", "required": true}, "content": {"type": "string", "required": true}}', '{"type": "file_operation", "operation": "write"}', TRUE),
('tool-validate-data', 'validate_data', '验证数据格式和内容', '{"schema": {"type": "object", "required": true}}', '{"type": "data_processing", "operation": "validate"}', TRUE),
('tool-send-email', 'send_email', '发送邮件', '{"to": {"type": "string", "required": true}, "subject": {"type": "string", "required": true}, "body": {"type": "string", "required": true}}', '{"type": "api_call", "endpoint": "/api/email/send", "method": "POST"}', TRUE),
('tool-ai-analysis', 'ai_analysis', 'AI 分析处理', '{"prompt": {"type": "string", "required": true}, "model": {"type": "string", "default": "gpt-4o-mini"}}', '{"type": "ai_service", "service": "openai"}', TRUE),
('tool-data-transform', 'data_transform', '数据转换处理', '{"operation": {"type": "string", "required": true}, "config": {"type": "object"}}', '{"type": "data_processing", "operation": "transform"}', TRUE);

-- 插入内置 Agent (使用系统用户 ID = 0)
INSERT OR IGNORE INTO agents (id, user_id, name, description, avatar_url, system_prompt, capabilities, tools, config, status) VALUES
('agent-research-assistant', 0, '研究助手', '专业的学术研究助手，擅长文献调研、数据分析和报告撰写', 'https://example.com/avatar/research.png', '你是一个专业的学术研究助手。请帮助用户进行文献调研、数据分析、报告撰写等研究工作。', '["research", "analysis", "writing", "data_processing"]', '["web_search", "ai_analysis", "data_transform", "write_file"]', '{"maxConcurrentTasks": 3, "stopOnError": false, "retryAttempts": 2}', 'inactive'),
('agent-data-analyst', 0, '数据分析师', '专业的数据分析师，擅长数据处理、统计分析和可视化', 'https://example.com/avatar/analyst.png', '你是一个专业的数据分析师。请帮助用户进行数据处理、统计分析、图表制作等工作。', '["data_analysis", "statistics", "visualization", "reporting"]', '["read_file", "data_transform", "ai_analysis", "write_file"]', '{"maxConcurrentTasks": 2, "stopOnError": true, "retryAttempts": 3}', 'inactive'),
('agent-content-creator', 0, '内容创作者', '专业的内容创作者，擅长文案写作、创意策划和内容优化', 'https://example.com/avatar/creator.png', '你是一个专业的内容创作者。请帮助用户进行文案写作、创意策划、内容优化等工作。', '["writing", "creativity", "marketing", "seo"]', '["ai_analysis", "web_search", "write_file", "validate_data"]', '{"maxConcurrentTasks": 4, "stopOnError": false, "retryAttempts": 1}', 'inactive');
