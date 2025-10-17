-- Performance Indexes for Actual Database Schema
-- Based on current table structure
-- Date: 2025-10-16

-- ========================================
-- Messages Table Indexes
-- ========================================
-- 按会话ID和时间戳查询（已存在，跳过）
-- CREATE INDEX idx_messages_conversation ON messages(conversation_id, timestamp);

-- 按时间戳排序
CREATE INDEX IF NOT EXISTS idx_messages_timestamp
ON messages(timestamp DESC);

-- 按状态查询
CREATE INDEX IF NOT EXISTS idx_messages_status
ON messages(status)
WHERE status IS NOT NULL;

-- ========================================
-- Conversations Table Indexes
-- ========================================
-- 按更新时间排序
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
ON conversations(updated_at DESC);

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations(created_at DESC);

-- ========================================
-- Users Table Indexes
-- ========================================
-- Email查询（登录）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Username查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username)
WHERE username IS NOT NULL;

-- ========================================
-- Sessions Table Indexes
-- ========================================
-- Token查找（最重要）
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token);

-- 按过期时间查询
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);

-- ========================================
-- User Configs Table Indexes
-- ========================================
-- 按user_id查询（如果有该列）
CREATE INDEX IF NOT EXISTS idx_user_configs_lookup
ON user_configs(id);

-- ========================================
-- Login History Table Indexes
-- ========================================
-- 按created_at排序（假设使用created_at而非timestamp）
CREATE INDEX IF NOT EXISTS idx_login_history_created
ON login_history(created_at DESC)
WHERE created_at IS NOT NULL;

-- 按IP地址查询
CREATE INDEX IF NOT EXISTS idx_login_history_ip
ON login_history(ip_address)
WHERE ip_address IS NOT NULL;

-- ========================================
-- Invite Codes Table Indexes
-- ========================================
-- 邀请码查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code
ON invite_codes(code);

-- 按created_at排序
CREATE INDEX IF NOT EXISTS idx_invite_codes_created
ON invite_codes(created_at DESC)
WHERE created_at IS NOT NULL;

-- ========================================
-- Images Table Indexes (if exists)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_images_created
ON images(created_at DESC)
WHERE created_at IS NOT NULL;

-- ========================================
-- Image Analyses Table Indexes (if exists)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_image_analyses_created
ON image_analyses(created_at DESC)
WHERE created_at IS NOT NULL;

-- ========================================
-- Verify Indexes
-- ========================================
-- Run this to verify indexes were created:
-- .indices messages
-- .indices conversations
-- .indices users
-- .indices sessions
