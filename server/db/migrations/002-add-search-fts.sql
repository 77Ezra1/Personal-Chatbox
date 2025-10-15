-- Migration: 添加全文搜索支持
-- Version: 002
-- Created: 2025-10-15

-- 创建虚拟表用于全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  tokenize='porter unicode61'
);

-- 为现有对话创建 FTS 索引
INSERT INTO conversations_fts(id, title, content)
SELECT
  c.id,
  c.title,
  COALESCE(
    (SELECT GROUP_CONCAT(content, ' ')
     FROM messages
     WHERE conversation_id = c.id),
    ''
  )
FROM conversations c;

-- 创建触发器：新增对话时同步到 FTS 表
CREATE TRIGGER IF NOT EXISTS conversations_fts_insert AFTER INSERT ON conversations
BEGIN
  INSERT INTO conversations_fts(id, title, content)
  VALUES (NEW.id, NEW.title, '');
END;

-- 创建触发器：更新对话时同步到 FTS 表
CREATE TRIGGER IF NOT EXISTS conversations_fts_update AFTER UPDATE ON conversations
BEGIN
  UPDATE conversations_fts
  SET title = NEW.title
  WHERE id = NEW.id;
END;

-- 创建触发器：删除对话时清理 FTS 表
CREATE TRIGGER IF NOT EXISTS conversations_fts_delete AFTER DELETE ON conversations
BEGIN
  DELETE FROM conversations_fts WHERE id = OLD.id;
END;

-- 创建触发器：消息变化时更新 FTS 内容
CREATE TRIGGER IF NOT EXISTS messages_fts_sync AFTER INSERT ON messages
BEGIN
  UPDATE conversations_fts
  SET content = (
    SELECT GROUP_CONCAT(content, ' ')
    FROM messages
    WHERE conversation_id = NEW.conversation_id
  )
  WHERE id = NEW.conversation_id;
END;

-- 创建触发器：消息更新时同步 FTS
CREATE TRIGGER IF NOT EXISTS messages_fts_update AFTER UPDATE ON messages
BEGIN
  UPDATE conversations_fts
  SET content = (
    SELECT GROUP_CONCAT(content, ' ')
    FROM messages
    WHERE conversation_id = NEW.conversation_id
  )
  WHERE id = NEW.conversation_id;
END;

-- 创建触发器：消息删除时同步 FTS
CREATE TRIGGER IF NOT EXISTS messages_fts_delete AFTER DELETE ON messages
BEGIN
  UPDATE conversations_fts
  SET content = (
    SELECT COALESCE(GROUP_CONCAT(content, ' '), '')
    FROM messages
    WHERE conversation_id = OLD.conversation_id
  )
  WHERE id = OLD.conversation_id;
END;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
  ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_created
  ON conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, timestamp);

