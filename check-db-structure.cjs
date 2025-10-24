const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'app.db');

console.log('数据库路径:', dbPath);

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

  console.log('数据库中的表:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);

    // 获取每个表的列
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(`    列: ${columns.map(c => c.name).join(', ')}`);
  });

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

