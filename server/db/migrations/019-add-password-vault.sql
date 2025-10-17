-- Password Vault Migration
-- 创建密码保险库表，用于安全存储用户密码

CREATE TABLE IF NOT EXISTS password_vault (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  username TEXT,
  encrypted_password TEXT NOT NULL,
  url TEXT,
  category TEXT DEFAULT 'general',
  notes TEXT,
  tags TEXT,
  favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_password_vault_user_id ON password_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_category ON password_vault(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_favorite ON password_vault(favorite);
CREATE INDEX IF NOT EXISTS idx_password_vault_created_at ON password_vault(created_at);

-- 创建主密码表（用户的主密码，用于加密/解密密码保险库）
CREATE TABLE IF NOT EXISTS master_password (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建密码历史记录表
CREATE TABLE IF NOT EXISTS password_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vault_id INTEGER NOT NULL,
  encrypted_password TEXT NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vault_id) REFERENCES password_vault(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_history_vault_id ON password_history(vault_id);
