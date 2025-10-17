/**
 * 模板市场引擎
 * 处理模板市场、评分、收藏、推荐等功能
 */

const { v4: uuidv4 } = require('uuid');

class TemplateMarketplace {
  constructor() {
    this.db = require('../db/init.cjs');
    // 暂时禁用评分和推荐系统，避免依赖问题
    // this.ratingSystem = new RatingSystem();
    // this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * 获取模板市场列表
   * @param {Object} options - 查询选项
   */
  async getMarketplaceTemplates(options = {}) {
    const {
      category = 'all',
      search = '',
      sortBy = 'popular',
      limit = 20,
      offset = 0,
      userId = null
    } = options;

    let sql = `
      SELECT
        tm.*,
        st.name as template_name,
        st.description as template_description,
        st.template_type,
        st.prompt_template,
        st.is_public,
        u.username as author_name,
        u.avatar_url as author_avatar
      FROM template_marketplace tm
      JOIN summary_templates st ON tm.template_id = st.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.is_featured = TRUE OR st.is_public = TRUE
    `;

    const params = [];

    if (category !== 'all') {
      sql += ' AND tm.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (tm.title LIKE ? OR tm.description LIKE ? OR st.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        sql += ' ORDER BY tm.download_count DESC, tm.rating_average DESC';
        break;
      case 'rating':
        sql += ' ORDER BY tm.rating_average DESC, tm.rating_count DESC';
        break;
      case 'newest':
        sql += ' ORDER BY tm.published_at DESC';
        break;
      case 'trending':
        sql += ' ORDER BY tm.view_count DESC, tm.download_count DESC';
        break;
      default:
        sql += ' ORDER BY tm.download_count DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.formatMarketplaceTemplate(row)));
      });
    });
  }

  /**
   * 获取模板分类
   */
  async getTemplateCategories() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM template_categories WHERE is_active = TRUE ORDER BY sort_order ASC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatCategory(row)));
        }
      );
    });
  }

  /**
   * 发布模板到市场
   * @param {Object} templateData - 模板数据
   */
  async publishTemplate(templateData) {
    const {
      templateId,
      userId,
      title,
      description,
      category,
      tags = [],
      previewImage = null
    } = templateData;

    // 检查模板是否存在且属于用户
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error('模板不存在或无权限发布');
    }

    // 检查是否已经发布
    const existing = await this.getMarketplaceTemplate(templateId);
    if (existing) {
      throw new Error('模板已经发布到市场');
    }

    const marketplaceId = uuidv4();
    const marketplaceData = {
      id: marketplaceId,
      templateId,
      userId,
      title,
      description,
      category,
      tags: JSON.stringify(tags),
      previewImage,
      isFeatured: false,
      isVerified: false,
      downloadCount: 0,
      ratingAverage: 0.0,
      ratingCount: 0,
      viewCount: 0,
      publishedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO template_marketplace (
          id, template_id, user_id, title, description, category,
          tags, preview_image, is_featured, is_verified, download_count,
          rating_average, rating_count, view_count, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          marketplaceData.id, marketplaceData.templateId, marketplaceData.userId,
          marketplaceData.title, marketplaceData.description, marketplaceData.category,
          marketplaceData.tags, marketplaceData.previewImage, marketplaceData.isFeatured,
          marketplaceData.isVerified, marketplaceData.downloadCount,
          marketplaceData.ratingAverage, marketplaceData.ratingCount,
          marketplaceData.viewCount, marketplaceData.publishedAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(marketplaceData);
        }
      );
    });
  }

  /**
   * 使用模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {string} conversationId - 对话ID
   */
  async useTemplate(templateId, userId, conversationId = null) {
    // 记录使用日志
    await this.logTemplateUsage(templateId, userId, conversationId, 'use');

    // 更新下载计数
    await this.updateDownloadCount(templateId);

    // 获取模板详情
    const template = await this.getTemplate(templateId, userId);
    return template;
  }

  /**
   * 评分模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {number} rating - 评分
   * @param {string} comment - 评论
   */
  async rateTemplate(templateId, userId, rating, comment = '') {
    if (rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间');
    }

    // 检查是否已经评分
    const existingRating = await this.getUserRating(templateId, userId);
    if (existingRating) {
      // 更新现有评分
      await this.updateRating(existingRating.id, rating, comment);
    } else {
      // 创建新评分
      await this.createRating(templateId, userId, rating, comment);
    }

    // 更新模板平均评分
    await this.updateTemplateRating(templateId);

    return { success: true };
  }

  /**
   * 收藏模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async favoriteTemplate(templateId, userId) {
    // 检查是否已经收藏
    const existing = await this.getUserFavorite(templateId, userId);
    if (existing) {
      throw new Error('已经收藏过此模板');
    }

    const favoriteId = uuidv4();

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO template_favorites (id, template_id, user_id, created_at) VALUES (?, ?, ?, ?)',
        [favoriteId, templateId, userId, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true, id: favoriteId });
        }
      );
    });
  }

  /**
   * 取消收藏模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async unfavoriteTemplate(templateId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM template_favorites WHERE template_id = ? AND user_id = ?',
        [templateId, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  /**
   * 获取推荐模板
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   */
  async getRecommendedTemplates(userId, limit = 10) {
    // 基于用户历史使用记录推荐
    const userHistory = await this.getUserUsageHistory(userId);
    const categories = userHistory.map(record => record.category);

    // 获取相关类别的热门模板
    const recommendations = await this.getMarketplaceTemplates({
      category: categories[0] || 'all',
      sortBy: 'popular',
      limit: limit * 2
    });

    // 过滤已使用的模板
    const usedTemplateIds = userHistory.map(record => record.template_id);
    const filteredRecommendations = recommendations.filter(
      template => !usedTemplateIds.includes(template.templateId)
    );

    return filteredRecommendations.slice(0, limit);
  }

  /**
   * 获取热门模板
   * @param {number} limit - 限制数量
   */
  async getTrendingTemplates(limit = 10) {
    return await this.getMarketplaceTemplates({
      sortBy: 'trending',
      limit
    });
  }

  /**
   * 获取模板详情
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async getTemplate(templateId, userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM summary_templates WHERE id = ? AND (user_id = ? OR is_public = TRUE)',
        [templateId, userId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.formatTemplate(row));
        }
      );
    });
  }

  /**
   * 获取市场模板
   * @param {string} templateId - 模板ID
   */
  async getMarketplaceTemplate(templateId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM template_marketplace WHERE template_id = ?',
        [templateId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.formatMarketplaceTemplate(row));
        }
      );
    });
  }

  /**
   * 获取用户评分
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async getUserRating(templateId, userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM template_ratings WHERE template_id = ? AND user_id = ?',
        [templateId, userId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.formatRating(row));
        }
      );
    });
  }

  /**
   * 获取用户收藏
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async getUserFavorite(templateId, userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM template_favorites WHERE template_id = ? AND user_id = ?',
        [templateId, userId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.formatFavorite(row));
        }
      );
    });
  }

  /**
   * 获取用户使用历史
   * @param {number} userId - 用户ID
   */
  async getUserUsageHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT tul.*, tm.category
         FROM template_usage_logs tul
         JOIN template_marketplace tm ON tul.template_id = tm.template_id
         WHERE tul.user_id = ?
         ORDER BY tul.created_at DESC
         LIMIT 50`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatUsageLog(row)));
        }
      );
    });
  }

  /**
   * 创建评分
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {number} rating - 评分
   * @param {string} comment - 评论
   */
  async createRating(templateId, userId, rating, comment = '') {
    const ratingId = uuidv4();

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO template_ratings (
          id, template_id, user_id, rating, comment, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ratingId, templateId, userId, rating, comment, false, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({ id: ratingId, success: true });
        }
      );
    });
  }

  /**
   * 更新评分
   * @param {string} ratingId - 评分ID
   * @param {number} rating - 新评分
   * @param {string} comment - 新评论
   */
  async updateRating(ratingId, rating, comment = '') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE template_ratings SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [rating, comment, ratingId],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  /**
   * 更新模板评分
   * @param {string} templateId - 模板ID
   */
  async updateTemplateRating(templateId) {
    const ratings = await this.getTemplateRatings(templateId);

    if (ratings.length === 0) {
      return;
    }

    const average = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE template_marketplace SET rating_average = ?, rating_count = ? WHERE template_id = ?',
        [average, ratings.length, templateId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 获取模板评分
   * @param {string} templateId - 模板ID
   */
  async getTemplateRatings(templateId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT tr.*, u.username, u.avatar_url
         FROM template_ratings tr
         JOIN users u ON tr.user_id = u.id
         WHERE tr.template_id = ?
         ORDER BY tr.created_at DESC`,
        [templateId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatRating(row)));
        }
      );
    });
  }

  /**
   * 记录模板使用
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {string} conversationId - 对话ID
   * @param {string} usageType - 使用类型
   */
  async logTemplateUsage(templateId, userId, conversationId, usageType) {
    const usageId = uuidv4();

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO template_usage_logs (
          id, template_id, user_id, conversation_id, usage_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [usageId, templateId, userId, conversationId, usageType, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({ id: usageId, success: true });
        }
      );
    });
  }

  /**
   * 更新下载计数
   * @param {string} templateId - 模板ID
   */
  async updateDownloadCount(templateId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE template_marketplace SET download_count = download_count + 1 WHERE template_id = ?',
        [templateId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 更新查看计数
   * @param {string} templateId - 模板ID
   */
  async updateViewCount(templateId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE template_marketplace SET view_count = view_count + 1 WHERE template_id = ?',
        [templateId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 格式化市场模板数据
   * @param {Object} row - 数据库行数据
   */
  formatMarketplaceTemplate(row) {
    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      previewImage: row.preview_image,
      isFeatured: row.is_featured,
      isVerified: row.is_verified,
      downloadCount: row.download_count,
      ratingAverage: row.rating_average,
      ratingCount: row.rating_count,
      viewCount: row.view_count,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      templateName: row.template_name,
      templateDescription: row.template_description,
      templateType: row.template_type,
      promptTemplate: row.prompt_template,
      isPublic: row.is_public,
      authorName: row.author_name,
      authorAvatar: row.author_avatar
    };
  }

  /**
   * 格式化分类数据
   * @param {Object} row - 数据库行数据
   */
  formatCategory(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at
    };
  }

  /**
   * 格式化模板数据
   * @param {Object} row - 数据库行数据
   */
  formatTemplate(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      templateType: row.template_type,
      promptTemplate: row.prompt_template,
      isPublic: row.is_public,
      usageCount: row.usage_count,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 格式化评分数据
   * @param {Object} row - 数据库行数据
   */
  formatRating(row) {
    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      rating: row.rating,
      comment: row.comment,
      isVerified: row.is_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      username: row.username,
      avatarUrl: row.avatar_url
    };
  }

  /**
   * 格式化收藏数据
   * @param {Object} row - 数据库行数据
   */
  formatFavorite(row) {
    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      createdAt: row.created_at
    };
  }

  /**
   * 格式化使用记录数据
   * @param {Object} row - 数据库行数据
   */
  formatUsageLog(row) {
    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      conversationId: row.conversation_id,
      usageType: row.usage_type,
      category: row.category,
      createdAt: row.created_at
    };
  }
}

module.exports = TemplateMarketplace;
