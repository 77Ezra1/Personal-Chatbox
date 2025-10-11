/**
 * 大模型工具调用测试脚本
 * 使用OpenAI客户端测试MCP工具调用
 */

import OpenAI from 'openai'
import { convertMcpToolsToOpenAIFormat, executeMcpTool } from './src/lib/mcpClient.js'

// 使用环境变量中的OpenAI配置
const client = new OpenAI()

// 模拟启用的服务器配置
const enabledServers = [
  {
    id: 'duckduckgo-search',
    type: 'search',
    name: 'DuckDuckGo 搜索',
    isEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'open-meteo-weather',
    type: 'weather', 
    name: 'Open-Meteo 天气',
    isEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'official-time-server',
    type: 'time',
    name: '官方时间服务',
    isEnabled: true,
    requiresApiKey: false
  }
]

async function testLLMWithTools() {
  console.log('🤖 开始测试大模型工具调用...\n')
  
  // 转换MCP工具为OpenAI格式
  const tools = convertMcpToolsToOpenAIFormat(enabledServers)
  console.log('✅ 已转换', tools.length, '个工具为OpenAI格式')
  
  // 测试问题列表
  const testQuestions = [
    "北京今天天气怎么样？",
    "帮我搜索一下最新的AI技术趋势",
    "现在几点了？"
  ]
  
  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i]
    console.log(`\n📝 测试问题 ${i + 1}: ${question}`)
    
    try {
      // 调用大模型
      const response = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        tools: tools,
        tool_choice: 'auto'
      })
      
      const message = response.choices[0].message
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('🔧 大模型请求调用工具:', message.tool_calls.length, '个')
        
        // 执行工具调用
        const toolResults = []
        for (const toolCall of message.tool_calls) {
          console.log('  - 工具:', toolCall.function.name)
          console.log('  - 参数:', toolCall.function.arguments)
          
          try {
            const args = JSON.parse(toolCall.function.arguments)
            const result = await executeMcpTool(toolCall.function.name, args, enabledServers)
            
            if (result.success) {
              console.log('  ✅ 工具执行成功')
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: result.content
              })
            } else {
              console.log('  ❌ 工具执行失败:', result.error)
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: `工具执行失败: ${result.error}`
              })
            }
          } catch (error) {
            console.log('  ❌ 工具执行异常:', error.message)
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: `工具执行异常: ${error.message}`
            })
          }
        }
        
        // 将工具结果发送回大模型
        const finalResponse = await client.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'user',
              content: question
            },
            message,
            ...toolResults
          ]
        })
        
        console.log('🎯 最终回答:', finalResponse.choices[0].message.content)
        
      } else {
        console.log('📝 直接回答:', message.content)
      }
      
    } catch (error) {
      console.log('❌ 测试失败:', error.message)
    }
  }
  
  console.log('\n🏁 大模型工具调用测试完成！')
}

// 运行测试
testLLMWithTools().catch(console.error)
