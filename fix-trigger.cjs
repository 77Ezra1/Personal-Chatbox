const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('查找并修复有问题的触发器...\n');

try {
  // 1. 查找所有触发器
  const triggers = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'").all();

  console.log(`找到 ${triggers.length} 个触发器\n`);

  // 2. 查找引用 summary_templates 的触发器
  const problematicTriggers = triggers.filter(t =>
    t.sql && (t.sql.includes('summary_templates') || t.sql.includes('summary_'))
  );

  if (problematicTriggers.length > 0) {
    console.log(`发现 ${problematicTriggers.length} 个有问题的触发器:\n`);

    problematicTriggers.forEach(t => {
      console.log(`触发器: ${t.name}`);
      console.log(`表: ${t.tbl_name}`);
      console.log(`SQL: ${t.sql.substring(0, 100)}...\n`);

      try {
        db.prepare(`DROP TRIGGER IF EXISTS ${t.name}`).run();
        console.log(`✅ 已删除触发器: ${t.name}\n`);
      } catch (err) {
        console.log(`❌ 删除失败: ${err.message}\n`);
      }
    });
  } else {
    console.log('✅ 没有发现引用 summary_templates 的触发器');

    // 检查是否有与删除相关的触发器
    console.log('\n检查所有删除触发器:');
    const deleteTriggers = triggers.filter(t =>
      t.sql && (t.sql.includes('DELETE') && (t.tbl_name === 'messages' || t.tbl_name === 'conversations'))
    );

    if (deleteTriggers.length > 0) {
      console.log(`\n与 messages/conversations 删除相关的触发器:`);
      deleteTriggers.forEach(t => {
        console.log(`  - ${t.name} (${t.tbl_name})`);
      });
    }
  }

  // 3. 验证修复
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试删除操作:');

  const testId = `test-trigger-${Date.now()}`;

  // 插入测试数据
  db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 1, '测试触发器', new Date().toISOString(), new Date().toISOString());

  db.prepare(`
    INSERT INTO messages (conversation_id, role, content, timestamp, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 'user', '测试消息', new Date().toISOString(), 'chat');

  console.log('✅ 测试数据已插入');

  // 删除消息
  try {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testId);
    console.log('✅ 消息删除成功');
  } catch (err) {
    console.log(`❌ 消息删除失败: ${err.message}`);
  }

  // 删除对话
  try {
    db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
    console.log('✅ 对话删除成功');
  } catch (err) {
    console.log(`❌ 对话删除失败: ${err.message}`);
  }

  console.log('\n✅ 所有操作正常！\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

