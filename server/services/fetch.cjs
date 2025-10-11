/**
 * 网页内容抓取服务
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { createProxyClient } = require('../lib/ProxyClient.cjs');

// 创建支持代理的HTTP客户端
const axios = createProxyClient();

class FetchService extends BaseService {
  constructor(config) {
    super(config);
    
    // 初始化Markdown转换器
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'fetch_url',
          description: '从URL获取网页内容并转换为Markdown格式',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: '要抓取的网页URL'
              },
              max_length: {
                type: 'number',
                description: '返回内容的最大字符数,默认5000',
                default: 5000
              },
              raw: {
                type: 'boolean',
                description: '是否返回原始HTML(false则返回Markdown)',
                default: false
              }
            },
            required: ['url']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行网页抓取工具: ${toolName}`, parameters);
    
    try {
      const { url, max_length = 5000, raw = false } = parameters;
      
      // 验证参数
      this.validateParameters(parameters, ['url']);
      
      // 验证URL格式
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return {
          success: false,
          error: 'URL格式错误',
          details: '请提供有效的URL,例如: https://example.com'
        };
      }
      
      logger.info(`抓取网页: ${url}`);
      
      // 获取网页内容
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Life-System/1.0; +https://github.com/77Ezra1/AI-Life-system)'
        },
        maxRedirects: 5,
        timeout: 10000
      });
      
      if (response.status !== 200) {
        return {
          success: false,
          error: `网页请求失败: ${response.status}`,
          details: response.statusText
        };
      }
      
      const html = response.data;
      
      // 提取主要内容
      const extractedContent = this.extractMainContent(html);
      
      // 转换为Markdown或返回原始HTML
      let content;
      if (raw) {
        content = extractedContent;
      } else {
        content = this.turndownService.turndown(extractedContent);
      }
      
      // 限制长度
      if (content.length > max_length) {
        content = content.substring(0, max_length) + '\n\n...(内容已截断)';
      }
      
      const result = `**网页内容**\n\n` +
                    `🔗 URL: ${url}\n` +
                    `📄 格式: ${raw ? 'HTML' : 'Markdown'}\n` +
                    `📏 长度: ${content.length} 字符\n\n` +
                    `**内容:**\n\n${content}`;
      
      return {
        success: true,
        content: result,
        metadata: {
          url: url,
          format: raw ? 'html' : 'markdown',
          length: content.length,
          truncated: content.length >= max_length
        }
      };
      
    } catch (error) {
      logger.error('网页抓取失败:', error);
      
      if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: '无法访问该网站',
          details: '请检查URL是否正确,或者该网站可能无法访问'
        };
      }
      
      if (error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: '请求超时',
          details: '网站响应时间过长,请稍后再试'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
  }

  extractMainContent(html) {
    const $ = cheerio.load(html);
    
    // 移除不需要的元素
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();
    
    // 尝试找到主要内容区域
    let mainContent = null;
    
    // 常见的主内容选择器
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.post-content',
      '.entry-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0 && element.text().trim().length > 100) {
        mainContent = element.html();
        break;
      }
    }
    
    // 如果没找到主内容,使用body
    if (!mainContent) {
      mainContent = $('body').html();
    }
    
    return mainContent || html;
  }
}

module.exports = FetchService;

