-- Migration: 添加 AI 工作流编排支持
-- Version: 008
-- Created: 2025-10-15

-- 创建工作流表
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  definition TEXT NOT NULL, -- JSON 工作流定义
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  is_public BOOLEAN DEFAULT false,
  tags TEXT, -- JSON 标签数组
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建工作流执行记录表
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'running', -- running, completed, failed, cancelled
  input_data TEXT, -- JSON 输入数据
  output_data TEXT, -- JSON 输出数据
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建节点执行记录表
CREATE TABLE IF NOT EXISTS node_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  input_data TEXT, -- JSON 输入数据
  output_data TEXT, -- JSON 输出数据
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);

-- 创建工作流模板表
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  definition TEXT NOT NULL, -- JSON 工作流定义
  category TEXT, -- 模板分类
  tags TEXT, -- JSON 标签数组
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_workflows_user_id
  ON workflows(user_id);

CREATE INDEX IF NOT EXISTS idx_workflows_status
  ON workflows(status);

CREATE INDEX IF NOT EXISTS idx_workflows_is_public
  ON workflows(is_public);

CREATE INDEX IF NOT EXISTS idx_workflows_created_at
  ON workflows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id
  ON workflow_executions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id
  ON workflow_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
  ON workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at
  ON workflow_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_node_executions_execution_id
  ON node_executions(execution_id);

CREATE INDEX IF NOT EXISTS idx_node_executions_node_id
  ON node_executions(node_id);

CREATE INDEX IF NOT EXISTS idx_node_executions_status
  ON node_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category
  ON workflow_templates(category);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_public
  ON workflow_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage_count
  ON workflow_templates(usage_count DESC);

-- 插入内置工作流模板
INSERT INTO workflow_templates (
  id, name, description, definition, category, tags, is_public, usage_count, rating
) VALUES
(
  'text-analysis-workflow',
  '文本分析工作流',
  '自动分析文本内容，提取关键信息和情感',
  '{"nodes":[{"id":"start","type":"start","position":{"x":100,"y":100},"data":{"label":"开始"}},{"id":"ai_analysis","type":"ai_analysis","position":{"x":300,"y":100},"data":{"label":"AI 分析","config":{"prompt":"请分析以下文本内容，提取关键信息和情感：","model":"gpt-4o-mini"}}},{"id":"end","type":"end","position":{"x":500,"y":100},"data":{"label":"结束"}}],"connections":[{"id":"conn1","source":"start","target":"ai_analysis"},{"id":"conn2","source":"ai_analysis","target":"end"}]}',
  'analysis',
  '["文本分析", "AI", "自动化"]',
  true,
  0,
  4.5
),
(
  'data-processing-workflow',
  '数据处理工作流',
  '自动处理数据，进行清洗、转换和分析',
  '{"nodes":[{"id":"start","type":"start","position":{"x":100,"y":100},"data":{"label":"开始"}},{"id":"data_transform","type":"data_transform","position":{"x":300,"y":100},"data":{"label":"数据转换","config":{"transformType":"json_parse"}}},{"id":"ai_analysis","type":"ai_analysis","position":{"x":500,"y":100},"data":{"label":"AI 分析","config":{"prompt":"请分析以下数据：","model":"gpt-4o-mini"}}},{"id":"end","type":"end","position":{"x":700,"y":100},"data":{"label":"结束"}}],"connections":[{"id":"conn1","source":"start","target":"data_transform"},{"id":"conn2","source":"data_transform","target":"ai_analysis"},{"id":"conn3","source":"ai_analysis","target":"end"}]}',
  'processing',
  '["数据处理", "自动化", "分析"]',
  true,
  0,
  4.3
),
(
  'conditional-workflow',
  '条件分支工作流',
  '根据条件执行不同的处理流程',
  '{"nodes":[{"id":"start","type":"start","position":{"x":100,"y":100},"data":{"label":"开始"}},{"id":"condition","type":"condition","position":{"x":300,"y":100},"data":{"label":"条件判断","config":{"condition":"data.length > 100","truePath":"long_text","falsePath":"short_text"}}},{"id":"long_text","type":"ai_analysis","position":{"x":500,"y":50},"data":{"label":"长文本处理","config":{"prompt":"处理长文本：","model":"gpt-4o-mini"}}},{"id":"short_text","type":"ai_analysis","position":{"x":500,"y":150},"data":{"label":"短文本处理","config":{"prompt":"处理短文本：","model":"gpt-4o-mini"}}},{"id":"end","type":"end","position":{"x":700,"y":100},"data":{"label":"结束"}}],"connections":[{"id":"conn1","source":"start","target":"condition"},{"id":"conn2","source":"condition","target":"long_text"},{"id":"conn3","source":"condition","target":"short_text"},{"id":"conn4","source":"long_text","target":"end"},{"id":"conn5","source":"short_text","target":"end"}]}',
  'conditional',
  '["条件分支", "逻辑控制", "自动化"]',
  true,
  0,
  4.7
);
