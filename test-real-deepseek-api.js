#!/usr/bin/env node

/**
 * 真实的DeepSeek API测试 - 验证工具调用后的响应生成
 */

console.log('🔍 测试真实的DeepSeek API工具调用后响应生成...')

// 模拟浏览器环境
global.fetch = (await import('node-fetch')).default

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(messages, tools = null) {
  const apiKey = 'sk-03db8009812649359e2f83cc738861aa'
  const baseURL = 'https://api.deepseek.com/v1'
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000,
    stream: false // 使用非流式响应便于调试
  }
  
  if (tools && tools.length > 0) {
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }
  
  console.log('📡 DeepSeek API请求:')
  console.log(`- 模型: ${requestBody.model}`)
  console.log(`- 消息数量: ${messages.length}`)
  console.log(`- 工具数量: ${tools ? tools.length : 0}`)
  console.log(`- 最后一条消息: ${messages[messages.length - 1].role} - ${messages[messages.length - 1].content?.substring(0, 100)}...`)
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ DeepSeek API响应成功')
    
    return data.choices[0].message
  } catch (error) {
    console.error('❌ DeepSeek API调用失败:', error.message)
    throw error
  }
}

/**
 * 模拟搜索结果
 */
function createMockSearchResult() {
  return `[搜索执行完成]

**搜索概况:**
- 查询类型: 市场分析
- 搜索领域: 美妆化妆品
- 时间范围: 2025年
- 质量评分: 85/100

**获取到的信息:**

**1. 化妆品** (可靠性: 85%, 时效性: 70%)
   化妆品，是除了简单的清洁用品以外，被用来提升人体外貌美丽程度的物质。化妆品的使用起源相當早且普遍，特别是有一定经济基础的人會經常使用。 广义上，化妆品还包括护肤品。护肤产品包括面部以及身体用以增湿的霜剂、洗剂；保护皮肤不受紫外辐射伤害的防晒霜、防晒油；以及美白、遮瑕（诸如粉刺、皱纹、黑眼圈等）的护理产品。
   来源: https://zh.wikipedia.org/wiki/化妝品

**2. 百雀羚** (可靠性: 85%, 时效性: 70%)
   ltd）旗下的护肤品品牌，该公司总部位于上海，主要生产护肤品、香水等产品。百雀羚1931年创立于上海，是中国最早的国产护肤品品牌，也是中国最大且最知名的化妆品品牌之一。2013年，百雀羚护肤品成为中华人民共和国的"国礼"之一。
   来源: https://zh.wikipedia.org/wiki/百雀羚

**3. 国家药品监督管理局** (可靠性: 85%, 时效性: 70%)
   化妆品卫生监督条例》中的"卫生行政部门"修改为"化妆品监督管理部门"，规定"各级化妆品监督管理部门行使化妆品卫生监督职责。" 根据《国家药品监督管理局职能配置、内设机构和人员编制规定》（厅字〔2018〕53号），国家药品监督管理局承担下列职责： 负责药品（含中药、民族药，下同）、医疗器械和化妆品
   来源: https://zh.wikipedia.org/wiki/国家药品监督管理局

**重要信息源链接:**
1. [化妆品](https://zh.wikipedia.org/wiki/化妝品) - Wikipedia
2. [百雀羚](https://zh.wikipedia.org/wiki/百雀羚) - Wikipedia
3. [国家药品监督管理局](https://zh.wikipedia.org/wiki/国家药品监督管理局) - Wikipedia

[搜索结果整理完成，请基于以上信息进行分析和回复]`
}

/**
 * 测试完整的工具调用流程
 */
async function testCompleteToolCallFlow() {
  console.log('\n🧪 测试完整的工具调用流程')
  
  try {
    // 1. 第一次调用 - 让AI决定是否使用工具
    console.log('\n📝 第一步: 用户查询，AI决定是否调用工具')
    
    const initialMessages = [
      {
        role: 'system',
        content: '你是一个专业的市场分析师。当用户询问市场信息时，你应该使用搜索工具获取最新的相关信息，然后基于搜索结果提供详细的分析。'
      },
      {
        role: 'user',
        content: '帮我分析一下2025年中国的美妆市场发展趋势'
      }
    ]
    
    const tools = [
      {
        type: 'function',
        function: {
          name: 'duckduckgo_search',
          description: '搜索网络信息以获取最新的市场数据和趋势',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询，应该包含具体的关键词'
              }
            },
            required: ['query']
          }
        }
      }
    ]
    
    const firstResponse = await callDeepSeekAPI(initialMessages, tools)
    console.log('🤖 AI第一次响应:')
    console.log(`- 内容: ${firstResponse.content || '无内容'}`)
    console.log(`- 工具调用: ${firstResponse.tool_calls ? firstResponse.tool_calls.length : 0} 个`)
    
    if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
      console.log('✅ AI决定调用搜索工具')
      
      // 2. 模拟工具调用执行
      console.log('\n📝 第二步: 执行工具调用，获取搜索结果')
      const toolCall = firstResponse.tool_calls[0]
      const searchResult = createMockSearchResult()
      
      // 3. 构建包含工具结果的消息历史
      const messagesWithToolResult = [
        ...initialMessages,
        {
          role: 'assistant',
          content: firstResponse.content,
          tool_calls: firstResponse.tool_calls
        },
        {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: searchResult
        }
      ]
      
      // 4. 第二次调用 - 基于工具结果生成最终回复
      console.log('\n📝 第三步: AI基于搜索结果生成最终回复')
      
      // 添加明确的系统指导
      messagesWithToolResult.push({
        role: 'system',
        content: `现在你已经获得了关于中国美妆市场的搜索结果。请基于这些信息：

1. 仔细分析搜索到的信息，包括化妆品行业概况、知名品牌（如百雀羚）、监管环境等
2. 结合2025年的时间背景，分析市场发展趋势
3. 提供结构化、详细的市场分析报告
4. 确保回复内容丰富、专业、有价值
5. 在适当位置引用信息来源

请现在就基于搜索结果生成一个完整的、详细的市场分析回复。不要再说需要更多信息，直接基于已有信息进行分析。`
      })
      
      const finalResponse = await callDeepSeekAPI(messagesWithToolResult)
      
      console.log('🤖 AI最终响应:')
      console.log(`- 内容长度: ${finalResponse.content ? finalResponse.content.length : 0} 字符`)
      console.log(`- 是否有实质内容: ${finalResponse.content && finalResponse.content.length > 200 ? '是' : '否'}`)
      
      if (finalResponse.content && finalResponse.content.length > 200) {
        console.log('\n✅ AI生成了详细的回复内容')
        console.log('📄 回复内容预览:')
        console.log(finalResponse.content.substring(0, 300) + '...')
        
        // 检查回复质量
        const hasMarketAnalysis = finalResponse.content.includes('市场') || finalResponse.content.includes('趋势')
        const hasBrandMention = finalResponse.content.includes('百雀羚') || finalResponse.content.includes('化妆品')
        const hasStructure = finalResponse.content.includes('##') || finalResponse.content.includes('###')
        
        console.log('\n📊 回复质量分析:')
        console.log(`- 包含市场分析: ${hasMarketAnalysis ? '✅' : '❌'}`)
        console.log(`- 提及品牌信息: ${hasBrandMention ? '✅' : '❌'}`)
        console.log(`- 结构化内容: ${hasStructure ? '✅' : '❌'}`)
        
        const qualityScore = (hasMarketAnalysis ? 1 : 0) + (hasBrandMention ? 1 : 0) + (hasStructure ? 1 : 0)
        console.log(`- 总体质量: ${qualityScore}/3 ${qualityScore >= 2 ? '✅ 优秀' : qualityScore >= 1 ? '⚠️ 一般' : '❌ 需改进'}`)
        
        return qualityScore >= 2
      } else {
        console.log('\n❌ AI没有生成足够的回复内容')
        console.log(`实际回复: "${finalResponse.content}"`)
        return false
      }
      
    } else {
      console.log('❌ AI没有决定调用搜索工具')
      console.log(`实际回复: "${firstResponse.content}"`)
      return false
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error)
    return false
  }
}

/**
 * 测试不同的系统提示
 */
async function testDifferentSystemPrompts() {
  console.log('\n🧪 测试不同的系统提示效果')
  
  const prompts = [
    {
      name: '当前系统提示',
      content: `基于以上MCP服务搜索结果，请进行全面分析和整理：
1. 仔细分析搜索到的信息，确保准确性和相关性
2. 如果信息不够充分或不够准确，可以再次调用搜索服务
3. 将搜索结果整理成结构化、易读的回复
4. 在回复末尾适当添加重要信息的来源链接
5. 确保回复内容的可靠性、精确性和时效性
6. 所有的搜索过程和分析过程都应该在思考过程中体现`
    },
    {
      name: '优化系统提示',
      content: `你现在已经获得了详细的搜索结果。请立即基于这些信息生成一个完整的回复：

**要求：**
1. 必须基于搜索结果中的具体信息进行分析
2. 生成至少500字的详细分析报告
3. 使用结构化格式（标题、子标题、要点）
4. 不要说"需要更多信息"，直接基于现有信息分析
5. 必须提及搜索结果中的具体内容（如百雀羚、监管政策等）

**现在就开始生成回复，不要再询问或搜索。**`
    }
  ]
  
  for (const prompt of prompts) {
    console.log(`\n📝 测试: ${prompt.name}`)
    
    try {
      const messages = [
        {
          role: 'user',
          content: '帮我分析一下2025年中国的美妆市场发展趋势'
        },
        {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_test',
            type: 'function',
            function: {
              name: 'duckduckgo_search',
              arguments: JSON.stringify({ query: '2025年中国美妆市场发展趋势' })
            }
          }]
        },
        {
          tool_call_id: 'call_test',
          role: 'tool',
          name: 'duckduckgo_search',
          content: createMockSearchResult()
        },
        {
          role: 'system',
          content: prompt.content
        }
      ]
      
      const response = await callDeepSeekAPI(messages)
      
      console.log(`- 回复长度: ${response.content ? response.content.length : 0} 字符`)
      console.log(`- 质量评估: ${response.content && response.content.length > 300 ? '✅ 详细' : '❌ 简短'}`)
      
      if (response.content && response.content.length > 100) {
        console.log(`- 内容预览: ${response.content.substring(0, 150)}...`)
      }
      
    } catch (error) {
      console.log(`- 错误: ${error.message}`)
    }
    
    // 等待一下避免API限制
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

/**
 * 运行完整测试
 */
async function runCompleteTest() {
  console.log('🚀 开始真实的DeepSeek API测试')
  console.log('🎯 目标: 找出为什么AI不基于搜索结果生成详细回复')
  
  try {
    // 测试1: 完整工具调用流程
    const success = await testCompleteToolCallFlow()
    
    // 测试2: 不同系统提示效果
    await testDifferentSystemPrompts()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 真实API测试总结')
    console.log('='.repeat(80))
    
    if (success) {
      console.log('\n🎉 测试结果: 成功')
      console.log('💡 DeepSeek API能够正确处理工具调用并生成详细回复')
      console.log('🔧 问题可能在于前端的实现细节')
    } else {
      console.log('\n❌ 测试结果: 失败')
      console.log('💡 DeepSeek API没有基于搜索结果生成详细回复')
      console.log('🔧 需要优化系统提示或调用方式')
    }
    
    console.log('\n🔧 建议的修复方案:')
    console.log('1. 使用更明确、更强制性的系统提示')
    console.log('2. 确保搜索结果格式正确传递给AI')
    console.log('3. 检查前端的消息更新逻辑')
    console.log('4. 验证工具调用的完整流程')
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest().catch(console.error)
