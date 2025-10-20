#!/usr/bin/env node

/**
 * 完整的数据库字段修复脚本
 * 添加所有缺失的字段
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const BACKUP_PATH = DB_PATH + '.before-complete-fix-' + Date.now();

console.log('='.repeat(70));
console.log('🔧 Personal Chatbox - 完整数据库字段修复');
console.log('='.repeat(70));

// 备份
console.log('\n📦 备份数据库...');
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`   备份到: ${BACKUP_PATH}`);

const db = new Database(DB_PATH);

// 检查字段是否存在
function columnExists(table, column) {
  const result = db.prepare(`PRAGMA table_info(${table})`).all();
  return result.some(col => col.name === column);
}

// 添加字段的函数
function addColumnIfNotExists(table, column, type, defaultValue = null) {
  if (!columnExists(table, column)) {
    const defaultClause = defaultValue !== null ? ` DEFAULT ${defaultValue}` : '';
    const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}${defaultClause}`;
    try {
      db.exec(sql);
      console.log(`   ✅ 添加字段: ${table}.${column}`);
      return true;
    } catch (err) {
      console.error(`   ❌ 添加失败: ${table}.${column} - ${err.message}`);
      return false;
    }
  } else {
    console.log(`   ⏭️  已存在: ${table}.${column}`);
    return false;
  }
}

console.log('\n🔍 检查并修复 users 表...');
console.log('━'.repeat(70));

const userFields = [
  ['currency', 'TEXT', "'USD'"],
  ['last_login_at', 'TEXT', null],
  ['login_count', 'INTEGER', '0'],
  ['last_ip', 'TEXT', null],
  ['last_user_agent', 'TEXT', null],
];

let addedCount = 0;
userFields.forEach(([column, type, defaultValue]) => {
  if (addColumnIfNotExists('users', column, type, defaultValue)) {
    addedCount++;
  }
});

console.log('\n🔍 检查并修复 conversations 表...');
console.log('━'.repeat(70));

const conversationFields = [
  ['tokens_used', 'INTEGER', '0'],
  ['cost', 'REAL', '0'],
];

conversationFields.forEach(([column, type, defaultValue]) => {
  if (addColumnIfNotExists('conversations', column, type, defaultValue)) {
    addedCount++;
  }
});

console.log('\n🔍 检查并修复 messages 表...');
console.log('━'.repeat(70));

const messageFields = [
  ['tokens', 'INTEGER', '0'],
  ['cost', 'REAL', '0'],
];

messageFields.forEach(([column, type, defaultValue]) => {
  if (addColumnIfNotExists('messages', column, type, defaultValue)) {
    addedCount++;
  }
});

console.log('\n🔍 检查并修复 notes 表...');
console.log('━'.repeat(70));

const noteFields = [
  ['ai_generated', 'INTEGER', '0'],
  ['ai_model', 'TEXT', null],
  ['word_count', 'INTEGER', '0'],
];

noteFields.forEach(([column, type, defaultValue]) => {
  if (addColumnIfNotExists('notes', column, type, defaultValue)) {
    addedCount++;
  }
});

// 验证修复结果
console.log('\n📊 验证修复结果...');
console.log('━'.repeat(70));

const tables = ['users', 'conversations', 'messages', 'notes'];
tables.forEach(table => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  console.log(`\n${table} 表 (${columns.length} 个字段):`);
  columns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
});

db.close();

console.log('\n' + '='.repeat(70));
console.log(`✅ 修复完成！共添加 ${addedCount} 个字段`);
console.log('='.repeat(70));
console.log('\n💡 建议:');
console.log('   1. 重启后端服务以应用更改');
console.log('   2. 清除浏览器缓存并刷新页面');
console.log('   3. 备份文件: ' + BACKUP_PATH);
console.log('');
