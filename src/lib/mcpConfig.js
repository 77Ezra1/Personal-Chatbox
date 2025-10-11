/**
 * MCP Server Configuration
 * MCP 服务器配置
 */

/**
 * 预置的 MCP 服务配置
 */
export const PRESET_MCP_SERVERS = {
  // === 搜索服务 ===
  DUCKDUCKGO_SEARCH: {
    id: 'duckduckgo-search',
    type: 'search',
    name: 'DuckDuckGo 搜索',
    description: '隐私保护的免费网络搜索，无需API密钥',
    icon: '🦆',
    url: 'https://github.com/nickclyde/duckduckgo-mcp-server',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://github.com/nickclyde/duckduckgo-mcp-server',
    repoUrl: 'https://github.com/nickclyde/duckduckgo-mcp-server',
    installCommand: 'pip install duckduckgo-mcp-server',
    configExample: {
      "mcpServers": {
        "duckduckgo": {
          "command": "python",
          "args": ["-m", "duckduckgo_mcp_server"]
        }
      }
    },
    tools: [
      {
        name: 'duckduckgo_search',
        description: '在网络上搜索信息，隐私保护',
        parameters: {
          query: '搜索查询词',
          max_results: '最大结果数（默认10）'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'Python'
  },

  BRAVE_SEARCH: {
    id: 'brave-search',
    type: 'search',
    name: 'Brave 搜索',
    description: '隐私优先的网络搜索引擎，提供网页、图片、视频等多种搜索',
    icon: '🦁',
    url: 'https://api.search.brave.com/mcp',
    authType: 'bearer',
    requiresApiKey: true,
    apiKeyLabel: 'Brave Search API Key',
    apiKeyPlaceholder: 'BSA-xxxxxxxxxxxxxxxxxxxxxxxx',
    signupUrl: 'https://brave.com/search/api/',
    docsUrl: 'https://brave.com/search/api/guides/',
    repoUrl: 'https://github.com/mikechao/brave-search-mcp',
    installCommand: 'npm install brave-search-mcp',
    configExample: {
      "mcpServers": {
        "brave-search": {
          "command": "npx",
          "args": ["brave-search-mcp"],
          "env": {
            "BRAVE_API_KEY": "your-api-key"
          }
        }
      }
    },
    tools: [
      {
        name: 'brave_web_search',
        description: '网页搜索',
        parameters: {
          query: '搜索查询词',
          count: '结果数量'
        }
      },
      {
        name: 'brave_local_search',
        description: '本地商家搜索',
        parameters: {
          query: '搜索查询词',
          location: '位置'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    freeLimit: '2000次/月',
    language: 'TypeScript'
  },

  SEARXNG_SEARCH: {
    id: 'searxng-search',
    type: 'search',
    name: 'SearXNG 搜索',
    description: '开源元搜索引擎，聚合多个搜索引擎结果',
    icon: '🔍',
    url: 'https://github.com/Ihor-Sokoliuk/mcp-searxng',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://docs.searxng.org',
    repoUrl: 'https://github.com/Ihor-Sokoliuk/mcp-searxng',
    installCommand: 'npm install mcp-searxng',
    configExample: {
      "mcpServers": {
        "searxng": {
          "command": "npx",
          "args": ["mcp-searxng"]
        }
      }
    },
    tools: [
      {
        name: 'searxng_search',
        description: '元搜索引擎搜索',
        parameters: {
          query: '搜索查询词',
          categories: '搜索类别'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'TypeScript'
  },

  // === 天气服务 ===
  OPEN_METEO_WEATHER: {
    id: 'open-meteo-weather',
    type: 'weather',
    name: 'Open-Meteo 天气',
    description: '完全免费的高精度天气服务，无需API密钥',
    icon: '🌤️',
    url: 'https://github.com/isdaniel/mcp_weather_server',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://open-meteo.com/en/docs',
    repoUrl: 'https://github.com/isdaniel/mcp_weather_server',
    installCommand: 'pip install open-meteo-mcp-server',
    configExample: {
      "mcpServers": {
        "open-meteo": {
          "command": "python",
          "args": ["-m", "open_meteo_mcp_server"]
        }
      }
    },
    tools: [
      {
        name: 'get_current_weather',
        description: '获取当前天气',
        parameters: {
          location: '城市名称或坐标',
          units: '单位（celsius/fahrenheit）'
        }
      },
      {
        name: 'get_weather_forecast',
        description: '获取天气预报',
        parameters: {
          location: '城市名称或坐标',
          days: '预报天数（1-16）'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'Python'
  },

  OPENWEATHER: {
    id: 'openweather',
    type: 'weather',
    name: 'OpenWeather',
    description: '全球天气预报服务，提供当前天气、预报和历史数据',
    icon: '☀️',
    url: 'https://api.openweathermap.org/mcp',
    authType: 'bearer',
    requiresApiKey: true,
    apiKeyLabel: 'OpenWeather API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    signupUrl: 'https://openweathermap.org/api',
    docsUrl: 'https://openweathermap.org/api',
    repoUrl: 'https://github.com/mschneider82/mcp-openweather',
    installCommand: 'pip install openweather-mcp-server',
    configExample: {
      "mcpServers": {
        "openweather": {
          "command": "python",
          "args": ["-m", "openweather_mcp_server"],
          "env": {
            "OPENWEATHER_API_KEY": "your-api-key"
          }
        }
      }
    },
    tools: [
      {
        name: 'get_current_weather',
        description: '获取当前天气',
        parameters: {
          location: '城市名称或坐标',
          units: '单位（metric/imperial）'
        }
      },
      {
        name: 'get_weather_forecast',
        description: '获取5天天气预报',
        parameters: {
          location: '城市名称或坐标',
          units: '单位（metric/imperial）'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    freeLimit: '60,000次/月',
    language: 'Python'
  },

  WEATHERAPI_COM: {
    id: 'weatherapi-com',
    type: 'weather',
    name: 'WeatherAPI.com',
    description: '实时天气数据，详细预报和当前条件',
    icon: '🌦️',
    url: 'https://github.com/devilcoder01/weather-mcp-server',
    authType: 'bearer',
    requiresApiKey: true,
    apiKeyLabel: 'WeatherAPI Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    signupUrl: 'https://www.weatherapi.com/signup.aspx',
    docsUrl: 'https://www.weatherapi.com/docs/',
    repoUrl: 'https://github.com/devilcoder01/weather-mcp-server',
    installCommand: 'pip install weatherapi-mcp-server',
    configExample: {
      "mcpServers": {
        "weatherapi": {
          "command": "python",
          "args": ["-m", "weatherapi_mcp_server"],
          "env": {
            "WEATHERAPI_KEY": "your-api-key"
          }
        }
      }
    },
    tools: [
      {
        name: 'get_current_weather',
        description: '获取实时天气数据',
        parameters: {
          location: '城市名称或坐标',
          aqi: '是否包含空气质量指数'
        }
      },
      {
        name: 'get_weather_forecast',
        description: '获取天气预报',
        parameters: {
          location: '城市名称或坐标',
          days: '预报天数（1-10）'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    freeLimit: '1,000,000次/月',
    language: 'Python'
  },

  // === 时间服务 ===
  OFFICIAL_TIME_SERVER: {
    id: 'official-time-server',
    type: 'time',
    name: '官方时间服务',
    description: 'Anthropic官方时间服务，支持全球时区转换',
    icon: '⏰',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    repoUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    installCommand: 'pip install mcp-server-time',
    configExample: {
      "mcpServers": {
        "time": {
          "command": "uvx",
          "args": ["mcp-server-time"]
        }
      }
    },
    tools: [
      {
        name: 'get_current_time',
        description: '获取指定时区的当前时间',
        parameters: {
          timezone: 'IANA时区名称（如 Asia/Shanghai）'
        }
      },
      {
        name: 'convert_time',
        description: '在不同时区间转换时间',
        parameters: {
          source_timezone: '源时区',
          time: '时间（HH:MM格式）',
          target_timezone: '目标时区'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'Python'
  },

  ADVANCED_TIME_SERVER: {
    id: 'advanced-time-server',
    type: 'time',
    name: '高级时间服务',
    description: 'Go语言实现，支持自然语言时间处理',
    icon: '🕐',
    url: 'https://github.com/TheoBrigitte/mcp-time',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://github.com/TheoBrigitte/mcp-time',
    repoUrl: 'https://github.com/TheoBrigitte/mcp-time',
    installCommand: 'go install github.com/TheoBrigitte/mcp-time@latest',
    configExample: {
      "mcpServers": {
        "mcp-time": {
          "command": "mcp-time",
          "args": []
        }
      }
    },
    tools: [
      {
        name: 'get_time',
        description: '获取时间信息',
        parameters: {
          format: '时间格式',
          timezone: '时区'
        }
      },
      {
        name: 'parse_time',
        description: '解析自然语言时间',
        parameters: {
          input: '自然语言时间描述'
        }
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'Go'
  },

  SIMPLE_TIME_SERVER: {
    id: 'simple-time-server',
    type: 'time',
    name: '简单时间服务',
    description: '支持本地时间和NTP网络时间同步',
    icon: '⌚',
    url: 'https://github.com/andybrandt/mcp-simple-timeserver',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://github.com/andybrandt/mcp-simple-timeserver',
    repoUrl: 'https://github.com/andybrandt/mcp-simple-timeserver',
    installCommand: 'pip install mcp-simple-timeserver',
    configExample: {
      "mcpServers": {
        "simple-time": {
          "command": "python",
          "args": ["-m", "mcp_simple_timeserver"]
        }
      }
    },
    tools: [
      {
        name: 'get_local_time',
        description: '获取客户端本地时间',
        parameters: {}
      },
      {
        name: 'get_utc_time',
        description: '从NTP服务器获取UTC时间',
        parameters: {}
      }
    ],
    isEnabled: false,
    apiKey: '',
    isFree: true,
    language: 'Python'
  }
}

/**
 * MCP 服务类型
 */
export const MCP_SERVICE_TYPES = {
  SEARCH: 'search',
  WEATHER: 'weather',
  TIME: 'time',
  CUSTOM: 'custom'
}

/**
 * MCP 服务类型标签
 */
export const MCP_SERVICE_TYPE_LABELS = {
  search: '搜索服务',
  weather: '天气服务',
  time: '时间服务',
  custom: '自定义服务'
}

/**
 * 服务类型图标
 */
export const MCP_SERVICE_TYPE_ICONS = {
  search: '🔍',
  weather: '🌤️',
  time: '⏰',
  custom: '🔧'
}

/**
 * 获取预置服务列表
 * @param {string} type 服务类型（可选）
 * @returns {Array}
 */
export function getPresetServers(type = null) {
  const servers = Object.values(PRESET_MCP_SERVERS)
  if (type) {
    return servers.filter(server => server.type === type)
  }
  return servers
}

/**
 * 获取预置服务
 * @param {string} id 服务ID
 * @returns {Object|null}
 */
export function getPresetServer(id) {
  return Object.values(PRESET_MCP_SERVERS).find(server => server.id === id) || null
}

/**
 * 验证 API Key 格式
 * @param {string} serverId 服务ID
 * @param {string} apiKey API Key
 * @returns {boolean}
 */
export function validateApiKey(serverId, apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    return false
  }

  // 基本格式验证
  switch (serverId) {
    case 'brave-search':
      return apiKey.startsWith('BSA') && apiKey.length > 20
    case 'openweather':
      return apiKey.length === 32
    case 'weatherapi-com':
      return apiKey.length > 20
    default:
      return apiKey.length > 10
  }
}

/**
 * 获取服务器的OpenAI工具格式
 * @param {Object} server 服务器配置
 * @returns {Array}
 */
export function getServerTools(server) {
  return server.tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.entries(tool.parameters).reduce((props, [key, desc]) => {
          props[key] = {
            type: 'string',
            description: desc
          }
          return props
        }, {}),
        required: Object.keys(tool.parameters)
      }
    }
  }))
}
