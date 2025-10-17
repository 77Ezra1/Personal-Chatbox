/**
 * AI 角色预设服务
 * 处理角色管理、创建、使用和统计
 */

const { v4: uuidv4 } = require('uuid');

class PersonaService {
  constructor() {
    this.builtinPersonas = this.loadBuiltinPersonas();
  }

  /**
   * 获取用户角色列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserPersonas(userId, options = {}) {
    const { category, search, isPublic, includeBuiltin = true } = options;

    let sql = `
      SELECT p.*,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(pr.id) as rating_count
      FROM personas p
      LEFT JOIN persona_ratings pr ON p.id = pr.persona_id
      WHERE (p.user_id = ? OR p.is_public = true)
    `;

    const params = [userId];

    if (!includeBuiltin) {
      sql += ' AND p.is_builtin = false';
    }

    if (category && category !== 'all') {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (isPublic !== undefined) {
      sql += ' AND p.is_public = ?';
      params.push(isPublic);
    }

    sql += ' GROUP BY p.id ORDER BY p.usage_count DESC, p.created_at DESC';

    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.formatPersona(row)));
        }
      });
    });
  }

  /**
   * 获取角色详情
   * @param {string} personaId - 角色ID
   * @param {number} userId - 用户ID
   */
  async getPersona(personaId, userId) {
    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');

      db.get(
        `SELECT p.*,
                COALESCE(AVG(pr.rating), 0) as avg_rating,
                COUNT(pr.id) as rating_count
         FROM personas p
         LEFT JOIN persona_ratings pr ON p.id = pr.persona_id
         WHERE p.id = ? AND (p.user_id = ? OR p.is_public = true OR p.is_builtin = true)
         GROUP BY p.id`,
        [personaId, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('角色不存在或无权限'));
          } else {
            resolve(this.formatPersona(row));
          }
        }
      );
    });
  }

  /**
   * 创建角色
   * @param {number} userId - 用户ID
   * @param {Object} personaData - 角色数据
   */
  async createPersona(userId, personaData) {
    const id = uuidv4();
    const {
      name,
      description = '',
      avatarUrl = '',
      systemPrompt,
      personality = {},
      expertise = [],
      conversationStyle = {},
      category = 'custom',
      tags = [],
      isPublic = false
    } = personaData;

    if (!name || !systemPrompt) {
      throw new Error('角色名称和系统提示不能为空');
    }

    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO personas (
          id, user_id, name, description, avatar_url, system_prompt,
          personality, expertise, conversation_style, category, tags,
          is_public, is_builtin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId, name, description, avatarUrl, systemPrompt,
          JSON.stringify(personality),
          JSON.stringify(expertise),
          JSON.stringify(conversationStyle),
          category,
          JSON.stringify(tags),
          isPublic,
          false
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              name,
              description,
              avatarUrl,
              systemPrompt,
              personality,
              expertise,
              conversationStyle,
              category,
              tags,
              isPublic,
              isBuiltin: false,
              usageCount: 0,
              rating: 0,
              ratingCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  /**
   * 更新角色
   * @param {string} personaId - 角色ID
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   */
  async updatePersona(personaId, userId, updateData) {
    const {
      name,
      description,
      avatarUrl,
      systemPrompt,
      personality,
      expertise,
      conversationStyle,
      category,
      tags,
      isPublic
    } = updateData;

    const { db } = require('../db/init.cjs');

    // 构建更新字段
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (avatarUrl !== undefined) {
      updateFields.push('avatar_url = ?');
      params.push(avatarUrl);
    }
    if (systemPrompt !== undefined) {
      updateFields.push('system_prompt = ?');
      params.push(systemPrompt);
    }
    if (personality !== undefined) {
      updateFields.push('personality = ?');
      params.push(JSON.stringify(personality));
    }
    if (expertise !== undefined) {
      updateFields.push('expertise = ?');
      params.push(JSON.stringify(expertise));
    }
    if (conversationStyle !== undefined) {
      updateFields.push('conversation_style = ?');
      params.push(JSON.stringify(conversationStyle));
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(tags));
    }
    if (isPublic !== undefined) {
      updateFields.push('is_public = ?');
      params.push(isPublic);
    }

    if (updateFields.length === 0) {
      throw new Error('没有提供更新字段');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(personaId, userId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE personas SET ${updateFields.join(', ')}
         WHERE id = ? AND user_id = ? AND is_builtin = false`,
        params,
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('角色不存在或无权限修改'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 删除角色
   * @param {string} personaId - 角色ID
   * @param {number} userId - 用户ID
   */
  async deletePersona(personaId, userId) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM personas WHERE id = ? AND user_id = ? AND is_builtin = false',
        [personaId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('角色不存在或无权限删除'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 使用角色
   * @param {number} userId - 用户ID
   * @param {string} personaId - 角色ID
   * @param {string} conversationId - 对话ID（可选）
   */
  async usePersona(userId, personaId, conversationId = null) {
    const { db } = require('../db/init.cjs');

    // 记录使用
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO persona_usage (user_id, persona_id, conversation_id)
         VALUES (?, ?, ?)`,
        [userId, personaId, conversationId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // 更新使用次数
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE personas SET usage_count = usage_count + 1 WHERE id = ?',
        [personaId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    return { success: true };
  }

  /**
   * 评分角色
   * @param {number} userId - 用户ID
   * @param {string} personaId - 角色ID
   * @param {number} rating - 评分（1-5）
   * @param {string} feedback - 反馈（可选）
   */
  async ratePersona(userId, personaId, rating, feedback = '') {
    if (rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间');
    }

    const { db } = require('../db/init.cjs');

    // 检查是否已评分
    const existingRating = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM persona_ratings WHERE user_id = ? AND persona_id = ?',
        [userId, personaId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRating) {
      // 更新现有评分
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE persona_ratings SET rating = ?, feedback = ? WHERE user_id = ? AND persona_id = ?',
          [rating, feedback, userId, personaId],
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });
    } else {
      // 创建新评分
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO persona_ratings (user_id, persona_id, rating, feedback) VALUES (?, ?, ?, ?)',
          [userId, personaId, rating, feedback],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    return { success: true };
  }

  /**
   * 获取角色使用统计
   * @param {number} userId - 用户ID
   * @param {string} personaId - 角色ID（可选）
   */
  async getPersonaStats(userId, personaId = null) {
    const { db } = require('../db/init.cjs');

    let sql = `
      SELECT
        p.id,
        p.name,
        p.category,
        COUNT(pu.id) as usage_count,
        AVG(pr.rating) as avg_rating,
        COUNT(pr.id) as rating_count,
        MAX(pu.used_at) as last_used
      FROM personas p
      LEFT JOIN persona_usage pu ON p.id = pu.persona_id AND pu.user_id = ?
      LEFT JOIN persona_ratings pr ON p.id = pr.persona_id
      WHERE p.user_id = ? OR p.is_public = true OR p.is_builtin = true
    `;

    const params = [userId, userId];

    if (personaId) {
      sql += ' AND p.id = ?';
      params.push(personaId);
    }

    sql += ' GROUP BY p.id ORDER BY usage_count DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            usageCount: row.usage_count,
            avgRating: row.avg_rating || 0,
            ratingCount: row.rating_count,
            lastUsed: row.last_used
          })));
        }
      });
    });
  }

  /**
   * 获取角色分类
   */
  getPersonaCategories() {
    return [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'assistant', name: '助手', icon: '🤖' },
      { id: 'professional', name: '专业', icon: '👔' },
      { id: 'creative', name: '创意', icon: '🎨' },
      { id: 'entertainment', name: '娱乐', icon: '🎭' },
      { id: 'custom', name: '自定义', icon: '⚙️' }
    ];
  }

  /**
   * 加载内置角色
   */
  loadBuiltinPersonas() {
    return [
      {
        id: 'assistant',
        name: '智能助手',
        description: '友好、专业的AI助手',
        category: 'assistant',
        isBuiltin: true
      },
      {
        id: 'teacher',
        name: '专业教师',
        description: '耐心、知识渊博的教育专家',
        category: 'professional',
        isBuiltin: true
      },
      {
        id: 'creative-writer',
        name: '创意作家',
        description: '富有想象力的文学创作者',
        category: 'creative',
        isBuiltin: true
      },
      {
        id: 'programmer',
        name: '程序员',
        description: '经验丰富的软件工程师',
        category: 'professional',
        isBuiltin: true
      },
      {
        id: 'psychologist',
        name: '心理学家',
        description: '专业的心理健康专家',
        category: 'professional',
        isBuiltin: true
      },
      {
        id: 'friend',
        name: '贴心朋友',
        description: '温暖、幽默的朋友',
        category: 'entertainment',
        isBuiltin: true
      }
    ];
  }

  /**
   * 格式化角色数据
   * @param {Object} row - 数据库行数据
   */
  formatPersona(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      avatarUrl: row.avatar_url,
      systemPrompt: row.system_prompt,
      personality: JSON.parse(row.personality || '{}'),
      expertise: JSON.parse(row.expertise || '[]'),
      conversationStyle: JSON.parse(row.conversation_style || '{}'),
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      isPublic: row.is_public,
      isBuiltin: row.is_builtin,
      usageCount: row.usage_count,
      rating: row.avg_rating || 0,
      ratingCount: row.rating_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 验证角色数据
   * @param {Object} personaData - 角色数据
   */
  validatePersonaData(personaData) {
    const errors = [];

    if (!personaData.name || personaData.name.trim().length === 0) {
      errors.push('角色名称不能为空');
    }

    if (!personaData.systemPrompt || personaData.systemPrompt.trim().length === 0) {
      errors.push('系统提示不能为空');
    }

    if (personaData.name && personaData.name.length > 50) {
      errors.push('角色名称不能超过50个字符');
    }

    if (personaData.description && personaData.description.length > 200) {
      errors.push('角色描述不能超过200个字符');
    }

    if (personaData.systemPrompt && personaData.systemPrompt.length > 2000) {
      errors.push('系统提示不能超过2000个字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = PersonaService;
