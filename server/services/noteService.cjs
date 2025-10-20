/**
 * 笔记服务
 * 提供完整的笔记管理功能
 */

const logger = require('../utils/logger.cjs');

class NoteService {
  constructor(db) {
    this.db = db;
  }

  /**
   * 获取用户的所有笔记
   */
  async getAllNotes(userId, options = {}) {
    try {
      const {
        category,
        tag,
        isFavorite,
        isArchived = 0,
        sortBy = 'updated_at',
        sortOrder = 'DESC',
        limit,
        offset = 0
      } = options;

      let query = 'SELECT * FROM notes WHERE user_id = ? AND is_archived = ?';
      const params = [userId, isArchived];

      // 添加过滤条件
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (isFavorite !== undefined) {
        query += ' AND is_favorite = ?';
        params.push(isFavorite ? 1 : 0);
      }

      if (tag) {
        query += ' AND id IN (SELECT note_id FROM note_tags WHERE tag = ?)';
        params.push(tag);
      }

      // 排序
      const validSortColumns = ['created_at', 'updated_at', 'title'];
      const validSortOrder = ['ASC', 'DESC'];

      if (validSortColumns.includes(sortBy) && validSortOrder.includes(sortOrder.toUpperCase())) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      }

      // 分页
      if (limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }

      const notes = await this.db.all(query, params);

      // 解析tags字段
      return notes.map(note => ({
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      }));
    } catch (error) {
      logger.error('[NoteService] Error getting notes:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个笔记
   */
  async getNoteById(noteId, userId) {
    try {
      const note = await this.db.get(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?',
        [noteId, userId]
      );

      if (!note) {
        return null;
      }

      return {
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      };
    } catch (error) {
      logger.error('[NoteService] Error getting note by id:', error);
      throw error;
    }
  }

  /**
   * 创建新笔记
   */
  async createNote(userId, noteData) {
    try {
      const { title = 'Untitled Note', content = '', category = 'default', tags = [] } = noteData;

      const result = await this.db.run(
        `INSERT INTO notes (user_id, title, content, category, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [userId, title, content, category, JSON.stringify(tags)]
      );

      // 插入标签到关联表
      if (tags.length > 0) {
        await this.insertNoteTags(result.lastID, tags);
      }

      // 返回创建的笔记
      return await this.getNoteById(result.lastID, userId);
    } catch (error) {
      logger.error('[NoteService] Error creating note:', error);
      throw error;
    }
  }

  /**
   * 更新笔记
   */
  async updateNote(noteId, userId, updates) {
    try {
      const { title, content, category, tags, is_favorite, is_archived } = updates;

      const updateFields = [];
      const params = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        params.push(title);
      }

      if (content !== undefined) {
        updateFields.push('content = ?');
        params.push(content);
      }

      if (category !== undefined) {
        updateFields.push('category = ?');
        params.push(category);
      }

      if (tags !== undefined) {
        updateFields.push('tags = ?');
        params.push(JSON.stringify(tags));

        // 更新标签关联表
        await this.db.run('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
        if (tags.length > 0) {
          await this.insertNoteTags(noteId, tags);
        }
      }

      if (is_favorite !== undefined) {
        updateFields.push('is_favorite = ?');
        params.push(is_favorite ? 1 : 0);
      }

      if (is_archived !== undefined) {
        updateFields.push('is_archived = ?');
        params.push(is_archived ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return await this.getNoteById(noteId, userId);
      }

      updateFields.push("updated_at = datetime('now')");
      params.push(noteId, userId);

      const query = `UPDATE notes SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;

      await this.db.run(query, params);

      return await this.getNoteById(noteId, userId);
    } catch (error) {
      logger.error('[NoteService] Error updating note:', error);
      throw error;
    }
  }

  /**
   * 删除笔记
   */
  async deleteNote(noteId, userId) {
    try {
      const result = await this.db.run(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [noteId, userId]
      );

      return result.changes > 0;
    } catch (error) {
      logger.error('[NoteService] Error deleting note:', error);
      throw error;
    }
  }

  /**
   * 批量删除笔记
   */
  async batchDeleteNotes(noteIds, userId) {
    try {
      const placeholders = noteIds.map(() => '?').join(',');
      const result = await this.db.run(
        `DELETE FROM notes WHERE id IN (${placeholders}) AND user_id = ?`,
        [...noteIds, userId]
      );

      return result.changes;
    } catch (error) {
      logger.error('[NoteService] Error batch deleting notes:', error);
      throw error;
    }
  }

  /**
   * 全文搜索笔记（支持PostgreSQL和SQLite）
   */
  async searchNotes(userId, searchQuery, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // 检测数据库类型
      const isPostgreSQL = this.db._driver === 'postgresql';

      let query, notes;

      if (isPostgreSQL) {
        // PostgreSQL全文搜索
        query = `
          SELECT * FROM notes
          WHERE user_id = $1 AND (
            to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $2)
          )
          ORDER BY ts_rank(
            to_tsvector('english', title || ' ' || content),
            plainto_tsquery('english', $2)
          ) DESC
          LIMIT $3 OFFSET $4
        `;
        notes = await this.db.all(query, [userId, searchQuery, limit, offset]);
      } else {
        // SQLite FTS5搜索
        query = `
          SELECT n.* FROM notes n
          INNER JOIN notes_fts fts ON n.id = fts.rowid
          WHERE n.user_id = ? AND notes_fts MATCH ?
          ORDER BY rank
          LIMIT ? OFFSET ?
        `;
        notes = await this.db.all(query, [userId, searchQuery, limit, offset]);
      }

      return notes.map(note => ({
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      }));
    } catch (error) {
      logger.error('[NoteService] Error searching notes:', error);
      // 如果FTS失败，降级为LIKE搜索
      return await this.searchNotesWithLike(userId, searchQuery, options);
    }
  }

  /**
   * 使用LIKE搜索（降级方案）
   */
  async searchNotesWithLike(userId, searchQuery, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      const searchPattern = `%${searchQuery}%`;

      const query = `
        SELECT * FROM notes
        WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;

      const notes = await this.db.all(
        query,
        [userId, searchPattern, searchPattern, limit, offset]
      );

      return notes.map(note => ({
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      }));
    } catch (error) {
      logger.error('[NoteService] Error searching notes with LIKE:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有分类
   */
  async getCategories(userId) {
    try {
      const categories = await this.db.all(
        'SELECT * FROM note_categories WHERE user_id = ? ORDER BY name',
        [userId]
      );

      return categories;
    } catch (error) {
      logger.error('[NoteService] Error getting categories:', error);
      throw error;
    }
  }

  /**
   * 创建新分类
   * @param {number} userId - 用户ID
   * @param {Object} categoryData - 分类数据
   * @param {string} categoryData.name - 分类名称（必填）
   * @param {string} [categoryData.color='#6366f1'] - 分类颜色（可选，默认紫色）
   * @param {string} [categoryData.description=''] - 分类描述（可选）
   * @param {string} [categoryData.icon=''] - 分类图标（可选，emoji或图标名称）
   * @param {number} [categoryData.sortOrder=0] - 排序顺序（可选）
   * @returns {Promise<Object>} 返回创建的分类对象
   */
  async createCategory(userId, categoryData) {
    try {
      const { 
        name, 
        color = '#6366f1', 
        description = '', 
        icon = '', 
        sortOrder = 0 
      } = categoryData;

      // 验证分类名称
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Category name is required and must be a non-empty string');
      }

      const trimmedName = name.trim();

      // 检查名称长度限制
      if (trimmedName.length > 50) {
        throw new Error('Category name must be less than 50 characters');
      }

      // 验证颜色格式（支持 hex 和 rgb/rgba）
      const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\()/;
      if (color && !colorRegex.test(color)) {
        throw new Error('Invalid color format. Use hex (#RGB, #RRGGBB) or rgb/rgba format');
      }

      // 检查分类是否已存在
      console.log('[noteService] 检查分类是否存在:', {
        userId,
        trimmedName,
        sql: 'SELECT id FROM note_categories WHERE user_id = ? AND LOWER(name) = LOWER(?)'
      });
      
      const existing = await this.db.get(
        'SELECT id FROM note_categories WHERE user_id = ? AND LOWER(name) = LOWER(?)',
        [userId, trimmedName]
      );

      console.log('[noteService] 检查结果:', existing);

      if (existing) {
        console.log('[noteService] 分类已存在，抛出错误');
        throw new Error('Category already exists');
      }

      // 如果未指定排序顺序，获取最大值+1
      let finalSortOrder = sortOrder;
      if (sortOrder === 0) {
        const maxOrder = await this.db.get(
          'SELECT MAX(sort_order) as max_order FROM note_categories WHERE user_id = ?',
          [userId]
        );
        finalSortOrder = (maxOrder?.max_order || 0) + 1;
      }

      const now = new Date().toISOString();

      // 插入新分类
      const result = await this.db.run(
        `INSERT INTO note_categories (user_id, name, color, description, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, trimmedName, color, description, icon, finalSortOrder, now, now]
      );

      // 获取笔记数量
      const noteCount = await this.db.get(
        'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND category = ?',
        [userId, trimmedName]
      );

      // 返回完整的分类对象
      return {
        success: true,
        category: {
          id: result.lastID,
          user_id: userId,
          name: trimmedName,
          color,
          description,
          icon,
          sort_order: finalSortOrder,
          note_count: noteCount?.count || 0,
          created_at: now,
          updated_at: now
        },
        message: 'Category created successfully'
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Category already exists');
      }
      logger.error('[NoteService] Error creating category:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(categoryId, userId, updates) {
    try {
      const { name, color } = updates;
      const updateFields = [];
      const params = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
      }

      if (color !== undefined) {
        updateFields.push('color = ?');
        params.push(color);
      }

      if (updateFields.length === 0) {
        return;
      }

      params.push(categoryId, userId);

      await this.db.run(
        `UPDATE note_categories SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
        params
      );
    } catch (error) {
      logger.error('[NoteService] Error updating category:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(categoryId, userId) {
    try {
      // 将使用该分类的笔记改为默认分类
      await this.db.run(
        'UPDATE notes SET category = ? WHERE category = (SELECT name FROM note_categories WHERE id = ? AND user_id = ?)',
        ['default', categoryId, userId]
      );

      // 删除分类
      const result = await this.db.run(
        'DELETE FROM note_categories WHERE id = ? AND user_id = ?',
        [categoryId, userId]
      );

      return result.changes > 0;
    } catch (error) {
      logger.error('[NoteService] Error deleting category:', error);
      throw error;
    }
  }

  /**
   * 获取所有标签
   */
  async getAllTags(userId) {
    try {
      const query = `
        SELECT DISTINCT nt.tag, COUNT(*) as count
        FROM note_tags nt
        INNER JOIN notes n ON nt.note_id = n.id
        WHERE n.user_id = ?
        GROUP BY nt.tag
        ORDER BY count DESC, nt.tag
      `;

      const tags = await this.db.all(query, [userId]);
      return tags;
    } catch (error) {
      logger.error('[NoteService] Error getting tags:', error);
      throw error;
    }
  }

  /**
   * 获取笔记统计信息
   */
  async getStatistics(userId) {
    try {
      const stats = await this.db.get(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites,
          SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived,
          COUNT(DISTINCT category) as categories
        FROM notes
        WHERE user_id = ?
      `, [userId]);

      const tags = await this.getAllTags(userId);

      return {
        ...stats,
        tags: tags.length
      };
    } catch (error) {
      logger.error('[NoteService] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * 插入笔记标签
   */
  async insertNoteTags(noteId, tags) {
    try {
      const values = tags.map(() => '(?, ?)').join(',');
      const params = tags.flatMap(tag => [noteId, tag]);

      await this.db.run(
        `INSERT INTO note_tags (note_id, tag) VALUES ${values}`,
        params
      );
    } catch (error) {
      logger.error('[NoteService] Error inserting note tags:', error);
      throw error;
    }
  }

  /**
   * 导出笔记（JSON格式）
   */
  async exportNotes(userId, noteIds = null) {
    try {
      let notes;
      if (noteIds && noteIds.length > 0) {
        const placeholders = noteIds.map(() => '?').join(',');
        notes = await this.db.all(
          `SELECT * FROM notes WHERE user_id = ? AND id IN (${placeholders})`,
          [userId, ...noteIds]
        );
      } else {
        notes = await this.db.all(
          'SELECT * FROM notes WHERE user_id = ?',
          [userId]
        );
      }

      return notes.map(note => ({
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      }));
    } catch (error) {
      logger.error('[NoteService] Error exporting notes:', error);
      throw error;
    }
  }

  /**
   * 导入笔记
   */
  async importNotes(userId, notes) {
    try {
      const imported = [];

      for (const note of notes) {
        const { title, content, category, tags } = note;
        const created = await this.createNote(userId, {
          title,
          content,
          category: category || 'default',
          tags: tags || []
        });
        imported.push(created);
      }

      return imported;
    } catch (error) {
      logger.error('[NoteService] Error importing notes:', error);
      throw error;
    }
  }
}

module.exports = NoteService;
