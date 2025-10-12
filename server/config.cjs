/**
 * 后端服务配置文件
 */

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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
        process.cwd() // 使用当前工作目录,跨平台兼容
      ],
      // 动态配置支持
      configurable: true,
      configFields: [
        {
          key: 'allowedDirectories',
          label: '允许访问的目录',
          type: 'array',
          default: [process.cwd()],
          description: '文件系统服务可以访问的目录列表'
        }
      ]
    },
    
    // Git - 版本控制操作
    git: {
      id: 'git',
      name: 'Git版本控制',
      enabled: true,  // 已启用
      autoLoad: true,
      description: 'Git版本控制操作,支持状态查询、提交、分支管理',
      command: 'python3',
      args: [
        '-m',
        'mcp_server_git',
        '--repository',
        process.cwd() // 使用当前工作目录,跨平台兼容
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
        require('path').join(process.cwd(), 'data', 'app.db') // 跨平台路径
      ],
      // 动态配置支持
      configurable: true,
      configFields: [
        {
          key: 'databasePath',
          label: '数据库文件路径',
          type: 'string',
          default: require('path').join(process.cwd(), 'data', 'app.db'),
          description: 'SQLite数据库文件的完整路径'
        }
      ]
    },
    
    // Wikipedia - 维基百科查询
    wikipedia: {
      id: 'wikipedia',
      name: 'Wikipedia维基百科',
      enabled: true,  // 已启用
      autoLoad: true,
      description: '维基百科信息查询,支持搜索、文章获取、摘要提取',
      command: 'npx',
      args: ['-y', '@shelm/wikipedia-mcp-server']
    },
    
    // ========== 第二批 MCP 服务 (需要 API Key) ==========
    
    // Brave Search - 网页搜索
    brave_search: {
      id: 'brave_search',
      name: 'Brave Search网页搜索',
      enabled: true,
      autoLoad: true,
      requiresConfig: true,  // 标记需要配置
      description: 'Brave Search API,提供网页、新闻、图片、视频搜索',
      command: 'npx',
      args: ['-y', '@brave/brave-search-mcp-server'],
      env: {
        BRAVE_API_KEY: '' // 从配置系统读取
      }
    },
    
    // GitHub - 仓库管理
    github: {
      id: 'github',
      name: 'GitHub仓库管理',
      enabled: true,
      autoLoad: true,
      requiresConfig: true,  // 标记需要配置
      description: 'GitHub API集成,支持仓库管理、PR、Issue、文件操作',
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-github'
      ],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '' // 从配置系统读取
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

