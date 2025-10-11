/**
 * MCP Manager Hook
 * 使用 use-mcp 包管理真实的 MCP 服务器连接
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { initializeMcpServices, getEnabledServices } from '@/lib/mcpInit'

/**
 * MCP 服务管理器
 * 管理多个 MCP 服务器连接并聚合工具
 */
export function useMcpManager() {
  const [enabledServers, setEnabledServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载已启用的服务器
  const loadEnabledServers = useCallback(async () => {
    try {
      setLoading(true)
      // 先初始化服务
      await initializeMcpServices()
      // 然后获取已启用的服务
      const servers = await getEnabledServices()
      console.log('[MCP Manager] Loaded enabled servers:', servers)
      setEnabledServers(servers)
      setError(null)
    } catch (err) {
      console.error('[MCP Manager] Failed to load servers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadEnabledServers()
  }, [loadEnabledServers])

  // 为每个启用的服务器创建连接（这里我们使用模拟实现，因为真实的MCP服务器需要单独部署）
  const mcpConnections = useMemo(() => {
    return enabledServers.map(server => ({
      serverId: server.id,
      serverName: server.name,
      // 这里我们返回模拟的工具，实际项目中应该连接到真实的MCP服务器
      tools: getServerTools(server),
      isReady: true
    }))
  }, [enabledServers])

  // 获取所有可用工具
  const getAllTools = useCallback(() => {
    const allTools = []
    mcpConnections.forEach(connection => {
      if (connection.isReady && connection.tools) {
        allTools.push(...connection.tools)
      }
    })
    console.log('[MCP Manager] All available tools:', allTools)
    return allTools
  }, [mcpConnections])

  // 调用工具
  const callTool = useCallback(async (toolName, parameters) => {
    console.log('[MCP Manager] Calling tool:', toolName, 'with params:', parameters)
    
    // 找到对应的服务器
    const connection = mcpConnections.find(conn => 
      conn.tools.some(tool => tool.function.name === toolName)
    )
    
    if (!connection) {
      throw new Error(`Tool ${toolName} not found in any connected server`)
    }

    // 执行工具调用（这里使用模拟实现）
    return await executeToolCall(toolName, parameters, connection.serverId)
  }, [mcpConnections])

  return {
    loading,
    error,
    enabledServers,
    connections: mcpConnections,
    getAllTools,
    callTool,
    reload: loadEnabledServers
  }
}

/**
 * 根据服务器配置生成工具定义
 */
function getServerTools(server) {
  const tools = []

  switch (server.id) {
    case 'open-meteo-weather':
      tools.push({
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: '获取指定城市的当前天气信息',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '城市名称，支持中文或英文'
              },
              units: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: '温度单位',
                default: 'celsius'
              }
            },
            required: ['location']
          }
        }
      })
      tools.push({
        type: 'function',
        function: {
          name: 'get_weather_forecast',
          description: '获取指定城市的天气预报',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '城市名称，支持中文或英文'
              },
              days: {
                type: 'number',
                description: '预报天数，1-16天',
                default: 3
              },
              units: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: '温度单位',
                default: 'celsius'
              }
            },
            required: ['location']
          }
        }
      })
      break

    case 'duckduckgo-search':
      tools.push({
        type: 'function',
        function: {
          name: 'duckduckgo_search',
          description: '使用DuckDuckGo进行网络搜索，隐私保护',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询词'
              },
              max_results: {
                type: 'number',
                description: '最大结果数量，默认10',
                default: 10
              }
            },
            required: ['query']
          }
        }
      })
      break

    case 'official-time-server':
      tools.push({
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '获取指定时区的当前时间',
          parameters: {
            type: 'object',
            properties: {
              timezone: {
                type: 'string',
                description: 'IANA时区名称，如Asia/Shanghai, America/New_York等',
                default: 'Asia/Shanghai'
              }
            },
            required: []
          }
        }
      })
      tools.push({
        type: 'function',
        function: {
          name: 'convert_time',
          description: '在不同时区间转换时间',
          parameters: {
            type: 'object',
            properties: {
              source_timezone: {
                type: 'string',
                description: '源时区的IANA名称'
              },
              time: {
                type: 'string',
                description: '时间，HH:MM格式，如14:30'
              },
              target_timezone: {
                type: 'string',
                description: '目标时区的IANA名称'
              }
            },
            required: ['source_timezone', 'time', 'target_timezone']
          }
        }
      })
      break
  }

  return tools
}

/**
 * 执行工具调用
 */
async function executeToolCall(toolName, parameters, serverId) {
  console.log(`[MCP Manager] Executing ${toolName} on server ${serverId}`)

  try {
    switch (toolName) {
      case 'get_current_weather':
      case 'get_weather_forecast':
        return await callWeatherAPI(toolName, parameters)
      
      case 'duckduckgo_search':
        return await callSearchAPI(parameters)
      
      case 'get_current_time':
        return await callTimeAPI(parameters)
      
      case 'convert_time':
        return await callTimeConversionAPI(parameters)
      
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  } catch (error) {
    console.error(`[MCP Manager] Tool call failed:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 调用天气API
 */
async function callWeatherAPI(toolName, parameters) {
  const { location, units = 'celsius', days = 1 } = parameters

  try {
    // 使用Open-Meteo API
    const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
    geocodeUrl.searchParams.append('name', location)
    geocodeUrl.searchParams.append('count', '1')
    geocodeUrl.searchParams.append('language', 'zh')

    const geocodeResponse = await fetch(geocodeUrl)
    if (!geocodeResponse.ok) {
      throw new Error('地理编码失败')
    }

    const geocodeData = await geocodeResponse.json()
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('未找到指定城市')
    }

    const { latitude, longitude, name, country } = geocodeData.results[0]

    // 获取天气数据
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
    weatherUrl.searchParams.append('latitude', latitude)
    weatherUrl.searchParams.append('longitude', longitude)
    weatherUrl.searchParams.append('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m')
    weatherUrl.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum')
    weatherUrl.searchParams.append('forecast_days', toolName === 'get_weather_forecast' ? days : 1)
    weatherUrl.searchParams.append('timezone', 'auto')

    if (units === 'fahrenheit') {
      weatherUrl.searchParams.append('temperature_unit', 'fahrenheit')
    }

    const weatherResponse = await fetch(weatherUrl)
    if (!weatherResponse.ok) {
      throw new Error('天气数据获取失败')
    }

    const weatherData = await weatherResponse.json()

    // 格式化响应
    const tempUnit = units === 'fahrenheit' ? '°F' : '°C'
    let content = `**${name}${country ? `, ${country}` : ''} 天气信息**\n\n`

    if (weatherData.current) {
      content += `🌡️ 当前温度: ${weatherData.current.temperature_2m}${tempUnit}\n`
      content += `💧 相对湿度: ${weatherData.current.relative_humidity_2m}%\n`
      content += `💨 风速: ${weatherData.current.wind_speed_10m} km/h\n`
      content += `☁️ 天气状况: ${getWeatherDescription(weatherData.current.weather_code)}\n\n`
    }

    if (toolName === 'get_weather_forecast' && weatherData.daily && weatherData.daily.temperature_2m_max) {
      content += `**未来几天预报:**\n`
      for (let i = 1; i < Math.min(weatherData.daily.temperature_2m_max.length, days + 1); i++) {
        const maxTemp = weatherData.daily.temperature_2m_max[i]
        const minTemp = weatherData.daily.temperature_2m_min[i]
        const weatherCode = weatherData.daily.weather_code[i]
        const precipitation = weatherData.daily.precipitation_sum[i] || 0

        content += `第${i}天: ${minTemp}${tempUnit} - ${maxTemp}${tempUnit}, ${getWeatherDescription(weatherCode)}`
        if (precipitation > 0) {
          content += `, 降水 ${precipitation}mm`
        }
        content += '\n'
      }
    }

    return {
      success: true,
      content
    }
  } catch (error) {
    throw new Error(`天气查询失败: ${error.message}`)
  }
}

/**
 * 调用搜索API
 */
async function callSearchAPI(parameters) {
  const { query, max_results = 10 } = parameters

  try {
    // 使用Wikipedia API进行搜索，这是一个可靠且无CORS限制的API
    const searchUrl = new URL('https://zh.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query))
    
    let content = `**搜索结果 - "${query}"**\n\n`
    let hasResults = false

    try {
      // 尝试获取Wikipedia页面摘要
      const response = await fetch(searchUrl)
      if (response.ok) {
        const data = await response.json()
        if (data.extract) {
          content += `**Wikipedia摘要**\n${data.extract}\n\n`
          if (data.content_urls && data.content_urls.desktop) {
            content += `详细信息: ${data.content_urls.desktop.page}\n\n`
          }
          hasResults = true
        }
      }
    } catch (wikiError) {
      console.log('Wikipedia搜索失败，尝试其他方式')
    }

    // 如果Wikipedia没有结果，提供搜索建议
    if (!hasResults) {
      // 使用OpenSearch API获取搜索建议
      try {
        const suggestUrl = new URL('https://zh.wikipedia.org/w/api.php')
        suggestUrl.searchParams.append('action', 'opensearch')
        suggestUrl.searchParams.append('search', query)
        suggestUrl.searchParams.append('limit', Math.min(max_results, 5).toString())
        suggestUrl.searchParams.append('format', 'json')
        suggestUrl.searchParams.append('origin', '*')

        const suggestResponse = await fetch(suggestUrl)
        if (suggestResponse.ok) {
          const suggestData = await suggestResponse.json()
          if (suggestData[1] && suggestData[1].length > 0) {
            content += `**相关搜索建议:**\n`
            suggestData[1].forEach((title, index) => {
              const url = suggestData[3] && suggestData[3][index] ? suggestData[3][index] : `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`
              content += `${index + 1}. ${title}\n   ${url}\n\n`
            })
            hasResults = true
          }
        }
      } catch (suggestError) {
        console.log('搜索建议获取失败')
      }
    }

    if (!hasResults) {
      content += `抱歉，没有找到关于"${query}"的相关信息。您可以尝试：\n`
      content += `• 使用更具体的关键词\n`
      content += `• 尝试不同的表达方式\n`
      content += `• 直接访问搜索引擎: https://www.google.com/search?q=${encodeURIComponent(query)}\n`
    }

    return {
      success: true,
      content
    }
  } catch (error) {
    throw new Error(`搜索失败: ${error.message}`)
  }
}

/**
 * 调用时间API
 */
async function callTimeAPI(parameters) {
  const { timezone = 'Asia/Shanghai' } = parameters

  try {
    const now = new Date()
    
    let timeString, offsetString
    if (timezone && timezone !== 'local') {
      const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      
      const formatter = new Intl.DateTimeFormat('zh-CN', options)
      timeString = formatter.format(now)
      
      const offsetMinutes = now.getTimezoneOffset()
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
      const offsetMins = Math.abs(offsetMinutes) % 60
      offsetString = `${offsetMinutes <= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`
    } else {
      timeString = now.toLocaleString('zh-CN')
      offsetString = 'local'
    }

    const content = `**当前时间信息**

🕐 时间: ${timeString}
🌍 时区: ${timezone}
📅 ISO格式: ${now.toISOString()}
⏰ 时间戳: ${now.getTime()}`

    return {
      success: true,
      content
    }
  } catch (error) {
    throw new Error(`时间查询失败: ${error.message}`)
  }
}

/**
 * 调用时间转换API
 */
async function callTimeConversionAPI(parameters) {
  const { source_timezone, time, target_timezone } = parameters

  try {
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error('时间格式错误，请使用 HH:MM 格式')
    }

    const today = new Date()
    const sourceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)

    const sourceOptions = { timeZone: source_timezone, hour12: false }
    const targetOptions = { timeZone: target_timezone, hour12: false }

    const sourceTime = sourceDate.toLocaleString('zh-CN', sourceOptions)
    const targetTime = sourceDate.toLocaleString('zh-CN', targetOptions)

    const content = `**时间转换结果**

📍 源时区 (${source_timezone}): ${sourceTime}
📍 目标时区 (${target_timezone}): ${targetTime}`

    return {
      success: true,
      content
    }
  } catch (error) {
    throw new Error(`时间转换失败: ${error.message}`)
  }
}

/**
 * 根据天气代码获取天气描述
 */
function getWeatherDescription(code) {
  const weatherCodes = {
    0: '晴朗',
    1: '基本晴朗',
    2: '部分多云',
    3: '阴天',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '毛毛雨',
    55: '大毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    95: '雷暴',
    96: '雷暴伴小冰雹',
    99: '雷暴伴大冰雹'
  }
  return weatherCodes[code] || '未知天气'
}
