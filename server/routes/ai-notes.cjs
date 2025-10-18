/**
 * 笔记 AI 功能路由
 * 提供笔记相关的 AI 能力接口
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const NotesAIService = require('../services/notesAIService.cjs');
const logger = require('../utils/logger.cjs');

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 生成摘要
 * POST /api/ai/notes/summary
 * Body: { content: string }
 */
router.post('/notes/summary', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    if (content.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Content too short for summary (minimum 50 characters)'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const summary = await aiService.generateSummary(content);

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    logger.error('[AI Notes API] Summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate summary'
    });
  }
});

/**
 * 生成大纲
 * POST /api/ai/notes/outline
 * Body: { content: string }
 */
router.post('/notes/outline', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    if (content.length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Content too short for outline (minimum 100 characters)'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const outline = await aiService.generateOutline(content);

    res.json({
      success: true,
      outline
    });
  } catch (error) {
    logger.error('[AI Notes API] Outline error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate outline'
    });
  }
});

/**
 * 改写文本
 * POST /api/ai/notes/rewrite
 * Body: { text: string, style: 'professional'|'casual'|'concise'|'detailed' }
 */
router.post('/notes/rewrite', async (req, res) => {
  try {
    const { text, style = 'professional' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    if (text.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Text too short to rewrite (minimum 10 characters)'
      });
    }

    const validStyles = ['professional', 'casual', 'concise', 'detailed'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}`
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const rewritten = await aiService.rewriteText(text, style);

    res.json({
      success: true,
      text: rewritten,
      style
    });
  } catch (error) {
    logger.error('[AI Notes API] Rewrite error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to rewrite text'
    });
  }
});

/**
 * 提取任务
 * POST /api/ai/notes/tasks
 * Body: { content: string }
 */
router.post('/notes/tasks', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const tasks = await aiService.extractTasks(content);

    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    logger.error('[AI Notes API] Tasks extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract tasks'
    });
  }
});

/**
 * 标签建议
 * POST /api/ai/notes/suggest-tags
 * Body: { title: string, content: string }
 */
router.post('/notes/suggest-tags', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        error: 'At least title or content is required'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const tags = await aiService.suggestTags(title || '', content || '');

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    logger.error('[AI Notes API] Tag suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest tags'
    });
  }
});

/**
 * 智能问答
 * POST /api/ai/notes/qa
 * Body: { question: string, content: string }
 */
router.post('/notes/qa', async (req, res) => {
  try {
    const { question, content } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string'
      });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const answer = await aiService.answerQuestion(question, content);

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    logger.error('[AI Notes API] Q&A error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to answer question'
    });
  }
});

/**
 * 扩展内容
 * POST /api/ai/notes/expand
 * Body: { content: string, context?: string }
 */
router.post('/notes/expand', async (req, res) => {
  try {
    const { content, context = '' } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    if (content.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Content too short to expand (minimum 20 characters)'
      });
    }

    const aiService = new NotesAIService(req.user.id);
    await aiService.initialize();

    const expansion = await aiService.expandContent(content, context);

    res.json({
      success: true,
      expansion
    });
  } catch (error) {
    logger.error('[AI Notes API] Expansion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to expand content'
    });
  }
});

module.exports = router;
