-- Migration: 强化 Agent 执行/队列与配置支持
-- Version: 025
-- Created: 2025-10-30

-- 执行与任务表新增运行时字段（排队时间、重试统计、错误分类）
ALTER TABLE agent_tasks ADD COLUMN queued_at TIMESTAMP;
ALTER TABLE agent_tasks ADD COLUMN attempts INTEGER DEFAULT 0;
ALTER TABLE agent_tasks ADD COLUMN last_error_type TEXT;
ALTER TABLE agent_tasks ADD COLUMN last_error_message TEXT;

ALTER TABLE agent_executions ADD COLUMN queued_at TIMESTAMP;
ALTER TABLE agent_executions ADD COLUMN attempts INTEGER DEFAULT 0;
ALTER TABLE agent_executions ADD COLUMN last_error_type TEXT;
ALTER TABLE agent_executions ADD COLUMN last_error_message TEXT;
ALTER TABLE agent_executions ADD COLUMN retry_delay_ms INTEGER DEFAULT 0;

-- 用户配置表新增 agent_settings 字段，存储运行时可调参数
ALTER TABLE user_configs ADD COLUMN agent_settings TEXT;
