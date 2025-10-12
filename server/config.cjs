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
    // ========== 第一批 MCP 服务 (官方) ==========
    
    // Memory - 知识图谱记忆系统
    memory: {
      id: 'memory',
      name: 'Memory记忆系统',
      enabled: true,
      autoLoad: true,
      description: '知识图谱式的持久化记忆系统,支持实体、关系和观察',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory']
    },
    
    // Filesystem - 文件系统操作
    filesystem: {
      id: 'filesystem',
      name: 'Filesystem文件系统',
      enabled: true,
      autoLoad: true,
      description: '安全的文件系统操作,支持读写、编辑、搜索文件',
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        '/home/ubuntu/AI-Life-system' // 允许访问项目目录
      ]
    },
    
    // Git - 版本控制操作
    git: {
      id: 'git',
      name: 'Git版本控制',
      enabled: false,  // 暂时禁用,需要调试
      autoLoad: false,
      description: 'Git版本控制操作,支持状态查询、提交、分支管理',
      command: 'python',
      args: [
        '-m',
        'mcp_server_git',
        '--repository',
        '/home/ubuntu/AI-Life-system' // Git仓库路径
      ]
    },
    
    // Sequential Thinking - 推理增强
    sequential_thinking: {
      id: 'sequential_thinking',
      name: 'Sequential Thinking推理增强',
      enabled: true,
      autoLoad: true,
      description: '结构化思考过程,支持复杂问题分解和推理',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      env: {
        DISABLE_THOUGHT_LOGGING: 'false' // 启用思考日志
      }
    },
    
    // ========== 第一批 MCP 服务 (社区) ==========
    
    // SQLite - 数据库操作
    sqlite: {
      id: 'sqlite',
      name: 'SQLite数据库',
      enabled: true,
      autoLoad: true,
      description: 'SQLite数据库操作,支持CRUD和自定义SQL查询',
      command: 'npx',
      args: [
        '-y',
        'mcp-sqlite',
        '/home/ubuntu/AI-Life-system/data/app.db' // 数据库文件路径
      ]
    },
    
    // Wikipedia - 维基百科查询
    wikipedia: {
      id: 'wikipedia',
      name: 'Wikipedia维基百科',
      enabled: false,  // 暂时禁用,需要调试
      autoLoad: false,
      description: '维基百科信息查询,支持搜索、文章获取、摘要提取',
      command: 'wikipedia-mcp',
      args: ['--language', 'zh-hans'], // 简体中文
      env: {
        WIKIPEDIA_ACCESS_TOKEN: process.env.WIKIPEDIA_ACCESS_TOKEN || ''
      }
    },
    
    // ========== 原有服务 (保留) ==========
    
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
    
    // 搜索服务(保留 - 待第二批替换为Brave Search)
    search: {
      id: 'search',
      name: '多引擎搜索',
      enabled: true,
      autoLoad: true,
      description: '支持多个搜索引擎的网络搜索服务',
      engines: ['bing', 'duckduckgo', 'brave']
    },
    
    // 网页抓取服务(保留)
    fetch: {
      id: 'fetch',
      name: '网页内容抓取',
      enabled: true,
      autoLoad: true,
      description: '从URL获取网页内容并转换为Markdown'
    },
    
    // Playwright浏览器自动化服务(保留)
    playwright: {
      id: 'playwright',
      name: 'Playwright浏览器自动化',
      enabled: true,
      autoLoad: true,
      description: '使用Playwright进行浏览器自动化操作'
    },
    
    // ========== 暂时禁用的服务 ==========
    
    // YouTube字幕服务
    youtube: {
      id: 'youtube',
      name: 'YouTube字幕提取',
      enabled: false,
      autoLoad: false,
      description: '获取YouTube视频的字幕和转录文本'
    },
    
    // 加密货币服务
    coincap: {
      id: 'coincap',
      name: '加密货币数据',
      enabled: false,
      autoLoad: false,
      description: '获取实时加密货币价格和市场数据'
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

