/**
 * Analytics API 路由
 * 提供数据分析和统计功能
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { createLogger } = require('../lib/logger.cjs');

const logger = createLogger('AnalyticsAPI');

/**
 * 获取统计概览
 * GET /api/analytics/overview
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户货币设置
    const userProfile = db.prepare(`
      SELECT currency FROM users WHERE id = ?
    `).get(userId);
    const userCurrency = userProfile?.currency || 'USD';

    // 总对话数
    const conversationCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM conversations
      WHERE user_id = ?
    `).get(userId);

    // 总消息数
    const messageCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ?
    `).get(userId);

    // API调用次数统计（计算assistant角色的消息数）
    const apiCallCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND m.role = 'assistant'
    `).get(userId);

    // Token统计（从消息中提取）
    const tokenStats = db.prepare(`
      SELECT
        SUM(CAST(json_extract(m.metadata, '$.usage.prompt_tokens') AS INTEGER)) as prompt_tokens,
        SUM(CAST(json_extract(m.metadata, '$.usage.completion_tokens') AS INTEGER)) as completion_tokens,
        SUM(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as total_tokens
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND m.metadata IS NOT NULL
    `).get(userId);

    // 模型使用统计
    const modelUsage = db.prepare(`
      SELECT
        m.model,
        COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND m.model IS NOT NULL AND m.role = 'assistant'
      GROUP BY m.model
      ORDER BY count DESC
      LIMIT 5
    `).all(userId);

    // 费用估算（基于token数，转换为用户货币）
    const estimatedCost = calculateCost(
      tokenStats.prompt_tokens || 0,
      tokenStats.completion_tokens || 0,
      userCurrency
    );

    // 今日数据
    const today = new Date().toISOString().split('T')[0];
    const todayStats = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND DATE(m.timestamp) = ?
    `).get(userId, today);

    // 今日API调用
    const todayApiCalls = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND DATE(m.timestamp) = ? AND m.role = 'assistant'
    `).get(userId, today);

    res.json({
      success: true,
      data: {
        conversations: conversationCount.count,
        messages: messageCount.count,
        apiCalls: apiCallCount.count,
        tokens: {
          prompt: tokenStats.prompt_tokens || 0,
          completion: tokenStats.completion_tokens || 0,
          total: tokenStats.total_tokens || 0
        },
        cost: estimatedCost,
        todayMessages: todayStats.count,
        todayApiCalls: todayApiCalls.count,
        topModels: modelUsage
      }
    });

  } catch (error) {
    logger.error('获取统计概览失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

/**
 * 获取使用趋势数据
 * GET /api/analytics/trends?period=7d|30d|90d
 */
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '7d';

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const trends = db.prepare(`
      SELECT
        DATE(m.timestamp) as date,
        COUNT(*) as message_count,
        COUNT(DISTINCT m.conversation_id) as conversation_count,
        SUM(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as total_tokens
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ?
        AND m.timestamp >= datetime('now', '-${days} days')
      GROUP BY DATE(m.timestamp)
      ORDER BY date ASC
    `).all(userId);

    // 填充缺失的日期
    const filledTrends = fillMissingDates(trends, days);

    res.json({
      success: true,
      data: filledTrends
    });

  } catch (error) {
    logger.error('获取使用趋势失败:', error);
    res.status(500).json({
      success: false,
      error: '获取趋势数据失败'
    });
  }
});

/**
 * 获取模型使用分布
 * GET /api/analytics/models
 */
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const modelStats = db.prepare(`
      SELECT
        m.model,
        COUNT(*) as count,
        SUM(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as total_tokens,
        AVG(CAST(json_extract(m.metadata, '$.usage.total_tokens') AS INTEGER)) as avg_tokens
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? AND m.model IS NOT NULL AND m.role = 'assistant'
      GROUP BY m.model
      ORDER BY count DESC
    `).all(userId);

    // 计算百分比
    const total = modelStats.reduce((sum, item) => sum + item.count, 0);
    const withPercentage = modelStats.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: withPercentage
    });

  } catch (error) {
    logger.error('获取模型统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取模型数据失败'
    });
  }
});

/**
 * 获取工具调用统计
 * GET /api/analytics/tools
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const toolStats = db.prepare(`
      SELECT
        json_extract(m.metadata, '$.tool_calls') as tool_calls
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ?
        AND json_extract(m.metadata, '$.tool_calls') IS NOT NULL
    `).all(userId);

    // 解析工具调用数据
    const toolCounts = {};
    toolStats.forEach(row => {
      try {
        const tools = JSON.parse(row.tool_calls);
        if (Array.isArray(tools)) {
          tools.forEach(tool => {
            const name = tool.function?.name || tool.name || 'unknown';
            toolCounts[name] = (toolCounts[name] || 0) + 1;
          });
        }
      } catch (e) {
        // 忽略解析错误
      }
    });

    // 转换为数组并排序
    const toolArray = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 只返回前10个

    res.json({
      success: true,
      data: toolArray
    });

  } catch (error) {
    logger.error('获取工具统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取工具数据失败'
    });
  }
});

/**
 * 获取时间热力图数据
 * GET /api/analytics/heatmap
 */
router.get('/heatmap', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const heatmapData = db.prepare(`
      SELECT
        CAST(strftime('%w', m.timestamp) AS INTEGER) as day_of_week,
        CAST(strftime('%H', m.timestamp) AS INTEGER) as hour,
        COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ?
        AND m.timestamp >= datetime('now', '-30 days')
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `).all(userId);

    // 转换为前端需要的格式
    const formattedData = heatmapData.map(item => ({
      day: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][item.day_of_week],
      hour: item.hour,
      count: item.count
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    logger.error('获取热力图数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取热力图数据失败'
    });
  }
});

/**
 * 导出数据
 * GET /api/analytics/export?format=csv|json
 */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'json';

    // 获取所有统计数据
    const conversations = db.prepare(`
      SELECT
        id,
        title,
        model,
        created_at,
        updated_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(userId);

    const messages = db.prepare(`
      SELECT
        m.id,
        m.conversation_id,
        m.role,
        m.content,
        m.model,
        m.timestamp,
        m.metadata
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ?
      ORDER BY m.timestamp DESC
    `).all(userId);

    const data = {
      conversations,
      messages,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // 转换为CSV格式
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csv);
    } else {
      // JSON格式
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json(data);
    }

  } catch (error) {
    logger.error('导出数据失败:', error);
    res.status(500).json({
      success: false,
      error: '导出数据失败'
    });
  }
});

// ========== 辅助函数 ==========

/**
 * 货币汇率（相对于USD）
 */
const EXCHANGE_RATES = {
  'USD': 1.0,      // 美元（基准）
  'CNY': 7.2,      // 人民币
  'EUR': 0.92,     // 欧元
  'GBP': 0.79,     // 英镑
  'JPY': 149.5,    // 日元
  'KRW': 1320.0,   // 韩元
  'HKD': 7.8,      // 港币
  'TWD': 31.5      // 新台币
};

/**
 * 货币符号映射
 */
const CURRENCY_SYMBOLS = {
  'USD': '$',
  'CNY': '¥',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'KRW': '₩',
  'HKD': 'HK$',
  'TWD': 'NT$'
};

/**
 * 计算费用估算
 * 基于不同模型的定价，并转换为指定货币
 */
function calculateCost(promptTokens, completionTokens, currency = 'USD') {
  // 平均价格（美元/1M tokens）
  const avgPricePerMillion = {
    prompt: 0.5,      // $0.5/1M tokens
    completion: 1.5   // $1.5/1M tokens
  };

  // 先计算USD价格
  const promptCostUSD = (promptTokens / 1000000) * avgPricePerMillion.prompt;
  const completionCostUSD = (completionTokens / 1000000) * avgPricePerMillion.completion;
  const totalCostUSD = promptCostUSD + completionCostUSD;

  // 转换为目标货币
  const exchangeRate = EXCHANGE_RATES[currency] || 1.0;
  const promptCost = promptCostUSD * exchangeRate;
  const completionCost = completionCostUSD * exchangeRate;
  const totalCost = totalCostUSD * exchangeRate;

  // 根据货币类型决定小数位数
  const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : 4;

  return {
    total: totalCost.toFixed(decimals),
    prompt: promptCost.toFixed(decimals),
    completion: completionCost.toFixed(decimals),
    currency: currency,
    currencySymbol: CURRENCY_SYMBOLS[currency] || currency
  };
}

/**
 * 填充缺失的日期
 */
function fillMissingDates(trends, days) {
  const today = new Date();
  const filled = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existing = trends.find(t => t.date === dateStr);
    filled.push({
      date: dateStr,
      message_count: existing?.message_count || 0,
      conversation_count: existing?.conversation_count || 0,
      total_tokens: existing?.total_tokens || 0
    });
  }

  return filled;
}

/**
 * 转换为CSV格式
 */
function convertToCSV(data) {
  const lines = [];

  // 对话数据
  lines.push('\n=== Conversations ===');
  lines.push('ID,Title,Model,Created At,Updated At');
  data.conversations.forEach(conv => {
    lines.push(`${conv.id},"${conv.title}",${conv.model},${conv.created_at},${conv.updated_at}`);
  });

  // 消息数据
  lines.push('\n=== Messages ===');
  lines.push('ID,Conversation ID,Role,Content Preview,Model,Timestamp');
  data.messages.forEach(msg => {
    const preview = msg.content.substring(0, 100).replace(/"/g, '""');
    lines.push(`${msg.id},${msg.conversation_id},${msg.role},"${preview}",${msg.model},${msg.timestamp}`);
  });

  return lines.join('\n');
}

/**
 * Stats endpoint - alias for overview
 * GET /api/analytics/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get basic statistics
    const conversationCount = await db.prepare(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?'
    ).get(userId);

    const messageCount = await db.prepare(
      'SELECT COUNT(*) as count FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ?'
    ).get(userId);

    res.json({
      conversationCount: conversationCount?.count || 0,
      messageCount: messageCount?.count || 0,
      stats: {
        conversations: conversationCount?.count || 0,
        messages: messageCount?.count || 0
      }
    });
  } catch (error) {
    console.error('[Analytics] Error fetching stats:', error);
    res.status(500).json({ error: '获取统计数据失败', message: error.message });
  }
});

module.exports = router;

