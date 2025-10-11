/**
 * 后端服务配置文件
 */

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  },

  // MCP服务配置
  services: {
    // 天气服务(保留)
    weather: {
      id: 'weather',
      name: '天气服务',
      enabled: true,
      autoLoad: true,
      description: '获取全球天气信息'
    },
    
    // 时间服务(保留)
    time: {
      id: 'time',
      name: '时间服务',
      enabled: true,
      autoLoad: true,
      description: '获取当前时间和时区转换'
    },
    
    // 搜索服务(新 - 替换DuckDuckGo)
    search: {
      id: 'search',
      name: '多引擎搜索',
      enabled: false,  // 默认关闭,用户手动开启
      autoLoad: false,
      description: '支持多个搜索引擎的网络搜索服务',
      engines: ['bing', 'duckduckgo', 'brave']
    },
    
    // YouTube字幕服务(新)
    youtube: {
      id: 'youtube',
      name: 'YouTube字幕提取',
      enabled: false,
      autoLoad: false,
      description: '获取YouTube视频的字幕和转录文本'
    },
    
    // 加密货币服务(新)
    coincap: {
      id: 'coincap',
      name: '加密货币数据',
      enabled: false,
      autoLoad: false,
      description: '获取实时加密货币价格和市场数据'
    },
    
    // 网页抓取服务(新)
    fetch: {
      id: 'fetch',
      name: '网页内容抓取',
      enabled: false,
      autoLoad: false,
      description: '从URL获取网页内容并转换为Markdown'
    }
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300, // 5分钟
    maxSize: 100 // 最多缓存100个结果
  },

  // 限流配置
  rateLimit: {
    windowMs: 60 * 1000, // 1分钟
    max: 60 // 每分钟最多60个请求
  },

  // 超时配置
  timeout: {
    default: 30000, // 30秒
    search: 15000,  // 搜索15秒
    scraper: 20000  // 网页提取20秒
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/server.log'
  }
};

