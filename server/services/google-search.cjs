/**
 * Google搜索服务 (基于web-search实现)
 * 免费使用Google搜索,无需API密钥
 */
const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const axios = require('axios');
const cheerio = require('cheerio');

class GoogleSearchService extends BaseService {
  constructor(config) {
    super(config);
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'google_search',
          description: '使用Google进行网络搜索,免费无需API密钥',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询词'
              },
              limit: {
                type: 'number',
                description: '最大结果数量,默认5,最大10',
                default: 5,
                minimum: 1,
                maximum: 10
              }
            },
            required: ['query']
          }
        }
      }
    ];
  }

  async initialize() {
    logger.info('初始化Google搜索服务...');
    this.loaded = true;
    logger.info('Google搜索服务初始化完成');
  }

  async execute(toolName, parameters) {
    logger.debug(`执行Google搜索工具: ${toolName}`, parameters);
    
    try {
      const { query, limit = 5 } = parameters;
      
      // 验证参数
      this.validateParameters(parameters, ['query']);
      
      const maxLimit = Math.min(limit, 10);
      logger.info(`Google搜索: "${query}", 最大结果: ${maxLimit}`);
      
      // 执行搜索
      const results = await this.performSearch(query, maxLimit);
      
      if (!results || results.length === 0) {
        return {
          success: false,
          error: '未找到搜索结果',
          details: '请尝试使用不同的关键词'
        };
      }
      
      // 格式化结果
      const content = this.formatSearchResults(query, results);
      
      return {
        success: true,
        content: content,
        metadata: {
          query: query,
          resultCount: results.length,
          engine: 'google'
        }
      };
      
    } catch (error) {
      logger.error('Google搜索失败:', error);
      
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          error: '搜索超时',
          details: '网络连接超时,请稍后再试'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
  }

  async performSearch(query, limit) {
    try {
      const response = await axios.get('https://www.google.com/search', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10秒超时
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('div.g').each((i, element) => {
        if (i >= limit) return false;

        const titleElement = $(element).find('h3');
        const linkElement = $(element).find('a');
        const snippetElement = $(element).find('.VwiC3b');

        if (titleElement.length && linkElement.length) {
          const url = linkElement.attr('href');
          if (url && url.startsWith('http')) {
            results.push({
              title: titleElement.text(),
              url: url,
              description: snippetElement.text() || ''
            });
          }
        }
      });

      return results;
    } catch (error) {
      logger.error('Google搜索请求失败:', error.message);
      throw error;
    }
  }

  formatSearchResults(query, results) {
    let content = `**Google搜索结果: "${query}"**\n\n`;
    content += `找到 ${results.length} 个结果:\n\n`;

    results.forEach((result, index) => {
      content += `${index + 1}. **${result.title}**\n`;
      content += `   🔗 ${result.url}\n`;
      if (result.description) {
        content += `   📝 ${result.description}\n`;
      }
      content += '\n';
    });

    return content;
  }
}

module.exports = GoogleSearchService;

