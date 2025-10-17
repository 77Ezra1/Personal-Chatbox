/**
 * 记忆管理器
 * 处理长期记忆的存储、检索、更新和删除
 */

class MemoryManager {
  constructor() {
    this.db = require('../db/init.cjs');
  }

  /**
   * 保存记忆
   * @param {Object} memory - 记忆对象
   */
  async saveMemory(memory) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO memories (
          id, user_id, conversation_id, memory_type, title, content,
          importance_score, access_count, last_accessed, created_at, updated_at,
          expires_at, tags, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          memory.id, memory.userId, memory.conversationId, memory.memoryType,
          memory.title, memory.content, memory.importanceScore, memory.accessCount,
          memory.lastAccessed, memory.createdAt, memory.updatedAt,
          memory.expiresAt, JSON.stringify(memory.tags), JSON.stringify(memory.metadata)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 获取记忆
   * @param {string} memoryId - 记忆ID
   * @param {number} userId - 用户ID
   */
  async getMemory(memoryId, userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM memories WHERE id = ? AND user_id = ?',
        [memoryId, userId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.formatMemory(row));
        }
      );
    });
  }

  /**
   * 更新记忆
   * @param {string} memoryId - 记忆ID
   * @param {Object} updateData - 更新数据
   */
  async updateMemory(memoryId, updateData) {
    const updateFields = [];
    const params = [];

    if (updateData.title !== undefined) {
      updateFields.push('title = ?');
      params.push(updateData.title);
    }
    if (updateData.content !== undefined) {
      updateFields.push('content = ?');
      params.push(updateData.content);
    }
    if (updateData.importanceScore !== undefined) {
      updateFields.push('importance_score = ?');
      params.push(updateData.importanceScore);
    }
    if (updateData.accessCount !== undefined) {
      updateFields.push('access_count = ?');
      params.push(updateData.accessCount);
    }
    if (updateData.lastAccessed !== undefined) {
      updateFields.push('last_accessed = ?');
      params.push(updateData.lastAccessed);
    }
    if (updateData.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(updateData.tags));
    }
    if (updateData.metadata !== undefined) {
      updateFields.push('metadata = ?');
      params.push(JSON.stringify(updateData.metadata));
    }

    if (updateFields.length === 0) return;

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(memoryId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE memories SET ${updateFields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 删除记忆
   * @param {string} memoryId - 记忆ID
   * @param {number} userId - 用户ID
   */
  async deleteMemory(memoryId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM memories WHERE id = ? AND user_id = ?',
        [memoryId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 获取用户记忆列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserMemories(userId, options = {}) {
    const {
      memoryType = 'all',
      limit = 20,
      offset = 0,
      minImportance = 0.0,
      search = '',
      sortBy = 'importance_score',
      sortOrder = 'DESC'
    } = options;

    let sql = 'SELECT * FROM memories WHERE user_id = ?';
    const params = [userId];

    if (memoryType !== 'all') {
      sql += ' AND memory_type = ?';
      params.push(memoryType);
    }

    if (minImportance > 0) {
      sql += ' AND importance_score >= ?';
      params.push(minImportance);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.formatMemory(row)));
      });
    });
  }

  /**
   * 搜索记忆
   * @param {string} query - 搜索查询
   * @param {number} userId - 用户ID
   * @param {Object} options - 搜索选项
   */
  async searchMemories(query, userId, options = {}) {
    const {
      memoryType = 'all',
      limit = 10,
      minImportance = 0.0
    } = options;

    let sql = `SELECT *,
      (CASE
        WHEN title LIKE ? THEN 3
        WHEN content LIKE ? THEN 2
        ELSE 1
      END) as relevance_score
      FROM memories
      WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)`;

    const params = [
      `%${query}%`, `%${query}%`, userId,
      `%${query}%`, `%${query}%`
    ];

    if (memoryType !== 'all') {
      sql += ' AND memory_type = ?';
      params.push(memoryType);
    }

    if (minImportance > 0) {
      sql += ' AND importance_score >= ?';
      params.push(minImportance);
    }

    sql += ' ORDER BY relevance_score DESC, importance_score DESC LIMIT ?';
    params.push(limit);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.formatMemory(row)));
      });
    });
  }

  /**
   * 获取记忆统计
   * @param {number} userId - 用户ID
   */
  async getMemoryStats(userId) {
    const queries = [
      'SELECT COUNT(*) as total_memories FROM memories WHERE user_id = ?',
      'SELECT COUNT(*) as user_preferences FROM memories WHERE user_id = ? AND memory_type = "user_preference"',
      'SELECT COUNT(*) as conversation_summaries FROM memories WHERE user_id = ? AND memory_type = "conversation_summary"',
      'SELECT COUNT(*) as knowledge_fragments FROM memories WHERE user_id = ? AND memory_type = "knowledge_fragment"',
      'SELECT COUNT(*) as facts FROM memories WHERE user_id = ? AND memory_type = "fact"',
      'SELECT AVG(importance_score) as avg_importance FROM memories WHERE user_id = ?',
      'SELECT AVG(access_count) as avg_access_count FROM memories WHERE user_id = ?'
    ];

    try {
      const results = await Promise.all(queries.map(query =>
        new Promise((resolve, reject) => {
          this.db.get(query, [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      ));

      return {
        totalMemories: results[0].total_memories,
        userPreferences: results[1].user_preferences,
        conversationSummaries: results[2].conversation_summaries,
        knowledgeFragments: results[3].knowledge_fragments,
        facts: results[4].facts,
        avgImportance: results[5].avg_importance || 0,
        avgAccessCount: results[6].avg_access_count || 0
      };
    } catch (error) {
      console.error('获取记忆统计失败:', error);
      return {
        totalMemories: 0,
        userPreferences: 0,
        conversationSummaries: 0,
        knowledgeFragments: 0,
        facts: 0,
        avgImportance: 0,
        avgAccessCount: 0
      };
    }
  }

  /**
   * 获取热门记忆
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   */
  async getPopularMemories(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM memories
         WHERE user_id = ?
         ORDER BY access_count DESC, importance_score DESC
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatMemory(row)));
        }
      );
    });
  }

  /**
   * 获取最近记忆
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   */
  async getRecentMemories(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM memories
         WHERE user_id = ?
         ORDER BY last_accessed DESC, created_at DESC
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatMemory(row)));
        }
      );
    });
  }

  /**
   * 批量删除记忆
   * @param {Array} memoryIds - 记忆ID数组
   * @param {number} userId - 用户ID
   */
  async batchDeleteMemories(memoryIds, userId) {
    if (memoryIds.length === 0) return 0;

    const placeholders = memoryIds.map(() => '?').join(',');
    const params = [...memoryIds, userId];

    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM memories WHERE id IN (${placeholders}) AND user_id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 更新记忆访问次数
   * @param {string} memoryId - 记忆ID
   * @param {number} userId - 用户ID
   */
  async updateMemoryAccess(memoryId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE memories
         SET access_count = access_count + 1,
             last_accessed = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [memoryId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 清理过期记忆
   * @param {number} userId - 用户ID
   */
  async cleanupExpiredMemories(userId) {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM memories WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at < ?',
        [userId, now],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 获取记忆类型统计
   * @param {number} userId - 用户ID
   */
  async getMemoryTypeStats(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT memory_type, COUNT(*) as count, AVG(importance_score) as avg_importance
         FROM memories
         WHERE user_id = ?
         GROUP BY memory_type
         ORDER BY count DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * 格式化记忆数据
   * @param {Object} row - 数据库行数据
   */
  formatMemory(row) {
    return {
      id: row.id,
      userId: row.user_id,
      conversationId: row.conversation_id,
      memoryType: row.memory_type,
      title: row.title,
      content: row.content,
      importanceScore: row.importance_score,
      accessCount: row.access_count,
      lastAccessed: row.last_accessed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}')
    };
  }
}

module.exports = MemoryManager;
