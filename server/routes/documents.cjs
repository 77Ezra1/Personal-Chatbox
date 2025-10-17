/**
 * 文档管理路由
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const documentService = require('../services/documentService.cjs');
const { createLogger } = require('../lib/logger.cjs');

const logger = createLogger('DocumentRoutes');

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取所有分类
 * GET /api/documents/categories/list
 */
router.get('/categories/list', async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await documentService.getCategories(userId);
    res.json(categories);
  } catch (error) {
    logger.error('Failed to get categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * 获取所有标签
 * GET /api/documents/tags/list
 */
router.get('/tags/list', async (req, res) => {
  try {
    const userId = req.user.id;
    const tags = await documentService.getAllTags(userId);
    res.json(tags);
  } catch (error) {
    logger.error('Failed to get tags:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

/**
 * 获取统计信息
 * GET /api/documents/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const statistics = await documentService.getStatistics(userId);
    res.json(statistics);
  } catch (error) {
    logger.error('Failed to get statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * 导出文档
 * GET /api/documents/export/all
 */
router.get('/export/all', async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await documentService.exportDocuments(userId);
    res.json(data);
  } catch (error) {
    logger.error('Failed to export documents:', error);
    res.status(500).json({ error: 'Failed to export documents' });
  }
});

/**
 * 搜索文档
 * GET /api/documents/search/:query
 * Query params: isArchived
 */
router.get('/search/:query', async (req, res) => {
  try {
    const userId = req.user.id;
    const searchQuery = req.params.query;
    const options = {
      isArchived: req.query.isArchived === 'true'
    };

    const documents = await documentService.searchDocuments(userId, searchQuery, options);
    res.json(documents);
  } catch (error) {
    logger.error('Failed to search documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

/**
 * 获取所有文档
 * GET /api/documents
 * Query params: category, tag, isFavorite, isArchived, sortBy, sortOrder
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      category: req.query.category,
      tag: req.query.tag,
      isFavorite: req.query.isFavorite === 'true',
      isArchived: req.query.isArchived === 'true',
      sortBy: req.query.sortBy || 'updated_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const documents = await documentService.getAllDocuments(userId, options);
    res.json(documents);
  } catch (error) {
    logger.error('Failed to get documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

/**
 * 根据ID获取文档
 * GET /api/documents/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);

    const document = await documentService.getDocumentById(userId, documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    logger.error('Failed to get document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

/**
 * 创建新文档
 * POST /api/documents
 * Body: { title, description, url, category, tags, icon, is_favorite, is_archived }
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const documentData = req.body;

    // 验证必填字段
    if (!documentData.title || !documentData.url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const document = await documentService.createDocument(userId, documentData);
    res.status(201).json(document);
  } catch (error) {
    logger.error('Failed to create document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

/**
 * 更新文档
 * PUT /api/documents/:id
 * Body: { title, description, url, category, tags, icon, is_favorite, is_archived }
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);
    const updates = req.body;

    const document = await documentService.updateDocument(userId, documentId, updates);
    res.json(document);
  } catch (error) {
    logger.error('Failed to update document:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to update document' });
  }
});

/**
 * 删除文档
 * DELETE /api/documents/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);

    await documentService.deleteDocument(userId, documentId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete document:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * 记录文档访问
 * POST /api/documents/:id/visit
 */
router.post('/:id/visit', async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);

    const document = await documentService.recordVisit(userId, documentId);
    res.json(document);
  } catch (error) {
    logger.error('Failed to record visit:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

/**
 * 创建分类
 * POST /api/documents/categories
 * Body: { name, color, icon, description }
 */
router.post('/categories', async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryData = req.body;

    if (!categoryData.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await documentService.createCategory(userId, categoryData);
    res.status(201).json(category);
  } catch (error) {
    logger.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * 更新分类
 * PUT /api/documents/categories/:id
 * Body: { name, color, icon, description }
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);
    const updates = req.body;

    const category = await documentService.updateCategory(userId, categoryId, updates);
    res.json(category);
  } catch (error) {
    logger.error('Failed to update category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * 删除分类
 * DELETE /api/documents/categories/:id
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);

    await documentService.deleteCategory(userId, categoryId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

/**
 * 导入文档
 * POST /api/documents/import
 * Body: { documents: [...], categories: [...] }
 */
router.post('/import', async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    const result = await documentService.importDocuments(userId, data);
    res.json(result);
  } catch (error) {
    logger.error('Failed to import documents:', error);
    res.status(500).json({ error: 'Failed to import documents' });
  }
});

module.exports = router;
