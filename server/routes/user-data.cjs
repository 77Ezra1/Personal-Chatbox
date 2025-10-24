const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { searchConversations, getSearchStats } = require('../services/search.cjs');
const { cacheMiddleware, clearUserCache } = require('../middleware/cache.cjs');
const logger = require('../utils/logger.cjs');

/**
 * 安全的JSON解析
 */
function safeJSONParse(str, defaultValue = null) {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (err) {
    logger.error('[User Data] JSON parse error:', err);
    return defaultValue;
  }
}

/**
 * 获取用户的所有对话
 * GET /api/user-data/conversations
 * Cached for 2 minutes for better performance
 */
router.get('/conversations', authMiddleware, cacheMiddleware({ ttl: 120 }), async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await db.prepare(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId);

    // 获取每个对话的消息
    const conversationsWithMessages = [];
    for (const conv of conversations) {
      const messages = await db.prepare(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
      ).all(conv.id);

      conversationsWithMessages.push({
        ...conv,
        messages: messages.map(msg => ({
          ...msg,
          metadata: safeJSONParse(msg.metadata, undefined),
          attachments: safeJSONParse(msg.attachments, [])
        }))
      });
    }

    res.json({ conversations: conversationsWithMessages });
  } catch (err) {
    logger.error('[User Data] Error fetching conversations:', err);
    res.status(500).json({ message: '获取对话列表失败' });
  }
});

/**
 * 保存/更新对话数据
 * POST /api/user-data/conversations
 *
 * 改为async/await以兼容PostgreSQL
 */
router.post('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { conversations } = req.body;

  if (!conversations || typeof conversations !== 'object') {
    return res.status(400).json({ message: '无效的对话数据' });
  }

  logger.info('[User Data] Saving conversations for user:', userId);
  logger.info('[User Data] Conversations count:', Object.keys(conversations).length);

  try {
    const conversationList = Object.values(conversations);

    if (conversationList.length === 0) {
      logger.info('[User Data] No conversations to save, skipping');
      return res.json({ message: '没有对话需要保存', count: 0 });
    }

    // 获取数据库中现有的对话 ID（TEXT 类型）
    const existingConversations = await db.prepare(
      'SELECT id FROM conversations WHERE user_id = ?'
    ).all(userId);

    // 创建现有对话 ID 的 Set（支持 TEXT ID）
    const existingIds = new Set(existingConversations.map(c => c.id).filter(id => id !== null));

    let totalMessages = 0;
    let updatedCount = 0;
    let insertedCount = 0;

    // 遍历前端传来的对话,进行增量更新
    for (const conv of conversationList) {
      try {
        const title = conv.title || '新对话';
        let dbId = null;

        // conversations 表的 id 是 TEXT 类型，直接使用字符串 ID
        const convId = conv.id;

        // 如果 ID 存在于数据库中，则更新；否则插入
        if (convId && existingIds.has(convId)) {
          dbId = convId;
          await db.prepare(
            `UPDATE conversations
             SET title = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`
          ).run(
            title,
            conv.updatedAt || new Date().toISOString(),
            dbId,
            userId
          );
          updatedCount++;
          logger.info(`[User Data] Updated conversation: ${title} (ID: ${dbId})`);
        } else {
          // 插入新对话（前端临时 ID，或者数据库中不存在的 ID）
          // 对话表的 id 是 TEXT 类型，使用前端提供的 ID
          dbId = conv.id || `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

          await db.prepare(
            `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`
          ).run(
            dbId,
            userId,
            title,
            conv.createdAt || new Date().toISOString(),
            conv.updatedAt || new Date().toISOString()
          );
          existingIds.add(dbId);
          insertedCount++;
          logger.info(`[User Data] Inserted new conversation: ${title} (ID: ${dbId})`);
        }

        // 获取该对话现有消息的时间戳列表（用于去重）
        const existingMessages = await db.prepare(
          'SELECT timestamp, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
        ).all(dbId);

        // 创建一个 Set 用于快速查找（使用时间戳+内容前50字符作为唯一标识）
        const existingMessageSet = new Set(
          existingMessages.map(m => `${m.timestamp}:${(m.content || '').substring(0, 50)}`)
        );

        const newMessages = conv.messages || [];

        // 过滤出真正需要插入的新消息
        const messagesToInsert = newMessages.filter(msg => {
          const msgKey = `${msg.timestamp}:${(msg.content || '').substring(0, 50)}`;
          return !existingMessageSet.has(msgKey);
        });

        // 插入新消息
        if (messagesToInsert.length > 0) {
          for (const msg of messagesToInsert) {
            const content = msg.content || '';
            if (content.length > 100000) {
              logger.warn(`[User Data] Message content too large (${content.length} bytes), skipping`);
              continue;
            }

            // 插入到 messages 表（保持向后兼容）
            await db.prepare(
              `INSERT INTO messages (conversation_id, role, content, timestamp, metadata, model, source)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).run(
              dbId,
              msg.role || 'user',
              content,
              msg.timestamp || new Date().toISOString(),
              msg.metadata ? JSON.stringify(msg.metadata) : null,
              msg.model || null,
              msg.source || 'chat' // 默认为对话来源
            );
            totalMessages++;

            // 双写：如果是 assistant 消息且有 usage 信息，同时写入 ai_usage_logs
            if (msg.role === 'assistant' && msg.metadata && msg.metadata.usage) {
              try {
                const usage = msg.metadata.usage;

                // 计算成本（DeepSeek 价格）
                const promptCost = (usage.prompt_tokens || 0) / 1000000 * 0.14;
                const completionCost = (usage.completion_tokens || 0) / 1000000 * 0.28;
                const totalCost = promptCost + completionCost;

                // 准备元数据
                const aiLogMetadata = JSON.stringify({
                  usage: usage,
                  conversation_id: dbId,
                  conversation_title: title,
                  content_preview: content.substring(0, 100),
                  timestamp: msg.timestamp || new Date().toISOString()
                });

                // 插入到 ai_usage_logs
                await db.prepare(
                  `INSERT INTO ai_usage_logs (
                    user_id, source, action, model,
                    prompt_tokens, completion_tokens, total_tokens,
                    cost_usd, currency,
                    related_id, related_type,
                    metadata, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).run(
                  userId,
                  msg.source || 'chat',
                  'chat',  // action
                  msg.model || 'unknown',
                  usage.prompt_tokens || 0,
                  usage.completion_tokens || 0,
                  usage.total_tokens || 0,
                  totalCost,
                  'USD',
                  dbId,  // 关联到对话ID
                  'conversation',
                  aiLogMetadata,
                  msg.timestamp || new Date().toISOString()
                );

              } catch (aiLogError) {
                // 双写失败不影响主流程
                logger.warn(`[User Data] Failed to write to ai_usage_logs:`, aiLogError.message);
              }
            }
          }

          logger.info(`[User Data] Added ${messagesToInsert.length} new messages to conversation: ${title}`);
        }
      } catch (convError) {
        logger.error(`[User Data] Error processing conversation:`, convError);
        throw convError;
      }
    }

    logger.info(`[User Data] ✅ Saved: ${insertedCount} new, ${updatedCount} updated conversations with ${totalMessages} new messages`);

    // Clear cache after saving conversations
    clearUserCache(userId);

    return res.json({
      message: '对话数据已保存',
      inserted: insertedCount,
      updated: updatedCount,
      totalMessages
    });

  } catch (error) {
    logger.error('[User Data] Error in conversation save:', error);
    return res.status(500).json({
      message: '保存对话数据失败',
      error: error.message
    });
  }
});

/**
 * 删除单个对话
 * DELETE /api/user-data/conversations/:id
 */
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conversationId = parseInt(req.params.id, 10);

  if (!conversationId || isNaN(conversationId)) {
    return res.status(400).json({ message: '无效的对话 ID' });
  }

  try {
    // 验证对话属于当前用户
    const conversation = await db.prepare(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
    ).get(conversationId, userId);

    if (!conversation) {
      return res.status(404).json({ message: '对话不存在或无权限删除' });
    }

    // 删除对话（级联删除关联的消息）
    await db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
      .run(conversationId, userId);

    logger.info(`[User Data] ✅ Deleted conversation ${conversationId} for user ${userId}`);

    // Clear cache
    clearUserCache(userId);

    return res.json({
      message: '对话已删除',
      conversationId
    });

  } catch (error) {
    logger.error('[User Data] Error deleting conversation:', error);
    return res.status(500).json({
      message: '删除对话失败',
      error: error.message
    });
  }
});

/**
 * 获取用户配置
 * GET /api/user-data/config
 */
router.get('/config', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const config = await db.prepare(
      'SELECT * FROM user_configs WHERE user_id = ?'
    ).get(userId);

    if (!config) {
      return res.json({ config: null });
    }

    res.json({
      config: {
        modelConfig: config.model_config ? JSON.parse(config.model_config) : null,
        systemPrompt: config.system_prompt ? JSON.parse(config.system_prompt) : null,
        apiKeys: config.api_keys ? JSON.parse(config.api_keys) : null,
        proxyConfig: config.proxy_config ? JSON.parse(config.proxy_config) : null,
        mcpConfig: config.mcp_config ? JSON.parse(config.mcp_config) : null
      }
    });
  } catch (err) {
    console.error('[User Data] Error fetching config:', err);
    res.status(500).json({ message: '获取配置失败' });
  }
});

/**
 * 保存用户配置
 * POST /api/user-data/config
 */
router.post('/config', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { modelConfig, systemPrompt, apiKeys, proxyConfig, mcpConfig } = req.body;

  try {
    await db.prepare(
      `INSERT INTO user_configs (user_id, model_config, system_prompt, api_keys, proxy_config, mcp_config, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         model_config = excluded.model_config,
         system_prompt = excluded.system_prompt,
         api_keys = excluded.api_keys,
         proxy_config = excluded.proxy_config,
         mcp_config = excluded.mcp_config,
         updated_at = CURRENT_TIMESTAMP`
    ).run(
      userId,
      modelConfig ? JSON.stringify(modelConfig) : null,
      systemPrompt ? JSON.stringify(systemPrompt) : null,
      apiKeys ? JSON.stringify(apiKeys) : null,
      proxyConfig ? JSON.stringify(proxyConfig) : null,
      mcpConfig ? JSON.stringify(mcpConfig) : null
    );

    res.json({ message: '配置已保存' });
  } catch (err) {
    console.error('[User Data] Error saving config:', err);
    return res.status(500).json({ message: '保存配置失败' });
  }
});

/**
 * 检查用户是否是第一个注册的用户
 * GET /api/user-data/is-first-user
 */
router.get('/is-first-user', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const row = await db.prepare(
      'SELECT id FROM users ORDER BY created_at ASC LIMIT 1'
    ).get();

    res.json({ isFirstUser: row ? (row.id === userId) : true });
  } catch (err) {
    console.error('[User Data] Error checking first user:', err);
    res.status(500).json({ message: '检查用户失败' });
  }
});

/**
 * 搜索对话
 * GET /api/user-data/conversations/search
 * Query参数:
 *   - q: 搜索关键词
 *   - dateFrom: 开始日期 (YYYY-MM-DD)
 *   - dateTo: 结束日期 (YYYY-MM-DD)
 *   - model: 模型筛选
 *   - sort: 排序方式 (relevance/date/messages)
 *   - order: 排序方向 (asc/desc)
 *   - limit: 返回数量限制
 *   - offset: 分页偏移
 */
router.get('/conversations/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      q: query,
      dateFrom,
      dateTo,
      model,
      sort,
      order,
      limit,
      offset
    } = req.query;

    console.log('[Search] 搜索参数:', {
      query,
      dateFrom,
      dateTo,
      model,
      sort,
      order,
      limit,
      offset
    });

    const filters = {
      dateFrom,
      dateTo,
      model,
      sort: sort || 'date',
      order: order || 'desc',
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    };

    const results = await searchConversations(userId, query, filters);

    // 为每个对话获取消息（可选，如果需要完整数据）
    const conversationsWithMessages = await Promise.all(
      results.map(conv => {
        return new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
            [conv.id],
            (err, messages) => {
              if (err) {
                reject(err);
              } else {
                resolve({
                  ...conv,
                  messages: messages.map(msg => ({
                    ...msg,
                    metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
                    attachments: msg.attachments ? JSON.parse(msg.attachments) : []
                  }))
                });
              }
            }
          );
        });
      })
    );

    res.json({
      conversations: conversationsWithMessages,
      hasMore: results.length === filters.limit
    });
  } catch (error) {
    console.error('[Search] 搜索失败:', error);
    res.status(500).json({ message: '搜索失败', error: error.message });
  }
});

/**
 * 获取搜索统计
 * GET /api/user-data/conversations/search/stats
 */
router.get('/conversations/search/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: query, dateFrom, dateTo } = req.query;

    const stats = await getSearchStats(userId, query, { dateFrom, dateTo });

    res.json(stats);
  } catch (error) {
    console.error('[Search] 获取统计失败:', error);
    res.status(500).json({ message: '获取统计失败', error: error.message });
  }
});

module.exports = router;

