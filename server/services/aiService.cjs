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
      // 直接从数据库读取用户API配置
      const { db } = require('../db/init.cjs');
      const { OpenAI } = require('openai');

      let openaiApiKey = null;
      let deepseekApiKey = null;

      // 如果有userId，从数据库读取
      if (this.userId) {
        try {
          const config = await db.prepare(
            'SELECT api_keys FROM user_configs WHERE user_id = ?'
          ).get(this.userId);

          if (config && config.api_keys) {
            const apiKeys = JSON.parse(config.api_keys);
            openaiApiKey = apiKeys.openai;
            deepseekApiKey = apiKeys.deepseek;
            console.log(`[AI Service] User ${this.userId} API keys loaded from database`);
          }
        } catch (error) {
          console.warn(`[AI Service] Failed to load user ${this.userId} config:`, error.message);
        }
      }

      // 回退到环境变量
      openaiApiKey = openaiApiKey || process.env.OPENAI_API_KEY;
      deepseekApiKey = deepseekApiKey || process.env.DEEPSEEK_API_KEY;

      // 初始化 OpenAI
      if (openaiApiKey && openaiApiKey !== 'test-key') {
        this.openai = new OpenAI({
          apiKey: openaiApiKey
        });
        console.log('[AI Service] OpenAI initialized');
      } else {
        console.warn('[AI Service] OpenAI API key not configured');
      }

      // 初始化 DeepSeek（使用OpenAI SDK兼容接口）
      if (deepseekApiKey && deepseekApiKey !== 'test-key') {
        this.deepseek = new OpenAI({
          apiKey: deepseekApiKey,
          baseURL: 'https://api.deepseek.com'
        });
        console.log('[AI Service] DeepSeek initialized');
      } else {
        console.warn('[AI Service] DeepSeek API key not configured');
      }
    } catch (error) {
      console.error('[AI Service] Initialization error:', error.message);
      // 尝试使用环境变量作为最后的回退
      try {
        const { OpenAI } = require('openai');
        if (process.env.DEEPSEEK_API_KEY) {
          this.deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com'
          });
          console.log('[AI Service] Fallback to DeepSeek with env variable');
        }
      } catch (e) {
        console.error('[AI Service] Fallback initialization failed:', e.message);
      }
    }
  }

  async generateResponse(prompt, context = '', options = {}) {
    // 确保服务已初始化
    if (!this.openai && !this.deepseek) {
      await this.initializeServices();
    }

    // 智能选择默认模型：优先使用已配置的API
    let defaultModel = 'gpt-3.5-turbo';
    if (this.deepseek && !this.openai) {
      defaultModel = 'deepseek-chat';
    } else if (!this.deepseek && this.openai) {
      defaultModel = 'gpt-3.5-turbo';
    }

    const {
      model = defaultModel,
      maxTokens = 1000,
      temperature = 0.7
    } = options;

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    try {
      // 根据模型名称选择对应的客户端
      let client = null;
      let actualModel = model;

      console.log(`[AI Service] generateResponse called with model: ${model}`);
      console.log(`[AI Service] this.deepseek:`, this.deepseek ? 'initialized' : 'null');
      console.log(`[AI Service] this.openai:`, this.openai ? 'initialized' : 'null');

      // 判断模型类型
      if (model.includes('deepseek')) {
        client = this.deepseek;
        actualModel = 'deepseek-chat'; // DeepSeek的标准模型名
        console.log(`[AI Service] Selected DeepSeek client`);
      } else if (model.includes('gpt')) {
        client = this.openai;
        console.log(`[AI Service] Selected OpenAI client`);
      } else {
        // 默认：有DeepSeek用DeepSeek，否则用OpenAI
        client = this.deepseek || this.openai;
        actualModel = this.deepseek ? 'deepseek-chat' : model;
        console.log(`[AI Service] Selected default client:`, client ? 'found' : 'null');
      }

      console.log(`[AI Service] Final client:`, client ? 'available' : 'null', `model: ${actualModel}`);

      if (client) {
        const response = await client.chat.completions.create({
          model: actualModel,
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: maxTokens,
          temperature
        });

        // 返回包含token统计的完整信息
        return {
          content: response.choices[0].message.content,
          usage: response.usage || null,
          model: actualModel
        };
      }

      // 回退到模拟响应
      console.warn('[AI Service] No API key configured, using mock response');
      const mockContent = this.generateMockResponse(fullPrompt);
      return {
        content: mockContent,
        usage: null,
        model: 'mock'
      };
    } catch (error) {
      console.error('[AI Service] Generate response error:', error);
      const mockContent = this.generateMockResponse(fullPrompt);
      return {
        content: mockContent,
        usage: null,
        model: 'mock'
      };
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
