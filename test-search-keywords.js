#!/usr/bin/env node

/**
 * 测试搜索关键词提取和Wikipedia搜索
 */

console.log('🔍 测试搜索关键词提取和Wikipedia搜索...')

// 模拟浏览器环境
global.fetch = (await import('node-fetch')).default

/**
 * 提取搜索关键词 - 复制的函数实现
 */
function extractSearchKeywords(query) {
  if (!query || typeof query !== 'string') {
    return []
  }
  
  // 移除常见的停用词
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '可以', '这个', '我们', '能够', '如何', '怎么', '为什么', '哪里', '什么时候', '谁', '哪个', '多少',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'where', 'when', 'why', 'how', 'who', 'which'
  ])
  
  // 分词并过滤
  const words = query
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文、英文、数字
    .split(/\s+/)
    .filter(word => {
      return word.length > 1 && !stopWords.has(word)
    })
  
  // 提取重要关键词（限制数量避免搜索过于分散）
  const keywords = []
  
  // 优先提取数字年份
  const yearPattern = /20\d{2}/g
  const years = query.match(yearPattern)
  if (years) {
    keywords.push(...years)
  }
  
  // 提取其他关键词
  const otherWords = words.filter(word => !/20\d{2}/.test(word))
  keywords.push(...otherWords.slice(0, 5 - keywords.length))
  
  return keywords.slice(0, 5) // 最多返回5个关键词
}

/**
 * Wikipedia搜索函数
 */
async function searchWikipedia(searchQuery, params = {}) {
  try {
    console.log(`🔍 Wikipedia搜索查询: "${searchQuery}"`)
    
    const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
    wikiSearchUrl.searchParams.append('action', 'query')
    wikiSearchUrl.searchParams.append('format', 'json')
    wikiSearchUrl.searchParams.append('list', 'search')
    wikiSearchUrl.searchParams.append('srsearch', searchQuery)
    wikiSearchUrl.searchParams.append('srlimit', params.limit || 3)
    wikiSearchUrl.searchParams.append('origin', '*')

    console.log(`📡 请求URL: ${wikiSearchUrl.toString()}`)

    const response = await fetch(wikiSearchUrl)
    if (!response.ok) {
      console.log(`❌ Wikipedia API请求失败: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    console.log(`📄 Wikipedia API响应:`, JSON.stringify(data, null, 2))
    
    if (!data.query || !data.query.search) {
      console.log('⚠️ Wikipedia API返回空结果')
      return []
    }

    const results = data.query.search.map(result => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]*>/g, ''),
      url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
      source: 'Wikipedia',
      reliability: 85,
      timestamp: result.timestamp
    }))
    
    console.log(`✅ Wikipedia搜索成功，返回 ${results.length} 个结果`)
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.title}`)
      console.log(`     ${result.snippet.substring(0, 100)}...`)
    })
    
    return results
  } catch (error) {
    console.log('❌ Wikipedia搜索失败:', error.message)
    return []
  }
}

/**
 * 测试完整的搜索流程
 */
async function testCompleteSearchFlow() {
  console.log('\n🧪 测试完整的搜索流程...')
  
  const testQueries = [
    '2025年中国美妆市场的发展趋势',
    '中国化妆品行业分析',
    '美容护肤品市场趋势',
    '2025 中国 美妆 市场',
    '化妆品 护肤品 美容 行业 产业'
  ]
  
  for (const query of testQueries) {
    console.log(`\n📝 测试查询: "${query}"`)
    
    // 1. 提取关键词
    const keywords = extractSearchKeywords(query)
    console.log(`🔑 提取的关键词: [${keywords.join(', ')}]`)
    
    // 2. 构建搜索查询
    const searchQuery = keywords.join(' ')
    console.log(`🔍 搜索查询: "${searchQuery}"`)
    
    // 3. 执行Wikipedia搜索
    const results = await searchWikipedia(searchQuery, { limit: 3 })
    
    // 4. 分析结果相关性
    const relevantResults = results.filter(result => {
      const title = result.title.toLowerCase()
      const snippet = result.snippet.toLowerCase()
      const content = title + ' ' + snippet
      
      // 检查是否包含美妆相关词汇
      const beautyKeywords = ['美妆', '化妆品', '护肤', '美容', '化妆', '护肤品', 'cosmetics', 'beauty', 'makeup']
      return beautyKeywords.some(keyword => content.includes(keyword))
    })
    
    console.log(`📊 相关结果: ${relevantResults.length}/${results.length}`)
    
    if (relevantResults.length > 0) {
      console.log('✅ 找到相关的美妆市场信息')
      break
    } else {
      console.log('❌ 未找到相关的美妆市场信息')
    }
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

/**
 * 测试优化后的搜索策略
 */
async function testOptimizedSearch() {
  console.log('\n🧪 测试优化后的搜索策略...')
  
  // 更精确的搜索词组合
  const optimizedQueries = [
    '中国化妆品市场',
    '美妆行业发展',
    '护肤品产业趋势',
    '化妆品消费市场',
    '美容行业分析'
  ]
  
  for (const query of optimizedQueries) {
    console.log(`\n📝 优化搜索: "${query}"`)
    
    const results = await searchWikipedia(query, { limit: 5 })
    
    if (results.length > 0) {
      console.log(`✅ 搜索成功，返回 ${results.length} 个结果`)
      
      // 检查结果相关性
      const relevantCount = results.filter(result => {
        const content = (result.title + ' ' + result.snippet).toLowerCase()
        return content.includes('化妆品') || content.includes('美妆') || content.includes('护肤') || content.includes('美容')
      }).length
      
      console.log(`📊 相关结果比例: ${relevantCount}/${results.length}`)
      
      if (relevantCount > 0) {
        console.log('🎉 找到了相关的美妆市场信息！')
        console.log('💡 建议使用此搜索策略')
        break
      }
    } else {
      console.log('❌ 搜索无结果')
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

/**
 * 运行完整测试
 */
async function runCompleteTest() {
  console.log('🚀 开始搜索关键词和Wikipedia搜索测试')
  console.log('🎯 目标: 找出为什么搜索不到相关的美妆市场信息')
  
  try {
    // 测试1: 完整搜索流程
    await testCompleteSearchFlow()
    
    // 测试2: 优化搜索策略
    await testOptimizedSearch()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 搜索测试总结')
    console.log('='.repeat(80))
    
    console.log('\n💡 问题分析:')
    console.log('1. 关键词提取可能过于复杂，导致搜索词不够精确')
    console.log('2. Wikipedia中文版可能缺少具体的市场分析内容')
    console.log('3. 需要使用更直接、更简单的搜索词')
    
    console.log('\n🔧 建议修复:')
    console.log('1. 简化关键词提取逻辑')
    console.log('2. 使用更直接的搜索词组合')
    console.log('3. 降低质量评估标准，允许返回部分相关的结果')
    console.log('4. 添加更多搜索源（不仅仅依赖Wikipedia）')
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest().catch(console.error)
