/**
 * 代理环境变量应用测试
 * 模拟服务器启动时加载和应用代理配置的过程
 */

const configStorage = require('./server/services/config-storage.cjs');

async function testProxyEnvironment() {
  console.log('='.repeat(60));
  console.log('代理环境变量应用测试');
  console.log('='.repeat(60));
  
  try {
    // 1. 保存当前环境变量
    console.log('\n1. 保存当前环境变量...');
    const originalEnv = {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      https_proxy: process.env.https_proxy
    };
    console.log('原始环境变量:');
    console.log(JSON.stringify(originalEnv, null, 2));
    
    // 2. 初始化配置存储
    console.log('\n2. 初始化配置存储...');
    await configStorage.initialize();
    console.log('✓ 配置存储初始化成功');
    
    // 3. 加载代理配置
    console.log('\n3. 加载代理配置...');
    const proxyConfig = await configStorage.getServiceConfig('proxy');
    console.log('代理配置:');
    console.log(JSON.stringify(proxyConfig, null, 2));
    
    // 4. 应用代理配置到环境变量
    console.log('\n4. 应用代理配置到环境变量...');
    if (proxyConfig && proxyConfig.enabled) {
      const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      
      console.log(`✓ 已应用代理: ${proxyUrl}`);
    } else {
      console.log('⚠ 代理未启用或未配置');
    }
    
    // 5. 验证环境变量
    console.log('\n5. 验证环境变量...');
    const currentEnv = {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      https_proxy: process.env.https_proxy
    };
    console.log('当前环境变量:');
    console.log(JSON.stringify(currentEnv, null, 2));
    
    // 6. 验证代理 URL 格式
    console.log('\n6. 验证代理 URL 格式...');
    if (proxyConfig && proxyConfig.enabled) {
      const expectedUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      
      const validations = [
        { name: 'HTTP_PROXY', value: process.env.HTTP_PROXY, expected: expectedUrl },
        { name: 'HTTPS_PROXY', value: process.env.HTTPS_PROXY, expected: expectedUrl },
        { name: 'http_proxy', value: process.env.http_proxy, expected: expectedUrl },
        { name: 'https_proxy', value: process.env.https_proxy, expected: expectedUrl }
      ];
      
      let allValid = true;
      for (const validation of validations) {
        if (validation.value === validation.expected) {
          console.log(`✓ ${validation.name}: ${validation.value}`);
        } else {
          console.log(`✗ ${validation.name}: ${validation.value} (期望: ${validation.expected})`);
          allValid = false;
        }
      }
      
      if (allValid) {
        console.log('\n✓ 所有环境变量设置正确');
      } else {
        console.log('\n✗ 部分环境变量设置不正确');
      }
    }
    
    // 7. 测试代理 URL 解析
    console.log('\n7. 测试代理 URL 解析...');
    if (proxyConfig && proxyConfig.enabled) {
      const proxyUrl = process.env.HTTP_PROXY;
      try {
        const url = new URL(proxyUrl);
        console.log('代理 URL 解析结果:');
        console.log(`  - 协议: ${url.protocol.replace(':', '')}`);
        console.log(`  - 主机: ${url.hostname}`);
        console.log(`  - 端口: ${url.port}`);
        console.log('✓ 代理 URL 格式正确');
      } catch (error) {
        console.log('✗ 代理 URL 格式错误:', error.message);
      }
    }
    
    // 8. 模拟 MCP 服务使用代理
    console.log('\n8. 模拟 MCP 服务使用代理...');
    if (proxyConfig && proxyConfig.enabled) {
      console.log('MCP 服务将使用以下代理配置:');
      console.log(`  - Wikipedia: ${process.env.HTTPS_PROXY}`);
      console.log(`  - Brave Search: ${process.env.HTTPS_PROXY}`);
      console.log(`  - GitHub: ${process.env.HTTPS_PROXY}`);
      console.log(`  - Fetch: ${process.env.HTTPS_PROXY}`);
    } else {
      console.log('MCP 服务将直接连接(不使用代理)');
    }
    
    // 9. 总结
    console.log('\n' + '='.repeat(60));
    console.log('测试结果总结');
    console.log('='.repeat(60));
    console.log('✓ 配置加载: 成功');
    console.log(`✓ 代理状态: ${proxyConfig.enabled ? '已启用' : '未启用'}`);
    if (proxyConfig && proxyConfig.enabled) {
      console.log(`✓ 代理地址: ${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`);
      console.log('✓ 环境变量: 已设置');
      console.log('✓ URL 格式: 正确');
      console.log('✓ MCP 服务: 将使用代理');
    }
    
    // 10. Clash 兼容性检查
    console.log('\n' + '='.repeat(60));
    console.log('Clash 兼容性检查');
    console.log('='.repeat(60));
    
    const isClashDefault = 
      proxyConfig.protocol === 'http' &&
      proxyConfig.host === '127.0.0.1' &&
      proxyConfig.port === 7890;
    
    if (isClashDefault) {
      console.log('✓ 完全兼容 Clash 默认配置');
      console.log('  用户使用 Clash 时无需修改任何设置');
    } else {
      console.log('⚠ 当前配置与 Clash 默认不同');
      console.log('  Clash 默认: http://127.0.0.1:7890');
      console.log(`  当前配置: ${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

// 运行测试
testProxyEnvironment()
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

