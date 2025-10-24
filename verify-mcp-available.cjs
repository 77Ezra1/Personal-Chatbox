const http = require('http');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('验证 MCP 服务可用性');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

http.get('http://localhost:3001/api/mcp/services', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const services = response.services || [];

      // 分类统计
      const running = services.filter(s => s.status === 'running');
      const loaded = services.filter(s => s.loaded === true && s.enabled === true);
      const needsConfig = services.filter(s => s.requiresConfig === true && s.enabled === true);
      const disabled = services.filter(s => s.enabled === false);

      console.log('【1】官方 MCP 服务（需要启动进程）:');
      running.forEach(s => {
        console.log(`   ✅ ${s.name} (${s.id})`);
        console.log(`      状态: running, 工具数: ${s.toolCount}`);
        console.log(`      工具: ${s.tools.map(t => t.name || t).slice(0, 3).join(', ')}...`);
      });

      console.log(`\n   小计: ${running.length} 个服务, ${running.reduce((sum, s) => sum + s.toolCount, 0)} 个工具\n`);

      console.log('【2】内置服务（直接可用）:');
      const builtIn = loaded.filter(s => !running.some(r => r.id === s.id));
      builtIn.forEach(s => {
        const toolCount = s.tools?.length || 0;
        console.log(`   ✅ ${s.name} (${s.id})`);
        console.log(`      工具数: ${toolCount}`);
        if (toolCount > 0 && toolCount <= 3) {
          console.log(`      工具: ${s.tools.map(t => t.name || 'unknown').join(', ')}`);
        } else if (toolCount > 3) {
          console.log(`      工具: ${s.tools.slice(0, 3).map(t => t.name || 'unknown').join(', ')}...`);
        }
      });

      console.log(`\n   小计: ${builtIn.length} 个服务, ${builtIn.reduce((sum, s) => sum + (s.tools?.length || 0), 0)} 个工具\n`);

      console.log('【3】需要配置的服务（暂不可用）:');
      needsConfig.forEach(s => {
        console.log(`   ⚠️  ${s.name} - 需要 API Key`);
      });
      console.log(`\n   小计: ${needsConfig.length} 个服务\n`);

      console.log('【4】未启用的服务:');
      console.log(`   ℹ️  ${disabled.length} 个服务已禁用\n`);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 总结:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const totalAvailable = running.length + builtIn.length;
      const totalTools = running.reduce((sum, s) => sum + s.toolCount, 0) +
                         builtIn.reduce((sum, s) => sum + (s.tools?.length || 0), 0);

      console.log(`\n✅ 可用服务总数: ${totalAvailable} 个`);
      console.log(`✅ 可用工具总数: ${totalTools} 个`);
      console.log(`⚠️  需要配置: ${needsConfig.length} 个`);
      console.log(`ℹ️  未启用: ${disabled.length} 个\n`);

      console.log('💡 结论: 您有 ' + totalAvailable + ' 个MCP服务可以立即使用！\n');

    } catch (err) {
      console.error('解析失败:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('请求失败:', err.message);
});

