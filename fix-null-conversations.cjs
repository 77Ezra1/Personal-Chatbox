const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('修复NULL对话ID...\n');

try {
  // 1. 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();
  console.log('已禁用外键约束');

  // 2. 查看对话数
  const countBefore = db.prepare("SELECT COUNT(*) as count FROM conversations").get();
  console.log(`当前对话数: ${countBefore.count}`);

  const nullCount = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE id IS NULL OR id = 'null' OR id = ''").get();
  console.log(`NULL/空ID对话数: ${nullCount.count}`);

  // 3. 删除 NULL ID 的对话（直接使用 ROWID）
  const deleteResult = db.prepare("DELETE FROM conversations WHERE id IS NULL OR id = 'null' OR id = ''").run();
  console.log(`\n✅ 删除了 ${deleteResult.changes} 个无效对话`);

  // 4. 删除对应的 FTS 记录
  db.prepare("DELETE FROM conversations_fts WHERE id IS NULL OR id = 'null' OR id = ''").run();
  console.log('✅ 清理了 FTS 索引');

  // 5. 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();
  console.log('✅ 已重新启用外键约束');

  // 6. 检查结果
  const countAfter = db.prepare("SELECT COUNT(*) as count FROM conversations").get();
  console.log(`\n当前对话数: ${countAfter.count}`);

  if (countAfter.count === 0) {
    console.log('\n✅ 所有无效对话已清理完成！');
    console.log('提示: 重启前端后会自动创建新的有效对话');
  }

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

