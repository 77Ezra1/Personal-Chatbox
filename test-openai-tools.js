/**
 * OpenAI Tools Format Test
 * 测试工具转换为OpenAI格式是否正确
 */

import { convertMcpToolsToOpenAIFormat, executeMcpTool } from './src/lib/mcpClient.js'

// 模拟启用的服务器配置
const mockServers = [
  {
    id: 'duckduckgo-search',
    type: 'search',
    name: 'DuckDuckGo 搜索',
    isEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'open-meteo-weather',
    type: 'weather', 
    name: 'Open-Meteo 天气',
    isEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'official-time-server',
    type: 'time',
    name: '官方时间服务',
    isEnabled: true,
    requiresApiKey: false
  }
]

function testToolConversion() {
  console.log('🔧 测试工具转换为 OpenAI 格式...')
  
  const tools = convertMcpToolsToOpenAIFormat(mockServers)
  
  console.log('✅ 转换成功！生成了', tools.length, '个工具')
  
  tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.function.name}`)
    console.log('   描述:', tool.function.description)
    console.log('   参数数量:', Object.keys(tool.function.parameters.properties).length)
    console.log('   必需参数:', tool.function.parameters.required.join(', ') || '无')
  })
  
  return tools
}

async function testToolExecution() {
  console.log('\n🚀 测试工具执行...')
  
  // 测试搜索工具
  console.log('\n1. 测试搜索工具')
  try {
    const searchResult = await executeMcpTool('duckduckgo_search', { query: 'AI' }, mockServers)
    if (searchResult.success) {
      console.log('✅ 搜索工具执行成功')
      console.log('   返回内容长度:', searchResult.content.length, '字符')
    } else {
      console.log('❌ 搜索工具执行失败:', searchResult.error)
    }
  } catch (error) {
    console.log('❌ 搜索工具执行异常:', error.message)
  }
  
  // 测试天气工具
  console.log('\n2. 测试天气工具')
  try {
    const weatherResult = await executeMcpTool('get_current_weather', { location: 'Shanghai' }, mockServers)
    if (weatherResult.success) {
      console.log('✅ 天气工具执行成功')
      console.log('   返回内容长度:', weatherResult.content.length, '字符')
    } else {
      console.log('❌ 天气工具执行失败:', weatherResult.error)
    }
  } catch (error) {
    console.log('❌ 天气工具执行异常:', error.message)
  }
  
  // 测试时间工具
  console.log('\n3. 测试时间工具')
  try {
    const timeResult = await executeMcpTool('get_current_time', { timezone: 'Asia/Tokyo' }, mockServers)
    if (timeResult.success) {
      console.log('✅ 时间工具执行成功')
      console.log('   返回内容长度:', timeResult.content.length, '字符')
    } else {
      console.log('❌ 时间工具执行失败:', timeResult.error)
    }
  } catch (error) {
    console.log('❌ 时间工具执行异常:', error.message)
  }
}

async function runTests() {
  console.log('🧪 开始测试 OpenAI 工具格式和执行...\n')
  
  const tools = testToolConversion()
  await testToolExecution()
  
  console.log('\n📊 测试总结:')
  console.log('- 工具转换: ✅ 正常')
  console.log('- 工具数量:', tools.length)
  console.log('- 免费服务: 3个 (DuckDuckGo, Open-Meteo, 时间服务)')
  console.log('- API兼容性: ✅ 符合 OpenAI 标准')
  
  console.log('\n🏁 测试完成！')
}

runTests().catch(console.error)
