-- ============================================
-- SQLite 初始数据库架构
-- Personal Chatbox
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT,
  is_locked INTEGER DEFAULT 0,
  locked_until TEXT,
  failed_login_attempts INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- OAuth账号关联表
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 登录历史表
CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  success INTEGER DEFAULT 1,
  failure_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);

-- 对话表
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at DESC);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  metadata TEXT,
  status TEXT DEFAULT 'done',
  attachments TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- 用户配置表
CREATE TABLE IF NOT EXISTS user_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  model_config TEXT,
  system_prompt TEXT,
  api_keys TEXT,
  proxy_config TEXT,
  mcp_config TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_configs_user_id ON user_configs(user_id);

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active ON invite_codes(is_active);

