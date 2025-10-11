/**
 * Dexscreener加密货币服务
 * 使用免费的Dexscreener API获取实时加密货币价格
 */
const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { createProxyClient } = require('../lib/ProxyClient.cjs');

// 创建支持代理的HTTP客户端
const axios = createProxyClient('https://api.dexscreener.com');

class DexscreenerService extends BaseService {
  constructor(config) {
    super(config);
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'search_token',
          description: '搜索加密货币代币,获取价格和交易对信息',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询词,可以是代币名称、符号或地址,例如: BTC, ETH, SOL'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_token_price',
          description: '获取指定代币的详细价格信息',
          parameters: {
            type: 'object',
            properties: {
              chainId: {
                type: 'string',
                description: '区块链ID,例如: ethereum, bsc, solana, polygon',
                default: 'ethereum'
              },
              tokenAddress: {
                type: 'string',
                description: '代币合约地址'
              }
            },
            required: ['tokenAddress']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_trending_tokens',
          description: '获取最新的热门代币列表',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行Dexscreener工具: ${toolName}`, parameters);
    
    try {
      switch (toolName) {
        case 'search_token':
          return await this.searchToken(parameters);
        
        case 'get_token_price':
          return await this.getTokenPrice(parameters);
        
        case 'get_trending_tokens':
          return await this.getTrendingTokens();
        
        default:
          return {
            success: false,
            error: `未知工具: ${toolName}`
          };
      }
    } catch (error) {
      return this.handleApiError(error, this.name);
    }
  }

  async searchToken(parameters) {
    try {
      const { query } = parameters;
      
      this.validateParameters(parameters, ['query']);
      
      logger.info(`搜索代币: ${query}`);
      
      const response = await axios.get('/latest/dex/search', {
        params: { q: query },
        timeout: 10000
      });
      
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return {
          success: false,
          error: '未找到匹配的代币',
          details: `没有找到与"${query}"匹配的代币`
        };
      }
      
      // 取前5个结果
      const pairs = response.data.pairs.slice(0, 5);
      
      let content = `**代币搜索结果: "${query}"**\n\n`;
      content += `找到 ${pairs.length} 个交易对:\n\n`;
      
      pairs.forEach((pair, index) => {
        content += `${index + 1}. **${pair.baseToken.symbol}/${pair.quoteToken.symbol}**\n`;
        content += `   💰 价格: $${pair.priceUsd || 'N/A'}\n`;
        content += `   📊 24h交易量: $${this.formatNumber(pair.volume?.h24)}\n`;
        content += `   📈 24h涨跌: ${pair.priceChange?.h24 ? pair.priceChange.h24.toFixed(2) + '%' : 'N/A'}\n`;
        content += `   🔗 链: ${pair.chainId}\n`;
        content += `   💧 流动性: $${this.formatNumber(pair.liquidity?.usd)}\n`;
        content += `   🏪 DEX: ${pair.dexId}\n`;
        content += `   📍 地址: ${pair.pairAddress}\n\n`;
      });
      
      return {
        success: true,
        content: content,
        metadata: {
          query: query,
          resultCount: pairs.length
        }
      };
      
    } catch (error) {
      logger.error('代币搜索失败:', error);
      throw error;
    }
  }

  async getTokenPrice(parameters) {
    try {
      const { chainId = 'ethereum', tokenAddress } = parameters;
      
      this.validateParameters(parameters, ['tokenAddress']);
      
      logger.info(`获取代币价格: ${chainId}/${tokenAddress}`);
      
      const response = await axios.get(
        `/latest/dex/tokens/${chainId}/${tokenAddress}`,
        { timeout: 10000 }
      );
      
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return {
          success: false,
          error: '未找到代币信息',
          details: `未找到地址为${tokenAddress}的代币`
        };
      }
      
      const pair = response.data.pairs[0];
      const token = pair.baseToken;
      
      let content = `**${token.name} (${token.symbol}) 价格信息**\n\n`;
      content += `💰 当前价格: $${pair.priceUsd || 'N/A'}\n`;
      content += `📊 24h交易量: $${this.formatNumber(pair.volume?.h24)}\n`;
      content += `📈 价格变化:\n`;
      content += `   - 5分钟: ${pair.priceChange?.m5 ? pair.priceChange.m5.toFixed(2) + '%' : 'N/A'}\n`;
      content += `   - 1小时: ${pair.priceChange?.h1 ? pair.priceChange.h1.toFixed(2) + '%' : 'N/A'}\n`;
      content += `   - 6小时: ${pair.priceChange?.h6 ? pair.priceChange.h6.toFixed(2) + '%' : 'N/A'}\n`;
      content += `   - 24小时: ${pair.priceChange?.h24 ? pair.priceChange.h24.toFixed(2) + '%' : 'N/A'}\n`;
      content += `💧 流动性: $${this.formatNumber(pair.liquidity?.usd)}\n`;
      content += `🔗 区块链: ${pair.chainId}\n`;
      content += `🏪 DEX: ${pair.dexId}\n`;
      content += `📍 合约地址: ${token.address}\n`;
      
      return {
        success: true,
        content: content,
        metadata: {
          symbol: token.symbol,
          price: pair.priceUsd,
          chainId: pair.chainId
        }
      };
      
    } catch (error) {
      logger.error('获取代币价格失败:', error);
      throw error;
    }
  }

  async getTrendingTokens() {
    try {
      logger.info('获取热门代币');
      
      const response = await axios.get(
        '/token-profiles/latest/v1',
        { timeout: 10000 }
      );
      
      if (!response.data || response.data.length === 0) {
        return {
          success: false,
          error: '未找到热门代币',
          details: '暂时无法获取热门代币列表'
        };
      }
      
      // 取前10个
      const tokens = response.data.slice(0, 10);
      
      let content = `**最新热门代币 (Top ${tokens.length})**\n\n`;
      
      tokens.forEach((token, index) => {
        content += `${index + 1}. **${token.name || 'Unknown'}**\n`;
        content += `   🔗 链: ${token.chainId || 'N/A'}\n`;
        content += `   📍 地址: ${token.tokenAddress || 'N/A'}\n`;
        if (token.description) {
          content += `   📝 ${token.description.substring(0, 100)}...\n`;
        }
        content += '\n';
      });
      
      return {
        success: true,
        content: content,
        metadata: {
          count: tokens.length
        }
      };
      
    } catch (error) {
      logger.error('获取热门代币失败:', error);
      throw error;
    }
  }

  formatNumber(num) {
    if (!num) return 'N/A';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }
}

module.exports = DexscreenerService;

