/**
 * 网络搜索服务 (使用DuckDuckGo)
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { search } = require('duck-duck-scrape');

class SearchService extends BaseService {
  constructor(config) {
    super(config);
    
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
      
      // 执行搜索
      const searchResults = await search(query, {
        safeSearch: 0 // 0 = off, 1 = moderate, 2 = strict
      });
      
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
      
      if (error.message && error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'API限流',
          details: '搜索请求过于频繁,请稍后再试'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
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

