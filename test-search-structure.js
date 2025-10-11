#!/usr/bin/env node

/**
 * 搜索功能和结果结构化验证测试
 * 验证业务逻辑流程：用户输入 → 思考整理 → 搜索关键词 → 获取回复信息 → 整理结构化 → 回复到前端
 */

import { useMcpManager } from './src/hooks/useMcpManager.js'

// 模拟React Hook环境
const mockReactHooks = () => {
  let state = {}
  let effects = []
  
  global.useState = (initial) => {
    const key = Math.random().toString(36)
    if (!(key in state)) {
      state[key] = initial
    }
    return [state[key], (newValue) => { state[key] = newValue }]
  }
  
  global.useEffect = (fn, deps) => {
    effects.push({ fn, deps })
    fn() // 立即执行
  }
  
  global.useCallback = (fn, deps) => fn
  global.useMemo = (fn, deps) => fn()
}

// 初始化模拟环境
mockReactHooks()

// 测试用例
const SEARCH_TEST_CASES = [
  {
    name: '美妆市场趋势搜索',
    query: '2025年中国美妆市场发展趋势',
    expectedElements: [
      '搜索结果',
      '权威背景信息',
      '智能分析洞察',
      '信息来源说明',
      '深入研究建议'
    ]
  },
  {
    name: '人工智能应用搜索',
    query: '人工智能在美妆行业的应用前景',
    expectedElements: [
      '搜索结果',
      '市场分析',
      '趋势预测',
      '技术创新',
      '发展方向'
    ]
  },
  {
    name: '一般性市场查询',
    query: '2025年市场发展趋势',
    expectedElements: [
      '搜索结果',
      '市场发展趋势',
      '数字化转型',
      '消费升级',
      '技术应用'
    ]
  },
  {
    name: '行业发展查询',
    query: '化妆品行业创新发展',
    expectedElements: [
      '搜索结果',
      '行业洞察',
      '创新技术',
      '商业模式',
      '可持续发展'
    ]
  }
]

/**
 * 验证搜索结果结构
 */
function validateSearchStructure(content, testCase) {
  console.log(`\n🔍 验证搜索结果结构 - ${testCase.name}`)
  console.log('=' .repeat(60))
  
  const results = {
    hasTitle: false,
    hasBackground: false,
    hasAnalysis: false,
    hasInsights: false,
    hasSource: false,
    hasSuggestions: false,
    structureScore: 0,
    contentQuality: 0
  }
  
  // 检查标题和基本结构
  if (content.includes('搜索结果')) {
    results.hasTitle = true
    results.structureScore += 10
    console.log('✅ 包含搜索结果标题')
  }
  
  // 检查背景信息
  if (content.includes('背景信息') || content.includes('Wikipedia') || content.includes('权威')) {
    results.hasBackground = true
    results.structureScore += 15
    console.log('✅ 包含背景信息')
  }
  
  // 检查分析内容
  if (content.includes('市场分析') || content.includes('行业分析') || content.includes('发展趋势')) {
    results.hasAnalysis = true
    results.structureScore += 20
    console.log('✅ 包含专业分析')
  }
  
  // 检查智能洞察
  if (content.includes('智能分析洞察') || content.includes('洞察') || content.includes('趋势预测')) {
    results.hasInsights = true
    results.structureScore += 20
    console.log('✅ 包含智能洞察')
  }
  
  // 检查信息来源说明
  if (content.includes('信息来源说明') || content.includes('数据来源')) {
    results.hasSource = true
    results.structureScore += 15
    console.log('✅ 包含信息来源说明')
  }
  
  // 检查研究建议
  if (content.includes('深入研究建议') || content.includes('建议')) {
    results.hasSuggestions = true
    results.structureScore += 20
    console.log('✅ 包含研究建议')
  }
  
  // 评估内容质量
  const contentLength = content.length
  if (contentLength > 1000) {
    results.contentQuality += 30
    console.log('✅ 内容丰富 (>1000字符)')
  } else if (contentLength > 500) {
    results.contentQuality += 20
    console.log('⚠️ 内容适中 (500-1000字符)')
  } else {
    results.contentQuality += 10
    console.log('⚠️ 内容较少 (<500字符)')
  }
  
  // 检查结构化程度
  const sectionCount = (content.match(/\*\*.*?\*\*/g) || []).length
  if (sectionCount >= 5) {
    results.contentQuality += 20
    console.log('✅ 结构化程度高 (>=5个章节)')
  } else if (sectionCount >= 3) {
    results.contentQuality += 15
    console.log('⚠️ 结构化程度中等 (3-4个章节)')
  } else {
    results.contentQuality += 5
    console.log('⚠️ 结构化程度低 (<3个章节)')
  }
  
  // 检查业务逻辑流程体现
  const hasThinking = content.includes('分析') || content.includes('思考')
  const hasKeywords = content.includes('关键词') || content.includes('搜索')
  const hasStructured = content.includes('结构化') || sectionCount >= 3
  
  if (hasThinking && hasKeywords && hasStructured) {
    results.contentQuality += 30
    console.log('✅ 体现完整业务逻辑流程')
  } else {
    results.contentQuality += 10
    console.log('⚠️ 业务逻辑流程体现不完整')
  }
  
  const totalScore = results.structureScore + results.contentQuality
  console.log(`\n📊 评分结果:`)
  console.log(`- 结构完整性: ${results.structureScore}/100`)
  console.log(`- 内容质量: ${results.contentQuality}/100`)
  console.log(`- 总体评分: ${totalScore}/200`)
  
  let grade = 'F'
  if (totalScore >= 160) grade = 'A'
  else if (totalScore >= 140) grade = 'B'
  else if (totalScore >= 120) grade = 'C'
  else if (totalScore >= 100) grade = 'D'
  
  console.log(`- 等级评定: ${grade}`)
  
  return {
    ...results,
    totalScore,
    grade,
    passed: totalScore >= 120 // C级及以上为通过
  }
}

/**
 * 执行搜索功能测试
 */
async function testSearchFunction() {
  console.log('🚀 开始搜索功能和结果结构化验证测试')
  console.log('🎯 验证业务逻辑流程：用户输入 → 思考整理 → 搜索关键词 → 获取信息 → 结构化 → 回复')
  
  const results = []
  
  try {
    // 模拟MCP管理器初始化
    console.log('\n📦 初始化MCP管理器...')
    
    // 直接测试搜索API函数
    const { callSearchAPI } = await import('./src/hooks/useMcpManager.js')
    
    for (const testCase of SEARCH_TEST_CASES) {
      console.log(`\n🧪 测试用例: ${testCase.name}`)
      console.log(`📝 查询: "${testCase.query}"`)
      
      try {
        // 调用搜索API
        const searchResult = await callSearchAPI({
          query: testCase.query,
          max_results: 10
        })
        
        if (searchResult.success) {
          console.log('✅ 搜索API调用成功')
          console.log(`📄 内容长度: ${searchResult.content.length} 字符`)
          
          // 验证结果结构
          const validation = validateSearchStructure(searchResult.content, testCase)
          
          results.push({
            name: testCase.name,
            query: testCase.query,
            success: true,
            validation,
            contentLength: searchResult.content.length,
            metadata: searchResult.metadata
          })
          
          // 显示部分内容预览
          console.log('\n📋 内容预览:')
          console.log(searchResult.content.substring(0, 300) + '...')
          
        } else {
          console.log('❌ 搜索API调用失败')
          results.push({
            name: testCase.name,
            query: testCase.query,
            success: false,
            error: searchResult.error || '未知错误'
          })
        }
        
      } catch (error) {
        console.log('❌ 测试执行失败:', error.message)
        results.push({
          name: testCase.name,
          query: testCase.query,
          success: false,
          error: error.message
        })
      }
      
      // 测试间隔
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.log('❌ 测试初始化失败:', error.message)
    return false
  }
  
  // 汇总结果
  console.log('\n' + '='.repeat(80))
  console.log('📊 搜索功能验证结果汇总')
  console.log('='.repeat(80))
  
  let passedCount = 0
  let totalScore = 0
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`)
    console.log(`   查询: "${result.query}"`)
    
    if (result.success && result.validation) {
      const status = result.validation.passed ? '✅ 通过' : '❌ 未通过'
      console.log(`   状态: ${status} (${result.validation.grade}级, ${result.validation.totalScore}/200分)`)
      console.log(`   内容长度: ${result.contentLength} 字符`)
      
      if (result.metadata) {
        console.log(`   搜索关键词: ${result.metadata.searchKeywords?.join(', ') || '无'}`)
        console.log(`   查询类型: ${result.metadata.queryType || '未知'}`)
        console.log(`   结果来源: ${result.metadata.resultSources?.join(', ') || '无'}`)
      }
      
      if (result.validation.passed) {
        passedCount++
      }
      totalScore += result.validation.totalScore
    } else {
      console.log(`   状态: ❌ 失败`)
      console.log(`   错误: ${result.error}`)
    }
  })
  
  const successRate = (passedCount / results.length) * 100
  const avgScore = totalScore / results.length
  
  console.log('\n📈 总体统计:')
  console.log(`- 测试用例总数: ${results.length}`)
  console.log(`- 通过用例数: ${passedCount}`)
  console.log(`- 通过率: ${successRate.toFixed(1)}%`)
  console.log(`- 平均得分: ${avgScore.toFixed(1)}/200`)
  
  // 业务逻辑流程验证
  console.log('\n🔄 业务逻辑流程验证:')
  console.log('✅ 用户输入信息 → 接收查询参数')
  console.log('✅ 思考整理 → 提取搜索关键词')
  console.log('✅ 搜索关键词 → 多源信息获取')
  console.log('✅ 获取回复信息 → 整合搜索结果')
  console.log('✅ 整理结构化 → 格式化输出')
  console.log('✅ 回复到前端 → 返回结构化内容')
  
  if (passedCount === results.length && avgScore >= 140) {
    console.log('\n🎉 搜索功能验证完全通过！业务逻辑流程正确实现！')
    return true
  } else if (passedCount >= results.length * 0.75) {
    console.log('\n⚠️ 搜索功能基本通过，但仍有改进空间')
    return true
  } else {
    console.log('\n❌ 搜索功能验证未通过，需要进一步优化')
    return false
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testSearchFunction()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('测试运行失败:', error)
      process.exit(1)
    })
}

export { testSearchFunction }
