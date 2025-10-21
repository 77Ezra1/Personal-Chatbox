-- Performance Optimization Indexes
-- Based on optimization recommendations document
-- Execution date: 2025-10-16

-- ========================================
-- Messages Table Indexes
-- ========================================
-- 按会话ID查询（最常用）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
ON messages(conversation_id);

-- 按时间戳排序
CREATE INDEX IF NOT EXISTS idx_messages_timestamp
ON messages(timestamp DESC);

-- 复合索引：会话ID + 时间戳（最优化查询）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
ON messages(conversation_id, timestamp DESC);

-- Note: messages table doesn't have user_id column, removed invalid index

-- ========================================
-- Conversations Table Indexes
-- ========================================
-- 按用户ID查询会话列表
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations(user_id);

-- 按更新时间排序
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
ON conversations(updated_at DESC);

-- 复合索引：用户ID + 更新时间（最优化）
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations(created_at DESC);

-- ========================================
-- Users Table Indexes
-- ========================================
-- Email查询（登录）- 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Username查询 - 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username)
WHERE username IS NOT NULL;

-- 按创建时间查询
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- ========================================
-- Sessions Table Indexes
-- ========================================
-- Token查找 - 唯一索引（最重要）
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token);

-- 按用户ID查询会话
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

-- 清理过期会话
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);

-- 复合索引：用户ID + 过期时间
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires
ON sessions(user_id, expires_at);

-- ========================================
-- User Configs Table Indexes
-- ========================================
-- 按用户ID查询配置
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_configs_user_id
ON user_configs(user_id);

-- ========================================
-- Login History Table Indexes
-- ========================================
-- 按用户ID查询登录历史
CREATE INDEX IF NOT EXISTS idx_login_history_user_id
ON login_history(user_id);

-- 按时间戳排序 (Note: column is login_at, not timestamp)
CREATE INDEX IF NOT EXISTS idx_login_history_login_at
ON login_history(login_at DESC);

-- 复合索引：用户ID + 登录时间
CREATE INDEX IF NOT EXISTS idx_login_history_user_login_at
ON login_history(user_id, login_at DESC);

-- 按IP地址查询（安全分析）
CREATE INDEX IF NOT EXISTS idx_login_history_ip_address
ON login_history(ip_address);

-- ========================================
-- Invite Codes Table Indexes
-- ========================================
-- 邀请码查找 - 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code
ON invite_codes(code);

-- 查询活跃的邀请码 (Note: using is_active instead of used)
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active
ON invite_codes(is_active);

-- 复合索引：is_active + created_at
CREATE INDEX IF NOT EXISTS idx_invite_codes_active_created
ON invite_codes(is_active, created_at DESC);

-- ========================================
-- Note: Conditional indexes for optional tables removed
-- These indexes will be created by their respective migration files
-- ========================================

-- ========================================
-- PostgreSQL Specific Optimizations
-- ========================================
-- Update statistics after creating indexes
-- (PostgreSQL only - SQLite will ignore this)
ANALYZE messages;
ANALYZE conversations;
ANALYZE users;
ANALYZE sessions;
ANALYZE user_configs;
ANALYZE login_history;
ANALYZE invite_codes;

-- ========================================
-- Index Usage Notes
-- ========================================
-- Expected performance improvements:
-- - Conversation list queries: 500ms → 50ms (90% improvement)
-- - Message loading: 300ms → 30ms (90% improvement)
-- - User authentication: 100ms → 10ms (90% improvement)
-- - Session validation: 50ms → 5ms (90% improvement)
--
-- Trade-offs:
-- - Write operations will be 5-10% slower
-- - Database size will increase by ~10-15%
-- - These are acceptable trade-offs for read-heavy applications
