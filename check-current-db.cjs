const path = require('path');
const fs = require('fs');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('检查当前使用的数据库');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. 检查环境变量
console.log('1. 环境变量检查:');
console.log(`   POSTGRES_URL: ${process.env.POSTGRES_URL || '未设置'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL || '未设置'}\n`);

// 2. 检查数据库文件
const sqlitePath = path.join(__dirname, 'data', 'app.db');
const jsonPath = path.join(__dirname, 'data', 'database.json');

console.log('2. 数据库文件检查:');
console.log(`   SQLite (data/app.db): ${fs.existsSync(sqlitePath) ? '✅ 存在' : '❌ 不存在'}`);
if (fs.existsSync(sqlitePath)) {
  const stats = fs.statSync(sqlitePath);
  console.log(`      文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`      最后修改: ${stats.mtime.toLocaleString('zh-CN')}`);
}

console.log(`   JSON (data/database.json): ${fs.existsSync(jsonPath) ? '✅ 存在' : '❌ 不存在'}`);
if (fs.existsSync(jsonPath)) {
  const stats = fs.statSync(jsonPath);
  console.log(`      文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`      最后修改: ${stats.mtime.toLocaleString('zh-CN')}`);
}

// 3. 尝试连接 SQLite
console.log('\n3. SQLite 数据库详情:');
try {
  const Database = require('better-sqlite3');
  const db = new Database(sqlitePath);

  // 检查对话数
  const convCount = db.prepare("SELECT COUNT(*) as count FROM conversations").get();
  console.log(`   ✅ 对话数量: ${convCount.count}`);

  // 检查消息数
  const msgCount = db.prepare("SELECT COUNT(*) as count FROM messages").get();
  console.log(`   ✅ 消息数量: ${msgCount.count}`);

  // 检查最近的对话
  const recentConvs = db.prepare(`
    SELECT id, title, user_id, created_at, updated_at
    FROM conversations
    ORDER BY updated_at DESC
    LIMIT 5
  `).all();

  if (recentConvs.length > 0) {
    console.log('\n   最近的对话:');
    recentConvs.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. ${conv.title}`);
      console.log(`      ID: ${conv.id}`);
      console.log(`      用户ID: ${conv.user_id}`);
      console.log(`      更新时间: ${conv.updated_at}`);

      // 检查该对话的消息数
      const msgCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?").get(conv.id);
      console.log(`      消息数: ${msgCount.count}\n`);
    });
  }

  // 检查最近的消息
  const recentMsgs = db.prepare(`
    SELECT id, conversation_id, role,
           substr(content, 1, 50) as content_preview,
           timestamp
    FROM messages
    ORDER BY timestamp DESC
    LIMIT 5
  `).all();

  if (recentMsgs.length > 0) {
    console.log('   最近的消息:');
    recentMsgs.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. [${msg.role}] ${msg.content_preview}...`);
      console.log(`      对话ID: ${msg.conversation_id}`);
      console.log(`      时间: ${msg.timestamp}\n`);
    });
  } else {
    console.log('   ⚠️  数据库中没有消息记录！');
  }

  db.close();

} catch (error) {
  console.log(`   ❌ 无法连接: ${error.message}`);
}

// 4. 根据配置判断当前使用的数据库
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 结论:');
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  console.log('   当前配置: PostgreSQL 数据库');
} else if (fs.existsSync(sqlitePath)) {
  console.log('   当前配置: SQLite 数据库 (data/app.db)');
} else if (fs.existsSync(jsonPath)) {
  console.log('   当前配置: JSON 文件数据库 (data/database.json)');
} else {
  console.log('   ⚠️  无法确定数据库配置');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

