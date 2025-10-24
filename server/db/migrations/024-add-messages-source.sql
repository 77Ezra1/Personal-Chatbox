-- 为 messages 表添加 source 字段
-- 用于标识消息来源（如不同的对话模式、工具等）

ALTER TABLE messages ADD COLUMN IF NOT EXISTS source TEXT;

-- 为现有消息设置默认值
UPDATE messages SET source = 'chat' WHERE source IS NULL;

