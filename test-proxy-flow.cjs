/**
 * 完整的代理流程测试
 * 测试从配置存储到 MCP 服务的整个代理应用流程
 */

const configStorage = require('./server/services/config-storage.cjs');
const { getSystemProxyDetector } = require('./server/lib/SystemProxyDetector.cjs');
const { getProxyManager } = require('./server/lib/ProxyManager.cjs');

async function testProxyFlow() {
  console.log('='.repeat(70));
  console.log('完整代理流程测试');
  console.log('='.repeat(70));
  
  try {
    // 1. 初始化配置存储
    console.log('\n步骤 1: 初始化配置存储');
    console.log('-'.repeat(70));
    await configStorage.initialize();
    console.log('✓ 配置存储初始化成功');
    
    // 2. 读取代理配置
    console.log('\n步骤 2: 读取代理配置');
    console.log('-'.repeat(70));
    const proxyConfig = await configStorage.getServiceConfig('proxy');
    console.log('代理配置:', JSON.stringify(proxyConfig, null, 2));
    
    if (!proxyConfig) {
      console.log('✗ 未找到代理配置');
      return false;
    }
    
    // 3. 应用代理到环境变量 (模拟 server/index.cjs 的行为)
    console.log('\n步骤 3: 应用代理到环境变量');
    console.log('-'.repeat(70));
    if (proxyConfig.enabled) {
      const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      console.log(`✓ 已设置环境变量: ${proxyUrl}`);
    } else {
      console.log('⚠ 代理未启用,跳过环境变量设置');
    }
    
    // 4. SystemProxyDetector 检测
    console.log('\n步骤 4: SystemProxyDetector 检测代理');
    console.log('-'.repeat(70));
    const detector = getSystemProxyDetector();
    const detectedProxy = await detector.getSystemProxy();
    console.log('检测到的代理:', JSON.stringify(detectedProxy, null, 2));
    
    // 验证检测结果
    if (proxyConfig.enabled) {
      if (detectedProxy.enabled && detectedProxy.source === 'user_config') {
        console.log('✓ 正确检测到用户配置的代理');
      } else if (detectedProxy.enabled && detectedProxy.source === 'environment') {
        console.log('✓ 从环境变量检测到代理');
      } else {
        console.log('✗ 代理检测结果不符合预期');
        console.log('  期望: enabled=true, source=user_config 或 environment');
        console.log('  实际:', detectedProxy);
      }
    }
    
    // 5. ProxyManager 初始化
    console.log('\n步骤 5: ProxyManager 初始化');
    console.log('-'.repeat(70));
    const proxyManager = getProxyManager();
    await proxyManager.initialize();
    const proxyInfo = await proxyManager.getProxyInfo();
    console.log('ProxyManager 信息:', JSON.stringify(proxyInfo, null, 2));
    
    // 6. 模拟 MCP 服务启动时的代理获取
    console.log('\n步骤 6: 模拟 MCP 服务启动时的代理获取');
    console.log('-'.repeat(70));
    
    // 这是 mcp-manager.cjs 中的逻辑
    const processEnv = {
      ...process.env
    };
    
    if (proxyInfo.system && proxyInfo.system.enabled) {
      const proxyUrl = proxyInfo.system.url;
      processEnv.HTTP_PROXY = proxyUrl;
      processEnv.HTTPS_PROXY = proxyUrl;
      processEnv.http_proxy = proxyUrl;
      processEnv.https_proxy = proxyUrl;
      console.log(`✓ MCP 服务将使用代理: ${proxyUrl}`);
    } else {
      console.log('⚠ MCP 服务将不使用代理');
    }
    
    // 7. 验证特定 URL 的代理使用
    console.log('\n步骤 7: 验证特定 URL 的代理使用');
    console.log('-'.repeat(70));
    
    const testUrls = [
      { url: 'https://en.wikipedia.org/api', shouldProxy: true, desc: 'Wikipedia (需要代理)' },
      { url: 'https://api.github.com', shouldProxy: true, desc: 'GitHub API (需要代理)' },
      { url: 'https://search.brave.com', shouldProxy: true, desc: 'Brave Search (需要代理)' },
      { url: 'http://localhost:3001', shouldProxy: false, desc: 'Localhost (不需要代理)' },
      { url: 'https://www.baidu.com', shouldProxy: false, desc: '百度 (不需要代理)' }
    ];
    
    for (const test of testUrls) {
      const shouldProxy = await detector.shouldUseProxyForUrl(test.url);
      const match = shouldProxy === test.shouldProxy ? '✓' : '✗';
      console.log(`${match} ${test.desc}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   期望使用代理: ${test.shouldProxy}, 实际: ${shouldProxy}`);
    }
    
    // 8. 总结
    console.log('\n' + '='.repeat(70));
    console.log('测试结果总结');
    console.log('='.repeat(70));
    
    const checks = [
      { name: '配置存储', pass: !!proxyConfig },
      { name: '代理启用状态', pass: proxyConfig.enabled },
      { name: '环境变量设置', pass: !!process.env.HTTP_PROXY },
      { name: 'SystemProxyDetector', pass: detectedProxy.enabled },
      { name: 'ProxyManager', pass: proxyInfo.system && proxyInfo.system.enabled },
      { name: 'MCP 服务代理', pass: processEnv.HTTP_PROXY === proxyInfo.system?.url }
    ];
    
    console.log('\n检查项:');
    for (const check of checks) {
      console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
    }
    
    const allPass = checks.every(c => c.pass);
    
    if (allPass) {
      console.log('\n✅ 所有检查通过!代理配置流程正常');
    } else {
      console.log('\n⚠️ 部分检查未通过,请查看详细信息');
    }
    
    // 9. 配置建议
    console.log('\n' + '='.repeat(70));
    console.log('配置建议');
    console.log('='.repeat(70));
    
    if (proxyConfig.enabled) {
      console.log(`\n当前代理配置: ${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`);
      console.log('\n如果您使用 Clash:');
      console.log('  - 确保 Clash 正在运行');
      console.log('  - 确保 Clash 监听端口为 7890 (默认)');
      console.log('  - 或修改配置以匹配您的 Clash 端口');
      
      console.log('\n如果外部服务仍然无法访问:');
      console.log('  1. 检查 Clash 是否正常运行');
      console.log('  2. 尝试在浏览器中访问外部网站验证代理');
      console.log('  3. 重启后端服务以应用最新配置');
      console.log('  4. 查看服务器日志中的代理相关信息');
    } else {
      console.log('\n代理未启用。如需访问外部服务,请:');
      console.log('  1. 启动 Clash 或其他代理工具');
      console.log('  2. 在设置页面启用代理');
      console.log('  3. 填写正确的代理地址和端口');
      console.log('  4. 保存配置并重启服务');
    }
    
    return allPass;
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

// 运行测试
testProxyFlow()
  .then(success => {
    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✓ 测试完成');
      process.exit(0);
    } else {
      console.log('✗ 测试发现问题');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试执行错误:', error);
    process.exit(1);
  });

