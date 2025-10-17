/**
 * AI 服务
 * 提供统一的 AI 接口
 * 优先使用用户在前端配置的API密钥，其次使用环境变量
 */

class AIService {
  constructor(userId = null) {
    this.userId = userId;
    this.openai = null;
    this.deepseek = null;
  }

  async initializeServices() {
    try {
      // 尝试加载用户配置
      const ConfigManager = require('./configManager.cjs');
      const configManager = new ConfigManager();
      const config = await configManager.loadUserConfig(this.userId);

      // 初始化 OpenAI
      const { OpenAI } = require('openai');
      const openaiApiKey = config?.openai?.apiKey || process.env.OPENAI_API_KEY;

      if (openaiApiKey && openaiApiKey !== 'test-key') {
        this.openai = new OpenAI({
          apiKey: openaiApiKey
        });
        console.log('[AI Service] OpenAI initialized with user config');
      } else {
        console.warn('[AI Service] OpenAI API key not configured');
      }

      // 初始化 DeepSeek
      const deepseekApiKey = config?.deepseek?.apiKey || process.env.DEEPSEEK_API_KEY;
      if (deepseekApiKey && deepseekApiKey !== 'test-key') {
        this.deepseek = {
          apiKey: deepseekApiKey,
          baseURL: 'https://api.deepseek.com'
        };
        console.log('[AI Service] DeepSeek initialized with user config');
      } else {
        console.warn('[AI Service] DeepSeek API key not configured');
      }
    } catch (error) {
      console.warn('[AI Service] Initialization error:', error.message);
      // 回退到环境变量
      try {
        const { OpenAI } = require('openai');
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || 'test-key'
        });
      } catch (e) {
        console.warn('[AI Service] Fallback initialization failed:', e.message);
      }
    }
  }

  async generateResponse(prompt, context = '', options = {}) {
    // 确保服务已初始化
    if (!this.openai && !this.deepseek) {
      await this.initializeServices();
    }

    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7
    } = options;

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: maxTokens,
          temperature
        });
        return response.choices[0].message.content;
      }

      // 回退到模拟响应
      console.warn('[AI Service] No API key configured, using mock response');
      return this.generateMockResponse(fullPrompt);
    } catch (error) {
      console.error('[AI Service] Generate response error:', error);
      return this.generateMockResponse(fullPrompt);
    }
  }

  async generateText(prompt, options = {}) {
    return this.generateResponse(prompt, '', options);
  }

  async analyzeImage(imageData, options = {}) {
    const {
      model = 'gpt-4o-mini-vision',
      prompt = '请分析这张图片'
    } = options;

    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageData } }
              ]
            }
          ]
        });
        return response.choices[0].message.content;
      }

      return '图片分析功能暂时不可用';
    } catch (error) {
      console.error('[AI Service] Analyze image error:', error);
      return '图片分析失败';
    }
  }

  async generateEmbedding(text, options = {}) {
    const { model = 'text-embedding-ada-002' } = options;

    try {
      if (this.openai) {
        const response = await this.openai.embeddings.create({
          model,
          input: text
        });
        return response.data[0].embedding;
      }

      // 回退到模拟向量
      return this.generateMockEmbedding(text);
    } catch (error) {
      console.error('[AI Service] Generate embedding error:', error);
      return this.generateMockEmbedding(text);
    }
  }

  generateMockResponse(prompt) {
    const responses = [
      '这是一个模拟的 AI 响应。',
      '由于 API 配置问题，这是默认回复。',
      '请配置正确的 API 密钥以获得完整功能。',
      '模拟响应：' + prompt.substring(0, 50) + '...'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateMockEmbedding(text) {
    // 生成固定长度的模拟向量
    const length = 1536; // OpenAI embedding 维度
    const embedding = [];

    for (let i = 0; i < length; i++) {
      embedding.push(Math.random() * 2 - 1);
    }

    return embedding;
  }
}

module.exports = AIService;
