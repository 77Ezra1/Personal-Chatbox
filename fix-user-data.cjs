#!/usr/bin/env node

/**
 * 修复用户数据字段错误
 * 问题：迁移时字段映射错误，导致 username 和 email 数据错位
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const JSON_PATH = path.join(__dirname, 'data', 'database.json');
const BACKUP_PATH = DB_PATH + '.before-fix-' + Date.now();

console.log('='.repeat(60));
console.log('修复用户数据字段错误');
console.log('='.repeat(60));

// 1. 备份数据库
console.log('\n📦 备份数据库...');
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`   备份到: ${BACKUP_PATH}`);

// 2. 读取正确的 JSON 数据
console.log('\n📖 读取 JSON 数据...');
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// 3. 连接数据库
const db = new Database(DB_PATH);

// 4. 查看当前错误的数据
console.log('\n❌ 当前错误的数据:');
const wrongUsers = db.prepare('SELECT id, username, email, password FROM users WHERE id <= 5').all();
wrongUsers.forEach(u => {
  console.log(`   用户 ${u.id}: username="${u.username}", email="${u.email}"`);
});

// 5. 修复数据
console.log('\n🔧 修复数据...');

const updateUser = db.prepare(`
  UPDATE users 
  SET username = ?, 
      email = ?, 
      password = ?
  WHERE id = ?
`);

const fixMany = db.transaction((users) => {
  let fixed = 0;
  for (const user of users) {
    try {
      // JSON 中的字段名是 password_hash，数据库中是 password
      const password = user.password_hash || user.password;
      
      updateUser.run(
        user.username || user.email?.split('@')[0] || `user_${user.id}`,  // username
        user.email,                                                         // email
        password,                                                           // password
        user.id                                                             // WHERE id
      );
      fixed++;
    } catch (err) {
      console.error(`   ✗ 修复用户 ${user.id} 失败:`, err.message);
    }
  }
  return fixed;
});

const fixedCount = fixMany(jsonData.users);
console.log(`   ✓ 修复了 ${fixedCount} 个用户`);

// 6. 验证修复结果
console.log('\n✅ 修复后的数据:');
const fixedUsers = db.prepare('SELECT id, username, email FROM users WHERE id <= 5').all();
fixedUsers.forEach(u => {
  const original = jsonData.users.find(ju => ju.id === u.id);
  const match = original && u.email === original.email ? '✓' : '✗';
  console.log(`   ${match} 用户 ${u.id}: username="${u.username}", email="${u.email}"`);
});

// 7. 统计有笔记的用户
console.log('\n📊 用户笔记统计:');
const stats = db.prepare(`
  SELECT 
    u.id,
    u.email,
    COUNT(n.id) as note_count
  FROM users u
  LEFT JOIN notes n ON u.id = n.user_id
  WHERE u.id <= 5
  GROUP BY u.id
`).all();

stats.forEach(s => {
  if (s.note_count > 0) {
    console.log(`   用户 ${s.id} (${s.email}): ${s.note_count} 条笔记`);
  }
});

db.close();

console.log('\n' + '='.repeat(60));
console.log('✅ 修复完成！');
console.log('='.repeat(60));
console.log('\n💡 提示:');
console.log('   1. 现在可以使用正确的邮箱登录');
console.log('   2. 如果还是有问题，检查密码是否正确');
console.log('   3. 备份文件保存在:', BACKUP_PATH);
