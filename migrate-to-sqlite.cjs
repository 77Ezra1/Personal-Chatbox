#!/usr/bin/env node

/**
 * 将 JSON 数据库迁移到 SQLite
 * 这个脚本会：
 * 1. 读取 database.json 中的所有数据
 * 2. 在 app.db 中创建所需的表结构
 * 3. 将所有数据迁移到 SQLite
 * 4. 验证迁移结果
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const JSON_DB_PATH = path.join(__dirname, 'data', 'database.json');
const SQLITE_DB_PATH = path.join(__dirname, 'data', 'app.db');
const BACKUP_PATH = SQLITE_DB_PATH + '.backup-' + Date.now();

console.log('='.repeat(60));
console.log('数据库迁移工具: JSON -> SQLite');
console.log('='.repeat(60));

// 1. 备份现有的 SQLite 数据库（如果存在）
if (fs.existsSync(SQLITE_DB_PATH)) {
  console.log('\n📦 备份现有 SQLite 数据库...');
  fs.copyFileSync(SQLITE_DB_PATH, BACKUP_PATH);
  console.log(`   备份到: ${BACKUP_PATH}`);
  // 删除旧数据库
  fs.unlinkSync(SQLITE_DB_PATH);
  console.log('   ✓ 已删除旧数据库');
}

// 2. 读取 JSON 数据
console.log('\n📖 读取 JSON 数据库...');
const jsonData = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
console.log(`   - 用户数: ${jsonData.users?.length || 0}`);
console.log(`   - 笔记数: ${jsonData.notes?.length || 0}`);
console.log(`   - 分类数: ${jsonData.note_categories?.length || 0}`);
console.log(`   - 会话数: ${jsonData.conversations?.length || 0}`);
console.log(`   - 消息数: ${jsonData.messages?.length || 0}`);

// 3. 创建新的 SQLite 数据库
console.log('\n🔨 创建 SQLite 数据库...');
const db = new Database(SQLITE_DB_PATH);

// 设置 PRAGMA
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// 4. 创建表结构
console.log('\n📋 创建表结构...');

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    timezone TEXT DEFAULT 'Asia/Shanghai',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);
console.log('   ✓ users');

// 笔记表
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT,
    is_favorite INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ notes');

// 笔记分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS note_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ note_categories');

// 笔记标签表
db.exec(`
  CREATE TABLE IF NOT EXISTS note_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ note_tags');

// 会话表
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ conversations');

// 消息表
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ messages');

// 会话索引
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    data TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
console.log('   ✓ sessions');

// 5. 迁移数据
console.log('\n📥 迁移数据...');

// 迁移用户
if (jsonData.users && jsonData.users.length > 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, email, avatar, role, timezone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(
        user.id,
        user.username,
        user.password,
        user.email || null,
        user.avatar || null,
        user.role || 'user',
        user.timezone || 'Asia/Shanghai',
        user.created_at || new Date().toISOString(),
        user.updated_at || user.created_at || new Date().toISOString()
      );
    }
  });

  insertMany(jsonData.users);
  console.log(`   ✓ 迁移了 ${jsonData.users.length} 个用户`);
}

// 迁移笔记分类
if (jsonData.note_categories && jsonData.note_categories.length > 0) {
  const insertCategory = db.prepare(`
    INSERT INTO note_categories (id, user_id, name, color, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((categories) => {
    for (const cat of categories) {
      insertCategory.run(
        cat.id,
        cat.user_id,
        cat.name,
        cat.color || '#6366f1',
        cat.created_at || new Date().toISOString()
      );
    }
  });

  insertMany(jsonData.note_categories);
  console.log(`   ✓ 迁移了 ${jsonData.note_categories.length} 个分类`);
}

// 迁移笔记
if (jsonData.notes && jsonData.notes.length > 0) {
  const insertNote = db.prepare(`
    INSERT INTO notes (id, user_id, title, content, category, tags, is_favorite, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT INTO note_tags (note_id, tag) VALUES (?, ?)
  `);

  const insertMany = db.transaction((notes) => {
    for (const note of notes) {
      // 插入笔记
      insertNote.run(
        note.id,
        note.user_id,
        note.title || 'Untitled',
        note.content || '',
        note.category || 'default',
        note.tags || '[]',
        note.is_favorite ? 1 : 0,
        note.is_archived ? 1 : 0,
        note.created_at || new Date().toISOString(),
        note.updated_at || note.created_at || new Date().toISOString()
      );

      // 解析并插入标签
      let tags = [];
      if (note.tags) {
        try {
          tags = typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags;
        } catch (e) {
          tags = [];
        }
      }

      for (const tag of tags) {
        if (tag && typeof tag === 'string') {
          insertTag.run(note.id, tag);
        }
      }
    }
  });

  insertMany(jsonData.notes);
  console.log(`   ✓ 迁移了 ${jsonData.notes.length} 条笔记`);
}

// 迁移会话
if (jsonData.conversations && jsonData.conversations.length > 0) {
  const insertConv = db.prepare(`
    INSERT INTO conversations (id, user_id, title, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((conversations) => {
    for (const conv of conversations) {
      insertConv.run(
        conv.id,
        conv.user_id,
        conv.title || 'New Conversation',
        conv.model || null,
        conv.created_at || new Date().toISOString(),
        conv.updated_at || conv.created_at || new Date().toISOString()
      );
    }
  });

  insertMany(jsonData.conversations);
  console.log(`   ✓ 迁移了 ${jsonData.conversations.length} 个会话`);
}

// 迁移消息
if (jsonData.messages && jsonData.messages.length > 0) {
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((messages) => {
    for (const msg of messages) {
      insertMsg.run(
        msg.id,
        msg.conversation_id,
        msg.role,
        msg.content,
        msg.created_at || new Date().toISOString()
      );
    }
  });

  insertMany(jsonData.messages);
  console.log(`   ✓ 迁移了 ${jsonData.messages.length} 条消息`);
}

// 迁移会话
if (jsonData.sessions && jsonData.sessions.length > 0) {
  const insertSession = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, data)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((sessions) => {
    for (const session of sessions) {
      insertSession.run(
        session.id,
        session.user_id,
        session.expires_at,
        session.data || null
      );
    }
  });

  insertMany(jsonData.sessions);
  console.log(`   ✓ 迁移了 ${jsonData.sessions.length} 个会话`);
}

// 6. 验证迁移结果
console.log('\n✅ 验证迁移结果...');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM note_categories').get().count;
const convCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;

console.log(`   - 用户: ${userCount} (预期: ${jsonData.users?.length || 0})`);
console.log(`   - 笔记: ${noteCount} (预期: ${jsonData.notes?.length || 0})`);
console.log(`   - 分类: ${categoryCount} (预期: ${jsonData.note_categories?.length || 0})`);
console.log(`   - 会话: ${convCount} (预期: ${jsonData.conversations?.length || 0})`);
console.log(`   - 消息: ${msgCount} (预期: ${jsonData.messages?.length || 0})`);

// 验证一条笔记数据
if (noteCount > 0) {
  const sampleNote = db.prepare('SELECT * FROM notes LIMIT 1').get();
  console.log('\n📝 示例笔记数据:');
  console.log(`   ID: ${sampleNote.id}`);
  console.log(`   标题: ${sampleNote.title}`);
  console.log(`   分类: ${sampleNote.category}`);
  console.log(`   标签: ${sampleNote.tags}`);
  console.log(`   创建时间: ${sampleNote.created_at}`);
  console.log(`   更新时间: ${sampleNote.updated_at}`);
}

// 7. 关闭数据库
db.close();

console.log('\n' + '='.repeat(60));
console.log('✨ 迁移完成！');
console.log('='.repeat(60));
console.log('\n下一步:');
console.log('1. 重启后端服务: ./start.sh');
console.log('2. 刷新浏览器，验证数据是否正常显示');
console.log('3. 如果有问题，可以从备份恢复:');
console.log(`   cp ${BACKUP_PATH} ${SQLITE_DB_PATH}`);
console.log('');
