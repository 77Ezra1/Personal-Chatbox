/**
 * 笔记 AI 功能路由
 * 提供笔记相关的 AI 能力接口
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const NotesAIService = require('../services/notesAIService.cjs');
const logger = require('../utils/logger.cjs');
const { db } = require('../db/init.cjs');

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 保存AI使用统计到数据库
 * @param {number} userId - 用户ID
 * @param {string} action - 操作类型（如 'summary', 'rewrite'等）
 * @param {Object} usage - Token使用信息 { prompt_tokens, completion_tokens, total_tokens }
 * @param {string} model - 使用的模型
 * @param {string} prompt - 用户输入
 * @param {string} response - AI响应
 * @param {number} relatedId - 关联ID（笔记ID等，可选）
 */
async function saveAIUsage(userId, action, usage, model, prompt, response, relatedId = null) {
  if (!usage) return; // 如果没有usage信息（mock响应），跳过

  try {
    // 计算成本（DeepSeek价格：输入1元/百万tokens，输出2元/百万tokens）
    const promptCost = (usage.prompt_tokens || 0) / 1000000 * 0.14;  // $0.14/1M tokens
    const completionCost = (usage.completion_tokens || 0) / 1000000 * 0.28;  // $0.28/1M tokens
    const totalCost = promptCost + completionCost;

    // 准备元数据
    const metadata = JSON.stringify({
      usage: usage,
      action: action,
      prompt_preview: prompt.substring(0, 100),
      response_preview: response.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    // 插入到专用的AI使用日志表
    await db.prepare(
      `INSERT INTO ai_usage_logs (
        user_id, source, action, model,
        prompt_tokens, completion_tokens, total_tokens,
        cost_usd, currency,
        related_id, related_type,
        metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      userId,
      'notes',  // 数据来源
      action,
      model,
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0,
      usage.total_tokens || 0,
      totalCost,
      'USD',
      relatedId,
      relatedId ? 'note' : null,
      metadata
    );

    logger.info(`[AI Notes] Saved usage stats for user ${userId}: ${usage.total_tokens} tokens, $${totalCost.toFixed(6)}`);
  } catch (error) {
    logger.error('[AI Notes] Failed to save usage stats:', error);
    // 不抛出错误，避免影响主功能
  }
}

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

    const result = await aiService.generateSummary(content);

    // 保存token统计
    await saveAIUsage(
      req.user.id,
      'summary',
      result.usage,
      result.model,
      content,
      result.text
    );

    res.json({
      success: true,
      summary: result.text,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.generateOutline(content);

    // 保存token统计
    await saveAIUsage(req.user.id, 'outline', result.usage, result.model, content, result.text);

    res.json({
      success: true,
      outline: result.text,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.rewriteText(text, style);

    // 保存token统计
    await saveAIUsage(
      req.user.id,
      `rewrite_${style}`,
      result.usage,
      result.model,
      text,
      result.text
    );

    res.json({
      success: true,
      text: result.text,
      style,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.extractTasks(content);

    // 保存token统计
    await saveAIUsage(req.user.id, 'extract_tasks', result.usage, result.model, content, JSON.stringify(result.tasks));

    res.json({
      success: true,
      tasks: result.tasks,
      count: result.tasks.length,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.suggestTags(title || '', content || '');

    // 保存token统计
    await saveAIUsage(req.user.id, 'suggest_tags', result.usage, result.model, `${title} | ${content}`, result.tags.join(', '));

    res.json({
      success: true,
      tags: result.tags,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.answerQuestion(question, content);

    // 保存token统计
    await saveAIUsage(req.user.id, 'qa', result.usage, result.model, `Q: ${question}`, result.text);

    res.json({
      success: true,
      answer: result.text,
      usage: result.usage,
      model: result.model
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

    const result = await aiService.expandContent(content, context);

    // 保存token统计
    await saveAIUsage(req.user.id, 'expand', result.usage, result.model, content, result.text);

    res.json({
      success: true,
      expansion: result.text,
      usage: result.usage,
      model: result.model
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
