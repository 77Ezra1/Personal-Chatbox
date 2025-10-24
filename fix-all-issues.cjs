const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('修复所有数据库问题...\n');

try {
  // 1. 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();
  console.log('✅ 已禁用外键约束');

  // 2. 删除所有 NULL ID 的对话
  const nullConvs = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE id IS NULL").get();
  console.log(`\n找到 ${nullConvs.count} 个 NULL ID 的对话`);

  if (nullConvs.count > 0) {
    db.prepare("DELETE FROM conversations WHERE id IS NULL").run();
    db.prepare("DELETE FROM conversations_fts WHERE id IS NULL").run();
    console.log('✅ 已删除所有 NULL ID 的对话');
  }

  // 3. 检查并删除有问题的触发器
  console.log('\n检查触发器...');
  const triggers = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='trigger'").all();

  const problematicTriggers = triggers.filter(t =>
    t.sql && t.sql.includes('summary_templates')
  );

  if (problematicTriggers.length > 0) {
    console.log(`发现 ${problematicTriggers.length} 个有问题的触发器:`);
    problematicTriggers.forEach(t => {
      console.log(`  - ${t.name}`);
      db.prepare(`DROP TRIGGER IF EXISTS ${t.name}`).run();
      console.log(`    ✅ 已删除`);
    });
  } else {
    console.log('✅ 没有引用不存在表的触发器');
  }

  // 4. 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();
  console.log('\n✅ 已重新启用外键约束');

  // 5. 验证修复
  console.log('\n验证修复结果:');
  const remainingConvs = db.prepare("SELECT COUNT(*) as count FROM conversations").get();
  console.log(`  对话总数: ${remainingConvs.count}`);

  const nullCheck = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE id IS NULL").get();
  console.log(`  NULL ID 对话: ${nullCheck.count}`);

  if (nullCheck.count === 0 && problematicTriggers.length === 0) {
    console.log('\n✅✅✅ 所有问题已修复！✅✅✅');
  }

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

