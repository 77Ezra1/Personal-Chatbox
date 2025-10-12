/**
 * 代理配置验证测试脚本
 * 验证代理配置的读取、应用和格式化是否正确
 */

const configStorage = require('./server/services/config-storage.cjs');

async function testProxyConfig() {
  console.log('='.repeat(60));
  console.log('代理配置验证测试');
  console.log('='.repeat(60));
  
  try {
    // 1. 初始化配置存储
    console.log('\n1. 初始化配置存储...');
    await configStorage.initialize();
    console.log('✓ 配置存储初始化成功');
    
    // 2. 读取当前代理配置
    console.log('\n2. 读取当前代理配置...');
    const proxyConfig = configStorage.getServiceConfig('proxy');
    console.log('当前代理配置:');
    console.log(JSON.stringify(proxyConfig, null, 2));
    
    // 3. 验证配置格式
    console.log('\n3. 验证配置格式...');
    const requiredFields = ['enabled', 'protocol', 'host', 'port'];
    const missingFields = requiredFields.filter(field => !(field in proxyConfig));
    
    if (missingFields.length > 0) {
      console.log('✗ 配置格式不完整,缺少字段:', missingFields.join(', '));
      return false;
    }
    console.log('✓ 配置格式完整');
    
    // 4. 验证配置值
    console.log('\n4. 验证配置值...');
    const validations = [];
    
    // 验证 enabled
    if (typeof proxyConfig.enabled !== 'boolean') {
      validations.push('enabled 必须是布尔值');
    }
    
    // 验证 protocol
    const validProtocols = ['http', 'https', 'socks5'];
    if (!validProtocols.includes(proxyConfig.protocol)) {
      validations.push(`protocol 必须是: ${validProtocols.join(', ')}`);
    }
    
    // 验证 host
    if (typeof proxyConfig.host !== 'string' || proxyConfig.host.length === 0) {
      validations.push('host 必须是非空字符串');
    }
    
    // 验证 port
    if (typeof proxyConfig.port !== 'number' || proxyConfig.port < 1 || proxyConfig.port > 65535) {
      validations.push('port 必须是 1-65535 之间的数字');
    }
    
    if (validations.length > 0) {
      console.log('✗ 配置值验证失败:');
      validations.forEach(msg => console.log('  -', msg));
      return false;
    }
    console.log('✓ 配置值验证通过');
    
    // 5. 生成代理 URL
    console.log('\n5. 生成代理 URL...');
    const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
    console.log('代理 URL:', proxyUrl);
    
    // 6. 验证 Clash 默认配置
    console.log('\n6. 验证是否匹配 Clash 默认配置...');
    const clashDefaults = {
      protocol: 'http',
      host: '127.0.0.1',
      port: 7890
    };
    
    const matchesClash = 
      proxyConfig.protocol === clashDefaults.protocol &&
      proxyConfig.host === clashDefaults.host &&
      proxyConfig.port === clashDefaults.port;
    
    if (matchesClash) {
      console.log('✓ 配置匹配 Clash 默认设置');
      console.log('  - 协议: http');
      console.log('  - 主机: 127.0.0.1');
      console.log('  - 端口: 7890');
    } else {
      console.log('⚠ 配置不匹配 Clash 默认设置');
      console.log('  当前配置:', proxyConfig);
      console.log('  Clash 默认:', clashDefaults);
    }
    
    // 7. 测试环境变量设置
    console.log('\n7. 测试环境变量设置...');
    if (proxyConfig.enabled) {
      const httpProxy = proxyUrl;
      const httpsProxy = proxyUrl;
      
      console.log('应设置的环境变量:');
      console.log(`  HTTP_PROXY=${httpProxy}`);
      console.log(`  HTTPS_PROXY=${httpsProxy}`);
      console.log(`  http_proxy=${httpProxy}`);
      console.log(`  https_proxy=${httpsProxy}`);
    } else {
      console.log('代理未启用,不需要设置环境变量');
    }
    
    // 8. 总结
    console.log('\n' + '='.repeat(60));
    console.log('测试结果总结');
    console.log('='.repeat(60));
    console.log('✓ 配置存储: 正常');
    console.log('✓ 配置格式: 正确');
    console.log('✓ 配置值: 有效');
    console.log(`✓ 代理状态: ${proxyConfig.enabled ? '已启用' : '未启用'}`);
    console.log(`✓ 代理地址: ${proxyUrl}`);
    console.log(`✓ Clash 兼容性: ${matchesClash ? '完全兼容' : '需要调整'}`);
    
    return true;
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

// 运行测试
testProxyConfig()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✓ 所有测试通过');
      process.exit(0);
    } else {
      console.log('✗ 测试失败');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试执行错误:', error);
    process.exit(1);
  });

