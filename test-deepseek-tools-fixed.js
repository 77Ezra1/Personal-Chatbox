#!/usr/bin/env node

/**
 * DeepSeek模型工具调用功能测试脚本
 * 测试修复后的MCP服务集成和业务逻辑流程
 */

import { generateAIResponse } from './src/lib/aiClient.js'

// 测试配置
const TEST_CONFIG = {
  apiKey: 'sk-03db8009812649359e2f83cc738861aa',
  provider: 'deepseek',
  temperature: 0.7,
  maxTokens: 2000
}

// 模拟MCP工具定义
const MOCK_TOOLS = [
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

// 模拟工具调用执行
async function mockToolCall(toolName, parameters) {
  console.log(`[Mock Tool] 执行工具调用: ${toolName}`, parameters)
  
  switch (toolName) {
    case 'duckduckgo_search':
      return {
        success: true,
        content: `**搜索结果 - "${parameters.query}"**\n\n**📚 相关背景信息:**\n1. **${parameters.query}相关概念**\n   这是关于${parameters.query}的基础信息和背景介绍...\n\n**🧠 智能分析洞察:**\n• 当前发展趋势分析\n• 市场机遇与挑战\n• 技术创新方向\n\n**📋 信息来源说明:**\n• 以上分析基于公开市场研究报告和行业趋势\n• 建议结合最新的官方数据和专业报告进行决策`
      }
    
    case 'get_current_weather':
      return {
        success: true,
        content: `**${parameters.location} 天气信息**\n\n🌡️ 当前温度: 22°C\n💧 相对湿度: 65%\n💨 风速: 8 km/h\n☁️ 天气状况: 多云`
      }
    
    default:
      return {
        success: false,
        error: `未知工具: ${toolName}`
      }
  }
}

// 测试用例
const TEST_CASES = [
  {
    name: '搜索功能测试 - deepseek-chat',
    model: 'deepseek-chat',
    deepThinking: false,
    messages: [
      {
        role: 'user',
        content: '请帮我搜索一下2025年中国美妆市场的发展趋势',
        attachments: []
      }
    ]
  },
  {
    name: '搜索功能测试 - deepseek-reasoner',
    model: 'deepseek-reasoner',
    deepThinking: true,
    messages: [
      {
        role: 'user',
        content: '分析一下人工智能在美妆行业的应用前景',
        attachments: []
      }
    ]
  },
  {
    name: '天气查询测试 - deepseek-chat',
    model: 'deepseek-chat',
    deepThinking: false,
    messages: [
      {
        role: 'user',
        content: '请查询一下北京的天气情况',
        attachments: []
      }
    ]
  },
  {
    name: '复合查询测试 - deepseek-reasoner',
    model: 'deepseek-reasoner',
    deepThinking: true,
    messages: [
      {
        role: 'user',
        content: '我想了解上海的天气，然后搜索一下上海美妆市场的情况',
        attachments: []
      }
    ]
  }
]

// 执行单个测试用例
async function runTestCase(testCase) {
  console.log(`\n🧪 开始测试: ${testCase.name}`)
  console.log(`📋 模型: ${testCase.model}`)
  console.log(`🧠 深度思考: ${testCase.deepThinking ? '开启' : '关闭'}`)
  console.log('=' .repeat(60))

  try {
    const modelConfig = {
      ...TEST_CONFIG,
      model: testCase.model,
      deepThinking: testCase.deepThinking
    }

    let accumulatedContent = ''
    let toolCallsProcessed = 0

    const response = await generateAIResponse({
      messages: testCase.messages,
      modelConfig,
      tools: MOCK_TOOLS,
      onToken: (token, fullText) => {
        if (typeof fullText === 'string') {
          accumulatedContent = fullText
        } else if (typeof token === 'string') {
          accumulatedContent += token
        }
        // 实时显示流式输出（简化版）
        if (accumulatedContent.length % 100 === 0) {
          process.stdout.write('.')
        }
      }
    })

    console.log('\n📤 AI响应:')
    console.log('内容:', response.content || accumulatedContent)
    
    if (response.reasoning) {
      console.log('\n🤔 推理过程:')
      console.log(response.reasoning)
    }

    // 检查是否有工具调用
    if (response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0) {
      console.log('\n🔧 检测到工具调用:')
      
      // 模拟工具调用处理
      const toolResults = []
      for (const toolCall of response.tool_calls) {
        console.log(`- 工具: ${toolCall.function.name}`)
        console.log(`- 参数: ${toolCall.function.arguments}`)
        
        try {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await mockToolCall(toolCall.function.name, args)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: result.success ? result.content : `Error: ${result.error}`
          })
          toolCallsProcessed++
        } catch (error) {
          console.log(`❌ 工具调用失败: ${error.message}`)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: `Error: ${error.message}`
          })
        }
      }

      // 模拟第二次AI调用（处理工具结果）
      if (toolResults.length > 0) {
        console.log('\n🔄 处理工具结果，生成最终回复...')
        
        const messagesWithTools = [
          ...testCase.messages,
          {
            role: 'assistant',
            content: response.content || null,
            tool_calls: response.tool_calls
          },
          ...toolResults
        ]

        const finalResponse = await generateAIResponse({
          messages: messagesWithTools,
          modelConfig,
          // 注意：不传递tools参数，避免无限循环
          onToken: (token, fullText) => {
            if (typeof fullText === 'string') {
              accumulatedContent = fullText
            } else if (typeof token === 'string') {
              accumulatedContent += token
            }
          }
        })

        console.log('\n📋 最终回复:')
        console.log(finalResponse.content || accumulatedContent)
        
        if (finalResponse.reasoning) {
          console.log('\n🤔 最终推理过程:')
          console.log(finalResponse.reasoning)
        }
      }
    }

    console.log('\n✅ 测试完成')
    console.log(`🔧 工具调用次数: ${toolCallsProcessed}`)
    
    return {
      success: true,
      toolCallsProcessed,
      hasContent: !!(response.content || accumulatedContent),
      hasReasoning: !!response.reasoning
    }

  } catch (error) {
    console.log('\n❌ 测试失败:')
    console.log('错误信息:', error.message)
    console.log('错误堆栈:', error.stack)
    
    return {
      success: false,
      error: error.message
    }
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始DeepSeek模型工具调用功能测试')
  console.log('🔑 API密钥:', TEST_CONFIG.apiKey.substring(0, 10) + '...')
  console.log('🌐 提供商:', TEST_CONFIG.provider)
  console.log('🛠️ 可用工具:', MOCK_TOOLS.map(t => t.function.name).join(', '))

  const results = []

  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase)
    results.push({
      name: testCase.name,
      model: testCase.model,
      ...result
    })
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // 汇总结果
  console.log('\n' + '='.repeat(80))
  console.log('📊 测试结果汇总:')
  console.log('='.repeat(80))

  let successCount = 0
  let toolCallCount = 0

  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败'
    console.log(`${index + 1}. ${result.name} (${result.model}): ${status}`)
    
    if (result.success) {
      successCount++
      toolCallCount += result.toolCallsProcessed || 0
      console.log(`   - 工具调用: ${result.toolCallsProcessed || 0}次`)
      console.log(`   - 内容生成: ${result.hasContent ? '是' : '否'}`)
      console.log(`   - 推理过程: ${result.hasReasoning ? '是' : '否'}`)
    } else {
      console.log(`   - 错误: ${result.error}`)
    }
  })

  console.log('\n📈 总体统计:')
  console.log(`- 测试用例总数: ${results.length}`)
  console.log(`- 成功用例数: ${successCount}`)
  console.log(`- 成功率: ${((successCount / results.length) * 100).toFixed(1)}%`)
  console.log(`- 工具调用总数: ${toolCallCount}`)

  if (successCount === results.length) {
    console.log('\n🎉 所有测试通过！MCP服务集成修复成功！')
    return true
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步调试')
    return false
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('测试运行失败:', error)
      process.exit(1)
    })
}

export { runAllTests, runTestCase }
