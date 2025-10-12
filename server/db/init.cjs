const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/app.db');

// 确保data目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB Init] Error opening database:', err);
    process.exit(1);
  }
  console.log('[DB Init] Connected to database:', DB_PATH);
});

// 初始化数据库表
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          username TEXT,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME,
          is_locked INTEGER DEFAULT 0,
          locked_until DATETIME,
          failed_login_attempts INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating users table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ users table created/verified');
        }
      });

      // 2. OAuth账号关联表
      db.run(`
        CREATE TABLE IF NOT EXISTS oauth_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          provider TEXT NOT NULL,
          provider_user_id TEXT NOT NULL,
          provider_email TEXT,
          provider_username TEXT,
          access_token TEXT,
          refresh_token TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(provider, provider_user_id)
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating oauth_accounts table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ oauth_accounts table created/verified');
        }
      });

      // 3. 会话表
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating sessions table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ sessions table created/verified');
        }
      });

      // 4. 登录历史表
      db.run(`
        CREATE TABLE IF NOT EXISTS login_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          success INTEGER DEFAULT 1,
          failure_reason TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating login_history table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ login_history table created/verified');
        }
      });

      // 5. 对话表
      db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating conversations table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ conversations table created/verified');
        }
      });

      // 6. 消息表
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          status TEXT DEFAULT 'done',
          attachments TEXT,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `);

      // 7. 用户配置表
      db.run(`
        CREATE TABLE IF NOT EXISTS user_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          model_config TEXT,
          system_prompt TEXT,
          api_keys TEXT,
          proxy_config TEXT,
          mcp_config TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating user_configs table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ user_configs table created/verified');
        }
      });

      // 8. 邀请码表
      db.run(`
        CREATE TABLE IF NOT EXISTS invite_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          max_uses INTEGER DEFAULT 1,
          used_count INTEGER DEFAULT 0,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          is_active INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('[DB Init] Error creating invite_codes table:', err);
          reject(err);
        } else {
          console.log('[DB Init] ✓ invite_codes table created/verified');
          resolve();
        }
      });
    });
  });
}

// 导出数据库实例和初始化函数
module.exports = {
  db,
  initDatabase,
  DB_PATH
};

// 如果直接运行此脚本，则初始化数据库
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('[DB Init] ✅ Database initialized successfully!');
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init] ❌ Database initialization failed:', err);
      db.close();
      process.exit(1);
    });
}

