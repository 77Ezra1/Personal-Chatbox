#!/usr/bin/env node

/**
 * 模拟前端环境的完整测试，包括MCP管理器和工具调用流程
 */

console.log('🔍 开始模拟前端环境测试...')

// 模拟浏览器环境
global.fetch = (await import('node-fetch')).default

// 导入必要的模块
import { generateAIResponse } from './src/lib/aiClient.js'

// 模拟MCP管理器
class MockMcpManager {
  constructor() {
    this.connections = [
      {
        serverId: 'duckduckgo-search',
        isReady: true,
        tools: [
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
      }
    ]
  }

  getAllTools() {
    const allTools = []
    this.connections.forEach(connection => {
      if (connection.isReady && connection.tools) {
        allTools.push(...connection.tools)
      }
    })
    console.log('[Mock MCP Manager] All available tools:', allTools.length)
    return allTools
  }

  async callTool(toolName, parameters) {
    console.log('[Mock MCP Manager] Calling tool:', toolName, 'with params:', parameters)
    
    if (toolName === 'duckduckgo_search') {
      return await this.callSearchAPI(parameters)
    }
    
    throw new Error(`Tool ${toolName} not found`)
  }

  async callSearchAPI(parameters) {
    const { query, max_results = 10, attempt = 1 } = parameters
    
    try {
      console.log(`[Mock Search API] 开始第${attempt}次搜索请求:`, query)
      
      // 简化的搜索实现
      const keywords = query.split(' ').filter(word => word.length > 1).slice(0, 3)
      console.log('[Mock Search API] 提取关键词:', keywords)
      
      // 尝试Wikipedia搜索
      const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
      wikiSearchUrl.searchParams.append('action', 'query')
      wikiSearchUrl.searchParams.append('format', 'json')
      wikiSearchUrl.searchParams.append('list', 'search')
      wikiSearchUrl.searchParams.append('srsearch', keywords.join(' '))
      wikiSearchUrl.searchParams.append('srlimit', '3')
      wikiSearchUrl.searchParams.append('origin', '*')

      const response = await fetch(wikiSearchUrl)
      if (!response.ok) {
        throw new Error(`Wikipedia API失败: ${response.status}`)
      }

      const data = await response.json()
      
      // 格式化搜索结果为思考过程内容
      let content = `[搜索执行完成]\n\n**搜索概况:**\n- 查询: ${query}\n- 关键词: ${keywords.join(', ')}\n- 尝试次数: ${attempt}\n\n`
      
      if (data.query && data.query.search && data.query.search.length > 0) {
        content += `**获取到的信息:**\n\n`
        data.query.search.slice(0, 2).forEach((result, index) => {
          content += `${index + 1}. **${result.title}**\n`
          content += `   ${result.snippet.replace(/<[^>]*>/g, '')}...\n`
          content += `   来源: https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}\n\n`
        })
        
        content += `**质量评估:**\n- 结果数量: ${data.query.search.length}\n- 可靠性评分: 85/100 (Wikipedia权威来源)\n- 时效性: 良好\n\n`
      } else {
        content += `**未找到相关信息**\n- 建议: 尝试调整搜索关键词\n\n`
      }
      
      content += `[搜索结果整理完成，请基于以上信息进行分析和回复]\n`
      
      console.log('[Mock Search API] 搜索成功，返回内容长度:', content.length)
      
      return {
        success: true,
        content
      }
      
    } catch (error) {
      console.error('[Mock Search API] 搜索失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 模拟完整的前端工具调用流程
 */
async function simulateFrontendFlow() {
  console.log('\n🎭 开始模拟完整的前端工具调用流程...')
  
  // 创建MCP管理器实例
  const mcpManager = new MockMcpManager()
  
  // 获取工具列表
  const tools = mcpManager.getAllTools()
  console.log('🔧 可用工具数量:', tools.length)
  
  // 模拟用户消息
  const userMessage = {
    role: 'user',
    content: '请帮我分析一下2025年中国美妆市场的发展趋势',
    attachments: []
  }
  
  // 模拟AI配置
  const modelConfig = {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: 'sk-03db8009812649359e2f83cc738861aa',
    temperature: 0.7,
    maxTokens: 1024,
    deepThinking: true, // 开启深度思考
    endpoint: 'https://api.deepseek.com/v1/chat/completions'
  }
  
  console.log('\n📤 第一步：发送初始AI请求...')
  
  let accumulatedContent = ''
  let toolCallReasoning = ''
  
  try {
    // 第一次AI调用
    const response = await generateAIResponse({
      messages: [userMessage],
      modelConfig,
      tools,
      onToken: (token, fullText) => {
        if (typeof fullText === 'string') {
          accumulatedContent = fullText
        } else if (typeof token === 'string') {
          accumulatedContent += token
        }
      },
      signal: new AbortController().signal
    })
    
    console.log('📥 AI响应:')
    console.log('- 内容长度:', response.content?.length || 0)
    console.log('- 有工具调用:', response.tool_calls ? '是' : '否')
    console.log('- 工具调用数量:', response.tool_calls?.length || 0)
    
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('\n🔧 第二步：处理工具调用...')
      
      const toolResults = []
      
      for (const toolCall of response.tool_calls) {
        try {
          console.log('🔨 处理工具调用:', toolCall.function.name)
          const args = JSON.parse(toolCall.function.arguments)
          
          // 在思考过程中记录工具调用
          toolCallReasoning += `\n\n[MCP服务调用] ${toolCall.function.name}\n参数: ${JSON.stringify(args, null, 2)}\n`
          
          const result = await mcpManager.callTool(toolCall.function.name, args)
          
          // 在思考过程中记录工具调用结果
          if (result.success) {
            toolCallReasoning += `[搜索结果获取成功]\n${result.content}\n`
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: result.content
            })
          } else {
            toolCallReasoning += `[搜索结果获取失败] ${result.error}\n`
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: `Error: ${result.error}`
            })
          }
        } catch (error) {
          toolCallReasoning += `[工具调用异常] ${error.message}\n`
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: `Error: ${error.message}`
          })
        }
      }
      
      console.log('✅ 工具调用完成，结果数量:', toolResults.length)
      
      // 构建包含工具结果的消息历史
      const messagesWithTools = [
        userMessage,
        {
          role: 'assistant',
          content: response.content || null,
          tool_calls: response.tool_calls
        },
        ...toolResults
      ]
      
      console.log('\n📤 第三步：基于工具结果生成最终回复...')
      
      // 添加系统提示
      const systemPromptForToolResult = `
基于以上MCP服务搜索结果，请进行全面分析和整理：
1. 仔细分析搜索到的信息，确保准确性和相关性
2. 如果信息不够充分或不够准确，可以再次调用搜索服务
3. 将搜索结果整理成结构化、易读的回复
4. 在回复末尾适当添加重要信息的来源链接
5. 确保回复内容的可靠性、精确性和时效性
6. 所有的搜索过程和分析过程都应该在思考过程中体现
`
      
      let finalAccumulatedContent = ''
      
      // 使用工具结果重新生成回复
      const finalResponse = await generateAIResponse({
        messages: [
          ...messagesWithTools,
          {
            role: 'system',
            content: systemPromptForToolResult,
            attachments: []
          }
        ],
        modelConfig: { ...modelConfig, deepThinking: true },
        signal: new AbortController().signal,
        tools: [], // 不再允许工具调用，避免无限循环
        onToken: (token, fullText) => {
          if (typeof fullText === 'string') {
            finalAccumulatedContent = fullText
          } else if (typeof token === 'string') {
            finalAccumulatedContent += token
          }
        }
      })
      
      console.log('📥 最终AI响应:')
      console.log('- 内容长度:', finalResponse.content?.length || 0)
      console.log('- 有推理过程:', finalResponse.reasoning ? '是' : '否')
      console.log('- 推理长度:', finalResponse.reasoning?.length || 0)
      
      // 模拟前端显示逻辑
      console.log('\n🖥️ 第四步：模拟前端显示...')
      
      let displayContent = finalResponse.content || ''
      let currentReasoning = toolCallReasoning
      
      // 提取推理内容（如果有）
      if (finalResponse.reasoning) {
        currentReasoning += '\n\n[分析整理过程]\n' + finalResponse.reasoning
      }
      
      console.log('📄 最终显示内容:')
      console.log('- 主要内容长度:', displayContent.length, '字符')
      console.log('- 思考过程长度:', currentReasoning.length, '字符')
      
      console.log('\n📄 内容预览:')
      console.log(displayContent.substring(0, 300) + '...')
      
      console.log('\n🧠 思考过程预览:')
      console.log(currentReasoning.substring(0, 300) + '...')
      
      return {
        success: true,
        content: displayContent,
        reasoning: currentReasoning,
        toolCallsExecuted: response.tool_calls.length,
        finalContentLength: displayContent.length,
        reasoningLength: currentReasoning.length
      }
      
    } else {
      console.log('⚠️ AI没有调用工具，直接返回回复')
      return {
        success: true,
        content: response.content,
        reasoning: response.reasoning || '',
        toolCallsExecuted: 0,
        finalContentLength: response.content?.length || 0,
        reasoningLength: response.reasoning?.length || 0
      }
    }
    
  } catch (error) {
    console.error('❌ 前端流程模拟失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 运行完整测试
 */
async function runCompleteTest() {
  console.log('🚀 开始完整的前端环境模拟测试')
  console.log('🎯 目标: 找出本地测试失败的真正原因')
  
  try {
    const result = await simulateFrontendFlow()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 前端模拟测试结果')
    console.log('='.repeat(80))
    
    if (result.success) {
      console.log('✅ 测试成功')
      console.log(`- 工具调用次数: ${result.toolCallsExecuted}`)
      console.log(`- 最终内容长度: ${result.finalContentLength} 字符`)
      console.log(`- 思考过程长度: ${result.reasoningLength} 字符`)
      
      if (result.toolCallsExecuted > 0 && result.finalContentLength > 0) {
        console.log('\n🎉 完整流程正常工作！')
        console.log('💡 如果本地测试仍然失败，可能的原因:')
        console.log('1. 前端环境配置问题（API密钥、端点等）')
        console.log('2. 浏览器网络限制或CORS问题')
        console.log('3. 前端状态管理问题')
        console.log('4. 错误处理逻辑问题')
      } else {
        console.log('\n⚠️ 流程有问题:')
        if (result.toolCallsExecuted === 0) {
          console.log('- AI没有调用工具，可能是提示词或工具定义问题')
        }
        if (result.finalContentLength === 0) {
          console.log('- 最终内容为空，可能是响应处理问题')
        }
      }
    } else {
      console.log('❌ 测试失败:', result.error)
      console.log('\n🔧 建议检查:')
      console.log('1. API密钥是否正确')
      console.log('2. 网络连接是否正常')
      console.log('3. 模型配置是否正确')
    }
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest().catch(console.error)
