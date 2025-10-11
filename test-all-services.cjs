/**
 * 完整的MCP服务测试脚本
 * 测试所有服务是否正常工作
 */

const API_BASE = 'http://localhost:3001/api/mcp';

async function testService(serviceName, testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试服务: ${serviceName}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(`${API_BASE}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });
    
    const result = await response.json();
    
    console.log('完整响应:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ 测试通过');
    } else {
      console.log('❌ 测试失败');
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ 请求失败');
    console.error('错误:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 开始测试所有MCP服务...\n');
  
  const tests = [
    {
      name: '天气服务',
      testCase: {
        toolName: 'get_current_weather',
        parameters: { location: '北京' }
      }
    },
    {
      name: '时间服务',
      testCase: {
        toolName: 'get_current_time',
        parameters: { timezone: 'Asia/Shanghai' }
      }
    },
    {
      name: '搜索服务',
      testCase: {
        toolName: 'search_web',
        parameters: { query: 'OpenAI GPT-4', max_results: 3 }
      }
    },
    {
      name: 'YouTube字幕服务',
      testCase: {
        toolName: 'get_youtube_transcript',
        parameters: { url: 'dQw4w9WgXcQ', lang: 'en' }
      }
    },
    {
      name: '加密货币服务 - 比特币',
      testCase: {
        toolName: 'get_bitcoin_price',
        parameters: {}
      }
    },
    {
      name: '加密货币服务 - 以太坊',
      testCase: {
        toolName: 'get_crypto_price',
        parameters: { symbol: 'ethereum' }
      }
    },
    {
      name: '网页抓取服务',
      testCase: {
        toolName: 'fetch_url',
        parameters: { url: 'https://example.com', max_length: 500 }
      }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await testService(test.name, test.testCase);
    results.push({ name: test.name, success });
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 输出总结
  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log(`\n总计: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('\n🎉 所有服务测试通过!');
  } else {
    console.log(`\n⚠️ 有 ${total - passed} 个服务测试失败`);
  }
}

runAllTests().catch(console.error);

