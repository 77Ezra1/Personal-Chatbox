/**
 * 网络搜索服务 (使用DuckDuckGo)
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { search } = require('duck-duck-scrape');

class SearchService extends BaseService {
  constructor(config) {
    super(config);
    
    // 请求间隔控制
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 最小请求间隔2秒
    this.maxRetries = 3; // 最大重试次数
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: '使用DuckDuckGo进行网络搜索',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询词'
              },
              max_results: {
                type: 'number',
                description: '最大结果数量,默认10',
                default: 10
              }
            },
            required: ['query']
          }
        }
      }
    ];
  }

  async initialize() {
    logger.info('初始化搜索服务...');
    this.loaded = true;
    logger.info('搜索服务初始化完成');
  }

  async execute(toolName, parameters) {
    logger.debug(`执行搜索工具: ${toolName}`, parameters);
    
    try {
      const { query, max_results = 10 } = parameters;
      
      // 验证参数
      this.validateParameters(parameters, ['query']);
      
      logger.info(`搜索: "${query}", 最大结果: ${max_results}`);
      
      // 执行带重试的搜索
      const searchResults = await this.searchWithRetry(query, max_results);
      
      if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
        return {
          success: false,
          error: '未找到搜索结果',
          details: '请尝试使用不同的关键词'
        };
      }
      
      // 限制结果数量
      const results = searchResults.results.slice(0, max_results);
      
      // 格式化结果
      const content = this.formatSearchResults(query, results);
      
      return {
        success: true,
        content: content,
        metadata: {
          query: query,
          resultCount: results.length,
          engine: 'duckduckgo'
        }
      };
      
    } catch (error) {
      logger.error('搜索失败:', error);
      
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          error: '搜索超时',
          details: '网络连接超时,请稍后再试'
        };
      }
      
      if (error.message && error.message.includes('rate limit') || 
          error.message && error.message.includes('anomaly')) {
        return {
          success: false,
          error: 'API限流',
          details: '搜索请求过于频繁,请稍后再试'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
  }

  /**
   * 带重试机制的搜索
   */
  async searchWithRetry(query, maxResults) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 检查请求间隔
        await this.waitForNextRequest();
        
        logger.info(`搜索尝试 ${attempt}/${this.maxRetries}: "${query}"`);
        
        // 执行搜索
        const results = await search(query, {
          safeSearch: 0
        });
        
        // 更新最后请求时间
        this.lastRequestTime = Date.now();
        
        return results;
        
      } catch (error) {
        logger.warn(`搜索尝试 ${attempt} 失败:`, error.message);
        
        // 如果是频率限制错误且还有重试机会,等待更长时间
        if ((error.message.includes('anomaly') || error.message.includes('rate limit')) 
            && attempt < this.maxRetries) {
          const waitTime = this.minRequestInterval * attempt * 2; // 指数退避
          logger.info(`等待 ${waitTime}ms 后重试...`);
          await this.sleep(waitTime);
          continue;
        }
        
        // 最后一次尝试失败或其他错误,抛出
        if (attempt === this.maxRetries) {
          throw error;
        }
      }
    }
  }

  /**
   * 等待到下次可以请求的时间
   */
  async waitForNextRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`等待 ${waitTime}ms 以满足请求间隔...`);
      await this.sleep(waitTime);
    }
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatSearchResults(query, results) {
    let content = `**搜索结果: "${query}"**\n\n`;
    content += `🔍 找到 ${results.length} 条结果\n\n`;
    
    results.forEach((result, index) => {
      content += `**${index + 1}. ${result.title}**\n`;
      
      if (result.description) {
        content += `${result.description}\n`;
      }
      
      if (result.url) {
        content += `🔗 ${result.url}\n`;
      }
      
      content += `\n`;
    });
    
    return content;
  }

  async disable() {
    await super.disable();
    // 清理资源
  }
}

module.exports = SearchService;

