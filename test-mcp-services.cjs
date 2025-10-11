const http = require('http');

// 测试工具调用
async function testToolCall(toolName, parameters) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      toolName: toolName,
      parameters: parameters
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/mcp/call',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('开始测试所有MCP服务');
  console.log('='.repeat(60));
  console.log('');

  const tests = [
    {
      name: '天气服务 - 获取当前天气',
      toolName: 'get_current_weather',
      parameters: { city: '北京' }
    },
    {
      name: '时间服务 - 获取当前时间',
      toolName: 'get_current_time',
      parameters: { timezone: 'Asia/Shanghai' }
    },
    {
      name: '搜索服务 - DuckDuckGo搜索',
      toolName: 'search_web',
      parameters: { query: 'OpenAI GPT-4', max_results: 3 }
    },
    {
      name: 'YouTube服务 - 获取字幕',
      toolName: 'get_youtube_transcript',
      parameters: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', lang: 'en' }
    },
    {
      name: '加密货币服务 - 获取比特币价格',
      toolName: 'get_bitcoin_price',
      parameters: {}
    },
    {
      name: '网页抓取服务 - 抓取示例页面',
      toolName: 'fetch_url',
      parameters: { url: 'https://example.com' }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n测试: ${test.name}`);
    console.log('-'.repeat(60));
    
    try {
      const result = await testToolCall(test.toolName, test.parameters);
      
      if (result.status === 200 && result.data.success) {
        console.log('✅ 测试通过');
        const preview = JSON.stringify(result.data).substring(0, 300);
        console.log('结果预览:', preview + (preview.length >= 300 ? '...' : ''));
        passed++;
      } else {
        console.log('❌ 测试失败');
        console.log('状态码:', result.status);
        console.log('响应:', JSON.stringify(result.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log('❌ 测试异常');
      console.log('错误:', error.message);
      failed++;
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`总计: ${tests.length} 个测试`);
  console.log(`通过: ${passed} 个`);
  console.log(`失败: ${failed} 个`);
  console.log('='.repeat(60));
}

runTests().catch(console.error);
