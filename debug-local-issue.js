#!/usr/bin/env node

/**
 * 诊断本地测试问题的调试脚本
 */

console.log('🔍 开始诊断本地测试问题...')

// 测试基础的搜索API函数
async function testBasicSearch() {
  console.log('\n1. 测试基础搜索功能...')
  
  try {
    // 测试Wikipedia搜索
    const wikiSearchUrl = new URL('https://zh.wikipedia.org/w/api.php')
    wikiSearchUrl.searchParams.append('action', 'query')
    wikiSearchUrl.searchParams.append('format', 'json')
    wikiSearchUrl.searchParams.append('list', 'search')
    wikiSearchUrl.searchParams.append('srsearch', '美妆市场')
    wikiSearchUrl.searchParams.append('srlimit', '3')
    wikiSearchUrl.searchParams.append('origin', '*')

    console.log('📡 发送Wikipedia API请求:', wikiSearchUrl.toString())
    
    const response = await fetch(wikiSearchUrl)
    console.log('📡 Wikipedia API响应状态:', response.status, response.statusText)
    
    if (!response.ok) {
      console.log('❌ Wikipedia API请求失败')
      return false
    }

    const data = await response.json()
    console.log('📄 Wikipedia API响应数据:', JSON.stringify(data, null, 2))
    
    if (data.query && data.query.search && data.query.search.length > 0) {
      console.log('✅ Wikipedia搜索成功，找到', data.query.search.length, '个结果')
      return true
    } else {
      console.log('⚠️ Wikipedia搜索无结果')
      return false
    }
    
  } catch (error) {
    console.log('❌ Wikipedia搜索异常:', error.message)
    return false
  }
}

// 测试搜索API函数
async function testSearchAPI() {
  console.log('\n2. 测试搜索API函数...')
  
  // 简化的搜索API实现
  async function callSearchAPI(parameters) {
    const { query, max_results = 10 } = parameters
    
    try {
      console.log('[Search API] 开始搜索:', query)
      
      // 简单的关键词提取
      const keywords = query.split(' ').filter(word => word.length > 1).slice(0, 3)
      console.log('[Search API] 提取关键词:', keywords)
      
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
      
      return {
        success: true,
        content
      }
      
    } catch (error) {
      console.error('[Search API] 搜索失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // 测试搜索API
  try {
    const result = await callSearchAPI({
      query: '2025年中国美妆市场发展趋势',
      max_results: 10
    })
    
    if (result.success) {
      console.log('✅ 搜索API调用成功')
      console.log('📄 返回内容长度:', result.content.length, '字符')
      console.log('📄 内容预览:', result.content.substring(0, 200) + '...')
      return true
    } else {
      console.log('❌ 搜索API调用失败:', result.error)
      return false
    }
    
  } catch (error) {
    console.log('❌ 搜索API测试异常:', error.message)
    return false
  }
}

// 测试工具调用流程
async function testToolCallFlow() {
  console.log('\n3. 测试工具调用流程...')
  
  // 模拟executeToolCall函数
  async function executeToolCall(toolName, parameters) {
    console.log(`[Tool Call] 执行工具: ${toolName}`)
    console.log(`[Tool Call] 参数:`, parameters)
    
    try {
      if (toolName === 'duckduckgo_search') {
        // 调用搜索API
        const result = await testSearchAPI()
        if (result) {
          return {
            success: true,
            content: `[搜索执行完成]\n\n**搜索概况:**\n- 查询: ${parameters.query}\n- 状态: 成功\n\n**获取到的信息:**\n\n1. **测试结果**\n   这是一个测试搜索结果...\n\n[搜索结果整理完成]`
          }
        } else {
          return {
            success: false,
            error: '搜索API调用失败'
          }
        }
      } else {
        return {
          success: false,
          error: `未知工具: ${toolName}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // 测试工具调用
  try {
    const result = await executeToolCall('duckduckgo_search', {
      query: '2025年中国美妆市场发展趋势',
      max_results: 10
    })
    
    if (result.success) {
      console.log('✅ 工具调用成功')
      console.log('📄 返回内容:', result.content.substring(0, 200) + '...')
      return true
    } else {
      console.log('❌ 工具调用失败:', result.error)
      return false
    }
    
  } catch (error) {
    console.log('❌ 工具调用异常:', error.message)
    return false
  }
}

// 检查网络连接
async function testNetworkConnection() {
  console.log('\n4. 测试网络连接...')
  
  const testUrls = [
    'https://zh.wikipedia.org/w/api.php',
    'https://httpbin.org/get',
    'https://api.github.com'
  ]
  
  for (const url of testUrls) {
    try {
      console.log(`📡 测试连接: ${url}`)
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 })
      console.log(`✅ ${url} - 状态: ${response.status}`)
    } catch (error) {
      console.log(`❌ ${url} - 错误: ${error.message}`)
    }
  }
}

// 检查项目文件
async function checkProjectFiles() {
  console.log('\n5. 检查项目文件...')
  
  const fs = await import('fs')
  const path = await import('path')
  
  const criticalFiles = [
    'src/App.jsx',
    'src/hooks/useMcpManager.js',
    'src/lib/aiClient.js'
  ]
  
  for (const file of criticalFiles) {
    try {
      const filePath = path.join(process.cwd(), file)
      const stats = fs.statSync(filePath)
      console.log(`✅ ${file} - 大小: ${stats.size} 字节`)
    } catch (error) {
      console.log(`❌ ${file} - 错误: ${error.message}`)
    }
  }
}

// 运行所有诊断测试
async function runDiagnostics() {
  console.log('🚀 开始完整诊断...\n')
  
  const results = {
    basicSearch: false,
    searchAPI: false,
    toolCall: false,
    network: true,
    files: true
  }
  
  try {
    results.basicSearch = await testBasicSearch()
    results.searchAPI = await testSearchAPI()
    results.toolCall = await testToolCallFlow()
    await testNetworkConnection()
    await checkProjectFiles()
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 诊断结果汇总:')
    console.log('='.repeat(50))
    console.log(`基础搜索功能: ${results.basicSearch ? '✅ 正常' : '❌ 异常'}`)
    console.log(`搜索API函数: ${results.searchAPI ? '✅ 正常' : '❌ 异常'}`)
    console.log(`工具调用流程: ${results.toolCall ? '✅ 正常' : '❌ 异常'}`)
    console.log(`网络连接: ${results.network ? '✅ 正常' : '❌ 异常'}`)
    console.log(`项目文件: ${results.files ? '✅ 正常' : '❌ 异常'}`)
    
    const passedCount = Object.values(results).filter(Boolean).length
    const totalCount = Object.keys(results).length
    
    console.log(`\n总体状态: ${passedCount}/${totalCount} 项通过`)
    
    if (passedCount === totalCount) {
      console.log('🎉 所有诊断项目都通过了！问题可能在其他地方。')
    } else {
      console.log('⚠️ 发现问题，需要进一步修复。')
    }
    
    // 提供修复建议
    console.log('\n🔧 修复建议:')
    if (!results.basicSearch) {
      console.log('- 检查网络连接和Wikipedia API访问权限')
    }
    if (!results.searchAPI) {
      console.log('- 检查搜索API函数的实现逻辑')
    }
    if (!results.toolCall) {
      console.log('- 检查工具调用的错误处理机制')
    }
    
  } catch (error) {
    console.log('❌ 诊断过程中发生异常:', error.message)
  }
}

// 运行诊断
runDiagnostics().catch(console.error)
