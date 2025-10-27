/**
 * 后端服务配置文件
 */

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: function (origin, callback) {
        // 在生产环境允许所有来源
        if (process.env.NODE_ENV === 'production') {
          callback(null, true);
        } else {
          const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
          if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
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

    // Git - 版本控制操作 (NPM包不存在，已移除)

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
      enabled: true,  // ✅ 已编译成功，可以启用
      autoLoad: true,
      description: 'SQLite数据库操作,支持CRUD和自定义SQL查询',
      command: 'npx',
      args: [
        '-y',
        'mcp-sqlite',
        require('path').join(process.cwd(), 'app.db') // 使用项目根目录的数据库
      ],
      // 动态配置支持
      configurable: true,
      configFields: [
        {
          key: 'databasePath',
          label: '数据库文件路径',
          type: 'string',
          default: require('path').join(process.cwd(), 'app.db'),
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
      signupUrl: 'https://brave.com/search/api/',
      apiKeyPlaceholder: '输入 Brave Search API Key',
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
      signupUrl: 'https://github.com/settings/tokens',
      apiKeyPlaceholder: '输入 GitHub Personal Access Token',
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

    // ========== 第三批 MCP 服务 (新增免费服务) ==========

    // Puppeteer - 轻量级浏览器自动化
    puppeteer: {
      id: 'puppeteer',
      name: 'Puppeteer浏览器控制',
      enabled: true,  // ✅ 已启用（首次运行会下载Chromium，可能需要几分钟）
      autoLoad: true,
      description: '轻量级浏览器自动化,支持截图、PDF生成、表单填写',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer']
    },

    // Fetch - 官方网页抓取服务 (NPM包不存在，已移除)

    // Google Maps - 位置服务
    google_maps: {
      id: 'google_maps',
      name: 'Google Maps位置服务',
      enabled: false, // 默认禁用,需要API Key
      autoLoad: true,
      requiresConfig: true,
      description: '地点搜索、路线规划、地理编码服务',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-maps'],
      env: {
        GOOGLE_MAPS_API_KEY: '' // 从配置系统读取
      },
      configFields: [
        {
          key: 'GOOGLE_MAPS_API_KEY',
          label: 'Google Maps API Key',
          type: 'string',
          required: true,
          description: '从Google Cloud Console获取,有免费额度'
        }
      ]
    },

    // EverArt - AI图像生成
    everart: {
      id: 'everart',
      name: 'EverArt图像生成',
      enabled: false, // 默认禁用,需要API Key
      autoLoad: true,
      requiresConfig: true,
      description: '免费AI图像生成服务,支持多种艺术风格',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everart'],
      env: {
        EVERART_API_KEY: '' // 从配置系统读取
      },
      configFields: [
        {
          key: 'EVERART_API_KEY',
          label: 'EverArt API Key',
          type: 'string',
          required: true,
          description: '从EverArt官网免费注册获取'
        }
      ]
    },

    // ========== 第四批 MCP 服务 (高级功能) ==========

    // Magg - 元MCP服务器(统一管理所有MCP服务)
    magg: {
      id: 'magg',
      name: 'Magg元服务器',
      enabled: false, // 默认禁用,需要Python 3.12+
      autoLoad: true,
      requiresConfig: false,
      description: 'AI自主管理MCP服务器,可搜索、添加、配置其他MCP服务',
      command: 'uv',
      args: ['tool', 'run', 'magg', 'serve'],
      env: {
        MAGG_CONFIG_PATH: require('path').join(process.cwd(), '.magg', 'config.json'),
        MAGG_LOG_LEVEL: 'INFO',
        MAGG_AUTO_RELOAD: 'true'
      },
      configFields: [
        {
          key: 'MAGG_READ_ONLY',
          label: '只读模式',
          type: 'boolean',
          default: false,
          description: '启用后AI无法修改MCP服务配置'
        },
        {
          key: 'MAGG_SELF_PREFIX',
          label: '工具前缀',
          type: 'string',
          default: 'magg',
          description: 'Magg工具的命名前缀'
        }
      ],
      notes: [
        '需要Python 3.12+和uv包管理器',
        '安装: curl -LsSf https://astral.sh/uv/install.sh | sh',
        '然后: uv tool install magg',
        'Magg可以让AI自主搜索和安装其他MCP服务'
      ]
    },

    // Slack - 消息通知和团队协作
    slack: {
      id: 'slack',
      name: 'Slack消息服务',
      enabled: false,
      autoLoad: true,
      requiresConfig: true,
      description: 'Slack集成,支持发送消息、读取频道、文件上传',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: {
        SLACK_BOT_TOKEN: '', // 从配置系统读取
        SLACK_TEAM_ID: '' // 可选,指定团队ID
      },
      configFields: [
        {
          key: 'SLACK_BOT_TOKEN',
          label: 'Slack Bot Token',
          type: 'string',
          required: true,
          description: '从Slack App管理页面获取(以xoxb-开头)'
        },
        {
          key: 'SLACK_TEAM_ID',
          label: 'Slack Team ID',
          type: 'string',
          required: false,
          description: '可选,指定要连接的Slack工作区'
        }
      ],
      notes: [
        '需要创建Slack App: https://api.slack.com/apps',
        '需要的权限: channels:read, chat:write, files:write',
        '免费版Slack完全可用'
      ]
    },

    // Qdrant - 向量数据库(RAG) (NPM包不存在，已移除)

    // PostgreSQL - 生产级关系数据库
    postgresql: {
      id: 'postgresql',
      name: 'PostgreSQL数据库',
      enabled: false,
      autoLoad: true,
      requiresConfig: true,
      description: '生产级关系数据库,支持复杂查询、事务、全文搜索',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: {
        POSTGRES_CONNECTION_STRING: '' // 从配置系统读取
      },
      configFields: [
        {
          key: 'POSTGRES_CONNECTION_STRING',
          label: 'PostgreSQL连接字符串',
          type: 'string',
          required: true,
          description: '格式: postgresql://user:password@host:port/database',
          placeholder: 'postgresql://postgres:password@localhost:5432/chatbox'
        }
      ],
      notes: [
        '本地安装: sudo apt install postgresql',
        '或使用Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres',
        '免费且开源,适合生产环境'
      ]
    },

    // ========== 方案A：核心能力增强服务 ==========

    // YouTube Transcript - 视频内容学习
    youtube_transcript: {
      id: 'youtube_transcript',
      name: 'YouTube字幕提取',
      enabled: true,  // ✅ 免费，无需API Key
      autoLoad: true,
      description: '获取YouTube视频的字幕和转录文本，支持视频内容分析和学习',
      command: 'npx',
      args: ['-y', '@kimtaeyoon83/mcp-server-youtube-transcript']
    },

    // Notion - 知识库管理
    notion: {
      id: 'notion',
      name: 'Notion知识管理',
      enabled: false,  // 默认禁用，需要API Token
      autoLoad: true,
      requiresConfig: true,
      description: '创建、更新、搜索Notion页面和数据库，构建结构化知识库',
      signupUrl: 'https://www.notion.so/my-integrations',
      apiKeyPlaceholder: '输入 Notion Integration Token',
      command: 'npx',
      args: ['-y', '@notionhq/client'],
      env: {
        NOTION_API_KEY: ''  // 从配置系统读取
      },
      configFields: [
        {
          key: 'NOTION_API_KEY',
          label: 'Notion Integration Token',
          type: 'string',
          required: true,
          description: '从 https://www.notion.so/my-integrations 创建Integration获取'
        }
      ],
      notes: [
        '个人版Notion完全免费（1000个block）',
        '创建Integration后需要分享页面给Integration',
        '支持页面创建、更新、搜索、数据库操作'
      ]
    },

    // Google Calendar - 日程管理
    google_calendar: {
      id: 'google_calendar',
      name: 'Google Calendar日程管理',
      enabled: false,  // 默认禁用，需要OAuth2凭据
      autoLoad: true,
      requiresConfig: true,
      description: '创建、查询、管理Google日历事件，实现智能日程安排',
      signupUrl: 'https://console.cloud.google.com/apis/credentials',
      apiKeyPlaceholder: '输入 Google OAuth2 凭证 JSON',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-calendar'],
      env: {
        GOOGLE_CALENDAR_CREDENTIALS: ''  // OAuth2 JSON凭证
      },
      configFields: [
        {
          key: 'GOOGLE_CALENDAR_CREDENTIALS',
          label: 'Google OAuth2 凭证',
          type: 'json',
          required: true,
          description: '从Google Cloud Console创建OAuth2凭证并下载JSON文件'
        }
      ],
      notes: [
        '完全免费',
        '需要启用Google Calendar API',
        '首次使用需要授权'
      ]
    },

    // Gmail - 邮件处理
    gmail: {
      id: 'gmail',
      name: 'Gmail邮件服务',
      enabled: false,  // 默认禁用，需要OAuth2凭据
      autoLoad: true,
      requiresConfig: true,
      description: '读取、发送、搜索、管理Gmail邮件，实现邮件自动化处理',
      signupUrl: 'https://console.cloud.google.com/apis/credentials',
      apiKeyPlaceholder: '输入 Gmail OAuth2 凭证 JSON',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gmail'],
      env: {
        GMAIL_CREDENTIALS: ''  // OAuth2 JSON凭证
      },
      configFields: [
        {
          key: 'GMAIL_CREDENTIALS',
          label: 'Gmail OAuth2 凭证',
          type: 'json',
          required: true,
          description: '从Google Cloud Console创建OAuth2凭证（与Calendar可共用）'
        }
      ],
      notes: [
        '完全免费',
        '需要启用Gmail API',
        '可与Google Calendar共用OAuth2凭证'
      ]
    },

    // ========== 方案B：扩展服务（待集成） ==========

    // Bilibili - 国内视频内容
    bilibili: {
      id: 'bilibili',
      name: 'Bilibili视频服务',
      enabled: false,
      autoLoad: true,
      description: '搜索B站视频、获取热门内容、UP主信息',
      command: 'npx',
      args: ['-y', 'bilibili-mcp']
    },

    // CoinGecko - 加密货币数据
    coingecko: {
      id: 'coingecko',
      name: 'CoinGecko加密货币',
      enabled: false,
      autoLoad: true,
      description: '全球加密货币价格、市场数据、历史数据',
      command: 'npx',
      args: ['-y', 'mcp-coingecko']
    },

    // ========== 暂时禁用的服务 ==========

    // YouTube字幕服务（旧配置，已被youtube_transcript替代）
    youtube: {
      id: 'youtube',
      name: 'YouTube字幕提取（旧）',
      enabled: false,
      autoLoad: false,
      description: '获取YouTube视频的字幕和转录文本（已废弃，请使用youtube_transcript）'
    },

    // 加密货币服务（旧配置，已被coingecko替代）
    coincap: {
      id: 'coincap',
      name: '加密货币数据（旧）',
      enabled: false,
      autoLoad: false,
      description: '获取实时加密货币价格和市场数据（已废弃，请使用coingecko）'
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

