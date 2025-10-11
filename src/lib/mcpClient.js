/**
 * MCP Client
 * 处理 MCP 工具调用
 */

/**
 * 调用 DuckDuckGo 搜索（模拟实现）
 * @param {string} query 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
export async function callDuckDuckGoSearch(query, options = {}) {
  const { maxResults = 10 } = options

  try {
    // 使用 DuckDuckGo Instant Answer API
    const url = new URL('https://api.duckduckgo.com/')
    url.searchParams.append('q', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('no_html', '1')
    url.searchParams.append('skip_disambig', '1')

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    // 构造搜索结果
    const results = []
    
    if (data.Abstract) {
      results.push({
        title: data.Heading || '摘要',
        content: data.Abstract,
        url: data.AbstractURL || '',
        source: data.AbstractSource || 'DuckDuckGo'
      })
    }

    // 添加相关主题
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, Math.min(maxResults - results.length, 5)).forEach(topic => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
            content: topic.Text,
            url: topic.FirstURL,
            source: 'DuckDuckGo'
          })
        }
      })
    }

    return {
      success: true,
      data: {
        query,
        results,
        total: results.length
      }
    }
  } catch (error) {
    console.error('DuckDuckGo search error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 调用 Open-Meteo 天气API
 * @param {string} location 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
export async function callOpenMeteoWeather(location, options = {}) {
  const { units = 'celsius', days = 1 } = options

  try {
    // 首先通过地理编码获取坐标
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
    weatherUrl.searchParams.append('forecast_days', days)
    weatherUrl.searchParams.append('timezone', 'auto')

    if (units === 'fahrenheit') {
      weatherUrl.searchParams.append('temperature_unit', 'fahrenheit')
    }

    const weatherResponse = await fetch(weatherUrl)
    if (!weatherResponse.ok) {
      throw new Error('天气数据获取失败')
    }

    const weatherData = await weatherResponse.json()

    return {
      success: true,
      data: {
        location: { name, country, latitude, longitude },
        current: weatherData.current,
        daily: weatherData.daily,
        units: weatherData.current_units
      }
    }
  } catch (error) {
    console.error('Open-Meteo weather error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取当前时间
 * @param {string} timezone 
 * @returns {Promise<Object>}
 */
export async function getCurrentTime(timezone = 'Asia/Shanghai') {
  try {
    const now = new Date()
    
    // 如果指定了时区，转换到该时区
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
      
      // 获取时区偏移
      const offsetMinutes = now.getTimezoneOffset()
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
      const offsetMins = Math.abs(offsetMinutes) % 60
      offsetString = `${offsetMinutes <= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`
    } else {
      timeString = now.toLocaleString('zh-CN')
      offsetString = 'local'
    }

    return {
      success: true,
      data: {
        timezone: timezone || 'local',
        datetime: timeString,
        iso: now.toISOString(),
        timestamp: now.getTime(),
        offset: offsetString
      }
    }
  } catch (error) {
    console.error('Get current time error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 时区转换
 * @param {string} sourceTimezone 
 * @param {string} time 
 * @param {string} targetTimezone 
 * @returns {Promise<Object>}
 */
export async function convertTime(sourceTimezone, time, targetTimezone) {
  try {
    // 解析时间（假设是 HH:MM 格式）
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error('时间格式错误，请使用 HH:MM 格式')
    }

    // 创建今天的日期对象
    const today = new Date()
    const sourceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)

    // 转换到目标时区
    const sourceOptions = { timeZone: sourceTimezone, hour12: false }
    const targetOptions = { timeZone: targetTimezone, hour12: false }

    const sourceTime = sourceDate.toLocaleString('zh-CN', sourceOptions)
    const targetTime = sourceDate.toLocaleString('zh-CN', targetOptions)

    return {
      success: true,
      data: {
        source: {
          timezone: sourceTimezone,
          time: sourceTime
        },
        target: {
          timezone: targetTimezone,
          time: targetTime
        }
      }
    }
  } catch (error) {
    console.error('Convert time error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 调用 Brave 搜索
 * @param {string} apiKey 
 * @param {string} query 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
export async function callBraveSearch(apiKey, query, options = {}) {
  const { count = 10, country = 'CN' } = options

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search')
    url.searchParams.append('q', query)
    url.searchParams.append('count', count)
    url.searchParams.append('country', country)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Brave API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Brave search error:', error)
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
    url.searchParams.append('lang', 'zh_cn')

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
 * 调用 WeatherAPI.com 获取天气
 * @param {string} apiKey 
 * @param {string} location 
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
export async function callWeatherAPI(apiKey, location, options = {}) {
  const { days = 1, aqi = 'yes' } = options

  try {
    const endpoint = days > 1 ? 'forecast.json' : 'current.json'
    const url = new URL(`https://api.weatherapi.com/v1/${endpoint}`)
    url.searchParams.append('key', apiKey)
    url.searchParams.append('q', location)
    url.searchParams.append('aqi', aqi)
    url.searchParams.append('lang', 'zh')

    if (days > 1) {
      url.searchParams.append('days', days)
    }

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('WeatherAPI error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// === 格式化函数 ===

/**
 * 格式化 DuckDuckGo 搜索结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatDuckDuckGoResults(data) {
  let text = `**搜索结果 - "${data.query}"**\n\n`

  if (data.results && data.results.length > 0) {
    data.results.forEach((result, index) => {
      text += `${index + 1}. **${result.title}**\n`
      text += `   ${result.content}\n`
      if (result.url) {
        text += `   来源: ${result.url}\n`
      }
      text += '\n'
    })
  } else {
    text += '未找到相关结果。'
  }

  return text
}

/**
 * 格式化 Open-Meteo 天气结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatOpenMeteoWeather(data) {
  const { location, current, daily, units } = data
  const tempUnit = units.temperature_2m || '°C'
  const windUnit = units.wind_speed_10m || 'km/h'

  let text = `**${location.name}${location.country ? `, ${location.country}` : ''} 天气信息**\n\n`

  if (current) {
    text += `🌡️ 当前温度: ${current.temperature_2m}${tempUnit}\n`
    text += `💧 相对湿度: ${current.relative_humidity_2m}%\n`
    text += `💨 风速: ${current.wind_speed_10m} ${windUnit}\n`
    text += `☁️ 天气状况: ${getWeatherDescription(current.weather_code)}\n\n`
  }

  if (daily && daily.temperature_2m_max && daily.temperature_2m_max.length > 1) {
    text += `**未来几天预报:**\n`
    for (let i = 1; i < Math.min(daily.temperature_2m_max.length, 4); i++) {
      const maxTemp = daily.temperature_2m_max[i]
      const minTemp = daily.temperature_2m_min[i]
      const weatherCode = daily.weather_code[i]
      const precipitation = daily.precipitation_sum[i] || 0

      text += `第${i}天: ${minTemp}${tempUnit} - ${maxTemp}${tempUnit}, ${getWeatherDescription(weatherCode)}`
      if (precipitation > 0) {
        text += `, 降水 ${precipitation}mm`
      }
      text += '\n'
    }
  }

  return text
}

/**
 * 格式化当前时间结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatCurrentTime(data) {
  return `**当前时间信息**

🕐 时间: ${data.datetime}
🌍 时区: ${data.timezone}
📅 ISO格式: ${data.iso}
⏰ 时间戳: ${data.timestamp}`
}

/**
 * 格式化时间转换结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatTimeConversion(data) {
  return `**时间转换结果**

📍 源时区 (${data.source.timezone}): ${data.source.time}
📍 目标时区 (${data.target.timezone}): ${data.target.time}`
}

/**
 * 格式化 Brave 搜索结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatBraveSearchResults(data) {
  let text = `**Brave 搜索结果**\n\n`

  if (data.web && data.web.results && data.web.results.length > 0) {
    data.web.results.forEach((result, index) => {
      text += `${index + 1}. **${result.title}**\n`
      text += `   ${result.description}\n`
      text += `   来源: ${result.url}\n\n`
    })
  } else {
    text += '未找到相关结果。'
  }

  return text
}

/**
 * 格式化 OpenWeather 当前天气
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
 * 格式化 WeatherAPI.com 结果
 * @param {Object} data 
 * @returns {string}
 */
export function formatWeatherAPIResults(data) {
  let text = `**${data.location.name} 天气信息**\n\n`

  if (data.current) {
    const current = data.current
    text += `🌡️ 当前温度: ${current.temp_c}°C (体感 ${current.feelslike_c}°C)\n`
    text += `☁️ 天气: ${current.condition.text}\n`
    text += `💧 湿度: ${current.humidity}%\n`
    text += `💨 风速: ${current.wind_kph} km/h\n`
    text += `👁️ 能见度: ${current.vis_km} km\n`

    if (current.air_quality) {
      text += `🌫️ 空气质量指数: ${Math.round(current.air_quality.pm2_5)}\n`
    }
    text += '\n'
  }

  if (data.forecast && data.forecast.forecastday) {
    text += `**未来几天预报:**\n`
    data.forecast.forecastday.forEach((day, index) => {
      if (index === 0) return // 跳过今天
      const dayData = day.day
      text += `${day.date}: ${dayData.mintemp_c}°C - ${dayData.maxtemp_c}°C, ${dayData.condition.text}\n`
    })
  }

  return text
}

/**
 * 根据天气代码获取天气描述
 * @param {number} code 
 * @returns {string}
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
      case 'duckduckgo-search':
        tools.push({
          type: 'function',
          function: {
            name: 'duckduckgo_search',
            description: '使用DuckDuckGo进行网络搜索，隐私保护，无需API密钥',
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

      case 'brave-search':
        tools.push({
          type: 'function',
          function: {
            name: 'brave_web_search',
            description: '使用Brave搜索引擎进行网络搜索',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索查询词'
                },
                count: {
                  type: 'number',
                  description: '结果数量，默认10',
                  default: 10
                }
              },
              required: ['query']
            }
          }
        })
        break

      case 'open-meteo-weather':
        tools.push({
          type: 'function',
          function: {
            name: 'get_current_weather',
            description: '使用Open-Meteo获取当前天气信息，完全免费',
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
            description: '使用Open-Meteo获取天气预报，完全免费',
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

      case 'openweather':
        tools.push({
          type: 'function',
          function: {
            name: 'openweather_current',
            description: '使用OpenWeatherMap获取当前天气信息',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: '城市的英文名称，例如：Beijing, Shanghai, London'
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial'],
                  description: '温度单位，metric为摄氏度',
                  default: 'metric'
                }
              },
              required: ['location']
            }
          }
        })
        break

      case 'weatherapi-com':
        tools.push({
          type: 'function',
          function: {
            name: 'weatherapi_current',
            description: '使用WeatherAPI.com获取当前天气信息',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: '城市名称，支持中文或英文'
                },
                aqi: {
                  type: 'string',
                  enum: ['yes', 'no'],
                  description: '是否包含空气质量指数',
                  default: 'yes'
                }
              },
              required: ['location']
            }
          }
        })
        tools.push({
          type: 'function',
          function: {
            name: 'weatherapi_forecast',
            description: '使用WeatherAPI.com获取天气预报',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: '城市名称，支持中文或英文'
                },
                days: {
                  type: 'number',
                  description: '预报天数，1-10天',
                  default: 3
                }
              },
              required: ['location']
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
                  description: 'IANA时区名称，如Asia/Shanghai, America/New_York, Europe/London等',
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
      case 'duckduckgo_search': {
        const server = servers.find(s => s.id === 'duckduckgo-search' && s.isEnabled)
        if (!server) {
          throw new Error('DuckDuckGo 搜索服务未启用')
        }

        const result = await callDuckDuckGoSearch(parameters.query, {
          maxResults: parameters.max_results || 10
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatDuckDuckGoResults(result.data),
          rawData: result.data
        }
      }

      case 'brave_web_search': {
        const server = servers.find(s => s.id === 'brave-search' && s.isEnabled)
        if (!server || !server.apiKey) {
          throw new Error('Brave 搜索服务未配置或未启用')
        }

        const result = await callBraveSearch(server.apiKey, parameters.query, {
          count: parameters.count || 10
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatBraveSearchResults(result.data),
          rawData: result.data
        }
      }

      case 'get_current_weather': {
        // 优先使用 Open-Meteo（免费）
        const openMeteoServer = servers.find(s => s.id === 'open-meteo-weather' && s.isEnabled)
        if (openMeteoServer) {
          const result = await callOpenMeteoWeather(parameters.location, {
            units: parameters.units || 'celsius'
          })

          if (!result.success) {
            throw new Error(result.error)
          }

          return {
            success: true,
            content: formatOpenMeteoWeather(result.data),
            rawData: result.data
          }
        }

        // 备选：OpenWeatherMap
        const openWeatherServer = servers.find(s => s.id === 'openweather' && s.isEnabled)
        if (openWeatherServer && openWeatherServer.apiKey) {
          const result = await callOpenWeatherCurrent(
            openWeatherServer.apiKey,
            parameters.location,
            parameters.units === 'fahrenheit' ? 'imperial' : 'metric'
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

        throw new Error('没有可用的天气服务')
      }

      case 'get_weather_forecast': {
        // 优先使用 Open-Meteo（免费）
        const openMeteoServer = servers.find(s => s.id === 'open-meteo-weather' && s.isEnabled)
        if (openMeteoServer) {
          const result = await callOpenMeteoWeather(parameters.location, {
            units: parameters.units || 'celsius',
            days: parameters.days || 3
          })

          if (!result.success) {
            throw new Error(result.error)
          }

          return {
            success: true,
            content: formatOpenMeteoWeather(result.data),
            rawData: result.data
          }
        }

        throw new Error('没有可用的天气预报服务')
      }

      case 'openweather_current': {
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

      case 'weatherapi_current':
      case 'weatherapi_forecast': {
        const server = servers.find(s => s.id === 'weatherapi-com' && s.isEnabled)
        if (!server || !server.apiKey) {
          throw new Error('WeatherAPI 服务未配置或未启用')
        }

        const result = await callWeatherAPI(server.apiKey, parameters.location, {
          days: toolName === 'weatherapi_forecast' ? (parameters.days || 3) : 1,
          aqi: parameters.aqi || 'yes'
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatWeatherAPIResults(result.data),
          rawData: result.data
        }
      }

      case 'get_current_time': {
        const server = servers.find(s => s.id === 'official-time-server' && s.isEnabled)
        if (!server) {
          throw new Error('时间服务未启用')
        }

        const result = await getCurrentTime(parameters.timezone || 'Asia/Shanghai')

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatCurrentTime(result.data),
          rawData: result.data
        }
      }

      case 'convert_time': {
        const server = servers.find(s => s.id === 'official-time-server' && s.isEnabled)
        if (!server) {
          throw new Error('时间服务未启用')
        }

        const result = await convertTime(
          parameters.source_timezone,
          parameters.time,
          parameters.target_timezone
        )

        if (!result.success) {
          throw new Error(result.error)
        }

        return {
          success: true,
          content: formatTimeConversion(result.data),
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
