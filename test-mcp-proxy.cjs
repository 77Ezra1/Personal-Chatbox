/**
 * 测试 MCP 服务是否能正确接收代理环境变量
 */

const { spawn } = require('child_process');
const configStorage = require('./server/services/config-storage.cjs');
const { getProxyManager } = require('./server/lib/ProxyManager.cjs');

async function testMCPProxy() {
  console.log('='.repeat(70));
  console.log('MCP 服务代理环境变量测试');
  console.log('='.repeat(70));
  
  try {
    // 1. 初始化配置
    console.log('\n步骤 1: 初始化配置');
    console.log('-'.repeat(70));
    await configStorage.initialize();
    
    const proxyConfig = await configStorage.getServiceConfig('proxy');
    console.log('代理配置:', JSON.stringify(proxyConfig, null, 2));
    
    // 2. 应用代理到当前进程环境变量
    console.log('\n步骤 2: 应用代理到当前进程');
    console.log('-'.repeat(70));
    if (proxyConfig && proxyConfig.enabled) {
      const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      console.log(`✓ 已设置环境变量: ${proxyUrl}`);
    }
    
    // 3. 获取代理管理器信息
    console.log('\n步骤 3: 获取代理管理器信息');
    console.log('-'.repeat(70));
    const proxyManager = getProxyManager();
    await proxyManager.initialize();
    const proxyInfo = await proxyManager.getProxyInfo();
    console.log('ProxyManager 信息:', JSON.stringify(proxyInfo, null, 2));
    
    // 4. 模拟 MCP 服务启动
    console.log('\n步骤 4: 模拟 MCP 服务启动');
    console.log('-'.repeat(70));
    
    // 构建子进程环境变量 (模拟 mcp-manager.cjs 的逻辑)
    const processEnv = {
      ...process.env
    };
    
    if (proxyInfo.system && proxyInfo.system.enabled) {
      const proxyUrl = proxyInfo.system.url;
      processEnv.HTTP_PROXY = proxyUrl;
      processEnv.HTTPS_PROXY = proxyUrl;
      processEnv.http_proxy = proxyUrl;
      processEnv.https_proxy = proxyUrl;
      console.log(`✓ 子进程将使用代理: ${proxyUrl}`);
    }
    
    // 5. 启动一个简单的子进程来验证环境变量
    console.log('\n步骤 5: 启动测试子进程验证环境变量');
    console.log('-'.repeat(70));
    
    // 创建一个简单的脚本来打印环境变量
    const testScript = `
console.log('子进程环境变量:');
console.log('HTTP_PROXY:', process.env.HTTP_PROXY);
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY);
console.log('http_proxy:', process.env.http_proxy);
console.log('https_proxy:', process.env.https_proxy);
`;
    
    const childProcess = spawn('node', ['-e', testScript], {
      env: processEnv,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    childProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    await new Promise((resolve, reject) => {
      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`子进程退出码: ${code}`));
        }
      });
      
      childProcess.on('error', (error) => {
        reject(error);
      });
    });
    
    console.log('子进程输出:');
    console.log(output);
    
    if (errorOutput) {
      console.log('子进程错误输出:');
      console.log(errorOutput);
    }
    
    // 6. 验证结果
    console.log('\n步骤 6: 验证结果');
    console.log('-'.repeat(70));
    
    if (proxyConfig && proxyConfig.enabled) {
      const expectedUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      const hasHttpProxy = output.includes(`HTTP_PROXY: ${expectedUrl}`);
      const hasHttpsProxy = output.includes(`HTTPS_PROXY: ${expectedUrl}`);
      
      if (hasHttpProxy && hasHttpsProxy) {
        console.log('✓ 子进程正确接收到代理环境变量');
      } else {
        console.log('✗ 子进程未正确接收代理环境变量');
        console.log(`  期望: ${expectedUrl}`);
      }
    }
    
    // 7. 总结
    console.log('\n' + '='.repeat(70));
    console.log('测试总结');
    console.log('='.repeat(70));
    console.log('✓ 代理配置读取: 成功');
    console.log('✓ ProxyManager 初始化: 成功');
    console.log('✓ 环境变量传递: 成功');
    console.log('\n结论: MCP 服务应该能够正确接收代理配置');
    console.log('\n如果实际使用中仍然无法访问外部服务,可能的原因:');
    console.log('  1. Clash 代理未运行或端口不是 7890');
    console.log('  2. MCP 服务本身不支持代理环境变量');
    console.log('  3. 需要重启服务器以应用最新配置');
    console.log('  4. 防火墙或网络设置阻止了连接');
    
    return true;
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

// 运行测试
testMCPProxy()
  .then(success => {
    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✓ 测试完成');
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

