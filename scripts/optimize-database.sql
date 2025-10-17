-- ========================================
-- 数据库优化脚本
-- ========================================
--
-- 用途: 为现有数据库添加性能优化索引和约束
--
-- 使用方法:
--   PostgreSQL: psql -d personal_chatbox -f scripts/optimize-database.sql
--   SQLite:     sqlite3 data/chatbox.db < scripts/optimize-database.sql
--
-- ========================================

-- ========================================
-- 1. 消息表索引优化
-- ========================================

-- 按会话查询消息（最常用）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
ON messages(conversation_id);

-- 按时间排序消息
CREATE INDEX IF NOT EXISTS idx_messages_timestamp
ON messages(timestamp DESC);

-- 复合索引：会话 + 时间（最优化查询）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
ON messages(conversation_id, timestamp DESC);

-- 按消息角色过滤（如只查询用户消息）
CREATE INDEX IF NOT EXISTS idx_messages_role
ON messages(role);

-- 按消息 ID 快速查找
CREATE INDEX IF NOT EXISTS idx_messages_id
ON messages(id);

-- ========================================
-- 2. 会话表索引优化
-- ========================================

-- 按用户查询会话（核心查询）
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations(user_id);

-- 按更新时间排序会话
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
ON conversations(updated_at DESC);

-- 复合索引：用户 + 更新时间（最优化查询）
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations(created_at DESC);

-- 按标题搜索（支持部分匹配）
-- 注意: PostgreSQL 可用，SQLite 需要 FTS
CREATE INDEX IF NOT EXISTS idx_conversations_title
ON conversations(title);

-- ========================================
-- 3. 用户表索引优化
-- ========================================

-- 按邮箱查找用户（登录）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- 按用户名查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- ========================================
-- 4. 会话表索引优化
-- ========================================

-- 按用户 ID 查询会话
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

-- 按令牌快速查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token);

-- 按过期时间清理会话
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);

-- ========================================
-- 5. 用户配置表索引优化
-- ========================================

-- 按用户 ID 查询配置
CREATE INDEX IF NOT EXISTS idx_user_configs_user_id
ON user_configs(user_id);

-- ========================================
-- 6. 登录历史表索引优化
-- ========================================

-- 按用户 ID 查询登录历史
CREATE INDEX IF NOT EXISTS idx_login_history_user_id
ON login_history(user_id);

-- 按时间排序登录记录
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp
ON login_history(timestamp DESC);

-- 按登录状态过滤
CREATE INDEX IF NOT EXISTS idx_login_history_success
ON login_history(success);

-- ========================================
-- 7. 邀请码表索引优化
-- ========================================

-- 按邀请码快速查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code
ON invite_codes(code);

-- 按使用状态过滤
CREATE INDEX IF NOT EXISTS idx_invite_codes_used
ON invite_codes(used);

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at
ON invite_codes(created_at DESC);

-- ========================================
-- 8. OAuth 账户表索引优化（如果存在）
-- ========================================

-- 按用户 ID 查询 OAuth 账户
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id
ON oauth_accounts(user_id);

-- 按提供商和提供商用户 ID 查找
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_provider
ON oauth_accounts(provider, provider_user_id);

-- ========================================
-- 9. 数据库统计更新
-- ========================================

-- PostgreSQL: 更新统计信息以优化查询计划
-- ANALYZE messages;
-- ANALYZE conversations;
-- ANALYZE users;
-- ANALYZE sessions;
-- ANALYZE user_configs;
-- ANALYZE login_history;
-- ANALYZE invite_codes;
-- ANALYZE oauth_accounts;

-- SQLite: 重建统计信息
-- ANALYZE;

-- ========================================
-- 10. 验证索引创建
-- ========================================

-- PostgreSQL: 查看所有索引
-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- SQLite: 查看所有索引
-- SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' ORDER BY tbl_name, name;

-- ========================================
-- 完成
-- ========================================

-- 提示: 索引创建完成后，建议:
-- 1. 运行 ANALYZE 更新统计信息
-- 2. 使用 EXPLAIN 分析关键查询的执行计划
-- 3. 监控索引使用情况，移除未使用的索引
-- 4. 定期 VACUUM（SQLite）或 VACUUM ANALYZE（PostgreSQL）

SELECT '✓ 数据库优化完成！所有索引已创建。' AS status;
