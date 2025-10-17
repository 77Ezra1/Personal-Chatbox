/**
 * 总结模板管理器
 * 处理总结模板的创建、管理和使用
 */

class TemplateManager {
  constructor() {
    this.db = require('../db/init.cjs');
  }

  /**
   * 获取默认模板
   * @param {string} summaryType - 总结类型
   */
  async getDefaultTemplate(summaryType) {
    const templates = {
      brief: {
        name: '简短总结',
        promptTemplate: `请为以下对话生成简短总结（100-200字）：

对话内容：
{conversation}

要求：
- 简洁明了
- 突出要点
- 易于理解`
      },
      detailed: {
        name: '详细总结',
        promptTemplate: `请为以下对话生成详细总结（300-500字）：

对话内容：
{conversation}

要求：
- 内容全面
- 结构清晰
- 包含细节
- 逻辑连贯`
      },
      complete: {
        name: '完整总结',
        promptTemplate: `请为以下对话生成完整总结（500-800字）：

对话内容：
{conversation}

要求：
- 内容完整
- 分析深入
- 包含见解
- 提供建议`
      }
    };

    return templates[summaryType] || templates.detailed;
  }

  /**
   * 获取模板
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
   * 获取用户模板列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserTemplates(userId, options = {}) {
    const {
      templateType = 'all',
      isPublic = 'all',
      limit = 20,
      offset = 0,
      search = ''
    } = options;

    let sql = 'SELECT * FROM summary_templates WHERE (user_id = ? OR is_public = TRUE)';
    const params = [userId];

    if (templateType !== 'all') {
      sql += ' AND template_type = ?';
      params.push(templateType);
    }

    if (isPublic !== 'all') {
      sql += ' AND is_public = ?';
      params.push(isPublic === 'true');
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY usage_count DESC, rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.formatTemplate(row)));
      });
    });
  }

  /**
   * 创建模板
   * @param {Object} templateData - 模板数据
   */
  async createTemplate(templateData) {
    const id = require('uuid').v4();
    const {
      userId,
      name,
      description = '',
      templateType,
      promptTemplate,
      isPublic = false
    } = templateData;

    if (!name || !templateType || !promptTemplate) {
      throw new Error('模板名称、类型和提示词不能为空');
    }

    const template = {
      id,
      userId,
      name,
      description,
      templateType,
      promptTemplate,
      isPublic,
      usageCount: 0,
      rating: 0.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO summary_templates (
          id, user_id, name, description, template_type, prompt_template,
          is_public, usage_count, rating, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          template.id, template.userId, template.name, template.description,
          template.templateType, template.promptTemplate, template.isPublic,
          template.usageCount, template.rating, template.createdAt, template.updatedAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(template);
        }
      );
    });
  }

  /**
   * 更新模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   */
  async updateTemplate(templateId, userId, updateData) {
    const {
      name,
      description,
      templateType,
      promptTemplate,
      isPublic
    } = updateData;

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
    if (templateType !== undefined) {
      updateFields.push('template_type = ?');
      params.push(templateType);
    }
    if (promptTemplate !== undefined) {
      updateFields.push('prompt_template = ?');
      params.push(promptTemplate);
    }
    if (isPublic !== undefined) {
      updateFields.push('is_public = ?');
      params.push(isPublic);
    }

    if (updateFields.length === 0) {
      throw new Error('没有提供更新字段');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(templateId, userId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE summary_templates SET ${updateFields.join(', ')}
         WHERE id = ? AND user_id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else if (this.changes === 0) {
            reject(new Error('模板不存在或无权限修改'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 删除模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   */
  async deleteTemplate(templateId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM summary_templates WHERE id = ? AND user_id = ?',
        [templateId, userId],
        function(err) {
          if (err) reject(err);
          else if (this.changes === 0) {
            reject(new Error('模板不存在或无权限删除'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 更新模板使用次数
   * @param {string} templateId - 模板ID
   */
  async updateTemplateUsage(templateId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE summary_templates SET usage_count = usage_count + 1 WHERE id = ?',
        [templateId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 更新模板评分
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {number} rating - 评分
   */
  async updateTemplateRating(templateId, userId, rating) {
    if (rating < 0 || rating > 5) {
      throw new Error('评分必须在0-5之间');
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE summary_templates SET rating = ? WHERE id = ? AND user_id = ?',
        [rating, templateId, userId],
        function(err) {
          if (err) reject(err);
          else if (this.changes === 0) {
            reject(new Error('模板不存在或无权限修改'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 获取热门模板
   * @param {number} limit - 限制数量
   */
  async getPopularTemplates(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM summary_templates
         WHERE is_public = TRUE
         ORDER BY usage_count DESC, rating DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.formatTemplate(row)));
        }
      );
    });
  }

  /**
   * 获取模板统计
   * @param {number} userId - 用户ID
   */
  async getTemplateStats(userId) {
    const queries = [
      'SELECT COUNT(*) as total_templates FROM summary_templates WHERE user_id = ?',
      'SELECT COUNT(*) as public_templates FROM summary_templates WHERE user_id = ? AND is_public = TRUE',
      'SELECT COUNT(*) as total_usage FROM summary_templates WHERE user_id = ?',
      'SELECT AVG(rating) as avg_rating FROM summary_templates WHERE user_id = ? AND rating > 0'
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
        totalTemplates: results[0].total_templates,
        publicTemplates: results[1].public_templates,
        totalUsage: results[2].total_usage,
        avgRating: results[3].avg_rating || 0
      };
    } catch (error) {
      console.error('获取模板统计失败:', error);
      return {
        totalTemplates: 0,
        publicTemplates: 0,
        totalUsage: 0,
        avgRating: 0
      };
    }
  }

  /**
   * 搜索模板
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   */
  async searchTemplates(query, options = {}) {
    const {
      templateType = 'all',
      isPublic = 'all',
      limit = 20,
      offset = 0
    } = options;

    let sql = 'SELECT * FROM summary_templates WHERE (name LIKE ? OR description LIKE ?)';
    const params = [`%${query}%`, `%${query}%`];

    if (templateType !== 'all') {
      sql += ' AND template_type = ?';
      params.push(templateType);
    }

    if (isPublic !== 'all') {
      sql += ' AND is_public = ?';
      params.push(isPublic === 'true');
    }

    sql += ' ORDER BY usage_count DESC, rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.formatTemplate(row)));
      });
    });
  }

  /**
   * 复制模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {string} newName - 新模板名称
   */
  async copyTemplate(templateId, userId, newName) {
    const originalTemplate = await this.getTemplate(templateId, userId);
    if (!originalTemplate) {
      throw new Error('模板不存在');
    }

    const templateData = {
      userId,
      name: newName || `${originalTemplate.name} (副本)`,
      description: originalTemplate.description,
      templateType: originalTemplate.templateType,
      promptTemplate: originalTemplate.promptTemplate,
      isPublic: false
    };

    return await this.createTemplate(templateData);
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
}

module.exports = TemplateManager;
