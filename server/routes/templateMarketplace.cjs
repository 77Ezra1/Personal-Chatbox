/**
 * 模板市场 API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const TemplateMarketplace = require('../services/templateMarketplace.cjs');

const router = express.Router();
const templateMarketplace = new TemplateMarketplace();

/**
 * 获取模板市场
 * GET /api/templates/marketplace
 */
router.get('/marketplace', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category = 'all',
      search = '',
      sortBy = 'popular',
      limit = 20,
      offset = 0
    } = req.query;

    const templates = await templateMarketplace.getMarketplaceTemplates({
      category,
      search,
      sortBy,
      limit: parseInt(limit),
      offset: parseInt(offset),
      userId
    });

    res.json({
      templates,
      count: templates.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('获取模板市场失败:', error);
    res.status(500).json({ message: '获取模板市场失败', error: error.message });
  }
});

/**
 * 获取模板分类
 * GET /api/templates/categories
 */
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await templateMarketplace.getTemplateCategories();

    res.json({ categories });
  } catch (error) {
    console.error('获取模板分类失败:', error);
    res.status(500).json({ message: '获取模板分类失败', error: error.message });
  }
});

/**
 * 搜索模板
 * GET /api/templates/search
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      query,
      category = 'all',
      sortBy = 'popular',
      limit = 20,
      offset = 0
    } = req.query;

    if (!query) {
      return res.status(400).json({ message: '搜索查询不能为空' });
    }

    const templates = await templateMarketplace.getMarketplaceTemplates({
      category,
      search: query,
      sortBy,
      limit: parseInt(limit),
      offset: parseInt(offset),
      userId
    });

    res.json({
      templates,
      query,
      count: templates.length
    });
  } catch (error) {
    console.error('搜索模板失败:', error);
    res.status(500).json({ message: '搜索模板失败', error: error.message });
  }
});

/**
 * 获取模板详情
 * GET /api/templates/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const template = await templateMarketplace.getTemplate(id, userId);

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    // 更新查看计数
    await templateMarketplace.updateViewCount(id);

    res.json({ template });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({ message: '获取模板详情失败', error: error.message });
  }
});

/**
 * 使用模板
 * POST /api/templates/:id/use
 */
router.post('/:id/use', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { conversationId } = req.body;

    const template = await templateMarketplace.useTemplate(id, userId, conversationId);

    res.json({
      message: '模板使用成功',
      template
    });
  } catch (error) {
    console.error('使用模板失败:', error);
    res.status(500).json({ message: '使用模板失败', error: error.message });
  }
});

/**
 * 评分模板
 * POST /api/templates/:id/rate
 */
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment = '' } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '评分必须在1-5之间' });
    }

    const result = await templateMarketplace.rateTemplate(id, userId, rating, comment);

    res.json({
      message: '模板评分成功',
      result
    });
  } catch (error) {
    console.error('评分模板失败:', error);
    res.status(500).json({ message: '评分模板失败', error: error.message });
  }
});

/**
 * 收藏模板
 * POST /api/templates/:id/favorite
 */
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await templateMarketplace.favoriteTemplate(id, userId);

    res.json({
      message: '模板收藏成功',
      result
    });
  } catch (error) {
    console.error('收藏模板失败:', error);
    res.status(500).json({ message: '收藏模板失败', error: error.message });
  }
});

/**
 * 取消收藏模板
 * DELETE /api/templates/:id/favorite
 */
router.delete('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await templateMarketplace.unfavoriteTemplate(id, userId);

    res.json({
      message: '取消收藏成功',
      result
    });
  } catch (error) {
    console.error('取消收藏模板失败:', error);
    res.status(500).json({ message: '取消收藏模板失败', error: error.message });
  }
});

/**
 * 获取模板评分
 * GET /api/templates/:id/ratings
 */
router.get('/:id/ratings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const ratings = await templateMarketplace.getTemplateRatings(id);

    res.json({
      ratings: ratings.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      count: ratings.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('获取模板评分失败:', error);
    res.status(500).json({ message: '获取模板评分失败', error: error.message });
  }
});

/**
 * 发布模板到市场
 * POST /api/templates/publish
 */
router.post('/publish', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      templateId,
      title,
      description,
      category,
      tags = [],
      previewImage = null
    } = req.body;

    if (!templateId || !title || !description || !category) {
      return res.status(400).json({ message: '模板ID、标题、描述和分类不能为空' });
    }

    const result = await templateMarketplace.publishTemplate({
      templateId,
      userId,
      title,
      description,
      category,
      tags,
      previewImage
    });

    res.json({
      message: '模板发布成功',
      result
    });
  } catch (error) {
    console.error('发布模板失败:', error);
    res.status(500).json({ message: '发布模板失败', error: error.message });
  }
});

/**
 * 获取推荐模板
 * GET /api/templates/recommendations
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const templates = await templateMarketplace.getRecommendedTemplates(userId, parseInt(limit));

    res.json({ templates });
  } catch (error) {
    console.error('获取推荐模板失败:', error);
    res.status(500).json({ message: '获取推荐模板失败', error: error.message });
  }
});

/**
 * 获取热门模板
 * GET /api/templates/trending
 */
router.get('/trending', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const templates = await templateMarketplace.getTrendingTemplates(parseInt(limit));

    res.json({ templates });
  } catch (error) {
    console.error('获取热门模板失败:', error);
    res.status(500).json({ message: '获取热门模板失败', error: error.message });
  }
});

/**
 * 获取用户模板库
 * GET /api/templates/user/:id/library
 */
router.get('/user/:id/library', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      type = 'all', // all, favorites, published, used
      limit = 20,
      offset = 0
    } = req.query;

    let templates = [];

    switch (type) {
      case 'favorites':
        // 获取收藏的模板
        templates = await templateMarketplace.getUserFavorites(userId, parseInt(limit), parseInt(offset));
        break;
      case 'published':
        // 获取发布的模板
        templates = await templateMarketplace.getUserPublishedTemplates(userId, parseInt(limit), parseInt(offset));
        break;
      case 'used':
        // 获取使用过的模板
        templates = await templateMarketplace.getUserUsedTemplates(userId, parseInt(limit), parseInt(offset));
        break;
      default:
        // 获取所有模板
        templates = await templateMarketplace.getUserTemplates(userId, parseInt(limit), parseInt(offset));
    }

    res.json({
      templates,
      count: templates.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('获取用户模板库失败:', error);
    res.status(500).json({ message: '获取用户模板库失败', error: error.message });
  }
});

/**
 * 获取模板统计
 * GET /api/templates/:id/stats
 */
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await templateMarketplace.getTemplateStats(id);

    res.json({ stats });
  } catch (error) {
    console.error('获取模板统计失败:', error);
    res.status(500).json({ message: '获取模板统计失败', error: error.message });
  }
});

module.exports = router;
