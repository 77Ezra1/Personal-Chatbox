const http = require('http');

console.log('获取原始 MCP API 响应...\n');

http.get('http://localhost:3001/api/mcp/services', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('\n原始响应:\n');
    console.log(data);
    console.log('\n');

    try {
      const parsed = JSON.parse(data);
      console.log('解析后的数据:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log('无法解析为JSON:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('请求失败:', err.message);
});

