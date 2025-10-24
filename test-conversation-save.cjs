const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('测试对话保存功能\n');

// 模拟前端保存对话的过程
const userId = 1; // test@example.com 的用户ID

try {
  // 1. 创建一个测试对话
  const conversationId = `${Date.now()}-test`;
  const title = '测试对话';

  console.log('1. 创建测试对话...');
  const insertConv = db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertConv.run(
    conversationId,
    userId,
    title,
    new Date().toISOString(),
    new Date().toISOString()
  );

  console.log(`   ✅ 对话已创建: ${conversationId}\n`);

  // 2. 添加测试消息
  console.log('2. 添加测试消息...');
  const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, role, content, timestamp, metadata, model, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 用户消息
  insertMsg.run(
    conversationId,
    'user',
    '你好，这是一条测试消息',
    new Date().toISOString(),
    null,
    null,
    'chat'
  );

  console.log('   ✅ 用户消息已添加');

  // 助手消息
  insertMsg.run(
    conversationId,
    'assistant',
    '您好！我收到了您的测试消息。',
    new Date().toISOString(),
    JSON.stringify({ usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 } }),
    'deepseek-chat',
    'chat'
  );

  console.log('   ✅ 助手消息已添加\n');

  // 3. 验证保存结果
  console.log('3. 验证保存结果...');
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
  console.log(`   对话: ${conv.title} (ID: ${conv.id})`);

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ?').all(conversationId);
  console.log(`   消息数: ${messages.length}`);

  messages.forEach((msg, idx) => {
    console.log(`   ${idx + 1}. [${msg.role}] ${msg.content}`);
  });

  console.log('\n✅ 测试成功！数据库可以正常保存对话和消息。');
  console.log('\n现在检查前端保存逻辑是否正确调用了后端API...\n');

} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error(error);
} finally {
  db.close();
}

