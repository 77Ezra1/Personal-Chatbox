const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');

console.log('检查数据库:', dbPath);

const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在！');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('\n检查数据库表...');

try {
  // 获取所有表
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

  console.log(`\n找到 ${tables.length} 个表:`);
  tables.forEach(table => {
    console.log(`\n━━━ 表: ${table.name} ━━━`);

    // 获取每个表的列
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(`列: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}`);

    // 获取记录数
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`记录数: ${count.count}`);
    } catch (e) {
      console.log(`记录数: 无法获取 (${e.message})`);
    }
  });

  // 特别检查 messages 表
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('特别检查 messages 表:');
  const messagesColumns = db.prepare("PRAGMA table_info(messages)").all();
  console.log('列名:', messagesColumns.map(c => c.name).join(', '));

  const hasSource = messagesColumns.some(c => c.name === 'source');
  const hasModel = messagesColumns.some(c => c.name === 'model');

  console.log(`\n- source 列: ${hasSource ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`- model 列: ${hasModel ? '✅ 存在' : '❌ 不存在'}`);

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

