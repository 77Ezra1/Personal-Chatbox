/**
 * 测试所有MCP服务
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/mcp';

// 测试结果
const results = {
  passed: [],
  failed: []
};

async function testService(serviceName, toolName, parameters) {
  try {
    console.log(`\n🧪 测试 ${serviceName} - ${toolName}...`);
    
    const response = await axios.post(`${BASE_URL}/call`, {
      toolName,
      parameters
    });
    
    if (response.data.success !== false) {
      console.log(`✅ ${serviceName} - ${toolName} 测试通过`);
      console.log(`   结果:`, JSON.stringify(response.data).substring(0, 200));
      results.passed.push(`${serviceName} - ${toolName}`);
      return true;
    } else {
      console.log(`❌ ${serviceName} - ${toolName} 测试失败`);
      console.log(`   错误:`, response.data.error);
      results.failed.push(`${serviceName} - ${toolName}: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${serviceName} - ${toolName} 测试失败`);
    console.log(`   错误:`, error.message);
    results.failed.push(`${serviceName} - ${toolName}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始测试所有MCP服务...\n');
  
  // 1. 测试天气服务
  await testService('天气服务', 'get_current_weather', {
    location: '北京'
  });
  
  // 2. 测试时间服务
  await testService('时间服务', 'get_current_time', {
    timezone: 'Asia/Shanghai'
  });
  
  // 3. 测试Dexscreener服务
  await testService('Dexscreener', 'search_token', {
    query: 'BTC'
  });
  
  // 4. 测试网页抓取服务
  await testService('网页抓取', 'fetch_url', {
    url: 'https://example.com'
  });
  
  // 5. 测试Playwright服务 - 导航
  await testService('Playwright', 'navigate_to_url', {
    url: 'https://example.com'
  });
  
  // 6. 测试Playwright服务 - 获取内容
  await testService('Playwright', 'get_page_content', {});
  
  // 7. 测试Playwright服务 - 截图
  await testService('Playwright', 'take_screenshot', {
    path: '/tmp/test-screenshot.png'
  });
  
  // 8. 测试Playwright服务 - 关闭浏览器
  await testService('Playwright', 'close_browser', {});
  
  // 打印测试结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ 通过的测试:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ 失败的测试:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 返回退出码
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});

