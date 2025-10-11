/**
 * MCP Functions Test Script
 * 测试集成的MCP功能是否正常工作
 */

import { 
  callDuckDuckGoSearch, 
  callOpenMeteoWeather, 
  getCurrentTime,
  formatDuckDuckGoResults,
  formatOpenMeteoWeather,
  formatCurrentTime
} from './src/lib/mcpClient.js'

async function testDuckDuckGoSearch() {
  console.log('🔍 测试 DuckDuckGo 搜索...')
  try {
    const result = await callDuckDuckGoSearch('JavaScript', { maxResults: 3 })
    if (result.success) {
      console.log('✅ DuckDuckGo 搜索成功')
      console.log('结果数量:', result.data.results.length)
      const formatted = formatDuckDuckGoResults(result.data)
      console.log('格式化结果长度:', formatted.length, '字符')
    } else {
      console.log('❌ DuckDuckGo 搜索失败:', result.error)
    }
  } catch (error) {
    console.log('❌ DuckDuckGo 搜索异常:', error.message)
  }
  console.log('')
}

async function testOpenMeteoWeather() {
  console.log('🌤️ 测试 Open-Meteo 天气...')
  try {
    const result = await callOpenMeteoWeather('Beijing', { units: 'celsius' })
    if (result.success) {
      console.log('✅ Open-Meteo 天气成功')
      console.log('城市:', result.data.location.name)
      console.log('当前温度:', result.data.current.temperature_2m, '°C')
      const formatted = formatOpenMeteoWeather(result.data)
      console.log('格式化结果长度:', formatted.length, '字符')
    } else {
      console.log('❌ Open-Meteo 天气失败:', result.error)
    }
  } catch (error) {
    console.log('❌ Open-Meteo 天气异常:', error.message)
  }
  console.log('')
}

async function testCurrentTime() {
  console.log('⏰ 测试时间服务...')
  try {
    const result = await getCurrentTime('Asia/Shanghai')
    if (result.success) {
      console.log('✅ 时间服务成功')
      console.log('当前时间:', result.data.datetime)
      console.log('时区:', result.data.timezone)
      const formatted = formatCurrentTime(result.data)
      console.log('格式化结果长度:', formatted.length, '字符')
    } else {
      console.log('❌ 时间服务失败:', result.error)
    }
  } catch (error) {
    console.log('❌ 时间服务异常:', error.message)
  }
  console.log('')
}

async function runAllTests() {
  console.log('🧪 开始测试 MCP 功能...\n')
  
  await testDuckDuckGoSearch()
  await testOpenMeteoWeather()
  await testCurrentTime()
  
  console.log('🏁 测试完成！')
}

// 运行测试
runAllTests().catch(console.error)
