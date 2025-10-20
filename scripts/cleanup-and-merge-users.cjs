/**
 * 数据库用户清理和合并脚本
 * 1. 合并用户3的数据到用户11
 * 2. 删除除用户11外的所有其他用户
 * 3. 将用户11改为用户1
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.db');
const db = new Database(dbPath);

console.log('🚀 开始数据库用户清理和合并...\n');

try {
  // 禁用外键约束（在修改主键时需要）
  db.exec('PRAGMA foreign_keys = OFF');

  // 开始事务
  db.exec('BEGIN TRANSACTION');

  // ============ 步骤1：合并用户3的数据到用户11 ============
  console.log('📊 步骤1：合并用户3的数据到用户11...');

  // 1.1 更新 conversations 表
  const convUpdated = db.prepare('UPDATE conversations SET user_id = 11 WHERE user_id = 3').run();
  console.log(`   ✅ 更新了 ${convUpdated.changes} 个对话的用户ID`);

  // 1.2 更新 ai_usage_logs 表
  const aiLogsUpdated = db.prepare('UPDATE ai_usage_logs SET user_id = 11 WHERE user_id = 3').run();
  console.log(`   ✅ 更新了 ${aiLogsUpdated.changes} 条AI使用记录的用户ID`);

  // 1.3 更新 notes 表（如果有）
  try {
    const notesUpdated = db.prepare('UPDATE notes SET user_id = 11 WHERE user_id = 3').run();
    console.log(`   ✅ 更新了 ${notesUpdated.changes} 条笔记的用户ID`);
  } catch (error) {
    console.log('   ℹ️  笔记表不存在或无数据需要更新');
  }

  // 1.4 更新 documents 表（如果有）
  try {
    const docsUpdated = db.prepare('UPDATE documents SET user_id = 11 WHERE user_id = 3').run();
    console.log(`   ✅ 更新了 ${docsUpdated.changes} 条文档的用户ID`);
  } catch (error) {
    console.log('   ℹ️  文档表不存在或无数据需要更新');
  }

  // 1.5 更新 user_configs 表
  try {
    const configsUpdated = db.prepare('UPDATE user_configs SET user_id = 11 WHERE user_id = 3').run();
    console.log(`   ✅ 更新了 ${configsUpdated.changes} 条用户配置的用户ID`);
  } catch (error) {
    console.log('   ℹ️  用户配置表不存在或无数据需要更新');
  }

  console.log('\n📊 步骤2：删除除用户11外的所有其他用户...');

  // ============ 步骤2：删除其他所有用户 ============

  // 2.1 删除其他用户的 conversations（会级联删除messages）
  const convDeleted = db.prepare('DELETE FROM conversations WHERE user_id != 11').run();
  console.log(`   ✅ 删除了 ${convDeleted.changes} 个其他用户的对话`);

  // 2.2 删除其他用户的 ai_usage_logs
  const aiLogsDeleted = db.prepare('DELETE FROM ai_usage_logs WHERE user_id != 11').run();
  console.log(`   ✅ 删除了 ${aiLogsDeleted.changes} 条其他用户的AI使用记录`);

  // 2.3 删除其他用户的 notes
  try {
    const notesDeleted = db.prepare('DELETE FROM notes WHERE user_id != 11').run();
    console.log(`   ✅ 删除了 ${notesDeleted.changes} 条其他用户的笔记`);
  } catch (error) {
    console.log('   ℹ️  笔记表不存在或无数据需要删除');
  }

  // 2.4 删除其他用户的 documents
  try {
    const docsDeleted = db.prepare('DELETE FROM documents WHERE user_id != 11').run();
    console.log(`   ✅ 删除了 ${docsDeleted.changes} 条其他用户的文档`);
  } catch (error) {
    console.log('   ℹ️  文档表不存在或无数据需要删除');
  }

  // 2.5 删除其他用户的 user_configs
  try {
    const configsDeleted = db.prepare('DELETE FROM user_configs WHERE user_id != 11').run();
    console.log(`   ✅ 删除了 ${configsDeleted.changes} 条其他用户的配置`);
  } catch (error) {
    console.log('   ℹ️  用户配置表不存在或无数据需要删除');
  }

  // 2.6 删除 users 表中除用户11外的所有用户
  const usersDeleted = db.prepare('DELETE FROM users WHERE id != 11').run();
  console.log(`   ✅ 删除了 ${usersDeleted.changes} 个其他用户账户`);

  console.log('\n📊 步骤3：将用户11改为用户1...');

  // ============ 步骤3：将用户11改为用户1 ============

  // 3.1 检查是否已存在用户1
  const existingUser1 = db.prepare('SELECT id FROM users WHERE id = 1').get();
  if (existingUser1) {
    console.log('   ⚠️  用户1已存在，先删除...');
    db.prepare('DELETE FROM users WHERE id = 1').run();
  }

  // 3.2 更新 users 表
  db.prepare('UPDATE users SET id = 1 WHERE id = 11').run();
  console.log('   ✅ 更新了 users 表的ID');

  // 3.3 更新 conversations 表
  db.prepare('UPDATE conversations SET user_id = 1 WHERE user_id = 11').run();
  console.log('   ✅ 更新了 conversations 表的user_id');

  // 3.4 更新 ai_usage_logs 表
  db.prepare('UPDATE ai_usage_logs SET user_id = 1 WHERE user_id = 11').run();
  console.log('   ✅ 更新了 ai_usage_logs 表的user_id');

  // 3.5 更新 notes 表
  try {
    db.prepare('UPDATE notes SET user_id = 1 WHERE user_id = 11').run();
    console.log('   ✅ 更新了 notes 表的user_id');
  } catch (error) {
    console.log('   ℹ️  笔记表不存在或无数据需要更新');
  }

  // 3.6 更新 documents 表
  try {
    db.prepare('UPDATE documents SET user_id = 1 WHERE user_id = 11').run();
    console.log('   ✅ 更新了 documents 表的user_id');
  } catch (error) {
    console.log('   ℹ️  文档表不存在或无数据需要更新');
  }

  // 3.7 更新 user_configs 表
  try {
    db.prepare('UPDATE user_configs SET user_id = 1 WHERE user_id = 11').run();
    console.log('   ✅ 更新了 user_configs 表的user_id');
  } catch (error) {
    console.log('   ℹ️  用户配置表不存在或无数据需要更新');
  }

  // 提交事务
  db.exec('COMMIT');

  // 重新启用外键约束
  db.exec('PRAGMA foreign_keys = ON');

  console.log('\n📈 最终统计：');

  // 验证最终数据
  const finalStats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get(),
    conversations: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = 1').get(),
    messages: db.prepare('SELECT COUNT(*) as count FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = 1').get(),
    aiUsageLogs: db.prepare('SELECT COUNT(*) as count, SUM(total_tokens) as tokens FROM ai_usage_logs WHERE user_id = 1').get()
  };

  console.log(`   用户总数: ${finalStats.users.count}`);
  console.log(`   用户1的对话数: ${finalStats.conversations.count}`);
  console.log(`   用户1的消息数: ${finalStats.messages.count}`);
  console.log(`   用户1的AI使用记录: ${finalStats.aiUsageLogs.count} 条`);
  console.log(`   用户1的总tokens: ${finalStats.aiUsageLogs.tokens || 0}`);

  // 按来源统计
  const sourceStats = db.prepare(`
    SELECT source, COUNT(*) as count, SUM(total_tokens) as tokens
    FROM ai_usage_logs
    WHERE user_id = 1
    GROUP BY source
  `).all();

  console.log('\n   按来源统计:');
  sourceStats.forEach(stat => {
    console.log(`     ${stat.source}: ${stat.count} 条, ${stat.tokens} tokens`);
  });

  console.log('\n✅ 数据清理和合并完成！');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ 操作失败，已回滚:', error);
  process.exit(1);
} finally {
  db.close();
}
