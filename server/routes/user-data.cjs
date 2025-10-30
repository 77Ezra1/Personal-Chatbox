const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { searchConversations, getSearchStats } = require('../services/search.cjs');
const { cacheMiddleware, clearUserCache } = require('../middleware/cache.cjs');
const logger = require('../utils/logger.cjs');
const { v4: uuidv4 } = require('uuid');

/**
 *    JSON  
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
 *          ?
 * GET /api/user-data/conversations
 * Cached for 2 minutes for better performance
 */
router.get('/conversations', authMiddleware, cacheMiddleware({ ttl: 120 }), async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await db.prepare(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId);

    //          ?
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
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

/**
 *   /      
 * POST /api/user-data/conversations
 *
 *   async/await   PostgreSQL
 */
router.post('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { conversations } = req.body;

  if (!conversations || typeof conversations !== 'object') {
    return res.status(400).json({ message: 'Invalid conversation payload' });
  }

  logger.info('[User Data] Saving conversations for user:', userId);
  logger.info('[User Data] Conversations count:', Object.keys(conversations).length);

  try {
    const conversationList = Object.values(conversations);

    if (conversationList.length === 0) {
      logger.info('[User Data] No conversations to save, skipping');
      return res.json({ message: 'No conversations to save', count: 0 });
    }

    //            ?ID TEXT    ?
    const existingConversations = await db.prepare(
      'SELECT id FROM conversations WHERE user_id = ?'
    ).all(userId);

    //        ID  ?Set   ?TEXT ID ?
    const existingIds = new Set(existingConversations.map(c => c.id).filter(id => id !== null));

    let totalMessages = 0;
    let updatedCount = 0;
    let insertedCount = 0;

    //          ?      
    for (const conv of conversationList) {
      try {
        const title = conv.title || 'New Conversation';
        let dbId = null;

        // conversations    id  ?TEXT            ID
        const convId = conv.id;

        //    ID                 
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
          const conversationId = convId || uuidv4();

          await db.prepare(
            `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`
          ).run(
            conversationId,
            userId,
            title,
            conv.createdAt || new Date().toISOString(),
            conv.updatedAt || new Date().toISOString()
          );

          dbId = conversationId;
          existingIds.add(dbId);
          insertedCount++;
          logger.info(`[User Data] Inserted new conversation: ${title} (ID: ${dbId})`);
        }

        //                      ?
        const existingMessages = await db.prepare(
          'SELECT timestamp, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC'
        ).all(dbId);

        //     ?Set             ?   ?0         ?
        const existingMessageSet = new Set(
          existingMessages.map(m => `${m.timestamp}:${(m.content || '').substring(0, 50)}`)
        );

        const newMessages = conv.messages || [];

        //              ?
        const messagesToInsert = newMessages.filter(msg => {
          const msgKey = `${msg.timestamp}:${(msg.content || '').substring(0, 50)}`;
          return !existingMessageSet.has(msgKey);
        });

        //      ?
        if (messagesToInsert.length > 0) {
          for (const msg of messagesToInsert) {
            const content = msg.content || '';
            if (content.length > 100000) {
              logger.warn(`[User Data] Message content too large (${content.length} bytes), skipping`);
              continue;
            }

            //    ?messages          ?
            await db.prepare(
              `INSERT INTO messages (conversation_id, role, content, timestamp, metadata)
               VALUES (?, ?, ?, ?, ?)`
            ).run(
              dbId,
              msg.role || 'user',
              content,
              msg.timestamp || new Date().toISOString(),
              msg.metadata ? JSON.stringify(msg.metadata) : null
            );
            totalMessages++;

            //        assistant      usage        ?ai_usage_logs
            if (msg.role === 'assistant' && msg.metadata && msg.metadata.usage) {
              try {
                const usage = msg.metadata.usage;

                //      DeepSeek    ?
                const promptCost = (usage.prompt_tokens || 0) / 1000000 * 0.14;
                const completionCost = (usage.completion_tokens || 0) / 1000000 * 0.28;
                const totalCost = promptCost + completionCost;

                //      ?
                const aiLogMetadata = JSON.stringify({
                  usage: usage,
                  conversation_id: dbId,
                  conversation_title: title,
                  content_preview: content.substring(0, 100),
                  timestamp: msg.timestamp || new Date().toISOString()
                });

                //    ?ai_usage_logs
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
                  dbId,  //      ID
                  'conversation',
                  aiLogMetadata,
                  msg.timestamp || new Date().toISOString()
                );

              } catch (aiLogError) {
                //           
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

    logger.info(`[User Data] Saved conversations: ${insertedCount} new, ${updatedCount} updated, ${totalMessages} new messages`);

    // Clear cache after saving conversations
    clearUserCache(userId);

    return res.json({
      message: 'Conversations saved successfully',
      inserted: insertedCount,
      updated: updatedCount,
      totalMessages
    });

  } catch (error) {
    logger.error('[User Data] Error in conversation save:', error);
    return res.status(500).json({
      message: 'Failed to save conversations',
      error: error.message
    });
  }
});

/**
 *       
 * DELETE /api/user-data/conversations/:id
 */
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  if (!conversationId) {
    return res.status(400).json({ message: 'Invalid conversation ID' });
  }

  try {
    //           
    const conversation = await db.prepare(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
    ).get(conversationId, userId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or no permission' });
    }

    //                ?
    await db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
      .run(conversationId, userId);

    logger.info(`[User Data] Deleted conversation ${conversationId} for user ${userId}`);

    // Clear cache
    clearUserCache(userId);

    return res.json({
      message: 'Conversation deleted',
      conversationId
    });

  } catch (error) {
    logger.error('[User Data] Error deleting conversation:', error);
    return res.status(500).json({
      message: 'Failed to delete conversation',
      error: error.message
    });
  }
});

/**
 *       
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
    res.status(500).json({ message: 'Failed to fetch config' });
  }
});

/**
 *       
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

    res.json({ message: 'Configuration saved' });
  } catch (err) {
    console.error('[User Data] Error saving config:', err);
    return res.status(500).json({ message: 'Failed to save config' });
  }
});

/**
 *            ?
 * GET /api/user-data/models
 *                
 */
router.get('/models', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const config = await db.prepare(
      'SELECT model_config FROM user_configs WHERE user_id = ?'
    ).get(userId);

    if (!config || !config.model_config) {
      return res.json({ models: [] });
    }

    const modelConfig = safeJSONParse(config.model_config, {});
    const models = [];

    //    modelConfig          
    // modelConfig   : { providers: { openai: { models: {...}, selectedModel: '...' } } }
    if (modelConfig.providers) {
      for (const [provider, providerConfig] of Object.entries(modelConfig.providers)) {
        if (providerConfig && providerConfig.models) {
          //            ?
          for (const [modelName, modelSettings] of Object.entries(providerConfig.models)) {
            models.push({
              id: `${provider}_${modelName}`,
              provider: provider,
              model: modelName,
              displayName: `${provider} - ${modelName}`,
              settings: modelSettings || {}
            });
          }
        }
      }
    }

    logger.info(`[User Data] Loaded ${models.length} models for user ${userId}`);
    res.json({ models });
  } catch (err) {
    logger.error('[User Data] Error fetching models:', err);
    res.status(500).json({ message: 'Failed to fetch models' });
  }
});

/**
 *                
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
    res.status(500).json({ message: 'Failed to check first user' });
  }
});

/**
 *     
 * GET /api/user-data/conversations/search
 * Query  :
 *   - q:      ?
 *   - dateFrom:     ?(YYYY-MM-DD)
 *   - dateTo:      (YYYY-MM-DD)
 *   - model:     ?
 *   - sort:      (relevance/date/messages)
 *   - order:      (asc/desc)
 *   - limit:       
 *   - offset:     
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

    console.log('[Search] Incoming request:', {
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

    //                       
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
    console.error('[Search] Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

/**
 *       
 * GET /api/user-data/conversations/search/stats
 */
router.get('/conversations/search/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: query, dateFrom, dateTo } = req.query;

    const stats = await getSearchStats(userId, query, { dateFrom, dateTo });

    res.json(stats);
  } catch (error) {
    console.error('[Search] Stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

module.exports = router;


