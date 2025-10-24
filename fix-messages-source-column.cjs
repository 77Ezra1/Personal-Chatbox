const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'app.db');
const db = new Database(dbPath);

console.log('检查 messages 表的列...');

try {
  // 获取 messages 表的表结构
  const columns = db.prepare("PRAGMA table_info(messages)").all();

  console.log('现有列:', columns.map(c => c.name).join(', '));

  // 检查是否存在 source 列
  const hasSource = columns.some(col => col.name === 'source');

  if (hasSource) {
    console.log('✅ source 列已存在');
  } else {
    console.log('❌ source 列不存在，正在添加...');

    // 添加 source 列
    db.prepare('ALTER TABLE messages ADD COLUMN source TEXT').run();

    // 为现有消息设置默认值
    const result = db.prepare("UPDATE messages SET source = 'chat' WHERE source IS NULL").run();
    console.log(`✅ 已添加 source 列，并更新了 ${result.changes} 条记录`);
  }

  // 检查是否存在 model 列
  const hasModel = columns.some(col => col.name === 'model');

  if (hasModel) {
    console.log('✅ model 列已存在');
  } else {
    console.log('❌ model 列不存在，正在添加...');

    // 添加 model 列
    db.prepare('ALTER TABLE messages ADD COLUMN model TEXT').run();
    console.log('✅ 已添加 model 列');
  }

  // 再次检查列
  const newColumns = db.prepare("PRAGMA table_info(messages)").all();
  console.log('\n更新后的列:', newColumns.map(c => c.name).join(', '));

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

