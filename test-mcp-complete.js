/**
 * 完整的MCP工具调用测试
 * 模拟真实的应用场景
 */

import { generateAIResponse } from './src/lib/aiClient.js'

const API_KEY = 'sk-03db8009812649359e2f83cc738861aa'

// 模拟MCP工具定义
const mcpTools = [
  {
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
  },
  {
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
  }
]

async function testMcpIntegration() {
  console.log('=== 测试MCP工具集成 ===\n')
  
  const modelConfig = {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: API_KEY,
    temperature: 0.7,
    maxTokens: 2000,
    deepThinking: false
  }
  
  const messages = [
    {
      role: 'user',
      content: '帮我分析一下2025年中国的美妆市场',
      attachments: []
    }
  ]
  
  console.log('测试配置:')
  console.log('- 模型:', modelConfig.model)
  console.log('- 工具数量:', mcpTools.length)
  console.log('- 工具列表:', mcpTools.map(t => t.function.name).join(', '))
  console.log('\n开始调用...\n')
  
  try {
    let streamedContent = ''
    
    const response = await generateAIResponse({
      messages,
      modelConfig,
      tools: mcpTools,
      systemPrompt: { mode: 'none' },
      onToken: (token, fullText) => {
        if (token) {
          process.stdout.write(token)
          streamedContent += token
        }
      }
    })
    
    console.log('\n\n=== 响应结果 ===')
    console.log('Role:', response.role)
    console.log('Content:', response.content)
    
    if (response.tool_calls) {
      console.log('\n✅ 检测到工具调用!')
      console.log('Tool Calls:', JSON.stringify(response.tool_calls, null, 2))
    } else {
      console.log('\n❌ 没有检测到工具调用')
      console.log('这可能意味着:')
      console.log('1. 工具列表没有正确传递给API')
      console.log('2. 模型选择不调用工具')
      console.log('3. 系统提示词干扰了工具调用')
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('错误详情:', error)
  }
}

testMcpIntegration()

