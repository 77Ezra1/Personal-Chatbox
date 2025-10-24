const http = require('http');

console.log('测试 MCP API...\n');

// 1. 测试 /api/mcp/tools
console.log('【1】测试 GET /api/mcp/tools');
http.get('http://localhost:3001/api/mcp/tools', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`   状态码: ${res.statusCode}`);

    if (res.statusCode === 200) {
      try {
        const tools = JSON.parse(data);
        console.log(`   工具总数: ${tools.length}`);

        if (tools.length > 0) {
          console.log('\n   前3个工具:');
          tools.slice(0, 3).forEach((tool, i) => {
            console.log(`   ${i + 1}. ${tool.name} (${tool.service})`);
            console.log(`      描述: ${tool.description}`);
          });
        } else {
          console.log('   ⚠️  返回的工具列表为空！');
        }
      } catch (err) {
        console.log(`   ❌ 解析响应失败: ${err.message}`);
        console.log(`   响应内容: ${data}`);
      }
    } else {
      console.log(`   ❌ 请求失败`);
      console.log(`   响应: ${data}`);
    }

    console.log('\n【2】测试 GET /api/mcp/services');

    // 2. 测试 /api/mcp/services
    http.get('http://localhost:3001/api/mcp/services', (res2) => {
      let data2 = '';

      res2.on('data', (chunk) => {
        data2 += chunk;
      });

      res2.on('end', () => {
        console.log(`   状态码: ${res2.statusCode}`);

        if (res2.statusCode === 200) {
          try {
            const services = JSON.parse(data2);
            console.log(`   服务总数: ${services.length}`);

            if (services.length > 0) {
              console.log('\n   所有服务:');
              services.forEach((svc, i) => {
                console.log(`   ${i + 1}. ${svc.name} (${svc.id})`);
                console.log(`      状态: ${svc.status}, 工具数: ${svc.toolCount}`);
                console.log(`      工具: ${(svc.tools || []).slice(0, 3).join(', ')}${svc.tools?.length > 3 ? '...' : ''}`);
              });
            } else {
              console.log('   ⚠️  返回的服务列表为空！');
            }
          } catch (err) {
            console.log(`   ❌ 解析响应失败: ${err.message}`);
            console.log(`   响应内容: ${data2}`);
          }
        } else {
          console.log(`   ❌ 请求失败`);
          console.log(`   响应: ${data2}`);
        }

        console.log('\n✅ API 测试完成\n');
      });
    }).on('error', (err) => {
      console.error(`❌ 请求失败: ${err.message}\n`);
    });

  });
}).on('error', (err) => {
  console.error(`❌ 请求失败: ${err.message}\n`);
});

