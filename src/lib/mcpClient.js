/**
 * MCP Client
 * 处理 MCP 工具调用
 */

/**
 * 调用 Tavily 搜索
 * @param {string} apiKey 
 * @param {string} query 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
export async function callTavilySearch(apiKey, query, options = {}) {
  const {
    searchDepth = 'basic',
    maxResults = 5,
    includeAnswer = true
  } = options

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Tavily search error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 调用 OpenWeatherMap 获取当前天气
 * @param {string} apiKey 
 * @param {string} location 
 * @param {string} units 
 * @returns {Promise<Object>}
 */
export async function callOpenWeatherCurrent(apiKey, location, units = 'metric') {
  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather')
    url.searchParams.append('q', location)
    url.searchParams.append('appid', apiKey)
    url.searchParams.append('units', units)

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('OpenWeather current weather error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 调用 OpenWeatherMap 获取天气预报
 * @param {string} apiKey 
 * @param {string} location 
 * @param {string} units 
 * @returns {Promise<Object>}
 */
export async function callOpenWeatherForecast(apiKey, location, units = 'metric') {
  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/forecast')
    url.searchParams.append('q', location)
    url.searchParams.append('appid', apiKey)
    url.searchParams.append('units', units)

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('OpenWeather forecast error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 格式化 Tavily 搜索结果为文本
 * @param {Object} data 
 * @returns {string}
 */
export function formatTavilyResults(data) {
  let text = ''

  if (data.answer) {
    text += `**回答**: ${data.answer}\n\n`
  }

  if (data.results && data.results.length > 0) {
    text += `**搜索结果**:\n\n`
    data.results.forEach((result, index) => {
      text += `${index + 1}. **${result.title}**\n`
      text += `   ${result.content}\n`
      text += `   来源: ${result.url}\n\n`
    })
  }

  return text
}

/**
 * 格式化 OpenWeather 当前天气为文本
 * @param {Object} data 
 * @returns {string}
 */
export function formatOpenWeatherCurrent(data) {
  const temp = Math.round(data.main.temp)
  const feelsLike = Math.round(data.main.feels_like)
  const weather = data.weather[0]
  const humidity = data.main.humidity
  const windSpeed = data.wind.speed

  return `**${data.name} 当前天气**

🌡️ 温度: ${temp}°C (体感 ${feelsLike}°C)
☁️ 天气: ${weather.description}
💧 湿度: ${humidity}%
💨 风速: ${windSpeed} m/s`
}

/**
 * 格式化 OpenWeather 天气预报为文本
 * @param {Object} data 
 * @returns {string}
 */
export function formatOpenWeatherForecast(data) {
  let text = `**${data.city.name} 天气预报**\n\n`

  // 只显示未来24小时（8个3小时间隔）
  const forecasts = data.list.slice(0, 8)
  
  forecasts.forEach(forecast => {
    const date = new Date(forecast.dt * 1000)
    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const temp = Math.round(forecast.main.temp)
    const weather = forecast.weather[0].description

    text += `${time}: ${temp}°C, ${weather}\n`
  })

  return text
}

/**
 * 将 MCP 工具转换为 OpenAI 函数格式
 * @param {Array} servers 
 * @returns {Array}
 */
export function convertMcpToolsToOpenAIFormat(servers) {
  const tools = []

  servers.forEach(server => {
    if (!server.isEnabled) return

    switch (server.id) {
      case 'tavily-search':
        tools.push({
          type: 'function',
          function: {
            name: 'tavily_search',
            description: '在网络上搜索信息，获取最新、最相关的搜索结果',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索查询词'
                },
                search_depth: {
                  type: 'string',
                  enum: ['basic', 'advanced'],
                  description: '搜索深度，basic 为基础搜索，advanced 为深度搜索'
                }
              },
              required: ['query']
            }
          }
        })
        break

      case 'openweather':
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
                  description: '城市名称，例如：Beijing, London, New York'
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial'],
                  description: '温度单位，metric 为摄氏度，imperial 为华氏度'
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
            description: '获取指定城市的天气预报（未来5天）',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: '城市名称，例如：Beijing, London, New York'
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial'],
                  description: '温度单位，metric 为摄氏度，imperial 为华氏度'
                }
              },
              required: ['location']
            }
          }
        })
        break
    }
  })

  return tools
}

/**
 * 执行 MCP 工具调用
 * @param {string} toolName 
 * @param {Object} parameters 
 * @param {Array} servers 
 * @returns {Promise<Object>}
 */
export async function executeMcpTool(toolName, parameters, servers) {
  try {
    switch (toolName) {
      case 'tavily_search': {
        const server = servers.find(s => s.id === 'tavily-search' && s.isEnabled)
        if (!server || !server.apiKey) {
          throw new Error('Tavily 搜索服务未配置或未启用')
        }

        const result = await callTavilySearch(
          server.apiKey,
          parameters.query,
          { searchDepth: parameters.search_depth || 'basic' }
        )

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatTavilyResults(result.data),
          rawData: result.data
        }
      }

      case 'get_current_weather': {
        const server = servers.find(s => s.id === 'openweather' && s.isEnabled)
        if (!server || !server.apiKey) {
          throw new Error('OpenWeather 服务未配置或未启用')
        }

        const result = await callOpenWeatherCurrent(
          server.apiKey,
          parameters.location,
          parameters.units || 'metric'
        )

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatOpenWeatherCurrent(result.data),
          rawData: result.data
        }
      }

      case 'get_weather_forecast': {
        const server = servers.find(s => s.id === 'openweather' && s.isEnabled)
        if (!server || !server.apiKey) {
          throw new Error('OpenWeather 服务未配置或未启用')
        }

        const result = await callOpenWeatherForecast(
          server.apiKey,
          parameters.location,
          parameters.units || 'metric'
        )

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatOpenWeatherForecast(result.data),
          rawData: result.data
        }
      }

      default:
        throw new Error(`未知的工具: ${toolName}`)
    }
  } catch (error) {
    console.error('MCP tool execution error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

