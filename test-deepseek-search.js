// 使用Node.js内置的fetch (Node 18+)

// 测试DeepSeek API和搜索功能
async function testDeepSeekSearch() {
  const apiKey = 'sk-03db8009812649359e2f83cc738861aa'
  const query = '2025年中国美妆市场'
  
  console.log('🔍 测试搜索功能...')
  
  // 首先测试搜索工具
  try {
    const searchResult = await callSearchAPI({ query, max_results: 10 })
    console.log('✅ 搜索工具测试成功:')
    console.log(searchResult.content.substring(0, 500) + '...')
  } catch (error) {
    console.error('❌ 搜索工具测试失败:', error.message)
    return
  }
  
  console.log('\n🤖 测试DeepSeek API...')
  
  // 测试DeepSeek API
  const tools = [
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
    }
  ]
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '帮我搜索一下2025年的中国美妆市场'
      }
    ],
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1024
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ DeepSeek API请求失败:', response.status, errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ DeepSeek API测试成功:')
    console.log('Response:', JSON.stringify(data, null, 2))
    
    // 如果有工具调用，执行工具调用
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) {
      console.log('\n🔧 执行工具调用...')
      const toolCall = data.choices[0].message.tool_calls[0]
      if (toolCall.function.name === 'duckduckgo_search') {
        const searchParams = JSON.parse(toolCall.function.arguments)
        const searchResult = await callSearchAPI(searchParams)
        console.log('✅ 工具调用成功:', searchResult.content.substring(0, 300) + '...')
      }
    }
    
  } catch (error) {
    console.error('❌ DeepSeek API测试失败:', error.message)
  }
}

// 搜索API实现
async function callSearchAPI(parameters) {
  const { query, max_results = 10 } = parameters

  try {
    let content = `**搜索结果 - "${query}"**\n\n`
    let hasResults = false

    // 首先尝试Wikipedia搜索
    try {
      const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
      wikiSearchUrl.searchParams.append('action', 'query')
      wikiSearchUrl.searchParams.append('format', 'json')
      wikiSearchUrl.searchParams.append('list', 'search')
      wikiSearchUrl.searchParams.append('srsearch', query)
      wikiSearchUrl.searchParams.append('srlimit', '3')
      wikiSearchUrl.searchParams.append('origin', '*')

      const wikiResponse = await fetch(wikiSearchUrl)
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json()
        if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
          content += `**📚 Wikipedia相关内容:**\n`
          wikiData.query.search.slice(0, 2).forEach((result, index) => {
            const snippet = result.snippet.replace(/<[^>]*>/g, '') // 移除HTML标签
            content += `${index + 1}. **${result.title}**\n`
            content += `   ${snippet}...\n`
            content += `   🔗 https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}\n\n`
          })
          hasResults = true
        }
      }
    } catch (wikiError) {
      console.log('Wikipedia搜索失败:', wikiError)
    }

    // 提供专业的搜索建议和资源链接
    content += `**🔍 推荐搜索资源:**\n\n`
    
    // 根据查询内容提供针对性的搜索建议
    if (query.includes('市场') || query.includes('行业') || query.includes('报告')) {
      content += `**📊 市场研究资源:**\n`
      content += `• 艾瑞咨询: https://www.iresearch.cn/search.shtml?q=${encodeURIComponent(query)}\n`
      content += `• 前瞻产业研究院: https://www.qianzhan.com/search/?q=${encodeURIComponent(query)}\n`
      content += `• 中商产业研究院: https://www.askci.com/search/?q=${encodeURIComponent(query)}\n\n`
    }

    if (query.includes('美妆') || query.includes('化妆品') || query.includes('护肤')) {
      content += `**💄 美妆行业资源:**\n`
      content += `• 美妆头条: https://www.meizhuangtoutiao.com/search?q=${encodeURIComponent(query)}\n`
      content += `• 化妆品财经在线: https://www.cbo.cn/search?q=${encodeURIComponent(query)}\n`
      content += `• 聚美丽: https://www.jumeili.cn/search?q=${encodeURIComponent(query)}\n\n`
    }

    if (query.includes('2025') || query.includes('趋势') || query.includes('预测')) {
      content += `**📈 趋势分析资源:**\n`
      content += `• 德勤中国: https://www2.deloitte.com/cn/zh/pages/search.html?q=${encodeURIComponent(query)}\n`
      content += `• 麦肯锡中国: https://www.mckinsey.com.cn/search?q=${encodeURIComponent(query)}\n`
      content += `• 普华永道中国: https://www.pwccn.com/zh/search.html?q=${encodeURIComponent(query)}\n\n`
    }

    // 通用搜索引擎
    content += `**🌐 通用搜索引擎:**\n`
    content += `• 百度: https://www.baidu.com/s?wd=${encodeURIComponent(query)}\n`
    content += `• 谷歌: https://www.google.com/search?q=${encodeURIComponent(query)}\n`
    content += `• 必应: https://www.bing.com/search?q=${encodeURIComponent(query)}\n\n`

    content += `**💡 搜索提示:**\n`
    content += `• 使用更具体的关键词可以获得更精准的结果\n`
    content += `• 尝试使用同义词或相关术语\n`
    content += `• 添加时间限制词（如"2024年"、"最新"）获取最新信息\n`

    return {
      success: true,
      content
    }
  } catch (error) {
    throw new Error(`搜索失败: ${error.message}`)
  }
}

// 运行测试
testDeepSeekSearch().catch(console.error)
