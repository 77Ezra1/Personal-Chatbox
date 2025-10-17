/**
 * 测试连接路由
 * POST /api/test-connection
 */
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const logger = require('../utils/logger.cjs');
const ConfigManager = require('../services/configManager.cjs');

const configManager = new ConfigManager();

/**
 * 测试DeepSeek连接
 */
router.post('/deepseek', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key is required'
      });
    }

    logger.info('Testing DeepSeek connection...');

    // 创建临时客户端测试连接
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });

    // 发送测试请求
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      max_tokens: 10
    });

    if (response && response.choices && response.choices.length > 0) {
      logger.info('DeepSeek connection test successful');
      return res.json({
        success: true,
        message: 'Connection successful! API key is valid.',
        model: response.model,
        response: response.choices[0].message.content
      });
    } else {
      throw new Error('Invalid response from DeepSeek API');
    }

  } catch (error) {
    logger.error('DeepSeek connection test failed:', error);
    
    let message = 'Connection failed';
    if (error.status === 401) {
      message = 'Invalid API key. Please check your DeepSeek API key.';
    } else if (error.status === 429) {
      message = 'Rate limit exceeded. Please try again later.';
    } else if (error.message) {
      message = error.message;
    }

    return res.status(error.status || 500).json({
      success: false,
      message: message,
      error: error.message
    });
  }
});

module.exports = router;
