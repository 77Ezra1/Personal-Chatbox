const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { searchConversations, getSearchStats } = require('../services/search.cjs');

/**
 * 获取用户的所有对话
 * GET /api/user-data/conversations
 */
router.get('/conversations', authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
    [userId],
    (err, conversations) => {
      if (err) {
        console.error('[User Data] Error fetching conversations:', err);
        return res.status(500).json({ message: '获取对话列表失败' });
      }

      // 获取每个对话的消息
      const conversationPromises = conversations.map(conv => {
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
      });

      Promise.all(conversationPromises)
        .then(conversationsWithMessages => {
          res.json({ conversations: conversationsWithMessages });
        })
        .catch(err => {
          console.error('[User Data] Error fetching messages:', err);
          res.status(500).json({ message: '获取对话消息失败' });
        });
    }
  );
});

/**
 * 保存/更新对话数据
 * POST /api/user-data/conversations
 */
router.post('/conversations', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { conversations } = req.body;

  if (!conversations || typeof conversations !== 'object') {
    return res.status(400).json({ message: '无效的对话数据' });
  }

  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    try {
      // 删除用户现有的所有对话和消息
      db.run('DELETE FROM conversations WHERE user_id = ?', [userId], (err) => {
        if (err) {
          console.error('[User Data] Error deleting old conversations:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: '删除旧对话失败' });
        }

        // 插入新的对话和消息
        const conversationList = Object.values(conversations);
        let completed = 0;
        let hasError = false;

        if (conversationList.length === 0) {
          db.run('COMMIT');
          return res.json({ message: '对话数据已保存' });
        }

        conversationList.forEach(conv => {
          // 插入对话
          db.run(
            `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
            [conv.id, userId, conv.title, conv.createdAt, conv.updatedAt],
            function(err) {
              if (err && !hasError) {
                console.error('[User Data] Error inserting conversation:', err);
                hasError = true;
                db.run('ROLLBACK');
                return res.status(500).json({ message: '保存对话失败' });
              }

              // 插入消息
              if (conv.messages && conv.messages.length > 0) {
                const messageStmt = db.prepare(
                  `INSERT INTO messages (conversation_id, role, content, timestamp, metadata, status, attachments)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`
                );

                conv.messages.forEach(msg => {
                  messageStmt.run(
                    conv.id,
                    msg.role,
                    msg.content,
                    msg.timestamp,
                    msg.metadata ? JSON.stringify(msg.metadata) : null,
                    msg.status || 'done',
                    msg.attachments ? JSON.stringify(msg.attachments) : '[]'
                  );
                });

                messageStmt.finalize();
              }

              completed++;
              if (completed === conversationList.length && !hasError) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('[User Data] Error committing transaction:', err);
                    return res.status(500).json({ message: '提交事务失败' });
                  }
                  res.json({ message: '对话数据已保存' });
                });
              }
            }
          );
        });
      });
    } catch (error) {
      console.error('[User Data] Error in transaction:', error);
      db.run('ROLLBACK');
      res.status(500).json({ message: '保存对话数据失败' });
    }
  });
});

/**
 * 获取用户配置
 * GET /api/user-data/config
 */
router.get('/config', authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT * FROM user_configs WHERE user_id = ?',
    [userId],
    (err, config) => {
      if (err) {
        console.error('[User Data] Error fetching config:', err);
        return res.status(500).json({ message: '获取配置失败' });
      }

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
    }
  );
});

/**
 * 保存用户配置
 * POST /api/user-data/config
 */
router.post('/config', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { modelConfig, systemPrompt, apiKeys, proxyConfig, mcpConfig } = req.body;

  db.run(
    `INSERT INTO user_configs (user_id, model_config, system_prompt, api_keys, proxy_config, mcp_config, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       model_config = excluded.model_config,
       system_prompt = excluded.system_prompt,
       api_keys = excluded.api_keys,
       proxy_config = excluded.proxy_config,
       mcp_config = excluded.mcp_config,
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      modelConfig ? JSON.stringify(modelConfig) : null,
      systemPrompt ? JSON.stringify(systemPrompt) : null,
      apiKeys ? JSON.stringify(apiKeys) : null,
      proxyConfig ? JSON.stringify(proxyConfig) : null,
      mcpConfig ? JSON.stringify(mcpConfig) : null
    ],
    function(err) {
      if (err) {
        console.error('[User Data] Error saving config:', err);
        return res.status(500).json({ message: '保存配置失败' });
      }

      res.json({ message: '配置已保存' });
    }
  );
});

/**
 * 检查用户是否是第一个注册的用户
 * GET /api/user-data/is-first-user
 */
router.get('/is-first-user', authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT MIN(id) as first_user_id FROM users',
    [],
    (err, row) => {
      if (err) {
        console.error('[User Data] Error checking first user:', err);
        return res.status(500).json({ message: '检查用户失败' });
      }

      res.json({ isFirstUser: row.first_user_id === userId });
    }
  );
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

