const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('诊断保存失败的原因');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // 1. 检查外键约束是否开启
  const fkStatus = db.prepare("PRAGMA foreign_keys").get();
  console.log(`1. 外键约束状态: ${fkStatus.foreign_keys === 1 ? '✅ 已启用' : '❌ 未启用'}\n`);

  // 2. 检查 conversations 表结构
  console.log('2. conversations 表结构:');
  const convColumns = db.prepare("PRAGMA table_info(conversations)").all();
  convColumns.forEach(col => {
    const pk = col.pk ? ' [PRIMARY KEY]' : '';
    const notnull = col.notnull ? ' [NOT NULL]' : '';
    console.log(`   ${col.name}: ${col.type}${pk}${notnull}`);
  });

  // 3. 检查 messages 表结构
  console.log('\n3. messages 表结构:');
  const msgColumns = db.prepare("PRAGMA table_info(messages)").all();
  msgColumns.forEach(col => {
    const pk = col.pk ? ' [PRIMARY KEY]' : '';
    const notnull = col.notnull ? ' [NOT NULL]' : '';
    console.log(`   ${col.name}: ${col.type}${pk}${notnull}`);
  });

  // 4. 检查外键定义
  console.log('\n4. messages 表的外键约束:');
  const fkList = db.prepare("PRAGMA foreign_key_list(messages)").all();
  fkList.forEach(fk => {
    console.log(`   ${fk.from} -> ${fk.table}.${fk.to}`);
  });

  // 5. 检查 conversations 表的主键类型
  console.log('\n5. 检查现有对话的 ID 类型:');
  const convs = db.prepare("SELECT id, typeof(id) as id_type, title FROM conversations LIMIT 5").all();
  if (convs.length > 0) {
    convs.forEach(c => {
      console.log(`   ID: ${c.id} (类型: ${c.id_type}), 标题: ${c.title}`);
    });
  } else {
    console.log('   ⚠️  没有对话记录');
  }

  // 6. 模拟前端创建对话的 ID 格式
  console.log('\n6. 测试前端 ID 格式:');
  const frontendId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  console.log(`   前端生成的ID: ${frontendId}`);
  console.log(`   ID类型: ${typeof frontendId}`);
  console.log(`   ID长度: ${frontendId.length}`);

  // 7. 检查 conversations 表的 id 列是否接受 TEXT
  console.log('\n7. 尝试插入测试对话:');
  const testId = `test-${Date.now()}`;
  try {
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testId, 1, '测试对话', new Date().toISOString(), new Date().toISOString());

    console.log(`   ✅ 成功插入对话: ${testId}`);

    // 尝试插入消息
    try {
      db.prepare(`
        INSERT INTO messages (conversation_id, role, content, timestamp, source)
        VALUES (?, ?, ?, ?, ?)
      `).run(testId, 'user', '测试消息', new Date().toISOString(), 'chat');

      console.log('   ✅ 成功插入消息');

      // 清理测试数据
      db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(testId);
      db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
      console.log('   ✅ 已清理测试数据');

    } catch (msgError) {
      console.log(`   ❌ 插入消息失败: ${msgError.message}`);
    }

  } catch (convError) {
    console.log(`   ❌ 插入对话失败: ${convError.message}`);
  }

  // 8. 检查是否有孤立的消息
  console.log('\n8. 检查孤立消息（conversation_id 不存在）:');
  const orphans = db.prepare(`
    SELECT m.id, m.conversation_id, m.role
    FROM messages m
    LEFT JOIN conversations c ON m.conversation_id = c.id
    WHERE c.id IS NULL
    LIMIT 10
  `).all();

  if (orphans.length > 0) {
    console.log(`   ⚠️  发现 ${orphans.length} 条孤立消息:`);
    orphans.forEach(o => {
      console.log(`      消息ID: ${o.id}, 对话ID: ${o.conversation_id}`);
    });
  } else {
    console.log('   ✅ 没有孤立消息');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

