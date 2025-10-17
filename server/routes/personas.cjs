/**
 * AI 角色预设 API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const PersonaService = require('../services/personaService.cjs');

const router = express.Router();
const personaService = new PersonaService();

/**
 * 获取角色列表
 * GET /api/personas
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category = 'all',
      search = '',
      isPublic,
      includeBuiltin = 'true'
    } = req.query;

    const personas = await personaService.getUserPersonas(userId, {
      category,
      search,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      includeBuiltin: includeBuiltin === 'true'
    });

    res.json({
      personas,
      count: personas.length,
      categories: personaService.getPersonaCategories()
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({ message: '获取角色列表失败', error: error.message });
  }
});

/**
 * 获取角色详情
 * GET /api/personas/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const persona = await personaService.getPersona(id, userId);

    res.json({ persona });
  } catch (error) {
    console.error('获取角色详情失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: '获取角色详情失败', error: error.message });
    }
  }
});

/**
 * 创建角色
 * POST /api/personas
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const personaData = req.body;

    // 验证角色数据
    const validation = personaService.validatePersonaData(personaData);
    if (!validation.valid) {
      return res.status(400).json({
        message: '角色数据验证失败',
        errors: validation.errors
      });
    }

    const persona = await personaService.createPersona(userId, personaData);

    res.json({
      message: '角色创建成功',
      persona
    });
  } catch (error) {
    console.error('创建角色失败:', error);
    res.status(500).json({ message: '创建角色失败', error: error.message });
  }
});

/**
 * 更新角色
 * PUT /api/personas/:id
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 验证更新数据
    if (updateData.name || updateData.systemPrompt) {
      const validation = personaService.validatePersonaData(updateData);
      if (!validation.valid) {
        return res.status(400).json({
          message: '角色数据验证失败',
          errors: validation.errors
        });
      }
    }

    await personaService.updatePersona(id, userId, updateData);

    res.json({ message: '角色更新成功' });
  } catch (error) {
    console.error('更新角色失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '更新角色失败', error: error.message });
    }
  }
});

/**
 * 删除角色
 * DELETE /api/personas/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await personaService.deletePersona(id, userId);

    res.json({ message: '角色删除成功' });
  } catch (error) {
    console.error('删除角色失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '删除角色失败', error: error.message });
    }
  }
});

/**
 * 使用角色
 * POST /api/personas/:id/use
 */
router.post('/:id/use', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { conversationId } = req.body;

    await personaService.usePersona(userId, id, conversationId);

    res.json({ message: '角色切换成功' });
  } catch (error) {
    console.error('使用角色失败:', error);
    res.status(500).json({ message: '使用角色失败', error: error.message });
  }
});

/**
 * 评分角色
 * POST /api/personas/:id/rate
 */
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, feedback = '' } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '评分必须在1-5之间' });
    }

    await personaService.ratePersona(userId, id, rating, feedback);

    res.json({ message: '评分提交成功' });
  } catch (error) {
    console.error('评分角色失败:', error);
    res.status(500).json({ message: '评分角色失败', error: error.message });
  }
});

/**
 * 获取角色统计
 * GET /api/personas/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { personaId } = req.query;

    const stats = await personaService.getPersonaStats(userId, personaId);

    res.json({ stats });
  } catch (error) {
    console.error('获取角色统计失败:', error);
    res.status(500).json({ message: '获取角色统计失败', error: error.message });
  }
});

/**
 * 获取角色分类
 * GET /api/personas/categories
 */
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = personaService.getPersonaCategories();

    res.json({ categories });
  } catch (error) {
    console.error('获取角色分类失败:', error);
    res.status(500).json({ message: '获取角色分类失败', error: error.message });
  }
});

/**
 * 复制角色
 * POST /api/personas/:id/copy
 */
router.post('/:id/copy', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    // 获取原角色信息
    const originalPersona = await personaService.getPersona(id, userId);

    // 创建新角色
    const newPersonaData = {
      name: name || `${originalPersona.name} (副本)`,
      description: originalPersona.description,
      avatarUrl: originalPersona.avatarUrl,
      systemPrompt: originalPersona.systemPrompt,
      personality: originalPersona.personality,
      expertise: originalPersona.expertise,
      conversationStyle: originalPersona.conversationStyle,
      category: originalPersona.category,
      tags: originalPersona.tags,
      isPublic: false
    };

    const newPersona = await personaService.createPersona(userId, newPersonaData);

    res.json({
      message: '角色复制成功',
      persona: newPersona
    });
  } catch (error) {
    console.error('复制角色失败:', error);
    res.status(500).json({ message: '复制角色失败', error: error.message });
  }
});

/**
 * 导入角色
 * POST /api/personas/import
 */
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { personas } = req.body;

    if (!Array.isArray(personas) || personas.length === 0) {
      return res.status(400).json({ message: '请提供有效的角色数据' });
    }

    const importedPersonas = [];
    const errors = [];

    for (const personaData of personas) {
      try {
        const validation = personaService.validatePersonaData(personaData);
        if (!validation.valid) {
          errors.push(`${personaData.name || '未知角色'}: ${validation.errors.join(', ')}`);
          continue;
        }

        const persona = await personaService.createPersona(userId, personaData);
        importedPersonas.push(persona);
      } catch (error) {
        errors.push(`${personaData.name || '未知角色'}: ${error.message}`);
      }
    }

    res.json({
      message: `成功导入 ${importedPersonas.length} 个角色`,
      personas: importedPersonas,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('导入角色失败:', error);
    res.status(500).json({ message: '导入角色失败', error: error.message });
  }
});

/**
 * 导出角色
 * GET /api/personas/export
 */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category = 'all' } = req.query;

    const personas = await personaService.getUserPersonas(userId, {
      category,
      includeBuiltin: false // 只导出用户创建的角色
    });

    // 移除敏感信息
    const exportData = personas.map(persona => ({
      name: persona.name,
      description: persona.description,
      avatarUrl: persona.avatarUrl,
      systemPrompt: persona.systemPrompt,
      personality: persona.personality,
      expertise: persona.expertise,
      conversationStyle: persona.conversationStyle,
      category: persona.category,
      tags: persona.tags
    }));

    res.json({
      personas: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('导出角色失败:', error);
    res.status(500).json({ message: '导出角色失败', error: error.message });
  }
});

module.exports = router;
