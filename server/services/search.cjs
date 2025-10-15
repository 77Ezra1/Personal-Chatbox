/**
 * 搜索服务
 * 提供对话搜索和过滤功能
 */

const { db } = require('../db/init.cjs');

// 搜索缓存（简单内存缓存）
const searchCache = new Map();
const CACHE_TTL = 60000; // 1分钟

/**
 * 生成缓存键
 */
const getCacheKey = (userId, query, filters) => {
  return JSON.stringify({ userId, query, filters });
};

/**
 * 获取缓存的搜索结果
 */
const getCachedSearch = (cacheKey) => {
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  searchCache.delete(cacheKey);
  return null;
};

/**
 * 设置搜索结果缓存
 */
const setCachedSearch = (cacheKey, data) => {
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * 搜索对话
 * @param {number} userId - 用户 ID
 * @param {string} query - 搜索关键词
 * @param {object} filters - 过滤条件
 * @returns {Promise<Array>} 搜索结果
 */
const searchConversations = async (userId, query, filters = {}) => {
  return new Promise((resolve, reject) => {
    // 检查缓存
    const cacheKey = getCacheKey(userId, query, filters);
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      console.log('🎯 使用缓存的搜索结果');
      return resolve(cached);
    }

    const {
      dateFrom,
      dateTo,
      model,
      sort = 'date',
      order = 'desc',
      limit = 20,
      offset = 0
    } = filters;

    // 构建基础查询
    let sql = `
      SELECT
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count
    `;

    // 如果有搜索关键词，添加摘要
    if (query && query.trim()) {
      sql += `, snippet(conversations_fts, 1, '<mark>', '</mark>', '...', 50) as snippet`;
    }

    sql += `
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
    `;

    // 如果有搜索关键词，连接 FTS 表
    if (query && query.trim()) {
      sql += ` INNER JOIN conversations_fts fts ON c.id = fts.id`;
    }

    sql += ` WHERE c.user_id = ?`;

    const params = [userId];

    // 添加搜索条件
    if (query && query.trim()) {
      // 转义特殊字符并构建 FTS 查询
      const ftsQuery = query.trim().replace(/[^a-zA-Z0-9\s\u4e00-\u9fa5]/g, '');
      sql += ` AND conversations_fts MATCH ?`;
      params.push(ftsQuery);
    }

    // 添加日期过滤
    if (dateFrom) {
      sql += ` AND c.created_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      // 添加一天，包含当天的所有记录
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      sql += ` AND c.created_at < ?`;
      params.push(endDate.toISOString());
    }

    // 分组
    sql += ` GROUP BY c.id`;

    // 排序
    if (sort === 'relevance' && query && query.trim()) {
      sql += ` ORDER BY rank`;
    } else if (sort === 'date') {
      sql += ` ORDER BY c.created_at ${order === 'asc' ? 'ASC' : 'DESC'}`;
    } else if (sort === 'messages') {
      sql += ` ORDER BY message_count ${order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      sql += ` ORDER BY c.updated_at DESC`;
    }

    // 分页
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    console.log('🔍 执行搜索 SQL:', sql);
    console.log('📊 参数:', params);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ 搜索失败:', err);
        return reject(err);
      }

      // 缓存结果
      setCachedSearch(cacheKey, rows);

      resolve(rows);
    });
  });
};

/**
 * 获取搜索统计
 * @param {number} userId - 用户 ID
 * @param {string} query - 搜索关键词
 * @param {object} filters - 过滤条件
 * @returns {Promise<object>} 统计信息
 */
const getSearchStats = async (userId, query, filters = {}) => {
  return new Promise((resolve, reject) => {
    const { dateFrom, dateTo } = filters;

    let sql = `
      SELECT COUNT(DISTINCT c.id) as total_count
      FROM conversations c
    `;

    if (query && query.trim()) {
      sql += ` INNER JOIN conversations_fts fts ON c.id = fts.id`;
    }

    sql += ` WHERE c.user_id = ?`;

    const params = [userId];

    if (query && query.trim()) {
      const ftsQuery = query.trim().replace(/[^a-zA-Z0-9\s\u4e00-\u9fa5]/g, '');
      sql += ` AND conversations_fts MATCH ?`;
      params.push(ftsQuery);
    }

    if (dateFrom) {
      sql += ` AND c.created_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      sql += ` AND c.created_at < ?`;
      params.push(endDate.toISOString());
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ 获取统计失败:', err);
        return reject(err);
      }

      resolve({
        totalCount: row?.total_count || 0
      });
    });
  });
};

/**
 * 清理搜索缓存
 */
const clearSearchCache = () => {
  searchCache.clear();
  console.log('🧹 搜索缓存已清理');
};

module.exports = {
  searchConversations,
  getSearchStats,
  clearSearchCache
};
