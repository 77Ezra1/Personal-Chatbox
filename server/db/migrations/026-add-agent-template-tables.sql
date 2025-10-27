-- Migration: Add agent template support tables
-- Version: 026
-- Created: 2025-10-30

CREATE TABLE IF NOT EXISTS agent_templates (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'custom', -- system, custom
  category TEXT,
  tags TEXT, -- JSON array
  config_snapshot TEXT NOT NULL, -- JSON agent config
  latest_version_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  config_snapshot TEXT NOT NULL, -- JSON agent config for this version
  change_summary TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (template_id, version)
);

CREATE INDEX IF NOT EXISTS idx_agent_templates_user_id ON agent_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_templates_type ON agent_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_agent_templates_updated_at ON agent_templates(updated_at);

CREATE INDEX IF NOT EXISTS idx_agent_template_versions_template_id ON agent_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_agent_template_versions_version ON agent_template_versions(template_id, version DESC);

