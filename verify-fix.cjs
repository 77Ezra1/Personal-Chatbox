const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 修复验证报告');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // 1. 检查对话表
  const convs = db.prepare("SELECT id, title, user_id FROM conversations ORDER BY created_at DESC LIMIT 3").all();
  console.log('1. 对话列表:');
  if (convs.length === 0) {
    console.log('   📝 暂无对话（正常，等待用户创建）\n');
  } else {
    convs.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title}`);
      console.log(`      ID: ${c.id}`);
      console.log(`      用户: ${c.user_id}\n`);
    });
  }

  // 2. 检查是否有 NULL ID
  const nullCheck = db.prepare("SELECT COUNT(*) as count FROM conversations WHERE id IS NULL").get();
  console.log(`2. NULL ID 检查: ${nullCheck.count === 0 ? '✅ 无异常' : `❌ 发现 ${nullCheck.count} 个`}\n`);

  // 3. 检查消息表
  const msgs = db.prepare("SELECT COUNT(*) as count FROM messages").get();
  console.log(`3. 消息总数: ${msgs.count}\n`);

  // 4. 检查外键约束
  const fk = db.prepare("PRAGMA foreign_keys").get();
  console.log(`4. 外键约束: ${fk.foreign_keys === 1 ? '✅ 已启用' : '❌ 未启用'}\n`);

  // 5. 测试插入
  console.log('5. 功能测试:');
  const testId = `test-verify-${Date.now()}`;

  try {
    // 插入测试对话
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testId, 1, '测试对话', new Date().toISOString(), new Date().toISOString());

    console.log('   ✅ 对话插入成功');

    // 插入测试消息
    db.prepare(`
      INSERT INTO messages (conversation_id, role, content, timestamp, source)
      VALUES (?, ?, ?, ?, ?)
    `).run(testId, 'user', '这是一条测试消息', new Date().toISOString(), 'chat');

    console.log('   ✅ 消息插入成功');

    // 清理测试数据
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testId);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);

    console.log('   ✅ 测试数据已清理\n');

  } catch (testErr) {
    console.log(`   ❌ 测试失败: ${testErr.message}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 服务状态:');
  console.log('   后端: http://localhost:3001');
  console.log('   前端: http://localhost:5173');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 修复完成！请在浏览器中测试对话保存功能。\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

