#!/usr/bin/env node

/**
 * 测试用户项目中的MCP服务集成
 */

import { PRESET_MCP_SERVERS } from './AI-Life-system/src/lib/mcpConfig.js'
import { 
  callDuckDuckGoSearch, 
  callOpenMeteoWeather, 
  getCurrentTime,
  formatDuckDuckGoResults,
  formatOpenMeteoWeather,
  formatCurrentTime
} from './AI-Life-system/src/lib/mcpClient.js'

// DeepSeek API配置
const DEEPSEEK_API_KEY = "sk-03db8009812649359e2f83cc738861aa"
const DEEPSEEK_BASE_URL = "https://api.deepseek.com"

/**
 * 测试项目中的MCP服务配置
 */
function testMcpConfiguration() {
  console.log("=== 测试项目MCP服务配置 ===")
  
  const presetServers = Object.values(PRESET_MCP_SERVERS)
  console.log(`✓ 项目中配置了 ${presetServers.length} 个预置MCP服务`)
  
  // 按类型分组显示
  const servicesByType = {}
  presetServers.forEach(server => {
    if (!servicesByType[server.type]) {
      servicesByType[server.type] = []
    }
    servicesByType[server.type].push(server)
  })
  
  Object.entries(servicesByType).forEach(([type, servers]) => {
    console.log(`\n${type.toUpperCase()} 服务 (${servers.length}个):`)
    servers.forEach(server => {
      console.log(`  - ${server.name} (${server.id})`)
      console.log(`    描述: ${server.description}`)
      console.log(`    免费: ${server.isFree ? '是' : '否'}`)
      console.log(`    需要API Key: ${server.requiresApiKey ? '是' : '否'}`)
    })
  })
  
  return presetServers
}

/**
 * 测试MCP工具调用
 */
async function testMcpTools() {
  console.log("\n=== 测试MCP工具调用 ===")
  
  try {
    // 1. 测试DuckDuckGo搜索（免费，无需API Key）
    console.log("\n1. 测试DuckDuckGo搜索...")
    const searchResult = await callDuckDuckGoSearch("人工智能", { maxResults: 3 })
    if (searchResult.success) {
      console.log("✓ DuckDuckGo搜索成功")
      console.log("搜索结果:", searchResult.data.results.length, "条")
    } else {
      console.log("✗ DuckDuckGo搜索失败:", searchResult.error)
    }
    
    // 2. 测试Open-Meteo天气（免费，无需API Key）
    console.log("\n2. 测试Open-Meteo天气...")
    const weatherResult = await callOpenMeteoWeather("北京")
    if (weatherResult.success) {
      console.log("✓ Open-Meteo天气查询成功")
      console.log("天气数据:", weatherResult.data.location.name)
    } else {
      console.log("✗ Open-Meteo天气查询失败:", weatherResult.error)
    }
    
    // 3. 测试时间服务
    console.log("\n3. 测试时间服务...")
    const timeResult = await getCurrentTime("Asia/Shanghai")
    if (timeResult.success) {
      console.log("✓ 时间服务成功")
      console.log("当前时间:", timeResult.data.datetime)
    } else {
      console.log("✗ 时间服务失败:", timeResult.error)
    }
    
    return {
      search: searchResult,
      weather: weatherResult,
      time: timeResult
    }
    
  } catch (error) {
    console.error("MCP工具测试异常:", error)
    return null
  }
}

/**
 * 模拟DeepSeek调用MCP工具
 */
async function simulateDeepSeekMcpCall() {
  console.log("\n=== 模拟DeepSeek调用MCP工具 ===")
  
  try {
    // 构造OpenAI格式的工具定义
    const tools = [
      {
        type: "function",
        function: {
          name: "duckduckgo_search",
          description: "在网络上搜索信息，隐私保护",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "搜索查询词"
              },
              max_results: {
                type: "number",
                description: "最大结果数（默认10）"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_current_weather",
          description: "获取指定城市的当前天气",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "城市名称"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_current_time",
          description: "获取指定时区的当前时间",
          parameters: {
            type: "object",
            properties: {
              timezone: {
                type: "string",
                description: "时区名称（如 Asia/Shanghai）"
              }
            },
            required: []
          }
        }
      }
    ]
    
    // 使用fetch调用DeepSeek API
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '请帮我查询一下北京的天气情况'
          }
        ],
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error(`DeepSeek API调用失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log("✓ DeepSeek API调用成功")
    console.log("模型响应:", data.choices[0].message.content)
    
    if (data.choices[0].message.tool_calls) {
      console.log("🔧 模型请求调用工具:")
      data.choices[0].message.tool_calls.forEach(toolCall => {
        console.log(`  - ${toolCall.function.name}`)
        console.log(`    参数: ${toolCall.function.arguments}`)
      })
      
      // 执行工具调用
      for (const toolCall of data.choices[0].message.tool_calls) {
        const { name, arguments: args } = toolCall.function
        const parsedArgs = JSON.parse(args)
        
        console.log(`\n执行工具: ${name}`)
        let toolResult
        
        switch (name) {
          case 'duckduckgo_search':
            toolResult = await callDuckDuckGoSearch(parsedArgs.query, { maxResults: parsedArgs.max_results || 5 })
            if (toolResult.success) {
              console.log("✓ 搜索工具执行成功")
              console.log(formatDuckDuckGoResults(toolResult.data))
            }
            break
            
          case 'get_current_weather':
            toolResult = await callOpenMeteoWeather(parsedArgs.location)
            if (toolResult.success) {
              console.log("✓ 天气工具执行成功")
              console.log(formatOpenMeteoWeather(toolResult.data))
            }
            break
            
          case 'get_current_time':
            toolResult = await getCurrentTime(parsedArgs.timezone || 'Asia/Shanghai')
            if (toolResult.success) {
              console.log("✓ 时间工具执行成功")
              console.log(formatCurrentTime(toolResult.data))
            }
            break
            
          default:
            console.log(`未知工具: ${name}`)
        }
      }
      
      return true
    } else {
      console.log("模型没有调用任何工具")
      return false
    }
    
  } catch (error) {
    console.error("✗ DeepSeek MCP调用模拟失败:", error)
    return false
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log("开始测试用户项目中的MCP服务集成...\n")
  
  // 1. 测试MCP配置
  const presetServers = testMcpConfiguration()
  
  // 2. 测试MCP工具
  const toolResults = await testMcpTools()
  
  // 3. 模拟DeepSeek调用
  const deepseekSuccess = await simulateDeepSeekMcpCall()
  
  console.log("\n=== 测试总结 ===")
  console.log(`配置的MCP服务: ${presetServers.length}个`)
  console.log(`工具测试结果: ${toolResults ? '部分成功' : '失败'}`)
  console.log(`DeepSeek集成: ${deepseekSuccess ? '成功' : '失败'}`)
  
  if (deepseekSuccess) {
    console.log("\n🎉 项目中的MCP服务可以正常与DeepSeek模型集成！")
  } else {
    console.log("\n⚠️  项目中的MCP服务集成存在问题，需要进一步调试。")
  }
}

// 运行测试
main().catch(console.error)
