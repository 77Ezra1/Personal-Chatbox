#!/usr/bin/env node

/**
 * 测试完整的AI调用流程，包括工具调用
 */

console.log('🔍 开始测试完整的AI调用流程...')

// 模拟环境变量
process.env.NODE_ENV = 'development'

// 导入必要的模块
import { generateAIResponse } from './src/lib/aiClient.js'

// 模拟工具定义
const mockTools = [
  {
    type: 'function',
    function: {
      name: 'duckduckgo_search',
      description: '搜索互联网信息，获取最新和相关的内容',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          max_results: {
            type: 'integer',
            description: '最大结果数量',
            default: 10
          }
        },
        required: ['query']
      }
    }
  }
]

// 测试配置
const testConfigs = [
  {
    name: 'DeepSeek Chat 基础测试',
    config: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: 'sk-03db8009812649359e2f83cc738861aa',
      temperature: 0.7,
      maxTokens: 1024,
      deepThinking: false,
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    messages: [
      {
        role: 'user',
        content: '你好，请简单介绍一下自己',
        attachments: []
      }
    ],
    tools: [],
    expectToolCall: false
  },
  {
    name: 'DeepSeek Chat 工具调用测试',
    config: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: 'sk-03db8009812649359e2f83cc738861aa',
      temperature: 0.7,
      maxTokens: 1024,
      deepThinking: false,
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    messages: [
      {
        role: 'user',
        content: '请帮我搜索2025年中国美妆市场的发展趋势',
        attachments: []
      }
    ],
    tools: mockTools,
    expectToolCall: true
  },
  {
    name: 'DeepSeek Reasoner 深度思考测试',
    config: {
      provider: 'deepseek',
      model: 'deepseek-reasoner',
      apiKey: 'sk-03db8009812649359e2f83cc738861aa',
      temperature: 0.7,
      maxTokens: 1024,
      deepThinking: true,
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    messages: [
      {
        role: 'user',
        content: '请分析一下人工智能在美妆行业的应用前景',
        attachments: []
      }
    ],
    tools: mockTools,
    expectToolCall: true
  }
]

/**
 * 测试单个配置
 */
async function testSingleConfig(testConfig) {
  console.log(`\n🧪 测试: ${testConfig.name}`)
  console.log('=' .repeat(50))
  
  const { config, messages, tools, expectToolCall } = testConfig
  
  try {
    console.log('📤 发送请求...')
    console.log('- 模型:', config.model)
    console.log('- 工具数量:', tools.length)
    console.log('- 期望工具调用:', expectToolCall ? '是' : '否')
    
    let responseContent = ''
    let hasToolCalls = false
    let toolCallsData = []
    
    const response = await generateAIResponse({
      messages,
      modelConfig: config,
      tools,
      onToken: (token, fullText) => {
        if (typeof fullText === 'string') {
          responseContent = fullText
        } else if (typeof token === 'string') {
          responseContent += token
        }
      },
      signal: new AbortController().signal
    })
    
    console.log('📥 收到响应:')
    console.log('- 内容长度:', response.content?.length || 0, '字符')
    console.log('- 有推理过程:', response.reasoning ? '是' : '否')
    console.log('- 有工具调用:', response.tool_calls ? '是' : '否')
    
    if (response.tool_calls && response.tool_calls.length > 0) {
      hasToolCalls = true
      toolCallsData = response.tool_calls
      console.log('🔧 工具调用详情:')
      response.tool_calls.forEach((toolCall, index) => {
        console.log(`  ${index + 1}. ${toolCall.function.name}`)
        console.log(`     参数: ${toolCall.function.arguments}`)
      })
    }
    
    // 验证结果
    const results = {
      success: true,
      hasContent: !!response.content,
      hasReasoning: !!response.reasoning,
      hasToolCalls,
      toolCallMatch: expectToolCall === hasToolCalls,
      contentLength: response.content?.length || 0,
      reasoningLength: response.reasoning?.length || 0
    }
    
    console.log('\n📊 测试结果:')
    console.log(`- 请求成功: ${results.success ? '✅' : '❌'}`)
    console.log(`- 有内容返回: ${results.hasContent ? '✅' : '❌'}`)
    console.log(`- 有推理过程: ${results.hasReasoning ? '✅' : '❌'}`)
    console.log(`- 工具调用匹配: ${results.toolCallMatch ? '✅' : '❌'}`)
    
    // 显示内容预览
    if (response.content) {
      console.log('\n📄 内容预览:')
      console.log(response.content.substring(0, 200) + '...')
    }
    
    if (response.reasoning) {
      console.log('\n🧠 推理预览:')
      console.log(response.reasoning.substring(0, 200) + '...')
    }
    
    return {
      name: testConfig.name,
      success: true,
      results,
      response
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message)
    console.log('📋 错误详情:', error.stack)
    
    return {
      name: testConfig.name,
      success: false,
      error: error.message,
      results: null
    }
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始完整的AI调用流程测试')
  console.log('🎯 测试目标: 验证AI模型配置、工具调用和响应处理')
  
  const testResults = []
  
  for (const testConfig of testConfigs) {
    const result = await testSingleConfig(testConfig)
    testResults.push(result)
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 汇总结果
  console.log('\n' + '='.repeat(80))
  console.log('📊 测试结果汇总')
  console.log('='.repeat(80))
  
  let passedCount = 0
  
  testResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`)
    
    if (result.success) {
      const { results } = result
      console.log(`   状态: ✅ 成功`)
      console.log(`   - 内容返回: ${results.hasContent ? '✅' : '❌'}`)
      console.log(`   - 推理过程: ${results.hasReasoning ? '✅' : '❌'}`)
      console.log(`   - 工具调用: ${results.toolCallMatch ? '✅' : '❌'}`)
      console.log(`   - 内容长度: ${results.contentLength} 字符`)
      
      if (results.hasContent && results.toolCallMatch) {
        passedCount++
      }
    } else {
      console.log(`   状态: ❌ 失败`)
      console.log(`   错误: ${result.error}`)
    }
  })
  
  const successRate = (passedCount / testResults.length) * 100
  
  console.log('\n📈 总体统计:')
  console.log(`- 测试用例总数: ${testResults.length}`)
  console.log(`- 通过用例数: ${passedCount}`)
  console.log(`- 成功率: ${successRate.toFixed(1)}%`)
  
  // 诊断建议
  console.log('\n🔧 诊断建议:')
  
  const failedTests = testResults.filter(r => !r.success)
  if (failedTests.length > 0) {
    console.log('❌ 失败的测试:')
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.error}`)
    })
  }
  
  const noToolCallTests = testResults.filter(r => r.success && r.results && !r.results.toolCallMatch)
  if (noToolCallTests.length > 0) {
    console.log('⚠️ 工具调用不匹配的测试:')
    noToolCallTests.forEach(test => {
      console.log(`- ${test.name}: 期望工具调用但未触发`)
    })
    console.log('建议检查:')
    console.log('  1. 工具定义是否正确')
    console.log('  2. 用户消息是否明确需要搜索')
    console.log('  3. AI模型是否支持工具调用')
  }
  
  if (passedCount === testResults.length) {
    console.log('\n🎉 所有测试都通过了！AI调用流程正常工作。')
  } else if (passedCount > 0) {
    console.log('\n⚠️ 部分测试通过，可能存在特定问题。')
  } else {
    console.log('\n❌ 所有测试都失败了，需要检查基础配置。')
  }
  
  return {
    total: testResults.length,
    passed: passedCount,
    successRate,
    results: testResults
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('❌ 测试运行失败:', error)
  process.exit(1)
})
