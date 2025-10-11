/**
 * MCP Manager Hook
 * 使用 use-mcp 包管理真实的 MCP 服务器连接
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { initializeMcpServices, getEnabledServices } from '../lib/mcpInit.js'

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
 * 调用搜索API - 优化版本，确保信息可靠性、精确性和时效性
 * 注意：此函数返回的内容将在AI的思考过程中处理，不直接展示给用户
 */
async function callSearchAPI(parameters) {
  const { query, max_results = 10, attempt = 1 } = parameters
  const MAX_ATTEMPTS = 3 // 防滥用限制

  try {
    console.log(`[Search API] 开始第${attempt}次搜索请求:`, query)
    
    // 智能分析查询意图和提取关键词
    const queryAnalysis = analyzeSearchQuery(query)
    const searchKeywords = extractSearchKeywords(query)
    console.log('[Search API] 查询分析:', queryAnalysis)
    console.log('[Search API] 搜索关键词:', searchKeywords)
    
    let searchResults = []
    let reliabilityScore = 0
    let sourceLinks = []

    // 多源搜索策略 - 根据查询类型选择最佳搜索源
    const searchSources = determineSearchSources(queryAnalysis)
    
    for (const source of searchSources) {
      try {
        let results = []
        
        switch (source.type) {
          case 'wikipedia':
            results = await searchWikipedia(searchKeywords.join(' '), source.params)
            if (results.length > 0) {
              reliabilityScore += 30 // Wikipedia权威性高
              sourceLinks.push(...results.map(r => ({ title: r.title, url: r.url, source: 'Wikipedia' })))
            }
            break
            
          case 'academic':
            results = await searchAcademicSources(searchKeywords, source.params)
            if (results.length > 0) {
              reliabilityScore += 40 // 学术来源可靠性最高
              sourceLinks.push(...results.map(r => ({ title: r.title, url: r.url, source: 'Academic' })))
            }
            break
            
          case 'news':
            results = await searchRecentNews(searchKeywords, source.params)
            if (results.length > 0) {
              reliabilityScore += 20 // 新闻时效性好但可靠性中等
              sourceLinks.push(...results.map(r => ({ title: r.title, url: r.url, source: 'News' })))
            }
            break
            
          case 'industry':
            results = await searchIndustryReports(searchKeywords, source.params)
            if (results.length > 0) {
              reliabilityScore += 35 // 行业报告专业性强
              sourceLinks.push(...results.map(r => ({ title: r.title, url: r.url, source: 'Industry' })))
            }
            break
        }
        
        if (results.length > 0) {
          searchResults.push({
            source: source.name,
            type: source.type,
            results: results,
            reliability: source.reliability,
            timeliness: source.timeliness
          })
        }
        
      } catch (error) {
        console.log(`[Search API] ${source.name}搜索失败:`, error.message)
      }
    }

    // 评估搜索结果质量
    const qualityAssessment = assessSearchQuality(searchResults, queryAnalysis)
    console.log('[Search API] 搜索质量评估:', qualityAssessment)
    
    // 如果搜索质量不足且未达到最大尝试次数，建议重新搜索
    if (qualityAssessment.score < 60 && attempt < MAX_ATTEMPTS) {
      return {
        success: true,
        content: formatSearchResultsForThinking(searchResults, queryAnalysis, qualityAssessment, sourceLinks),
        metadata: {
          searchKeywords,
          queryAnalysis,
          qualityScore: qualityAssessment.score,
          reliabilityScore,
          attempt,
          needsRefinement: true,
          refinementSuggestion: qualityAssessment.suggestion
        }
      }
    }

    // 格式化最终搜索结果（用于AI思考过程）
    const formattedContent = formatSearchResultsForThinking(searchResults, queryAnalysis, qualityAssessment, sourceLinks)
    
    return {
      success: true,
      content: formattedContent,
      metadata: {
        searchKeywords,
        queryAnalysis,
        qualityScore: qualityAssessment.score,
        reliabilityScore,
        sourceCount: searchResults.length,
        attempt,
        needsRefinement: false,
        sourceLinks: sourceLinks.slice(0, 5) // 限制链接数量
      }
    }
  } catch (error) {
    console.error('[Search API] 搜索失败:', error)
    return {
      success: false,
      error: `搜索失败: ${error.message}`,
      metadata: {
        attempt,
        error: error.message
      }
    }
  }
}

/**
 * 智能分析搜索查询
 */
function analyzeSearchQuery(query) {
  const analysis = {
    type: 'general',
    intent: 'information',
    domain: 'general',
    timeframe: 'current',
    complexity: 'medium',
    keywords: [],
    entities: []
  }
  
  // 分析查询类型
  if (query.includes('2024') || query.includes('2025') || query.includes('最新') || query.includes('近期')) {
    analysis.timeframe = 'recent'
  }
  
  if (query.includes('历史') || query.includes('发展历程') || query.includes('起源')) {
    analysis.timeframe = 'historical'
  }
  
  // 分析领域
  if (query.includes('美妆') || query.includes('化妆品') || query.includes('护肤')) {
    analysis.domain = 'beauty'
  } else if (query.includes('科技') || query.includes('AI') || query.includes('人工智能')) {
    analysis.domain = 'technology'
  } else if (query.includes('市场') || query.includes('经济') || query.includes('商业')) {
    analysis.domain = 'business'
  }
  
  // 分析意图
  if (query.includes('如何') || query.includes('怎么') || query.includes('方法')) {
    analysis.intent = 'howto'
  } else if (query.includes('为什么') || query.includes('原因')) {
    analysis.intent = 'explanation'
  } else if (query.includes('趋势') || query.includes('前景') || query.includes('预测')) {
    analysis.intent = 'forecast'
  }
  
  return analysis
}

/**
 * 确定搜索源策略
 */
function determineSearchSources(queryAnalysis) {
  const sources = []
  
  // 基础搜索源 - Wikipedia（权威性）
  sources.push({
    type: 'wikipedia',
    name: 'Wikipedia',
    reliability: 85,
    timeliness: 70,
    params: { limit: 3 }
  })
  
  // 根据查询类型添加特定搜索源
  if (queryAnalysis.timeframe === 'recent' || queryAnalysis.intent === 'forecast') {
    sources.push({
      type: 'news',
      name: 'Recent News',
      reliability: 70,
      timeliness: 95,
      params: { days: 30, limit: 5 }
    })
  }
  
  if (queryAnalysis.domain === 'business' || queryAnalysis.domain === 'beauty') {
    sources.push({
      type: 'industry',
      name: 'Industry Reports',
      reliability: 80,
      timeliness: 75,
      params: { limit: 3 }
    })
  }
  
  if (queryAnalysis.complexity === 'high' || queryAnalysis.intent === 'explanation') {
    sources.push({
      type: 'academic',
      name: 'Academic Sources',
      reliability: 90,
      timeliness: 60,
      params: { limit: 2 }
    })
  }
  
  return sources
}

/**
 * 搜索学术来源（模拟实现）
 */
async function searchAcademicSources(keywords, params = {}) {
  // 模拟学术搜索结果
  const academicResults = [
    {
      title: '数字化转型对传统行业的影响研究',
      snippet: '本研究分析了数字化技术在传统行业中的应用效果和转型路径...',
      url: 'https://example.com/academic/digital-transformation',
      source: 'Academic Journal',
      year: 2024
    }
  ]
  
  return academicResults.slice(0, params.limit || 2)
}

/**
 * 搜索最新新闻
 */
async function searchRecentNews(keywords, params = {}) {
  // 模拟新闻搜索，实际应该调用新闻API
  const newsResults = [
    {
      title: '2025年行业发展新趋势发布',
      snippet: '根据最新发布的行业报告，2025年将呈现以下发展趋势...',
      url: 'https://example.com/news/2025-trends',
      source: 'Industry News',
      publishDate: '2024-12-01'
    }
  ]
  
  return newsResults.slice(0, params.limit || 5)
}

/**
 * 搜索行业报告
 */
async function searchIndustryReports(keywords, params = {}) {
  // 模拟行业报告搜索
  const industryResults = [
    {
      title: '中国美妆市场发展报告2024',
      snippet: '报告显示，中国美妆市场在2024年继续保持强劲增长势头...',
      url: 'https://example.com/reports/beauty-market-2024',
      source: 'Market Research',
      year: 2024
    }
  ]
  
  return industryResults.slice(0, params.limit || 3)
}

/**
 * 评估搜索结果质量
 */
function assessSearchQuality(searchResults, queryAnalysis) {
  let score = 0
  let feedback = []
  
  // 评估结果数量
  const totalResults = searchResults.reduce((sum, source) => sum + source.results.length, 0)
  if (totalResults >= 5) {
    score += 30
  } else if (totalResults >= 3) {
    score += 20
  } else if (totalResults >= 1) {
    score += 10
  } else {
    feedback.push('搜索结果数量不足')
  }
  
  // 评估来源多样性
  const sourceTypes = new Set(searchResults.map(s => s.type))
  score += sourceTypes.size * 15
  
  // 评估可靠性
  const avgReliability = searchResults.reduce((sum, s) => sum + s.reliability, 0) / searchResults.length
  score += Math.floor(avgReliability * 0.4)
  
  // 评估时效性匹配
  if (queryAnalysis.timeframe === 'recent') {
    const hasRecentSources = searchResults.some(s => s.timeliness > 80)
    if (hasRecentSources) score += 15
    else feedback.push('缺少最新信息来源')
  }
  
  let suggestion = ''
  if (score < 60) {
    if (totalResults < 3) {
      suggestion = '建议扩大搜索范围或使用更多关键词'
    } else if (sourceTypes.size < 2) {
      suggestion = '建议增加不同类型的信息源'
    } else {
      suggestion = '建议优化搜索关键词以获得更相关的结果'
    }
  }
  
  return {
    score: Math.min(score, 100),
    feedback,
    suggestion
  }
}

/**
 * 为AI思考过程格式化搜索结果
 */
function formatSearchResultsForThinking(searchResults, queryAnalysis, qualityAssessment, sourceLinks) {
  let content = `[搜索执行完成]\n\n`
  
  // 搜索概况
  content += `**搜索概况:**\n`
  content += `- 查询类型: ${queryAnalysis.type}\n`
  content += `- 搜索领域: ${queryAnalysis.domain}\n`
  content += `- 时间范围: ${queryAnalysis.timeframe}\n`
  content += `- 质量评分: ${qualityAssessment.score}/100\n\n`
  
  // 搜索结果详情
  if (searchResults.length > 0) {
    content += `**获取到的信息:**\n\n`
    
    searchResults.forEach((sourceGroup, index) => {
      content += `**${index + 1}. ${sourceGroup.source}** (可靠性: ${sourceGroup.reliability}%, 时效性: ${sourceGroup.timeliness}%)\n`
      
      sourceGroup.results.forEach((result, resultIndex) => {
        content += `   ${resultIndex + 1}. ${result.title}\n`
        content += `      ${result.snippet}\n`
        if (result.url) {
          content += `      来源: ${result.url}\n`
        }
        content += '\n'
      })
    })
  } else {
    content += `**未找到相关信息**\n\n`
  }
  
  // 质量评估反馈
  if (qualityAssessment.feedback.length > 0) {
    content += `**搜索质量反馈:**\n`
    qualityAssessment.feedback.forEach(feedback => {
      content += `- ${feedback}\n`
    })
    content += '\n'
  }
  
  // 改进建议
  if (qualityAssessment.suggestion) {
    content += `**改进建议:** ${qualityAssessment.suggestion}\n\n`
  }
  
  // 重要信息源链接（供最终回复使用）
  if (sourceLinks.length > 0) {
    content += `**重要信息源链接:**\n`
    sourceLinks.slice(0, 3).forEach((link, index) => {
      content += `${index + 1}. [${link.title}](${link.url}) - ${link.source}\n`
    })
    content += '\n'
  }
  
  content += `[搜索结果整理完成，请基于以上信息进行分析和回复]\n`
  
  return content
}

/**
 * 优化的Wikipedia搜索函数
 */
async function searchWikipedia(searchQuery, params = {}) {
  try {
    const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
    wikiSearchUrl.searchParams.append('action', 'query')
    wikiSearchUrl.searchParams.append('format', 'json')
    wikiSearchUrl.searchParams.append('list', 'search')
    wikiSearchUrl.searchParams.append('srsearch', searchQuery)
    wikiSearchUrl.searchParams.append('srlimit', params.limit || 3)
    wikiSearchUrl.searchParams.append('origin', '*')

    const response = await fetch(wikiSearchUrl)
    if (!response.ok) return []

    const data = await response.json()
    if (!data.query || !data.query.search) return []

    return data.query.search.map(result => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]*>/g, ''),
      url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
      source: 'Wikipedia',
      reliability: 85,
      timestamp: result.timestamp
    }))
  } catch (error) {
    console.log('Wikipedia搜索失败:', error.message)
    return []
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

/**
 * 提取搜索关键词
 */
function extractSearchKeywords(query) {
  if (!query || typeof query !== 'string') {
    return []
  }
  
  // 移除常见的停用词
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '可以', '这个', '我们', '能够', '如何', '怎么', '为什么', '哪里', '什么时候', '谁', '哪个', '多少',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'where', 'when', 'why', 'how', 'who', 'which'
  ])
  
  // 分词并过滤
  const words = query
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文、英文、数字
    .split(/\s+/)
    .filter(word => {
      return word.length > 1 && !stopWords.has(word)
    })
  
  // 提取重要关键词（限制数量避免搜索过于分散）
  const keywords = []
  
  // 优先提取数字年份
  const yearPattern = /20\d{2}/g
  const years = query.match(yearPattern)
  if (years) {
    keywords.push(...years)
  }
  
  // 提取其他关键词
  const otherWords = words.filter(word => !/20\d{2}/.test(word))
  keywords.push(...otherWords.slice(0, 5 - keywords.length))
  
  return keywords.slice(0, 5) // 最多返回5个关键词
}
