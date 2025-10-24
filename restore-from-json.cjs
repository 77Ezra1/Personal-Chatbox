#!/usr/bin/env node

/**
 * 从 database.json 恢复数据到 SQLite 数据库
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const JSON_BACKUP = path.join(__dirname, 'data', 'database.json');

async function restoreData() {
  console.log('📦 开始从 JSON 恢复数据...\n');

  // 读取 JSON 备份
  const backup = JSON.parse(fs.readFileSync(JSON_BACKUP, 'utf-8'));
  console.log('✅ 已读取 JSON 备份文件');
  console.log(`   - 用户: ${backup.users?.length || 0}`);
  console.log(`   - 对话: ${backup.conversations?.length || 0}`);
  console.log(`   - 消息: ${backup.messages?.length || 0}`);
  console.log(`   - 笔记: ${backup.notes?.length || 0}`);
  console.log(`   - 代理: ${backup.agents?.length || 0}`);
  console.log(`   - 提示词模板: ${backup.prompt_templates?.length || 0}\n`);

  // 连接数据库
  const db = new Database(DB_PATH);
  
  // 临时禁用触发器
  db.pragma('recursive_triggers = OFF');

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. 恢复用户
    if (backup.users && backup.users.length > 0) {
      console.log('👤 恢复用户数据...');
      const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, username, avatar_url, created_at, last_login_at, is_locked, locked_until, failed_login_attempts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const user of backup.users) {
        try {
          insertUser.run(
            user.id,
            user.email,
            user.password_hash,
            user.username,
            user.avatar_url,
            user.created_at,
            user.last_login_at,
            user.is_locked || 0,
            user.locked_until,
            user.failed_login_attempts || 0
          );
          console.log(`   ✓ ${user.email}`);
        } catch (err) {
          console.log(`   ✗ ${user.email} - ${err.message}`);
        }
      }
    }

    // 2. 恢复笔记
    if (backup.notes && backup.notes.length > 0) {
      console.log('\n📝 恢复笔记数据...');
      const insertNote = db.prepare(`
        INSERT OR REPLACE INTO notes (id, user_id, title, content, category_id, is_pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const note of backup.notes) {
        try {
          insertNote.run(
            note.id,
            note.user_id,
            note.title,
            note.content,
            note.category_id,
            note.is_pinned || 0,
            note.created_at,
            note.updated_at
          );
          console.log(`   ✓ ${note.title}`);
        } catch (err) {
          console.log(`   ✗ ${note.title} - ${err.message}`);
        }
      }
    }

    // 3. 恢复对话
    if (backup.conversations && backup.conversations.length > 0) {
      console.log('\n💬 恢复对话数据...');
      const insertConv = db.prepare(`
        INSERT OR REPLACE INTO conversations (id, user_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const conv of backup.conversations) {
        try {
          insertConv.run(
            conv.id,
            conv.user_id,
            conv.title,
            conv.created_at,
            conv.updated_at
          );
          console.log(`   ✓ ${conv.title}`);
        } catch (err) {
          console.log(`   ✗ ${conv.title} - ${err.message}`);
        }
      }
    }

    // 4. 恢复消息
    if (backup.messages && backup.messages.length > 0) {
      console.log('\n💬 恢复消息数据...');
      const insertMsg = db.prepare(`
        INSERT OR REPLACE INTO messages (id, conversation_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const msg of backup.messages) {
        try {
          insertMsg.run(
            msg.id,
            msg.conversation_id,
            msg.role,
            msg.content,
            msg.created_at
          );
        } catch (err) {
          console.log(`   ✗ 消息 ${msg.id} - ${err.message}`);
        }
      }
      console.log(`   ✓ 已恢复 ${backup.messages.length} 条消息`);
    }

    // 5. 恢复代理
    if (backup.agents && backup.agents.length > 0) {
      console.log('\n🤖 恢复 AI 代理数据...');
      const insertAgent = db.prepare(`
        INSERT OR REPLACE INTO agents (id, user_id, name, description, system_prompt, model, temperature, max_tokens, tools, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const agent of backup.agents) {
        try {
          insertAgent.run(
            agent.id,
            agent.user_id,
            agent.name,
            agent.description,
            agent.system_prompt,
            agent.model,
            agent.temperature,
            agent.max_tokens,
            agent.tools,
            agent.is_public || 0,
            agent.created_at,
            agent.updated_at
          );
          console.log(`   ✓ ${agent.name}`);
        } catch (err) {
          console.log(`   ✗ ${agent.name} - ${err.message}`);
        }
      }
    }

    // 6. 恢复笔记分类
    if (backup.note_categories && backup.note_categories.length > 0) {
      console.log('\n📁 恢复笔记分类...');
      const insertCat = db.prepare(`
        INSERT OR REPLACE INTO note_categories (id, user_id, name, color, icon, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const cat of backup.note_categories) {
        try {
          insertCat.run(
            cat.id,
            cat.user_id,
            cat.name,
            cat.color,
            cat.icon,
            cat.created_at
          );
          console.log(`   ✓ ${cat.name}`);
        } catch (err) {
          console.log(`   ✗ ${cat.name} - ${err.message}`);
        }
      }
    }

    db.exec('COMMIT');
    console.log('\n✅ 数据恢复成功！');

  } catch (err) {
    db.exec('ROLLBACK');
    console.error('\n❌ 恢复失败:', err.message);
    throw err;
  } finally {
    db.close();
  }
}

// 执行恢复
restoreData().catch(err => {
  console.error('恢复过程出错:', err);
  process.exit(1);
});
