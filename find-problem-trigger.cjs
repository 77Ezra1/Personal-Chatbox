const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('查找所有触发器及其SQL...\n');

try {
  const triggers = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger' ORDER BY tbl_name, name").all();

  console.log(`找到 ${triggers.length} 个触发器\n`);

  let foundProblem = false;

  triggers.forEach((t, i) => {
    const num = String(i + 1).padStart(2, '0');
    console.log(`${num}. ${t.tbl_name}.${t.name}`);

    // 检查SQL中是否包含 summary_templates
    if (t.sql && t.sql.toLowerCase().includes('summary')) {
      console.log('   ⚠️  包含 summary 引用!');
      console.log(`   SQL: ${t.sql.substring(0, 200)}`);
      foundProblem = true;
    }
  });

  if (!foundProblem) {
    console.log('\n✅ 没有发现引用 summary_templates 的触发器');
    console.log('\n问题可能在其他地方，让我测试具体操作...\n');

    // 详细测试删除操作
    const testId = `delete-test-${Date.now()}`;

    console.log('步骤1: 插入测试对话...');
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testId, 1, '删除测试', new Date().toISOString(), new Date().toISOString());
    console.log('  ✅ 插入成功\n');

    console.log('步骤2: 删除测试对话...');
    try {
      db.exec(`DELETE FROM conversations WHERE id = '${testId}'`);
      console.log('  ✅ 删除成功\n');
    } catch (err) {
      console.log(`  ❌ 删除失败: ${err.message}\n`);
      console.log('错误详情:', err);
    }
  }

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

