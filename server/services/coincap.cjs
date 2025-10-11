/**
 * 加密货币数据服务 (基于CoinCap API)
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');

class CoincapService extends BaseService {
  constructor(config) {
    super(config);
    
    this.baseUrl = 'https://api.coincap.io/v2';
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_bitcoin_price',
          description: '获取比特币的实时价格和市场数据',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_crypto_price',
          description: '获取指定加密货币的实时价格和市场数据',
          parameters: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: '加密货币符号,例如: bitcoin, ethereum, cardano'
              }
            },
            required: ['symbol']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_crypto_assets',
          description: '列出热门加密货币资产',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: '返回数量限制,默认10',
                default: 10
              }
            }
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行加密货币工具: ${toolName}`, parameters);
    
    try {
      switch (toolName) {
        case 'get_bitcoin_price':
          return await this.getBitcoinPrice();
        
        case 'get_crypto_price':
          return await this.getCryptoPrice(parameters);
        
        case 'list_crypto_assets':
          return await this.listAssets(parameters);
        
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

  async getBitcoinPrice() {
    try {
      const response = await fetch(`${this.baseUrl}/assets/bitcoin`);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('API返回数据格式错误');
      }
      
      const btc = data.data;
      const content = this.formatCryptoData(btc);
      
      return {
        success: true,
        content: content,
        metadata: {
          symbol: 'bitcoin',
          timestamp: data.timestamp
        }
      };
    } catch (error) {
      logger.error('获取比特币价格失败:', error);
      throw error;
    }
  }

  async getCryptoPrice(parameters) {
    const { symbol } = parameters;
    
    // 验证参数
    this.validateParameters(parameters, ['symbol']);
    
    try {
      const response = await fetch(`${this.baseUrl}/assets/${symbol.toLowerCase()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: '未找到该加密货币',
            details: `未找到符号为 "${symbol}" 的加密货币,请检查拼写`
          };
        }
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('API返回数据格式错误');
      }
      
      const crypto = data.data;
      const content = this.formatCryptoData(crypto);
      
      return {
        success: true,
        content: content,
        metadata: {
          symbol: symbol,
          timestamp: data.timestamp
        }
      };
    } catch (error) {
      logger.error(`获取${symbol}价格失败:`, error);
      throw error;
    }
  }

  async listAssets(parameters = {}) {
    const { limit = 10 } = parameters;
    
    try {
      const response = await fetch(`${this.baseUrl}/assets?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('API返回数据格式错误');
      }
      
      const content = this.formatAssetList(data.data);
      
      return {
        success: true,
        content: content,
        metadata: {
          count: data.data.length,
          timestamp: data.timestamp
        }
      };
    } catch (error) {
      logger.error('获取加密货币列表失败:', error);
      throw error;
    }
  }

  formatCryptoData(crypto) {
    const price = parseFloat(crypto.priceUsd);
    const marketCap = parseFloat(crypto.marketCapUsd);
    const volume24h = parseFloat(crypto.volumeUsd24Hr);
    const change24h = parseFloat(crypto.changePercent24Hr);
    
    let content = `**${crypto.name} (${crypto.symbol})**\n\n`;
    content += `💰 当前价格: $${price.toFixed(2)}\n`;
    content += `📊 市值: $${(marketCap / 1e9).toFixed(2)}B\n`;
    content += `📈 24h交易量: $${(volume24h / 1e6).toFixed(2)}M\n`;
    content += `${change24h >= 0 ? '📈' : '📉'} 24h涨跌: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%\n`;
    
    if (crypto.supply) {
      content += `🔢 流通供应: ${(parseFloat(crypto.supply) / 1e6).toFixed(2)}M\n`;
    }
    
    if (crypto.maxSupply) {
      content += `🎯 最大供应: ${(parseFloat(crypto.maxSupply) / 1e6).toFixed(2)}M\n`;
    }
    
    return content;
  }

  formatAssetList(assets) {
    let content = `**热门加密货币资产 (Top ${assets.length})**\n\n`;
    
    assets.forEach((asset, index) => {
      const price = parseFloat(asset.priceUsd);
      const change24h = parseFloat(asset.changePercent24Hr);
      const marketCap = parseFloat(asset.marketCapUsd);
      
      content += `**${index + 1}. ${asset.name} (${asset.symbol})**\n`;
      content += `   💰 价格: $${price.toFixed(2)}`;
      content += ` | ${change24h >= 0 ? '📈' : '📉'} ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
      content += ` | 市值: $${(marketCap / 1e9).toFixed(2)}B\n\n`;
    });
    
    return content;
  }
}

module.exports = CoincapService;

