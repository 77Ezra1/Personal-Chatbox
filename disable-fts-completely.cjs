const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('完全禁用 FTS 功能（临时解决方案）...\n');

try {
  // 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();

  // 1. 删除所有触发器
  console.log('1. 删除所有 conversations 触发器...');
  ['conversations_fts_insert', 'conversations_fts_update', 'conversations_fts_delete',
   'messages_fts_sync', 'messages_fts_update', 'messages_fts_delete'].forEach(name => {
    try {
      db.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();
      console.log(`   ✅ ${name}`);
    } catch (err) {
      console.log(`   ⚠️  ${name}: ${err.message}`);
    }
  });

  console.log('\n2. 保留 FTS 表但不触发自动更新\n');

  // 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();

  // 3. 测试基本操作
  console.log('3. 测试基本CRUD操作...');
  const testId = `test-no-fts-${Date.now()}`;

  // INSERT 对话
  db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 1, '无FTS测试', new Date().toISOString(), new Date().toISOString());
  console.log('   ✅ INSERT 对话');

  // INSERT 消息
  db.prepare(`
    INSERT INTO messages (conversation_id, role, content, timestamp, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 'user', '测试消息', new Date().toISOString(), 'chat');
  console.log('   ✅ INSERT 消息');

  // DELETE 消息
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testId);
  console.log('   ✅ DELETE 消息');

  // DELETE 对话
  db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
  console.log('   ✅ DELETE 对话\n');

  console.log('✅✅✅ 禁用 FTS 后所有操作正常！✅✅✅\n');
  console.log('说明: FTS 全文搜索功能已暂时禁用，但不影响基本的对话保存功能。\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

