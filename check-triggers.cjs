const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('检查数据库触发器...\n');

try {
  // 获取所有触发器
  const triggers = db.prepare("SELECT * FROM sqlite_master WHERE type='trigger'").all();

  console.log(`找到 ${triggers.length} 个触发器:\n`);

  triggers.forEach((trigger, index) => {
    console.log(`${index + 1}. 名称: ${trigger.name}`);
    console.log(`   表: ${trigger.tbl_name}`);
    console.log(`   SQL:\n${trigger.sql}\n`);
  });

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

