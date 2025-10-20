/**
 * 迁移历史对话数据到 ai_usage_logs 表
 * 将 messages 表中的 token 统计数据复制到统一的 AI 使用日志表
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.db');
const db = new Database(dbPath);

console.log('🚀 开始迁移历史对话数据到 ai_usage_logs...\n');

try {
  // 1. 获取所有包含 usage 信息的对话消息
  const messages = db.prepare(`
    SELECT
      c.user_id,
      m.id as message_id,
      m.conversation_id,
      m.model,
      m.metadata,
      m.timestamp,
      m.content,
      COALESCE(m.source, 'chat') as source
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.role = 'assistant'
      AND m.metadata IS NOT NULL
      AND json_extract(m.metadata, '$.usage') IS NOT NULL
    ORDER BY m.timestamp ASC
  `).all();

  console.log(`📊 找到 ${messages.length} 条需要迁移的消息\n`);

  if (messages.length === 0) {
    console.log('✅ 没有需要迁移的数据');
    process.exit(0);
  }

  // 2. 准备插入语句
  const insertStmt = db.prepare(`
    INSERT INTO ai_usage_logs (
      user_id, source, action, model,
      prompt_tokens, completion_tokens, total_tokens,
      cost_usd, currency,
      related_id, related_type,
      metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 3. 开始事务
  const migrate = db.transaction(() => {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const msg of messages) {
      try {
        // 解析 metadata
        const metadata = JSON.parse(msg.metadata);
        const usage = metadata.usage;

        if (!usage || !usage.total_tokens) {
          console.log(`⚠️  跳过消息 ${msg.message_id}: 无有效 usage 数据`);
          skipCount++;
          continue;
        }

        // 计算成本（DeepSeek 价格）
        const promptCost = (usage.prompt_tokens || 0) / 1000000 * 0.14;
        const completionCost = (usage.completion_tokens || 0) / 1000000 * 0.28;
        const totalCost = promptCost + completionCost;

        // 准备新的元数据
        const newMetadata = JSON.stringify({
          original_message_id: msg.message_id,
          conversation_id: msg.conversation_id,
          usage: usage,
          migrated_at: new Date().toISOString(),
          content_preview: msg.content ? msg.content.substring(0, 100) : ''
        });

        // 插入到 ai_usage_logs
        insertStmt.run(
          msg.user_id,
          msg.source,           // 'chat' 或其他来源
          'chat',               // action: 对话
          msg.model || 'unknown',
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          usage.total_tokens || 0,
          totalCost,
          'USD',
          msg.conversation_id,  // 关联到对话ID
          'conversation',       // 类型
          newMetadata,
          msg.timestamp || new Date().toISOString()
        );

        successCount++;

        if (successCount % 10 === 0) {
          console.log(`   已迁移 ${successCount} 条...`);
        }

      } catch (error) {
        console.error(`❌ 迁移消息 ${msg.message_id} 失败:`, error.message);
        errorCount++;
      }
    }

    return { successCount, skipCount, errorCount };
  });

  // 4. 执行迁移
  const result = migrate();

  console.log('\n📊 迁移完成！');
  console.log(`   ✅ 成功: ${result.successCount} 条`);
  console.log(`   ⚠️  跳过: ${result.skipCount} 条`);
  console.log(`   ❌ 失败: ${result.errorCount} 条`);

  // 5. 验证迁移结果
  const stats = db.prepare(`
    SELECT
      source,
      COUNT(*) as count,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as total_cost
    FROM ai_usage_logs
    GROUP BY source
    ORDER BY source
  `).all();

  console.log('\n📈 ai_usage_logs 表统计:');
  stats.forEach(stat => {
    console.log(`   ${stat.source}: ${stat.count} 条记录, ${stat.total_tokens} tokens, $${stat.total_cost.toFixed(6)}`);
  });

  console.log('\n✅ 迁移脚本执行完毕！');

} catch (error) {
  console.error('\n❌ 迁移失败:', error);
  process.exit(1);
} finally {
  db.close();
}
