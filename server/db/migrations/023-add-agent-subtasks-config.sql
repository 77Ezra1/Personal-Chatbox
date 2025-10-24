-- 为 agent_subtasks 表添加 config 字段
-- 用于存储子任务的配置信息（工具名称、参数等）

ALTER TABLE agent_subtasks ADD COLUMN IF NOT EXISTS config TEXT;

-- 为现有的子任务添加空的 config (JSON 格式)
UPDATE agent_subtasks SET config = '{}' WHERE config IS NULL;

