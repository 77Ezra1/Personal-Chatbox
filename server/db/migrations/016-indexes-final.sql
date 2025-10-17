-- Final Performance Indexes - Matching Actual Schema
-- Date: 2025-10-16

-- ========================================
-- Messages Table
-- ========================================
CREATE INDEX IF NOT EXISTS idx_messages_timestamp
ON messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_status
ON messages(status);

-- ========================================
-- Conversations Table
-- ========================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- ========================================
-- Users Table
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- ========================================
-- Sessions Table
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at
ON sessions(created_at DESC);

-- ========================================
-- Login History Table
-- ========================================
CREATE INDEX IF NOT EXISTS idx_login_history_user_id
ON login_history(user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_login_at
ON login_history(login_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_ip_address
ON login_history(ip_address);

CREATE INDEX IF NOT EXISTS idx_login_history_user_login
ON login_history(user_id, login_at DESC);

-- ========================================
-- Invite Codes Table
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code
ON invite_codes(code);

-- ========================================
-- Images Table
-- ========================================
CREATE INDEX IF NOT EXISTS idx_images_created_at
ON images(created_at DESC);

-- ========================================
-- Image Analyses Table
-- ========================================
CREATE INDEX IF NOT EXISTS idx_image_analyses_created_at
ON image_analyses(created_at DESC);
