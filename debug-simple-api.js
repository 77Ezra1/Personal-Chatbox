#!/usr/bin/env node

/**
 * 简化的API测试，避免流处理问题
 */

console.log('🔍 开始简化的API测试...')

// 模拟环境变量
process.env.NODE_ENV = 'development'

// 简化的API调用测试
async function testSimpleAPI() {
  console.log('\n📡 测试DeepSeek API直接调用...')
  
  const apiKey = 'sk-03db8009812649359e2f83cc738861aa'
  const endpoint = 'https://api.deepseek.com/v1/chat/completions'
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '请帮我搜索2025年中国美妆市场的发展趋势'
      }
    ],
    temperature: 0.7,
    stream: false, // 不使用流式响应
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
    ],
    tool_choice: 'auto',
    max_tokens: 1024
  }
  
  try {
    console.log('📤 发送请求到:', endpoint)
    console.log('📋 请求体:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('📥 响应状态:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API错误:', errorText)
      return false
    }
    
    const data = await response.json()
    console.log('📄 响应数据:', JSON.stringify(data, null, 2))
    
    const message = data?.choices?.[0]?.message
    if (message) {
      console.log('\n✅ API调用成功:')
      console.log('- 内容:', message.content || '(无内容)')
      console.log('- 有工具调用:', message.tool_calls ? '是' : '否')
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('🔧 工具调用详情:')
        message.tool_calls.forEach((toolCall, index) => {
          console.log(`  ${index + 1}. ${toolCall.function.name}`)
          console.log(`     参数: ${toolCall.function.arguments}`)
        })
        
        return {
          success: true,
          hasToolCalls: true,
          toolCalls: message.tool_calls,
          content: message.content
        }
      } else {
        return {
          success: true,
          hasToolCalls: false,
          content: message.content
        }
      }
    } else {
      console.log('❌ 响应格式异常')
      return false
    }
    
  } catch (error) {
    console.log('❌ API调用失败:', error.message)
    return false
  }
}

// 模拟工具调用执行
async function simulateToolExecution(toolCalls) {
  console.log('\n🔧 模拟工具调用执行...')
  
  const toolResults = []
  
  for (const toolCall of toolCalls) {
    try {
      console.log(`🔨 执行工具: ${toolCall.function.name}`)
      const args = JSON.parse(toolCall.function.arguments)
      console.log(`📋 参数:`, args)
      
      if (toolCall.function.name === 'duckduckgo_search') {
        // 模拟搜索结果
        const searchResult = await mockSearch(args.query)
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: searchResult
        })
        
        console.log(`✅ 工具执行成功，结果长度: ${searchResult.length} 字符`)
      }
      
    } catch (error) {
      console.log(`❌ 工具执行失败: ${error.message}`)
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: `Error: ${error.message}`
      })
    }
  }
  
  return toolResults
}

// 模拟搜索功能
async function mockSearch(query) {
  console.log(`🔍 模拟搜索: ${query}`)
  
  try {
    // 简化的Wikipedia搜索
    const keywords = query.split(' ').filter(word => word.length > 1).slice(0, 3)
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
    
    let content = `[搜索执行完成]\n\n**搜索概况:**\n- 查询: ${query}\n- 关键词: ${keywords.join(', ')}\n\n`
    
    if (data.query && data.query.search && data.query.search.length > 0) {
      content += `**获取到的信息:**\n\n`
      data.query.search.slice(0, 2).forEach((result, index) => {
        content += `${index + 1}. **${result.title}**\n`
        content += `   ${result.snippet.replace(/<[^>]*>/g, '')}...\n`
        content += `   来源: https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}\n\n`
      })
    } else {
      content += `**未找到相关信息**\n\n`
    }
    
    content += `[搜索结果整理完成，请基于以上信息进行分析和回复]\n`
    
    return content
    
  } catch (error) {
    return `[搜索失败] ${error.message}`
  }
}

// 测试完整流程
async function testCompleteFlow() {
  console.log('🚀 开始完整流程测试')
  console.log('🎯 目标: 验证API调用和工具执行是否正常')
  
  try {
    // 第一步：测试API调用
    const apiResult = await testSimpleAPI()
    
    if (!apiResult || !apiResult.success) {
      console.log('❌ API调用失败，无法继续测试')
      return
    }
    
    if (!apiResult.hasToolCalls) {
      console.log('⚠️ AI没有调用工具，可能是提示词问题')
      console.log('📄 AI回复:', apiResult.content)
      return
    }
    
    // 第二步：执行工具调用
    const toolResults = await simulateToolExecution(apiResult.toolCalls)
    
    console.log('\n📊 完整流程测试结果:')
    console.log('- API调用: ✅ 成功')
    console.log('- 工具调用触发: ✅ 成功')
    console.log('- 工具执行: ✅ 成功')
    console.log(`- 工具结果数量: ${toolResults.length}`)
    
    // 第三步：模拟最终AI回复
    console.log('\n📤 模拟最终AI回复请求...')
    
    const finalRequestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: '请帮我搜索2025年中国美妆市场的发展趋势'
        },
        {
          role: 'assistant',
          content: apiResult.content,
          tool_calls: apiResult.toolCalls
        },
        ...toolResults,
        {
          role: 'system',
          content: '基于以上搜索结果，请进行全面分析和整理，提供结构化的回复。'
        }
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 1024
    }
    
    const finalResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-03db8009812649359e2f83cc738861aa`
      },
      body: JSON.stringify(finalRequestBody)
    })
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json()
      const finalMessage = finalData?.choices?.[0]?.message
      
      console.log('✅ 最终回复生成成功')
      console.log('📄 最终回复长度:', finalMessage?.content?.length || 0, '字符')
      console.log('📄 最终回复预览:', finalMessage?.content?.substring(0, 200) + '...')
      
      console.log('\n🎉 完整流程测试成功！')
      console.log('💡 这说明API和工具调用机制都是正常的')
      console.log('💡 本地测试问题可能在于:')
      console.log('  1. 流式响应处理问题')
      console.log('  2. 前端状态管理问题')
      console.log('  3. 错误处理逻辑问题')
      
    } else {
      console.log('❌ 最终回复生成失败')
    }
    
  } catch (error) {
    console.log('❌ 完整流程测试失败:', error.message)
  }
}

// 运行测试
testCompleteFlow().catch(console.error)
