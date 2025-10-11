#!/usr/bin/env node

/**
 * 测试修复后的系统提示效果
 */

console.log('🔍 测试修复后的系统提示效果...')

// 模拟浏览器环境
global.fetch = (await import('node-fetch')).default

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(messages) {
  const apiKey = 'sk-03db8009812649359e2f83cc738861aa'
  const baseURL = 'https://api.deepseek.com/v1'
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000,
    stream: false
  }
  
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

[搜索结果整理完成，请基于以上信息进行分析和回复]`
}

/**
 * 测试新的系统提示
 */
async function testNewSystemPrompt() {
  console.log('\n🧪 测试新的系统提示效果')
  
  const newSystemPrompt = `你现在已经获得了详细的搜索结果。请立即基于这些信息生成一个完整的回复：

**要求：**
1. 必须基于搜索结果中的具体信息进行分析，不要忽略任何重要内容
2. 生成至少500字的详细分析报告，确保内容丰富有价值
3. 使用结构化格式（标题、子标题、要点列表）使内容易读
4. 不要说"需要更多信息"或"让我再次搜索"，直接基于现有信息进行全面分析
5. 必须提及搜索结果中的具体内容、数据、案例和来源
6. 在适当位置添加重要信息的来源链接
7. 确保回复专业、准确、有深度

**现在就开始生成完整的回复，基于搜索结果提供有价值的分析。**`
  
  try {
    const messages = [
      {
        role: 'user',
        content: '帮我分析一下2025年中国的美妆市场发展趋势'
      },
      {
        role: 'assistant',
        content: '我来帮您搜索最新的中国美妆市场发展趋势信息，以便为您提供详细的分析。',
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
        content: newSystemPrompt
      }
    ]
    
    console.log('📡 发送API请求...')
    const response = await callDeepSeekAPI(messages)
    
    console.log('✅ API响应成功')
    console.log(`📝 回复长度: ${response.content ? response.content.length : 0} 字符`)
    
    if (response.content && response.content.length > 500) {
      console.log('🎉 AI生成了详细的回复内容')
      
      // 检查回复质量
      const hasMarketAnalysis = response.content.includes('市场') || response.content.includes('趋势')
      const hasBrandMention = response.content.includes('百雀羚') || response.content.includes('化妆品')
      const hasStructure = response.content.includes('##') || response.content.includes('###')
      const hasSource = response.content.includes('来源') || response.content.includes('wikipedia')
      const noMoreInfo = !response.content.includes('需要更多信息') && !response.content.includes('再次搜索')
      
      console.log('\n📊 回复质量分析:')
      console.log(`- 包含市场分析: ${hasMarketAnalysis ? '✅' : '❌'}`)
      console.log(`- 提及品牌信息: ${hasBrandMention ? '✅' : '❌'}`)
      console.log(`- 结构化内容: ${hasStructure ? '✅' : '❌'}`)
      console.log(`- 包含信息源: ${hasSource ? '✅' : '❌'}`)
      console.log(`- 不要求更多信息: ${noMoreInfo ? '✅' : '❌'}`)
      
      const qualityScore = (hasMarketAnalysis ? 1 : 0) + (hasBrandMention ? 1 : 0) + 
                          (hasStructure ? 1 : 0) + (hasSource ? 1 : 0) + (noMoreInfo ? 1 : 0)
      console.log(`- 总体质量: ${qualityScore}/5 ${qualityScore >= 4 ? '✅ 优秀' : qualityScore >= 3 ? '⚠️ 良好' : '❌ 需改进'}`)
      
      console.log('\n📄 回复内容预览:')
      console.log(response.content.substring(0, 400) + '...')
      
      return qualityScore >= 4
    } else {
      console.log('❌ AI没有生成足够的回复内容')
      console.log(`实际回复: "${response.content}"`)
      return false
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error)
    return false
  }
}

/**
 * 对比测试
 */
async function compareSystemPrompts() {
  console.log('\n🔄 对比新旧系统提示效果')
  
  const oldSystemPrompt = `基于以上MCP服务搜索结果，请进行全面分析和整理：
1. 仔细分析搜索到的信息，确保准确性和相关性
2. 如果信息不够充分或不够准确，可以再次调用搜索服务
3. 将搜索结果整理成结构化、易读的回复
4. 在回复末尾适当添加重要信息的来源链接
5. 确保回复内容的可靠性、精确性和时效性
6. 所有的搜索过程和分析过程都应该在思考过程中体现`
  
  const newSystemPrompt = `你现在已经获得了详细的搜索结果。请立即基于这些信息生成一个完整的回复：

**要求：**
1. 必须基于搜索结果中的具体信息进行分析，不要忽略任何重要内容
2. 生成至少500字的详细分析报告，确保内容丰富有价值
3. 使用结构化格式（标题、子标题、要点列表）使内容易读
4. 不要说"需要更多信息"或"让我再次搜索"，直接基于现有信息进行全面分析
5. 必须提及搜索结果中的具体内容、数据、案例和来源
6. 在适当位置添加重要信息的来源链接
7. 确保回复专业、准确、有深度

**现在就开始生成完整的回复，基于搜索结果提供有价值的分析。**`
  
  const prompts = [
    { name: '旧系统提示', content: oldSystemPrompt },
    { name: '新系统提示', content: newSystemPrompt }
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
          content: '我来帮您搜索最新的中国美妆市场发展趋势信息。',
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
      console.log(`- 质量评估: ${response.content && response.content.length > 500 ? '✅ 详细' : '❌ 简短'}`)
      
      if (response.content) {
        const wantsMoreInfo = response.content.includes('需要更多信息') || 
                             response.content.includes('再次搜索') ||
                             response.content.includes('tool_calls')
        console.log(`- 要求更多信息: ${wantsMoreInfo ? '❌ 是' : '✅ 否'}`)
        console.log(`- 内容预览: ${response.content.substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`- 错误: ${error.message}`)
    }
    
    // 等待一下避免API限制
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}

/**
 * 运行完整测试
 */
async function runCompleteTest() {
  console.log('🚀 开始测试修复后的系统提示效果')
  console.log('🎯 目标: 验证新的系统提示能让AI基于搜索结果生成详细回复')
  
  try {
    // 测试新系统提示
    const success = await testNewSystemPrompt()
    
    // 对比新旧系统提示
    await compareSystemPrompts()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 系统提示修复测试总结')
    console.log('='.repeat(80))
    
    if (success) {
      console.log('\n🎉 测试结果: 成功')
      console.log('💡 新的系统提示能够让AI基于搜索结果生成详细回复')
      console.log('🔧 修复已完成，前端应该能正常工作')
    } else {
      console.log('\n❌ 测试结果: 仍有问题')
      console.log('💡 需要进一步调整系统提示')
    }
    
    console.log('\n🔧 下一步操作:')
    console.log('1. 提交修复到GitHub')
    console.log('2. 刷新浏览器页面测试')
    console.log('3. 验证完整的用户体验')
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest().catch(console.error)
