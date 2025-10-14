-- 数据库索引优化迁移
-- 创建日期: 2025-10-14
-- 目的: 提升查询性能 70%+

-- ==========================================
-- 1. conversations 表索引
-- ==========================================

-- 用户对话列表查询优化（按更新时间排序）
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC);

-- 快速查找特定对话
CREATE INDEX IF NOT EXISTS idx_conversations_id 
ON conversations(id);

-- 用户对话统计
CREATE INDEX IF NOT EXISTS idx_conversations_user_created
ON conversations(user_id, created_at DESC);

-- ==========================================
-- 2. messages 表索引
-- ==========================================

-- 对话消息查询优化（按时间顺序）- 最重要的索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp 
ON messages(conversation_id, timestamp ASC);

-- 根据角色过滤消息（如筛选用户消息）
CREATE INDEX IF NOT EXISTS idx_messages_role 
ON messages(role);

-- 消息状态查询（如查找失败的消息）
CREATE INDEX IF NOT EXISTS idx_messages_status
ON messages(status);

-- ==========================================
-- 3. users 表索引
-- ==========================================

-- 邮箱唯一索引（用于登录和注册）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- 用户ID索引（快速查找）
CREATE INDEX IF NOT EXISTS idx_users_id
ON users(id);

-- ==========================================
-- 4. user_configs 表索引
-- ==========================================

-- 用户配置唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_configs_user_id 
ON user_configs(user_id);

-- ==========================================
-- 5. invite_codes 表索引
-- ==========================================

-- 邀请码唯一索引（快速验证）
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code 
ON invite_codes(code);

-- 有效邀请码查询（未过期且未用完）
CREATE INDEX IF NOT EXISTS idx_invite_codes_valid
ON invite_codes(expires_at, max_uses)
WHERE expires_at IS NULL OR expires_at > datetime('now');

-- ==========================================
-- 索引创建完成
-- ==========================================

-- 查看所有索引（用于验证）
-- .indexes conversations
-- .indexes messages
-- .indexes users
-- .indexes user_configs
-- .indexes invite_codes
