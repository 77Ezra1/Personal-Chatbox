const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');

const db = new Database(dbPath);

console.log('检查对话数据...\n');

try {
  // 获取所有对话
  const conversations = db.prepare("SELECT * FROM conversations ORDER BY updated_at DESC").all();

  console.log(`找到 ${conversations.length} 个对话:\n`);

  conversations.forEach((conv, index) => {
    console.log(`${index + 1}. ID: ${conv.id}`);
    console.log(`   用户ID: ${conv.user_id}`);
    console.log(`   标题: ${conv.title}`);
    console.log(`   创建时间: ${conv.created_at}`);
    console.log(`   更新时间: ${conv.updated_at}`);

    // 检查消息数
    const messageCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?").get(conv.id);
    console.log(`   消息数: ${messageCount.count}\n`);
  });

  // 检查是否有孤立的消息（conversation_id 不存在）
  const orphanedMessages = db.prepare(`
    SELECT m.* FROM messages m
    LEFT JOIN conversations c ON m.conversation_id = c.id
    WHERE c.id IS NULL
  `).all();

  if (orphanedMessages.length > 0) {
    console.log(`\n⚠️  发现 ${orphanedMessages.length} 条孤立消息（对话不存在）:`);
    orphanedMessages.forEach(msg => {
      console.log(`   - 消息ID: ${msg.id}, 对话ID: ${msg.conversation_id}, 角色: ${msg.role}`);
    });
  }

} catch (error) {
  console.error('错误:', error);
} finally {
  db.close();
}

