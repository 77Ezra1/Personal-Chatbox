#!/usr/bin/env node

/**
 * 完整的前端流程测试 - 模拟用户查询到AI回复的完整过程
 */

console.log('🔍 测试完整的前端AI工具调用流程...')

// 模拟浏览器环境
global.fetch = (await import('node-fetch')).default

// 导入必要的模块
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 模拟MCP管理器的搜索功能
 */
async function simulateSearchAPI(query) {
  console.log(`🔍 模拟搜索API调用: "${query}"`)
  
  // 模拟关键词提取
  const keywords = extractSearchKeywords(query)
  console.log(`🔑 提取的关键词: [${keywords.join(', ')}]`)
  
  // 模拟Wikipedia搜索
  const searchQuery = keywords.join(' ')
  const results = await searchWikipedia(searchQuery)
  
  if (results.length > 0) {
    console.log(`✅ 搜索成功，返回 ${results.length} 个结果`)
    
    // 格式化搜索结果（模拟formatSearchResultsForThinking）
    let content = `[搜索执行完成]\n\n`
    content += `**搜索概况:**\n`
    content += `- 查询类型: 市场分析\n`
    content += `- 搜索领域: 美妆化妆品\n`
    content += `- 时间范围: 2025年\n`
    content += `- 质量评分: 85/100\n\n`
    
    content += `**获取到的信息:**\n\n`
    results.forEach((result, index) => {
      content += `**${index + 1}. ${result.title}** (可靠性: 85%, 时效性: 70%)\n`
      content += `   ${result.snippet}\n`
      content += `   来源: ${result.url}\n\n`
    })
    
    content += `[搜索结果整理完成，请基于以上信息进行分析和回复]\n`
    
    return {
      success: true,
      content: content
    }
  } else {
    return {
      success: false,
      error: '未找到相关搜索结果'
    }
  }
}

/**
 * 关键词提取函数（复制自修复后的版本）
 */
function extractSearchKeywords(query) {
  if (!query || typeof query !== 'string') {
    return []
  }
  
  const domainMappings = {
    '美妆': ['化妆品', '美妆', '护肤品', '美容'],
    '市场': ['市场', '行业', '产业'],
    '发展': ['发展', '趋势', '前景', '分析']
  }
  
  const coreKeywords = []
  
  // 提取地理位置
  const locations = ['中国', '美国', '欧洲', '亚洲', '全球', '国际', '国内']
  const foundLocation = locations.find(loc => query.includes(loc))
  if (foundLocation) {
    coreKeywords.push(foundLocation)
  }
  
  // 提取年份
  const yearPattern = /20\d{2}/g
  const years = query.match(yearPattern)
  if (years) {
    coreKeywords.push(years[years.length - 1])
  }
  
  // 提取主要领域词汇
  for (const [domain, synonyms] of Object.entries(domainMappings)) {
    if (synonyms.some(synonym => query.includes(synonym))) {
      coreKeywords.push(synonyms[0])
      break
    }
  }
  
  const searchTerms = []
  
  if (coreKeywords.length >= 2) {
    const location = coreKeywords.find(k => locations.includes(k))
    const domain = coreKeywords.find(k => !locations.includes(k) && !/20\d{2}/.test(k))
    
    if (location && domain) {
      searchTerms.push(`${location}${domain}`)
    }
  }
  
  searchTerms.push(...coreKeywords.slice(0, 3))
  
  return searchTerms.slice(0, 3)
}

/**
 * Wikipedia搜索函数
 */
async function searchWikipedia(searchQuery, params = {}) {
  try {
    const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
    wikiSearchUrl.searchParams.append('action', 'query')
    wikiSearchUrl.searchParams.append('format', 'json')
    wikiSearchUrl.searchParams.append('list', 'search')
    wikiSearchUrl.searchParams.append('srsearch', searchQuery)
    wikiSearchUrl.searchParams.append('srlimit', params.limit || 3)
    wikiSearchUrl.searchParams.append('origin', '*')

    const response = await fetch(wikiSearchUrl)
    if (!response.ok) return []

    const data = await response.json()
    if (!data.query || !data.query.search) return []

    return data.query.search.map(result => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]*>/g, ''),
      url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
      source: 'Wikipedia',
      reliability: 85,
      timestamp: result.timestamp
    }))
  } catch (error) {
    console.log('Wikipedia搜索失败:', error.message)
    return []
  }
}

/**
 * 模拟AI客户端调用
 */
async function simulateAICall(messages, tools) {
  console.log('\n🤖 模拟AI客户端调用...')
  console.log(`📝 消息数量: ${messages.length}`)
  console.log(`🔧 工具数量: ${tools.length}`)
  
  // 检查最后一条消息是否是用户查询
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role === 'user' && lastMessage.content.includes('美妆市场')) {
    console.log('🎯 检测到美妆市场查询，模拟AI决定调用搜索工具')
    
    // 模拟AI决定调用搜索工具
    return {
      content: null,
      tool_calls: [{
        id: 'call_test_123',
        type: 'function',
        function: {
          name: 'duckduckgo_search',
          arguments: JSON.stringify({
            query: '2025年中国美妆市场的发展趋势'
          })
        }
      }]
    }
  }
  
  // 检查是否有工具调用结果
  const hasToolResults = messages.some(msg => msg.role === 'tool')
  if (hasToolResults) {
    console.log('🔍 检测到工具调用结果，模拟AI基于搜索结果生成回复')
    
    // 查找工具调用结果
    const toolResult = messages.find(msg => msg.role === 'tool')
    if (toolResult && toolResult.content.includes('化妆品')) {
      console.log('✅ 发现相关的化妆品信息，生成详细回复')
      
      return {
        content: `基于搜索结果，我为您分析2025年中国美妆市场的发展趋势：

## 市场概况
根据搜索到的信息，中国美妆市场呈现以下特点：

### 1. 市场规模持续增长
- 中国已成为全球重要的化妆品消费市场
- 护肤品和化妆品需求持续上升
- 消费者对美容产品的接受度不断提高

### 2. 品牌发展趋势
- 国产品牌如百雀羚等传统品牌重新焕发活力
- 新兴品牌通过电商渠道快速发展
- 国际品牌与本土品牌竞争激烈

### 3. 监管环境
- 国家药品监督管理局加强化妆品监管
- 行业标准和安全要求不断完善
- 消费者权益保护得到加强

### 4. 技术创新
- 产品研发技术不断提升
- 个性化定制需求增长
- 数字化营销成为主流

这些信息基于权威来源，为您的市场分析提供了可靠的参考依据。

*信息来源：Wikipedia等权威平台*`,
        reasoning: `[搜索分析过程]
1. 接收用户查询：2025年中国美妆市场发展趋势
2. 调用搜索工具获取相关信息
3. 分析搜索结果中的化妆品、百雀羚、监管等信息
4. 整理成结构化的市场分析报告
5. 确保信息的可靠性和时效性`
      }
    }
  }
  
  // 默认回复
  return {
    content: '让我搜索更具体的美妆市场分析报告和趋势预测。',
    reasoning: '需要更多信息来提供准确的分析'
  }
}

/**
 * 模拟完整的前端流程
 */
async function simulateFullFrontendFlow() {
  console.log('\n🚀 开始模拟完整的前端流程')
  console.log('🎯 目标: 验证从用户输入到AI回复的完整过程')
  
  try {
    // 1. 用户输入
    const userQuery = '帮我分析一下2025年中国的美妆市场'
    console.log(`\n👤 用户输入: "${userQuery}"`)
    
    // 2. 构建消息历史
    const messages = [
      {
        role: 'user',
        content: userQuery
      }
    ]
    
    // 3. 构建工具列表
    const tools = [
      {
        type: 'function',
        function: {
          name: 'duckduckgo_search',
          description: '搜索网络信息',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询'
              }
            },
            required: ['query']
          }
        }
      }
    ]
    
    // 4. 第一次AI调用（决定是否使用工具）
    console.log('\n🤖 第一次AI调用 - 决定是否使用工具')
    const firstResponse = await simulateAICall(messages, tools)
    
    if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
      console.log('✅ AI决定调用搜索工具')
      
      // 5. 执行工具调用
      console.log('\n🔧 执行工具调用')
      const toolCall = firstResponse.tool_calls[0]
      const args = JSON.parse(toolCall.function.arguments)
      
      const toolResult = await simulateSearchAPI(args.query)
      
      // 6. 构建包含工具结果的消息历史
      const messagesWithTools = [
        ...messages,
        {
          role: 'assistant',
          content: firstResponse.content,
          tool_calls: firstResponse.tool_calls
        },
        {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: toolResult.success ? toolResult.content : `Error: ${toolResult.error}`
        }
      ]
      
      // 7. 添加系统提示
      const systemPrompt = {
        role: 'system',
        content: `基于以上MCP服务搜索结果，请进行全面分析和整理：
1. 仔细分析搜索到的信息，确保准确性和相关性
2. 将搜索结果整理成结构化、易读的回复
3. 在回复末尾适当添加重要信息的来源链接
4. 确保回复内容的可靠性、精确性和时效性`
      }
      
      messagesWithTools.push(systemPrompt)
      
      // 8. 第二次AI调用（基于工具结果生成最终回复）
      console.log('\n🤖 第二次AI调用 - 基于搜索结果生成回复')
      const finalResponse = await simulateAICall(messagesWithTools, tools)
      
      // 9. 验证最终结果
      console.log('\n📊 验证最终结果')
      console.log('='.repeat(80))
      
      if (finalResponse.content && finalResponse.content.length > 100) {
        console.log('✅ AI生成了详细的回复内容')
        console.log(`📝 回复长度: ${finalResponse.content.length} 字符`)
        console.log(`🧠 思考过程: ${finalResponse.reasoning ? '有' : '无'}`)
        
        // 显示回复内容的前200字符
        console.log('\n📄 回复内容预览:')
        console.log(finalResponse.content.substring(0, 200) + '...')
        
        if (finalResponse.reasoning) {
          console.log('\n🧠 思考过程预览:')
          console.log(finalResponse.reasoning.substring(0, 200) + '...')
        }
        
        console.log('\n🎉 完整流程测试成功！')
        console.log('💡 前端应该能够接收到完整的AI回复')
        
        return true
      } else {
        console.log('❌ AI没有生成足够的回复内容')
        console.log(`📝 实际回复: "${finalResponse.content}"`)
        
        return false
      }
    } else {
      console.log('❌ AI没有决定调用搜索工具')
      return false
    }
    
  } catch (error) {
    console.error('❌ 流程测试异常:', error)
    return false
  }
}

/**
 * 运行完整测试
 */
async function runCompleteTest() {
  console.log('🚀 开始完整的前端流程测试')
  console.log('🎯 目标: 找出为什么前端没有接收到AI的完整回复')
  
  try {
    const success = await simulateFullFrontendFlow()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 前端流程测试总结')
    console.log('='.repeat(80))
    
    if (success) {
      console.log('\n🎉 测试结果: 成功')
      console.log('💡 模拟流程能够正常工作，问题可能在于:')
      console.log('1. 实际的AI模型响应与模拟不同')
      console.log('2. 系统提示不够明确')
      console.log('3. 工具结果格式化有问题')
      console.log('4. 前端消息更新逻辑有问题')
    } else {
      console.log('\n❌ 测试结果: 失败')
      console.log('💡 需要进一步检查:')
      console.log('1. 工具调用触发逻辑')
      console.log('2. 搜索结果处理逻辑')
      console.log('3. AI响应生成逻辑')
    }
    
    console.log('\n🔧 建议的修复方向:')
    console.log('1. 优化系统提示，更明确地指导AI如何使用搜索结果')
    console.log('2. 检查实际的AI模型调用参数')
    console.log('3. 验证工具结果的格式和内容')
    console.log('4. 测试真实的DeepSeek API调用')
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest().catch(console.error)
