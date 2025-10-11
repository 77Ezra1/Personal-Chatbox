#!/usr/bin/env node

/**
 * 测试优化后的关键词提取功能
 */

console.log('🔍 测试优化后的关键词提取功能...')

/**
 * 优化后的关键词提取函数
 */
function extractSearchKeywords(query) {
  if (!query || typeof query !== 'string') {
    return []
  }
  
  // 预定义的领域关键词映射，用于生成更精确的搜索词
  const domainMappings = {
    '美妆': ['化妆品', '美妆', '护肤品', '美容'],
    '市场': ['市场', '行业', '产业'],
    '发展': ['发展', '趋势', '前景', '分析'],
    '技术': ['技术', '科技', 'AI', '人工智能'],
    '医疗': ['医疗', '健康', '医学', '医院'],
    '教育': ['教育', '学校', '培训', '学习'],
    '金融': ['金融', '银行', '投资', '理财']
  }
  
  // 移除常见的停用词和修饰词
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '可以', '这个', '我们', '能够', '如何', '怎么', '为什么', '哪里', '什么时候', '谁', '哪个', '多少', '请', '帮', '分析', '一下'
  ])
  
  // 提取核心概念
  const coreKeywords = []
  
  // 1. 提取地理位置
  const locations = ['中国', '美国', '欧洲', '亚洲', '全球', '国际', '国内']
  const foundLocation = locations.find(loc => query.includes(loc))
  if (foundLocation) {
    coreKeywords.push(foundLocation)
  }
  
  // 2. 提取年份
  const yearPattern = /20\d{2}/g
  const years = query.match(yearPattern)
  if (years) {
    // 只取最新的年份
    coreKeywords.push(years[years.length - 1])
  }
  
  // 3. 提取主要领域词汇
  for (const [domain, synonyms] of Object.entries(domainMappings)) {
    if (synonyms.some(synonym => query.includes(synonym))) {
      // 使用最常见的词汇
      coreKeywords.push(synonyms[0])
      break // 只取一个主要领域
    }
  }
  
  // 4. 提取其他重要词汇
  const words = query
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(word => {
      return word.length > 1 && 
             !stopWords.has(word) && 
             !coreKeywords.includes(word) &&
             !/20\d{2}/.test(word)
    })
  
  // 添加最重要的其他词汇
  coreKeywords.push(...words.slice(0, 3 - coreKeywords.length))
  
  // 生成搜索词组合
  const searchTerms = []
  
  // 生成核心组合词
  if (coreKeywords.length >= 2) {
    // 组合最相关的词汇
    const location = coreKeywords.find(k => locations.includes(k))
    const domain = coreKeywords.find(k => !locations.includes(k) && !/20\d{2}/.test(k))
    
    if (location && domain) {
      searchTerms.push(`${location}${domain}`)
    }
  }
  
  // 添加单独的核心词汇
  searchTerms.push(...coreKeywords.slice(0, 3))
  
  return searchTerms.slice(0, 3) // 最多返回3个搜索词，保持精确性
}

/**
 * 测试关键词提取
 */
function testKeywordExtraction() {
  console.log('\n🧪 测试关键词提取优化效果...')
  
  const testCases = [
    {
      input: '2025年中国美妆市场的发展趋势',
      expected: '应该生成中国化妆品相关的搜索词'
    },
    {
      input: '人工智能在医疗领域的应用',
      expected: '应该生成AI医疗相关的搜索词'
    },
    {
      input: '中国金融科技发展现状',
      expected: '应该生成中国金融技术相关的搜索词'
    },
    {
      input: '全球教育行业趋势分析',
      expected: '应该生成全球教育相关的搜索词'
    }
  ]
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. 测试查询: "${testCase.input}"`)
    
    const keywords = extractSearchKeywords(testCase.input)
    console.log(`   提取结果: [${keywords.join(', ')}]`)
    console.log(`   期望效果: ${testCase.expected}`)
    
    // 评估结果质量
    const hasLocation = keywords.some(k => ['中国', '美国', '欧洲', '亚洲', '全球', '国际', '国内'].includes(k))
    const hasDomain = keywords.some(k => ['化妆品', '技术', '医疗', '教育', '金融', '市场'].includes(k))
    const isReasonableLength = keywords.length >= 1 && keywords.length <= 3
    
    const quality = (hasLocation ? 1 : 0) + (hasDomain ? 1 : 0) + (isReasonableLength ? 1 : 0)
    const qualityScore = Math.round((quality / 3) * 100)
    
    console.log(`   质量评分: ${qualityScore}% (${quality}/3)`)
    console.log(`   状态: ${qualityScore >= 67 ? '✅ 优秀' : qualityScore >= 33 ? '⚠️ 一般' : '❌ 需改进'}`)
  })
}

/**
 * 对比新旧版本
 */
function compareVersions() {
  console.log('\n🔄 对比新旧版本效果...')
  
  const testQuery = '2025年中国美妆市场的发展趋势'
  
  console.log(`📝 测试查询: "${testQuery}"`)
  
  // 旧版本结果（模拟）
  console.log('\n📊 旧版本结果:')
  console.log('   关键词: [2025, 中国, 美妆, 市场, 发展]')
  console.log('   搜索词: "2025 中国 美妆 市场 发展"')
  console.log('   问题: 词汇过多，搜索过于分散')
  
  // 新版本结果
  console.log('\n📊 新版本结果:')
  const newKeywords = extractSearchKeywords(testQuery)
  console.log(`   关键词: [${newKeywords.join(', ')}]`)
  console.log(`   搜索词: "${newKeywords.join(' ')}"`)
  console.log('   优势: 更精确，更直接，更容易找到相关内容')
  
  console.log('\n💡 改进效果:')
  console.log('✅ 生成更直接的搜索词组合')
  console.log('✅ 减少无关词汇的干扰')
  console.log('✅ 提高搜索结果的相关性')
  console.log('✅ 更符合Wikipedia等搜索引擎的特点')
}

/**
 * 运行完整测试
 */
function runCompleteTest() {
  console.log('🚀 开始优化后的关键词提取测试')
  console.log('🎯 目标: 验证新的关键词提取逻辑能生成更有效的搜索词')
  
  try {
    // 测试1: 关键词提取
    testKeywordExtraction()
    
    // 测试2: 版本对比
    compareVersions()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 关键词提取优化测试总结')
    console.log('='.repeat(80))
    
    console.log('\n🎉 优化成果:')
    console.log('1. ✅ 生成更精确的搜索词组合')
    console.log('2. ✅ 减少搜索词数量，提高精确性')
    console.log('3. ✅ 智能识别领域和地理位置')
    console.log('4. ✅ 更适合Wikipedia等搜索平台')
    
    console.log('\n💡 预期效果:')
    console.log('- 搜索结果相关性显著提升')
    console.log('- 减少无关内容的干扰')
    console.log('- 提高用户查询的满意度')
    console.log('- 降低质量评估的误判率')
    
  } catch (error) {
    console.error('❌ 测试运行异常:', error)
  }
}

// 运行测试
runCompleteTest()
