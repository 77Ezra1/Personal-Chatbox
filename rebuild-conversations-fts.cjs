const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('重建 conversations_fts 表...\n');

try {
  // 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();

  // 1. 保存现有对话数据
  console.log('1. 保存现有对话数据...');
  const conversations = db.prepare('SELECT id, title FROM conversations').all();
  console.log(`   找到 ${conversations.length} 个对话\n`);

  // 2. 删除所有触发器
  console.log('2. 删除所有 conversations 相关触发器...');
  ['conversations_fts_insert', 'conversations_fts_update', 'conversations_fts_delete'].forEach(name => {
    db.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();
    console.log(`   ✅ ${name}`);
  });

  // 3. 删除旧的 FTS 表
  console.log('\n3. 删除旧的 FTS 表...');
  db.prepare('DROP TABLE IF EXISTS conversations_fts').run();
  console.log('   ✅ conversations_fts\n');

  // 4. 重新创建 FTS 表（简化版本）
  console.log('4. 创建新的 FTS 表...');
  db.prepare(`
    CREATE VIRTUAL TABLE conversations_fts USING fts5(
      id UNINDEXED,
      title,
      content
    )
  `).run();
  console.log('   ✅ conversations_fts\n');

  // 5. 重新填充 FTS 数据
  console.log('5. 填充 FTS 数据...');
  const insertFts = db.prepare('INSERT INTO conversations_fts(id, title, content) VALUES (?, ?, ?)');
  conversations.forEach(conv => {
    if (conv.id) {  // 跳过 NULL ID
      insertFts.run(conv.id, conv.title || '', '');
    }
  });
  console.log(`   ✅ 已填充 ${conversations.filter(c => c.id).length} 条记录\n`);

  // 6. 重建触发器
  console.log('6. 重建触发器...');

  db.prepare(`
    CREATE TRIGGER conversations_fts_insert AFTER INSERT ON conversations
    BEGIN
      INSERT INTO conversations_fts(id, title, content)
      VALUES (NEW.id, NEW.title, '');
    END
  `).run();
  console.log('   ✅ conversations_fts_insert');

  db.prepare(`
    CREATE TRIGGER conversations_fts_update AFTER UPDATE ON conversations
    BEGIN
      UPDATE conversations_fts
      SET title = NEW.title
      WHERE id = NEW.id;
    END
  `).run();
  console.log('   ✅ conversations_fts_update');

  db.prepare(`
    CREATE TRIGGER conversations_fts_delete AFTER DELETE ON conversations
    BEGIN
      DELETE FROM conversations_fts WHERE id = OLD.id;
    END
  `).run();
  console.log('   ✅ conversations_fts_delete\n');

  // 7. 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();

  // 8. 测试
  console.log('7. 测试所有操作...');
  const testId = `test-rebuild-${Date.now()}`;

  db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 1, '测试', new Date().toISOString(), new Date().toISOString());
  console.log('   ✅ INSERT');

  db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
  console.log('   ✅ DELETE\n');

  console.log('✅✅✅ FTS 表重建完成！✅✅✅\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

