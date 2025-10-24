const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('修复对话ID...\n');

// 生成唯一ID的函数
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

try {
  // 由于 id 是 PRIMARY KEY 且是 TEXT类型，SQLite 不允许NULL作为主键
  // 但如果能查出 NULL，说明表结构有问题，我们需要重建表

  // 1. 先查看所有对话
  const conversations = db.prepare("SELECT rowid, * FROM conversations").all();

  console.log(`找到 ${conversations.length} 个对话`);
  console.log('前3个对话的ID:', conversations.slice(0, 3).map(c => c.id));

  // 2. 删除所有 NULL ID 的对话（这些是无效数据）
  const deleteResult = db.prepare("DELETE FROM conversations WHERE id IS NULL").run();
  console.log(`\n删除了 ${deleteResult.changes} 个ID为NULL的无效对话\n`);

  // 3. 检查剩余对话
  const remaining = db.prepare("SELECT * FROM conversations").all();
  console.log(`剩余 ${remaining.length} 个有效对话`);

  if (remaining.length === 0) {
    console.log('\n✅ 所有无效对话已清理');
  }

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

