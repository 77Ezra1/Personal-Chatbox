/**
 * 笔记管理路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const NoteService = require('../services/noteService.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const logger = require('../utils/logger.cjs');

const noteService = new NoteService(db);

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 搜索笔记
 * GET /api/notes/search
 * Query params: q (search query), limit, offset
 */
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const searchQuery = req.query.q;

    if (!searchQuery) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const notes = await noteService.searchNotes(userId, searchQuery, options);
    res.json({ success: true, notes });
  } catch (error) {
    logger.error('[Notes API] Error searching notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取所有分类
 * GET /api/notes/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await noteService.getCategories(userId);
    res.json({ success: true, categories });
  } catch (error) {
    logger.error('[Notes API] Error getting categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取所有标签
 * GET /api/notes/tags
 */
router.get('/tags', async (req, res) => {
  try {
    const userId = req.user.id;
    const tags = await noteService.getAllTags(userId);
    res.json({ success: true, tags });
  } catch (error) {
    logger.error('[Notes API] Error getting tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取笔记统计信息
 * GET /api/notes/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user.id;
    const statistics = await noteService.getStatistics(userId);
    res.json({ success: true, statistics });
  } catch (error) {
    logger.error('[Notes API] Error getting statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取所有笔记
 * GET /api/notes
 * Query params: category, tag, isFavorite, isArchived, sortBy, sortOrder, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      category: req.query.category,
      tag: req.query.tag,
      isFavorite: req.query.isFavorite === 'true',
      isArchived: req.query.isArchived === 'true' ? 1 : 0,
      sortBy: req.query.sortBy || 'updated_at',
      sortOrder: req.query.sortOrder || 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    logger.info(`[Notes API] GET /api/notes - userId: ${userId}, query:`, req.query);
    logger.info(`[Notes API] Parsed options:`, options);

    const notes = await noteService.getAllNotes(userId, options);
    logger.info(`[Notes API] Found ${notes.length} notes`);
    res.json({ success: true, notes });
  } catch (error) {
    logger.error('[Notes API] Error getting notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取单个笔记
 * GET /api/notes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = parseInt(req.params.id);

    const note = await noteService.getNoteById(noteId, userId);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    logger.error('[Notes API] Error getting note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建新笔记
 * POST /api/notes
 * Body: { title, content, category, tags }
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const noteData = req.body;

    const note = await noteService.createNote(userId, noteData);
    res.status(201).json({ success: true, note });
  } catch (error) {
    logger.error('[Notes API] Error creating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 更新笔记
 * PUT /api/notes/:id
 * Body: { title, content, category, tags, is_favorite, is_archived }
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = parseInt(req.params.id);
    const updates = req.body;

    const note = await noteService.updateNote(noteId, userId, updates);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    logger.error('[Notes API] Error updating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除笔记
 * DELETE /api/notes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = parseInt(req.params.id);

    const success = await noteService.deleteNote(noteId, userId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[Notes API] Error deleting note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 批量删除笔记
 * POST /api/notes/batch-delete
 * Body: { noteIds: [1, 2, 3] }
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteIds } = req.body;

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid noteIds' });
    }

    const deletedCount = await noteService.batchDeleteNotes(noteIds, userId);
    res.json({ success: true, deletedCount });
  } catch (error) {
    logger.error('[Notes API] Error batch deleting notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建新分类
 * POST /api/notes/categories
 * Body: { 
 *   name: string (必填),
 *   color: string (可选，默认 #6366f1),
 *   description: string (可选),
 *   icon: string (可选),
 *   sortOrder: number (可选)
 * }
 * Response: {
 *   success: boolean,
 *   category: {
 *     id: number,
 *     user_id: number,
 *     name: string,
 *     color: string,
 *     description: string,
 *     icon: string,
 *     sort_order: number,
 *     note_count: number,
 *     created_at: string,
 *     updated_at: string
 *   },
 *   message: string
 * }
 */
router.post('/categories', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color, description, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category name is required',
        code: 'MISSING_NAME' 
      });
    }

    const result = await noteService.createCategory(userId, { 
      name, 
      color, 
      description, 
      icon, 
      sortOrder 
    });
    
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Category already exists') {
      return res.status(409).json({ 
        success: false, 
        error: error.message,
        code: 'DUPLICATE_CATEGORY' 
      });
    }
    if (error.message.includes('must be less than 50 characters')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        code: 'NAME_TOO_LONG' 
      });
    }
    if (error.message.includes('Invalid color format')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        code: 'INVALID_COLOR' 
      });
    }
    logger.error('[Notes API] Error creating category:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: 'INTERNAL_ERROR' 
    });
  }
});

/**
 * 更新分类
 * PUT /api/notes/categories/:id
 * Body: { name, color }
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);
    const updates = req.body;

    await noteService.updateCategory(categoryId, userId, updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('[Notes API] Error updating category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除分类
 * DELETE /api/notes/categories/:id
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);

    const success = await noteService.deleteCategory(categoryId, userId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[Notes API] Error deleting category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 导出笔记
 * POST /api/notes/export
 * Body: { noteIds?: [1, 2, 3] } - 可选，不提供则导出所有笔记
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteIds } = req.body;

    const notes = await noteService.exportNotes(userId, noteIds);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="notes-export.json"');
    res.json({ success: true, notes, exportedAt: new Date().toISOString() });
  } catch (error) {
    logger.error('[Notes API] Error exporting notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 导入笔记
 * POST /api/notes/import
 * Body: { notes: [...] }
 */
router.post('/import', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid notes data' });
    }

    const imported = await noteService.importNotes(userId, notes);
    res.json({ success: true, imported: imported.length, notes: imported });
  } catch (error) {
    logger.error('[Notes API] Error importing notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
