#!/usr/bin/env node

/**
 * 生成测试对话和消息数据
 * 用于填充数据分析面板
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

// AI 模型列表
const MODELS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-sonnet',
  'deepseek-chat',
  'gemini-pro'
];

// 示例对话主题
const CONVERSATION_TOPICS = [
  '编程问题',
  '技术咨询',
  '学习计划',
  '项目讨论',
  '代码调试',
  '架构设计',
  '性能优化',
  '数据分析',
  '产品设计',
  '市场调研'
];

// 示例消息内容
const USER_MESSAGES = [
  '你好，我想了解一下 React 的最佳实践',
  '如何优化 Node.js 应用的性能？',
  '能帮我解释一下什么是闭包吗？',
  '请帮我分析这段代码的问题',
  '我应该如何开始学习 TypeScript？',
  '什么是微服务架构？',
  '如何实现用户认证系统？',
  'SQL 和 NoSQL 数据库有什么区别？',
  '能推荐一些前端框架吗？',
  '如何进行单元测试？'
];

const ASSISTANT_RESPONSES = [
  '我很乐意帮助你！让我详细解释一下...',
  '这是一个很好的问题。首先，我们需要了解...',
  '根据你的需求，我建议采用以下方案...',
  '让我为你分析一下这个问题的关键点...',
  '我可以为你提供一个详细的学习路径...',
  '这个概念确实很重要，让我用简单的例子说明...',
  '我理解你的困惑，让我们一步步来解决...',
  '基于最佳实践，我推荐以下方法...',
  '这涉及到几个核心概念，让我逐一说明...',
  '我可以为你提供一个完整的解决方案...'
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 生成随机日期（过去30天内）
 */
function randomDate(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - (Math.random() * daysAgo * 24 * 60 * 60 * 1000));
  return past.toISOString();
}

/**
 * 随机选择数组元素
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 生成随机 token 数
 */
function randomTokens(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成对话数据
 */
function generateConversations(db, userId, count = 50) {
  log(`\n正在生成 ${count} 个对话...`, 'cyan');

  const stmt = db.prepare(`
    INSERT INTO conversations (user_id, title, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const conversationIds = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate(30);
    const updatedAt = new Date(new Date(createdAt).getTime() + Math.random() * 3600000).toISOString();

    const result = stmt.run(
      userId,
      randomChoice(CONVERSATION_TOPICS),
      randomChoice(MODELS),
      createdAt,
      updatedAt
    );

    conversationIds.push(result.lastInsertRowid);
  }

  log(`✅ 成功生成 ${count} 个对话`, 'green');
  return conversationIds;
}

/**
 * 生成消息数据
 */
function generateMessages(db, conversationIds, messagesPerConversation = 6) {
  log(`\n正在为每个对话生成 ${messagesPerConversation} 条消息...`, 'cyan');

  const stmt = db.prepare(`
    INSERT INTO messages (
      conversation_id, role, content, model, timestamp, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalMessages = 0;

  conversationIds.forEach(conversationId => {
    // 获取对话的模型和创建时间
    const conversation = db.prepare('SELECT model, created_at FROM conversations WHERE id = ?').get(conversationId);
    const baseTime = new Date(conversation.created_at);

    for (let i = 0; i < messagesPerConversation; i++) {
      const isUserMessage = i % 2 === 0;
      const role = isUserMessage ? 'user' : 'assistant';
      const content = isUserMessage 
        ? randomChoice(USER_MESSAGES)
        : randomChoice(ASSISTANT_RESPONSES);

      // 每条消息间隔 1-5 分钟
      const timestamp = new Date(baseTime.getTime() + (i * (1 + Math.random() * 4) * 60000)).toISOString();

      // 只有 assistant 消息有 token 使用信息
      let metadata = null;
      if (!isUserMessage) {
        const promptTokens = randomTokens(100, 500);
        const completionTokens = randomTokens(50, 300);
        metadata = JSON.stringify({
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens
          }
        });
      }

      stmt.run(
        conversationId,
        role,
        content,
        isUserMessage ? null : conversation.model,
        timestamp,
        metadata
      );

      totalMessages++;
    }
  });

  log(`✅ 成功生成 ${totalMessages} 条消息`, 'green');
  return totalMessages;
}

/**
 * 主函数
 */
function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 生成测试对话和消息数据', 'cyan');
  log('='.repeat(60), 'cyan');

  const db = new Database(DB_PATH);

  try {
    // 检查用户
    const user = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (!user) {
      log('\n❌ 数据库中没有用户，请先创建用户', 'yellow');
      process.exit(1);
    }

    const userId = user.id;
    log(`\n📋 使用用户 ID: ${userId}`, 'blue');

    // 检查是否已有数据
    const existingConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get();
    if (existingConversations.count > 0) {
      log(`\n⚠️  数据库中已有 ${existingConversations.count} 个对话`, 'yellow');
      log('是否要先清除现有数据？（这会删除所有对话和消息）', 'yellow');
      log('如需清除，请先手动执行：', 'yellow');
      log('  DELETE FROM messages;', 'blue');
      log('  DELETE FROM conversations;', 'blue');
      log('\n继续添加数据...', 'cyan');
    }

    // 开始事务
    db.prepare('BEGIN').run();

    // 生成对话
    const conversationIds = generateConversations(db, userId, 50);

    // 生成消息
    const messageCount = generateMessages(db, conversationIds, 8);

    // 提交事务
    db.prepare('COMMIT').run();

    // 统计信息
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 数据生成完成', 'cyan');
    log('='.repeat(60), 'cyan');

    const stats = {
      conversations: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(userId),
      messages: db.prepare('SELECT COUNT(*) as count FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ?').get(userId),
      models: db.prepare('SELECT COUNT(DISTINCT model) as count FROM conversations WHERE user_id = ?').get(userId)
    };

    log(`\n✅ 总对话数: ${stats.conversations.count}`, 'green');
    log(`✅ 总消息数: ${stats.messages.count}`, 'green');
    log(`✅ 使用模型数: ${stats.models.count}`, 'green');

    // 模型分布
    const modelDistribution = db.prepare(`
      SELECT model, COUNT(*) as count
      FROM conversations
      WHERE user_id = ?
      GROUP BY model
      ORDER BY count DESC
    `).all(userId);

    log(`\n📊 模型分布:`, 'blue');
    modelDistribution.forEach(({ model, count }) => {
      log(`   ${model}: ${count} 个对话`, 'blue');
    });

    // 时间分布
    const dateRange = db.prepare(`
      SELECT
        MIN(DATE(created_at)) as earliest,
        MAX(DATE(created_at)) as latest
      FROM conversations
      WHERE user_id = ?
    `).get(userId);

    log(`\n📅 时间范围: ${dateRange.earliest} 至 ${dateRange.latest}`, 'blue');

    log('\n' + '='.repeat(60), 'cyan');
    log('✨ 完成！现在可以访问数据分析面板查看数据', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

  } catch (error) {
    db.prepare('ROLLBACK').run();
    log(`\n❌ 错误: ${error.message}`, 'yellow');
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 运行
main();
