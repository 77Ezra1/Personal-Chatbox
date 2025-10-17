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
    // 1. 删除用户现有的所有对话（级联删除消息）
    await db.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId);
    console.log('[User Data] Deleted old conversations for user:', userId);

    // 2. 插入新的对话和消息
    const conversationList = Object.values(conversations);

    if (conversationList.length === 0) {
      console.log('[User Data] No conversations to save');
      return res.json({ message: '对话数据已保存', count: 0 });
    }

    let totalMessages = 0;

    // 3. 遍历并插入每个对话
    for (const [index, conv] of conversationList.entries()) {
      try {
        // 插入对话
        await db.prepare(
          `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run(
          conv.id,
          userId,
          conv.title || '新对话',
          conv.createdAt || new Date().toISOString(),
          conv.updatedAt || new Date().toISOString()
        );

        // 插入该对话的所有消息
        if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
          for (const msg of conv.messages) {
            // 验证消息内容大小
            const content = msg.content || '';
            if (content.length > 100000) { // 限制单条消息100KB
              logger.warn(`[User Data] Message content too large (${content.length} bytes), truncating`);
              continue;
            }

            await db.prepare(
              `INSERT INTO messages (conversation_id, role, content, timestamp, metadata, status, attachments)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).run(
              conv.id,
              msg.role || 'user',
              content,
              msg.timestamp || new Date().toISOString(),
              msg.metadata ? JSON.stringify(msg.metadata) : null,
              msg.status || 'done',
              msg.attachments ? JSON.stringify(msg.attachments) : '[]'
            );
            totalMessages++;
          }
        }
      } catch (convError) {
        logger.error(`[User Data] Error inserting conversation ${index + 1}:`, convError);
        throw convError;
      }
    }

    logger.info(`[User Data] ✅ Successfully saved ${conversationList.length} conversations with ${totalMessages} messages`);

    // Clear cache after saving conversations
    clearUserCache(userId);

    return res.json({
      message: '对话数据已保存',
      count: conversationList.length,
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

