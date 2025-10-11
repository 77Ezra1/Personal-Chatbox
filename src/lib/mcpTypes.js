// MCP服务类型定义
export const MCP_SERVICE_TYPES = {
  SEARCH: 'search',
  WEATHER: 'weather', 
  TIME: 'time'
}

// MCP服务类型图标
export const MCP_SERVICE_TYPE_ICONS = {
  [MCP_SERVICE_TYPES.SEARCH]: '🔍',
  [MCP_SERVICE_TYPES.WEATHER]: '🌤️',
  [MCP_SERVICE_TYPES.TIME]: '🕐'
}

// 验证API Key格式
export const validateApiKey = (serverId, apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }
  
  // 基本格式验证
  if (apiKey.length < 10) {
    return false
  }
  
  return true
}
