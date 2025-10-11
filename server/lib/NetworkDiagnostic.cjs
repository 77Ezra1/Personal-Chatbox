const axios = require('axios');
const dns = require('dns').promises;

/**
 * 网络诊断工具
 * 用于诊断代理和网络连接问题
 */
class NetworkDiagnostic {
  /**
   * 完整的网络诊断
   */
  async diagnose() {
    console.log('🔍 开始网络诊断...\n');

    const results = {
      environment: await this.checkEnvironment(),
      systemProxy: await this.checkSystemProxy(),
      dns: await this.checkDNS(),
      connectivity: await this.checkConnectivity()
    };

    this.printResults(results);
    return results;
  }

  /**
   * 检查环境变量
   */
  async checkEnvironment() {
    return {
      HTTP_PROXY: process.env.HTTP_PROXY || process.env.http_proxy || 'Not set',
      HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy || 'Not set',
      NO_PROXY: process.env.NO_PROXY || process.env.no_proxy || 'Not set',
      NODE_VERSION: process.version
    };
  }

  /**
   * 检查系统代理
   */
  async checkSystemProxy() {
    try {
      const { getSystemProxyDetector } = require('./SystemProxyDetector.cjs');
      const detector = getSystemProxyDetector();
      return await detector.getSystemProxy();
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 检查DNS
   */
  async checkDNS() {
    const results = {};
    const testDomains = ['google.com', 'github.com', 'baidu.com'];

    for (const domain of testDomains) {
      try {
        const addresses = await dns.resolve4(domain);
        results[domain] = { success: true, ip: addresses[0] };
      } catch (error) {
        results[domain] = { success: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * 检查连接性
   */
  async checkConnectivity() {
    const results = {};
    const testUrls = [
      { url: 'https://www.baidu.com', name: '百度 (国内)' },
      { url: 'https://www.google.com', name: 'Google (国外)' },
      { url: 'https://api.github.com', name: 'GitHub API (国外)' }
    ];

    for (const test of testUrls) {
      try {
        const start = Date.now();
        const response = await axios.get(test.url, { 
          timeout: 10000,
          validateStatus: () => true // 接受所有状态码
        });
        const latency = Date.now() - start;
        
        results[test.name] = {
          success: response.status < 400,
          status: response.status,
          latency: `${latency}ms`,
          url: test.url
        };
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
          url: test.url
        };
      }
    }

    return results;
  }

  /**
   * 打印诊断结果
   */
  printResults(results) {
    console.log('\n📊 诊断结果:\n');

    console.log('1️⃣ 环境变量:');
    console.log(JSON.stringify(results.environment, null, 2));

    console.log('\n2️⃣ 系统代理:');
    if (results.systemProxy.enabled) {
      console.log(`   ✅ 已启用: ${results.systemProxy.url}`);
      console.log(`   来源: ${results.systemProxy.source}`);
    } else {
      console.log('   ❌ 未检测到代理');
    }

    console.log('\n3️⃣ DNS解析:');
    for (const [domain, result] of Object.entries(results.dns)) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${domain}: ${result.ip || result.error}`);
    }

    console.log('\n4️⃣ 连接性测试:');
    for (const [name, result] of Object.entries(results.connectivity)) {
      const status = result.success ? '✅' : '❌';
      const info = result.success 
        ? `HTTP ${result.status} (${result.latency})`
        : result.error;
      console.log(`   ${status} ${name}`);
      console.log(`      ${info}`);
    }

    console.log('\n');
  }
}

module.exports = { NetworkDiagnostic };

