/**
 * 笔记专用 AI 服务
 * 提供笔记相关的 AI 功能：摘要、大纲、改写、任务提取、标签建议等
 */

const AIService = require('./aiService.cjs');
const logger = require('../utils/logger.cjs');

class NotesAIService {
  constructor(userId = null) {
    this.userId = userId;
    this.aiService = new AIService(userId);
  }

  /**
   * 初始化服务
   */
  async initialize() {
    await this.aiService.initializeServices();
  }

  /**
   * 生成笔记摘要
   * @param {string} noteContent - 笔记内容
   * @returns {Promise<string>} 摘要文本
   */
  async generateSummary(noteContent) {
    if (!noteContent || noteContent.trim().length < 50) {
      throw new Error('Content too short for summary (minimum 50 characters)');
    }

    const prompt = `请为以下笔记内容生成一个简洁的摘要（不超过150字）。摘要应该：
1. 抓住核心要点
2. 使用简洁明了的语言
3. 保持客观中立的语气

笔记内容：
${noteContent}

摘要：`;

    try {
      const summary = await this.aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      logger.info('[NotesAI] Summary generated successfully');
      return summary.trim();
    } catch (error) {
      logger.error('[NotesAI] Summary generation error:', error);
      throw new Error('Failed to generate summary: ' + error.message);
    }
  }

  /**
   * 提取笔记大纲
   * @param {string} noteContent - 笔记内容
   * @returns {Promise<string>} Markdown 格式的大纲
   */
  async generateOutline(noteContent) {
    if (!noteContent || noteContent.trim().length < 100) {
      throw new Error('Content too short for outline (minimum 100 characters)');
    }

    const prompt = `请为以下笔记内容生成一个结构化的大纲，使用 Markdown 格式。要求：
1. 使用层级标题（#, ##, ###）
2. 提取主要观点和子观点
3. 保持逻辑清晰
4. 简洁明了

笔记内容：
${noteContent}

大纲：`;

    try {
      const outline = await this.aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      logger.info('[NotesAI] Outline generated successfully');
      return outline.trim();
    } catch (error) {
      logger.error('[NotesAI] Outline generation error:', error);
      throw new Error('Failed to generate outline: ' + error.message);
    }
  }

  /**
   * 改写文本
   * @param {string} text - 原始文本
   * @param {string} style - 改写风格：professional, casual, concise, detailed
   * @returns {Promise<string>} 改写后的文本
   */
  async rewriteText(text, style = 'professional') {
    if (!text || text.trim().length < 10) {
      throw new Error('Text too short to rewrite (minimum 10 characters)');
    }

    const stylePrompts = {
      professional: '使用专业、正式的语气，适合商务和学术场景',
      casual: '使用轻松、口语化的语气，适合日常交流',
      concise: '使用简洁、精炼的语言，去除冗余表达',
      detailed: '使用详细、充分的描述，增加细节和解释'
    };

    const styleDesc = stylePrompts[style] || stylePrompts.professional;

    const prompt = `请${styleDesc}改写以下文本。要求：
1. 保持原意不变
2. 优化表达方式
3. 提升可读性
4. 不要添加额外信息

原文：
${text}

改写后：`;

    try {
      const rewritten = await this.aiService.generateText(prompt, {
        temperature: 0.5,
        maxTokens: Math.min(text.length * 2, 1000)
      });

      logger.info('[NotesAI] Text rewritten successfully with style:', style);
      return rewritten.trim();
    } catch (error) {
      logger.error('[NotesAI] Rewrite error:', error);
      throw new Error('Failed to rewrite text: ' + error.message);
    }
  }

  /**
   * 提取待办事项
   * @param {string} noteContent - 笔记内容
   * @returns {Promise<Array>} 任务列表
   */
  async extractTasks(noteContent) {
    if (!noteContent || noteContent.trim().length < 20) {
      return [];
    }

    const prompt = `请从以下笔记中提取所有待办事项和任务。以 JSON 数组格式返回，每个任务包含：
- task: 任务描述（必填）
- priority: 优先级 high/medium/low（选填）
- deadline: 截止日期 YYYY-MM-DD 格式（选填，如果文中没有明确日期则为 null）

只返回纯 JSON，不要任何额外文字。

笔记内容：
${noteContent}

JSON：`;

    try {
      const response = await this.aiService.generateText(prompt, {
        temperature: 0.2,
        maxTokens: 500
      });

      // 尝试解析 JSON
      let tasks = [];
      try {
        // 移除可能的 markdown 代码块标记
        const jsonStr = response.trim()
          .replace(/^```json\s*/, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '');

        tasks = JSON.parse(jsonStr);

        if (!Array.isArray(tasks)) {
          tasks = [];
        }
      } catch (parseError) {
        logger.warn('[NotesAI] Failed to parse tasks JSON:', parseError.message);
        tasks = [];
      }

      logger.info('[NotesAI] Extracted tasks:', tasks.length);
      return tasks;
    } catch (error) {
      logger.error('[NotesAI] Task extraction error:', error);
      return [];
    }
  }

  /**
   * 智能标签建议
   * @param {string} noteTitle - 笔记标题
   * @param {string} noteContent - 笔记内容
   * @returns {Promise<Array<string>>} 标签列表
   */
  async suggestTags(noteTitle, noteContent) {
    if (!noteTitle && !noteContent) {
      return [];
    }

    const content = noteContent ? noteContent.substring(0, 500) : '';

    const prompt = `基于以下笔记的标题和内容，建议 3-5 个合适的标签。要求：
1. 标签简洁（1-2个词）
2. 使用小写英文或中文
3. 能准确反映笔记主题
4. 避免过于宽泛的标签
5. 只返回标签，用逗号分隔，不要其他文字

标题：${noteTitle || '(无标题)'}

内容：${content}${content.length >= 500 ? '...' : ''}

标签：`;

    try {
      const response = await this.aiService.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 100
      });

      const tags = response
        .trim()
        .split(/[,，、]/)
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length < 20)
        .slice(0, 5); // 最多5个标签

      logger.info('[NotesAI] Suggested tags:', tags);
      return tags;
    } catch (error) {
      logger.error('[NotesAI] Tag suggestion error:', error);
      return [];
    }
  }

  /**
   * 智能问答
   * @param {string} question - 用户问题
   * @param {string} noteContent - 笔记内容作为上下文
   * @returns {Promise<string>} 回答
   */
  async answerQuestion(question, noteContent) {
    if (!question || !noteContent) {
      throw new Error('Question and note content are required');
    }

    const prompt = `基于以下笔记内容回答问题。如果笔记中没有相关信息，请明确说明。

笔记内容：
${noteContent}

问题：${question}

回答：`;

    try {
      const answer = await this.aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 300
      });

      logger.info('[NotesAI] Question answered successfully');
      return answer.trim();
    } catch (error) {
      logger.error('[NotesAI] Q&A error:', error);
      throw new Error('Failed to answer question: ' + error.message);
    }
  }

  /**
   * 扩展内容（续写）
   * @param {string} currentContent - 当前内容
   * @param {string} context - 上下文提示
   * @returns {Promise<string>} 扩展内容
   */
  async expandContent(currentContent, context = '') {
    if (!currentContent || currentContent.trim().length < 20) {
      throw new Error('Content too short to expand');
    }

    const prompt = `请基于以下内容进行扩展和续写。要求：
1. 保持与原文风格一致
2. 自然延续原有思路
3. 增加有价值的信息
4. 长度约为原文的 50%

${context ? `背景提示：${context}\n\n` : ''}当前内容：
${currentContent}

扩展内容：`;

    try {
      const expansion = await this.aiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: Math.floor(currentContent.length * 0.8)
      });

      logger.info('[NotesAI] Content expanded successfully');
      return expansion.trim();
    } catch (error) {
      logger.error('[NotesAI] Expansion error:', error);
      throw new Error('Failed to expand content: ' + error.message);
    }
  }
}

module.exports = NotesAIService;
