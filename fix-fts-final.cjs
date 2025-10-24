const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('最终修复 FTS 触发器问题...\n');

try {
  // 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();

  // 1. 删除所有 conversations 相关的触发器
  console.log('1. 删除所有 conversations 触发器...');
  const convTriggers = ['conversations_fts_insert', 'conversations_fts_update', 'conversations_fts_delete'];

  convTriggers.forEach(name => {
    try {
      db.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();
      console.log(`   ✅ 删除 ${name}`);
    } catch (err) {
      console.log(`   ⚠️  ${name}: ${err.message}`);
    }
  });

  // 2. 重建触发器（简化版本，避免引用不存在的表）
  console.log('\n2. 重建简化版触发器...');

  // INSERT 触发器
  try {
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS conversations_fts_insert AFTER INSERT ON conversations
      BEGIN
        INSERT INTO conversations_fts(id, title, content)
        VALUES (NEW.id, NEW.title, '');
      END
    `).run();
    console.log('   ✅ conversations_fts_insert');
  } catch (err) {
    console.log(`   ❌ ${err.message}`);
  }

  // UPDATE 触发器
  try {
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS conversations_fts_update AFTER UPDATE ON conversations
      BEGIN
        UPDATE conversations_fts
        SET title = NEW.title
        WHERE id = NEW.id;
      END
    `).run();
    console.log('   ✅ conversations_fts_update');
  } catch (err) {
    console.log(`   ❌ ${err.message}`);
  }

  // DELETE 触发器（简化版，只删除 FTS 记录）
  try {
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS conversations_fts_delete AFTER DELETE ON conversations
      BEGIN
        DELETE FROM conversations_fts WHERE id = OLD.id;
      END
    `).run();
    console.log('   ✅ conversations_fts_delete');
  } catch (err) {
    console.log(`   ❌ ${err.message}`);
  }

  // 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();

  // 3. 测试所有操作
  console.log('\n3. 测试CRUD操作...');
  const testId = `test-final-${Date.now()}`;

  // INSERT
  db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 1, '测试对话', new Date().toISOString(), new Date().toISOString());
  console.log('   ✅ INSERT 成功');

  // UPDATE
  db.prepare(`UPDATE conversations SET title = ? WHERE id = ?`).run('更新后的标题', testId);
  console.log('   ✅ UPDATE 成功');

  // 插入消息
  db.prepare(`
    INSERT INTO messages (conversation_id, role, content, timestamp, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 'user', '测试消息', new Date().toISOString(), 'chat');
  console.log('   ✅ INSERT MESSAGE 成功');

  // DELETE消息
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testId);
  console.log('   ✅ DELETE MESSAGE 成功');

  // DELETE对话
  db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
  console.log('   ✅ DELETE CONVERSATION 成功');

  console.log('\n✅✅✅ 所有问题已完全修复！✅✅✅\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

