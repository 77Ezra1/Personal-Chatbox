/**
 * MCP Server Configuration
 * MCP 服务器配置
 */

/**
 * 预置的 MCP 服务配置
 */
export const PRESET_MCP_SERVERS = {
  TAVILY_SEARCH: {
    id: 'tavily-search',
    type: 'search',
    name: 'Tavily 搜索',
    description: '专为 AI 优化的网络搜索服务，提供高质量、相关性强的搜索结果',
    icon: '🔍',
    url: 'https://api.tavily.com/mcp',
    authType: 'bearer',
    requiresApiKey: true,
    apiKeyLabel: 'Tavily API Key',
    apiKeyPlaceholder: 'tvly-xxxxxxxxxxxxxxxxxxxxxxxx',
    signupUrl: 'https://tavily.com',
    docsUrl: 'https://docs.tavily.com',
    tools: [
      {
        name: 'tavily_search',
        description: '在网络上搜索信息',
        parameters: {
          query: '搜索查询词',
          search_depth: '搜索深度（basic/advanced）',
          max_results: '最大结果数'
        }
      }
    ],
    isEnabled: false,
    apiKey: ''
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
    tools: [
      {
        name: 'brave_web_search',
        description: '网页搜索',
        parameters: {
          query: '搜索查询词'
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
    apiKey: ''
  },

  OPENWEATHER: {
    id: 'openweather',
    type: 'weather',
    name: 'OpenWeather',
    description: '全球天气预报服务，提供当前天气、预报和历史数据',
    icon: '🌤️',
    url: 'https://api.openweathermap.org/mcp',
    authType: 'bearer',
    requiresApiKey: true,
    apiKeyLabel: 'OpenWeather API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    signupUrl: 'https://openweathermap.org/api',
    docsUrl: 'https://openweathermap.org/api',
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
        description: '获取天气预报',
        parameters: {
          location: '城市名称或坐标',
          days: '预报天数'
        }
      }
    ],
    isEnabled: false,
    apiKey: ''
  },

  NWS_WEATHER: {
    id: 'nws-weather',
    type: 'weather',
    name: 'NWS 天气（美国）',
    description: '美国国家气象局提供的免费天气服务，无需 API Key',
    icon: '🇺🇸',
    url: 'https://api.weather.gov/mcp',
    authType: 'none',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
    signupUrl: '',
    docsUrl: 'https://www.weather.gov/documentation/services-web-api',
    tools: [
      {
        name: 'get_alerts',
        description: '获取天气警报',
        parameters: {
          state: '美国州代码（如 CA, NY）'
        }
      },
      {
        name: 'get_forecast',
        description: '获取天气预报',
        parameters: {
          latitude: '纬度',
          longitude: '经度'
        }
      }
    ],
    isEnabled: false,
    apiKey: ''
  }
}

/**
 * MCP 服务类型
 */
export const MCP_SERVICE_TYPES = {
  SEARCH: 'search',
  WEATHER: 'weather',
  CUSTOM: 'custom'
}

/**
 * MCP 服务类型标签
 */
export const MCP_SERVICE_TYPE_LABELS = {
  search: '搜索服务',
  weather: '天气服务',
  custom: '自定义服务'
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
    case 'tavily-search':
      return apiKey.startsWith('tvly-') && apiKey.length > 20
    case 'brave-search':
      return apiKey.startsWith('BSA') && apiKey.length > 20
    case 'openweather':
      return apiKey.length === 32
    default:
      return apiKey.length > 10
  }
}

