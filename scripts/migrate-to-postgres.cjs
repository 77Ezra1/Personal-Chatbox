#!/usr/bin/env node
/**
 * 数据库迁移脚本：从JSON/SQLite迁移到PostgreSQL
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

// 数据库配置
const PG_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://chatbox_user:chatbox_pass@localhost:5432/personal_chatbox',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建PostgreSQL表结构
const CREATE_TABLES_SQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- OAuth账号表
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  username VARCHAR(100),
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 登录历史表
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 对话表
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) DEFAULT 'New Conversation',
  model VARCHAR(100),
  provider VARCHAR(50),
  system_prompt TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户配置表
CREATE TABLE IF NOT EXISTS user_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'zh',
  model_config JSONB DEFAULT '{}'::JSONB,
  shortcuts JSONB DEFAULT '{}'::JSONB,
  ui_preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT -1,
  used_count INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
`;

// 迁移数据
async function migrateData(client) {
  log('\n📦 开始迁移数据...', 'cyan');

  // 读取现有数据
  const dataPath = path.join(__dirname, '../data/database.json');
  let data = {};

  try {
    const content = await fs.readFile(dataPath, 'utf8');
    data = JSON.parse(content);
    log(`✅ 成功读取JSON数据文件`, 'green');
  } catch (error) {
    log(`⚠️  未找到JSON数据文件，将创建空数据库`, 'yellow');
    return;
  }

  // 迁移用户
  if (data.users && data.users.length > 0) {
    log(`\n迁移 ${data.users.length} 个用户...`);
    for (const user of data.users) {
      try {
        await client.query(`
          INSERT INTO users (id, email, password, username, avatar_url, role, is_active, created_at, updated_at, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (email) DO UPDATE SET
            password = EXCLUDED.password,
            updated_at = CURRENT_TIMESTAMP
        `, [
          user.id || null,
          user.email,
          user.password,
          user.username || null,
          user.avatar_url || null,
          user.role || 'user',
          user.is_active !== false,
          user.created_at || new Date().toISOString(),
          user.updated_at || new Date().toISOString(),
          JSON.stringify(user.metadata || {})
        ]);
      } catch (error) {
        log(`  ❌ 迁移用户失败: ${user.email} - ${error.message}`, 'red');
      }
    }
    log(`✅ 用户迁移完成`, 'green');
  }

  // 迁移邀请码
  if (data.invite_codes && data.invite_codes.length > 0) {
    log(`\n迁移 ${data.invite_codes.length} 个邀请码...`);
    for (const code of data.invite_codes) {
      try {
        await client.query(`
          INSERT INTO invite_codes (code, max_uses, used_count, description, is_active, expires_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (code) DO UPDATE SET
            used_count = EXCLUDED.used_count,
            is_active = EXCLUDED.is_active,
            updated_at = CURRENT_TIMESTAMP
        `, [
          code.code,
          code.max_uses || -1,
          code.used_count || 0,
          code.description || null,
          code.is_active !== false,
          code.expires_at || null,
          code.created_at || new Date().toISOString(),
          code.updated_at || new Date().toISOString()
        ]);
      } catch (error) {
        log(`  ❌ 迁移邀请码失败: ${code.code} - ${error.message}`, 'red');
      }
    }
    log(`✅ 邀请码迁移完成`, 'green');
  }

  // 迁移对话
  if (data.conversations && data.conversations.length > 0) {
    log(`\n迁移 ${data.conversations.length} 个对话...`);
    for (const conv of data.conversations) {
      try {
        await client.query(`
          INSERT INTO conversations (id, user_id, title, model, provider, system_prompt, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          conv.id,
          conv.user_id || 1,
          conv.title || 'New Conversation',
          conv.model || null,
          conv.provider || null,
          conv.system_prompt || null,
          JSON.stringify(conv.metadata || {}),
          conv.created_at || new Date().toISOString(),
          conv.updated_at || new Date().toISOString()
        ]);
      } catch (error) {
        log(`  ❌ 迁移对话失败: ${conv.id} - ${error.message}`, 'red');
      }
    }
    log(`✅ 对话迁移完成`, 'green');
  }

  log('\n✅ 数据迁移完成！', 'green');
}

// 主函数
async function main() {
  log('\n╔══════════════════════════════════════════════════╗', 'bright');
  log('║     PostgreSQL 数据库迁移工具                    ║', 'bright');
  log('╚══════════════════════════════════════════════════╝\n', 'bright');

  const client = new Client(PG_CONFIG);

  try {
    // 连接数据库
    log('🔌 正在连接PostgreSQL...', 'cyan');
    await client.connect();
    log('✅ 数据库连接成功！', 'green');

    // 创建表结构
    log('\n📊 正在创建表结构...', 'cyan');
    await client.query(CREATE_TABLES_SQL);
    log('✅ 表结构创建完成！', 'green');

    // 迁移数据
    await migrateData(client);

    // 验证迁移
    log('\n🔍 验证迁移结果...', 'cyan');
    const result = await client.query('SELECT COUNT(*) FROM users');
    const userCount = result.rows[0].count;
    log(`✅ 用户数量: ${userCount}`, 'green');

    const codesResult = await client.query('SELECT COUNT(*) FROM invite_codes');
    const codesCount = codesResult.rows[0].count;
    log(`✅ 邀请码数量: ${codesCount}`, 'green');

    log('\n╔══════════════════════════════════════════════════╗', 'green');
    log('║              ✅ 迁移成功完成！                    ║', 'green');
    log('╚══════════════════════════════════════════════════╝\n', 'green');

    log('📝 下一步操作:', 'cyan');
    log('1. 在 .env 文件中设置: DATABASE_URL=你的PostgreSQL连接字符串');
    log('2. 重启服务器: ./stop-dev.sh && ./start-dev.sh');
    log('3. 测试登录功能\n');

  } catch (error) {
    log(`\n❌ 迁移失败: ${error.message}`, 'red');
    log('\n请检查:', 'yellow');
    log('1. PostgreSQL是否已启动');
    log('2. 数据库连接字符串是否正确');
    log('3. 数据库用户权限是否足够\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 执行迁移
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ 发生未知错误: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

