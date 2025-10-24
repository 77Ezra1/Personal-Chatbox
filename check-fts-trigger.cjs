const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('检查 conversations_fts_delete 触发器...\n');

try {
  const trigger = db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type='trigger' AND name='conversations_fts_delete'
  `).get();

  if (trigger) {
    console.log('触发器 SQL:');
    console.log(trigger.sql);
    console.log('\n');
  }

  // 检查所有表
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

  console.log('数据库中的所有表:');
  const tableNames = tables.map(t => t.name);
  tableNames.forEach(name => {
    if (name.includes('summary') || name.includes('fts')) {
      console.log(`  - ${name} ⭐`);
    } else {
      console.log(`  - ${name}`);
    }
  });

  const hasSummary = tableNames.some(t => t.includes('summary'));
  console.log(`\n是否存在 summary 相关表: ${hasSummary ? '✅ 是' : '❌ 否'}`);

  // 尝试重建 conversations_fts_delete 触发器
  if (!hasSummary) {
    console.log('\n修复方案: 重建 conversations_fts_delete 触发器（移除 summary_templates 引用）\n');

    // 删除旧触发器
    db.prepare('DROP TRIGGER IF EXISTS conversations_fts_delete').run();
    console.log('✅ 已删除旧触发器');

    // 创建新触发器（只更新 FTS，不涉及 summary_templates）
    db.prepare(`
      CREATE TRIGGER conversations_fts_delete AFTER DELETE ON conversations
      BEGIN
        DELETE FROM conversations_fts WHERE id = OLD.id;
      END
    `).run();
    console.log('✅ 已创建新触发器');

    // 验证
    const testId = `test-${Date.now()}`;
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testId, 1, '测试', new Date().toISOString(), new Date().toISOString());

    db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
    console.log('✅ 删除操作测试成功！\n');
  }

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

