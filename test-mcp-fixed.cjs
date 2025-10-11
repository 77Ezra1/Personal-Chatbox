const http = require('http');

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
  console.log('Testing all MCP services...\n');

  const tests = [
    {
      name: 'Weather Service',
      toolName: 'get_current_weather',
      parameters: { city: 'Beijing' }
    },
    {
      name: 'Time Service',
      toolName: 'get_current_time',
      parameters: { timezone: 'Asia/Shanghai' }
    },
    {
      name: 'Search Service',
      toolName: 'search_web',
      parameters: { query: 'OpenAI GPT-4', max_results: 3 }
    },
    {
      name: 'YouTube Service',
      toolName: 'get_youtube_transcript',
      parameters: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', lang: 'en' }
    },
    {
      name: 'Crypto Service',
      toolName: 'get_bitcoin_price',
      parameters: {}
    },
    {
      name: 'Fetch Service',
      toolName: 'fetch_url',
      parameters: { url: 'https://example.com' }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    
    try {
      const result = await testToolCall(test.toolName, test.parameters);
      
      if (result.status === 200 && result.data.success) {
        console.log('PASS\n');
        passed++;
      } else {
        console.log('FAIL');
        console.log(JSON.stringify(result.data, null, 2));
        console.log('');
        failed++;
      }
    } catch (error) {
      console.log('ERROR:', error.message, '\n');
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
}

runTests().catch(console.error);
