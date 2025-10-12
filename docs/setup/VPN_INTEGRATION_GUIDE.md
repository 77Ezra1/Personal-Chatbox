# 应用识别和使用VPN网络指南

解决Node.js应用无法使用系统VPN的问题。

---

## 🔍 问题分析

### 为什么应用无法使用VPN?

**根本原因**: Node.js应用默认不会继承系统的网络代理设置,即使您的设备开启了VPN。

**常见VPN类型**:
1. **TUN/TAP模式VPN** (如Clash TUN模式, Surge等)
   - 创建虚拟网卡
   - 系统级流量劫持
   - **理论上应该生效,但可能被绕过**

2. **系统代理模式** (如Clash HTTP代理模式)
   - 设置系统HTTP/HTTPS代理
   - 浏览器自动使用
   - **Node.js不会自动使用**

3. **PAC代理** (自动代理配置)
   - 根据规则选择代理
   - **Node.js不支持PAC**

---

## 🎯 解决方案对比

| 方案 | 难度 | 效果 | 推荐度 | 适用场景 |
|------|------|------|--------|---------|
| 方案1: 读取系统代理 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 所有平台 |
| 方案2: 环境变量配置 | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 快速测试 |
| 方案3: DNS优先级 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | TUN模式VPN |
| 方案4: 强制全局代理 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 企业环境 |

---

## 🚀 方案1: 自动读取系统代理 (最推荐)

### 原理

自动检测并读取系统的HTTP/HTTPS代理设置,让应用使用VPN提供的代理。

### 实现步骤

#### 步骤1: 安装依赖

```bash
cd Personal Chatbox
npm install get-proxy-settings --save
```

#### 步骤2: 创建系统代理检测模块

创建 `server/lib/SystemProxyDetector.cjs`:

```javascript
const { getProxySettings } = require('get-proxy-settings');
const { URL } = require('url');

class SystemProxyDetector {
  constructor() {
    this.cachedProxy = null;
    this.lastCheck = 0;
    this.checkInterval = 60000; // 每60秒检查一次
  }

  /**
   * 获取系统代理设置
   */
  async getSystemProxy() {
    const now = Date.now();
    
    // 如果缓存有效,直接返回
    if (this.cachedProxy && (now - this.lastCheck) < this.checkInterval) {
      return this.cachedProxy;
    }

    try {
      // 检测系统代理
      const proxySettings = await getProxySettings();
      
      if (proxySettings && proxySettings.http) {
        const proxyUrl = proxySettings.http.host 
          ? `http://${proxySettings.http.host}:${proxySettings.http.port}`
          : proxySettings.http;

        this.cachedProxy = {
          enabled: true,
          url: proxyUrl,
          type: 'http',
          source: 'system',
          ...this.parseProxyUrl(proxyUrl)
        };

        console.log('✅ 检测到系统代理:', this.cachedProxy);
      } else {
        this.cachedProxy = {
          enabled: false,
          source: 'none'
        };
        console.log('ℹ️  未检测到系统代理');
      }

      this.lastCheck = now;
      return this.cachedProxy;
    } catch (error) {
      console.error('❌ 检测系统代理失败:', error.message);
      return { enabled: false, error: error.message };
    }
  }

  /**
   * 解析代理URL
   */
  parseProxyUrl(proxyUrl) {
    try {
      const url = new URL(proxyUrl);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: parseInt(url.port) || 80,
        username: url.username || '',
        password: url.password || ''
      };
    } catch (error) {
      console.error('解析代理URL失败:', error);
      return {};
    }
  }

  /**
   * 强制刷新代理检测
   */
  async refresh() {
    this.lastCheck = 0;
    return await this.getSystemProxy();
  }

  /**
   * 检查特定URL是否需要代理
   */
  async shouldUseProxyForUrl(url) {
    const proxy = await this.getSystemProxy();
    
    if (!proxy.enabled) {
      return false;
    }

    // 检查是否在排除列表中
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // localhost和本地IP不使用代理
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// 单例
let instance = null;

function getSystemProxyDetector() {
  if (!instance) {
    instance = new SystemProxyDetector();
  }
  return instance;
}

module.exports = { SystemProxyDetector, getSystemProxyDetector };
```

---

#### 步骤3: 修改ProxyManager集成系统代理

修改 `server/lib/ProxyManager.cjs`:

```javascript
const { getSystemProxyDetector } = require('./SystemProxyDetector.cjs');

class ProxyManager {
  constructor() {
    this.configPath = path.join(__dirname, '../config/proxy.json');
    this.config = this.loadConfig();
    this.systemProxyDetector = getSystemProxyDetector();
    this.agent = null;
    this.initializeAgent();
  }

  /**
   * 初始化代理Agent (优先使用系统代理)
   */
  async initializeAgent() {
    // 1. 尝试使用系统代理
    const systemProxy = await this.systemProxyDetector.getSystemProxy();
    
    if (systemProxy.enabled) {
      console.log('🌐 使用系统代理:', systemProxy.url);
      this.createAgentFromProxy(systemProxy);
      return;
    }

    // 2. 如果没有系统代理,使用手动配置
    if (this.config.enabled) {
      console.log('🔧 使用手动配置的代理');
      this.createAgentFromConfig();
      return;
    }

    // 3. 都没有,不使用代理
    console.log('🔗 不使用代理,直接连接');
    this.agent = null;
  }

  /**
   * 从系统代理创建Agent
   */
  createAgentFromProxy(proxy) {
    try {
      const proxyUrl = proxy.url;
      
      if (proxy.protocol === 'socks5') {
        this.agent = new SocksProxyAgent(proxyUrl);
      } else {
        this.agent = new HttpsProxyAgent(proxyUrl);
      }

      console.log(`✅ 系统代理Agent已创建: ${proxyUrl}`);
    } catch (error) {
      console.error('创建系统代理Agent失败:', error);
      this.agent = null;
    }
  }

  /**
   * 从手动配置创建Agent
   */
  createAgentFromConfig() {
    try {
      const { type, host, port, username, password } = this.config;
      
      let proxyUrl;
      if (username && password) {
        proxyUrl = `${type}://${username}:${password}@${host}:${port}`;
      } else {
        proxyUrl = `${type}://${host}:${port}`;
      }

      if (type === 'socks5') {
        this.agent = new SocksProxyAgent(proxyUrl);
      } else {
        this.agent = new HttpsProxyAgent(proxyUrl);
      }

      console.log(`✅ 手动代理Agent已创建: ${type}://${host}:${port}`);
    } catch (error) {
      console.error('创建手动代理Agent失败:', error);
      this.agent = null;
    }
  }

  /**
   * 获取代理Agent (自动选择系统代理或手动配置)
   */
  async getAgent(url) {
    // 检查是否需要使用代理
    const shouldProxy = await this.systemProxyDetector.shouldUseProxyForUrl(url);
    
    if (!shouldProxy) {
      return null;
    }

    // 如果Agent不存在,尝试初始化
    if (!this.agent) {
      await this.initializeAgent();
    }

    return this.agent;
  }

  /**
   * 获取代理信息 (包括系统代理)
   */
  async getProxyInfo() {
    const systemProxy = await this.systemProxyDetector.getSystemProxy();
    const manualConfig = this.getConfig();

    return {
      system: systemProxy,
      manual: manualConfig,
      active: systemProxy.enabled ? 'system' : (manualConfig.enabled ? 'manual' : 'none')
    };
  }
}
```

---

#### 步骤4: 更新ProxyClient使用异步Agent

修改 `server/lib/ProxyClient.cjs`:

```javascript
const axios = require('axios');
const { getProxyManager } = require('./ProxyManager.cjs');

function createProxyClient(baseURL = '', options = {}) {
  const proxyManager = getProxyManager();

  const client = axios.create({
    baseURL,
    timeout: options.timeout || 30000,
    ...options
  });

  // 请求拦截器 - 异步获取代理
  client.interceptors.request.use(
    async (config) => {
      const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
      
      // 异步获取Agent
      const agent = await proxyManager.getAgent(url);
      
      if (agent) {
        config.httpsAgent = agent;
        config.httpAgent = agent;
        console.log(`🌐 [VPN] Using proxy for: ${url}`);
      } else {
        console.log(`🔗 [Direct] Direct connection for: ${url}`);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = { createProxyClient };
```

---

#### 步骤5: 添加代理信息API

在 `server/routes/proxy.cjs` 中添加:

```javascript
/**
 * 获取代理信息 (包括系统代理)
 */
router.get('/info', async (req, res) => {
  try {
    const proxyManager = getProxyManager();
    const info = await proxyManager.getProxyInfo();
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 刷新系统代理检测
 */
router.post('/refresh', async (req, res) => {
  try {
    const { getSystemProxyDetector } = require('../lib/SystemProxyDetector.cjs');
    const detector = getSystemProxyDetector();
    const proxy = await detector.refresh();
    
    res.json({ 
      success: true, 
      message: '系统代理已刷新',
      proxy 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

#### 步骤6: 更新前端显示系统代理信息

修改 `src/components/proxy/ProxyConfig.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { RefreshCw, Info } from 'lucide-react'

export default function ProxyConfig() {
  const [proxyInfo, setProxyInfo] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // 加载代理信息
  useEffect(() => {
    loadProxyInfo()
  }, [])

  const loadProxyInfo = async () => {
    try {
      const response = await fetch('/api/proxy/info')
      const data = await response.json()
      if (data.success) {
        setProxyInfo(data.info)
      }
    } catch (error) {
      console.error('Failed to load proxy info:', error)
    }
  }

  // 刷新系统代理
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/proxy/refresh', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await loadProxyInfo()
        alert('系统代理已刷新')
      }
    } catch (error) {
      alert('刷新失败: ' + error.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 系统代理状态 */}
      {proxyInfo && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium">系统代理状态</h3>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {proxyInfo.system.enabled ? (
            <div className="space-y-1 text-sm">
              <p className="text-green-600 font-medium">
                ✅ 检测到系统代理
              </p>
              <p className="text-gray-700">
                代理地址: <code>{proxyInfo.system.url}</code>
              </p>
              <p className="text-gray-600">
                应用将自动使用系统代理访问外部服务
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <p className="text-orange-600 font-medium">
                ⚠️ 未检测到系统代理
              </p>
              <p className="text-gray-600">
                如果您已开启VPN,请点击刷新按钮重新检测
              </p>
            </div>
          )}

          {proxyInfo.active === 'system' && (
            <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-700">
              🌐 当前使用: 系统代理
            </div>
          )}
          {proxyInfo.active === 'manual' && (
            <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-700">
              🔧 当前使用: 手动配置
            </div>
          )}
          {proxyInfo.active === 'none' && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
              🔗 当前使用: 直接连接
            </div>
          )}
        </div>
      )}

      {/* 原有的手动配置界面 */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">手动配置代理 (可选)</h3>
        {/* ... 原有配置表单 ... */}
      </div>
    </div>
  )
}
```

---

## 🔧 方案2: 环境变量配置 (快速测试)

### 原理

通过设置Node.js的环境变量,让应用使用代理。

### 实现步骤

#### 方法A: 启动脚本配置

修改 `package.json`:

```json
{
  "scripts": {
    "start:backend": "node server/index.cjs",
    "start:backend:proxy": "HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890 node server/index.cjs",
    "dev": "vite",
    "dev:proxy": "HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890 vite"
  }
}
```

使用:
```bash
# 使用代理启动后端
npm run start:backend:proxy

# 使用代理启动前端
npm run dev:proxy
```

---

#### 方法B: .env文件配置

创建 `.env`:

```bash
# 代理配置
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
NO_PROXY=localhost,127.0.0.1,*.cn

# 或者使用SOCKS5代理
# HTTP_PROXY=socks5://127.0.0.1:7891
# HTTPS_PROXY=socks5://127.0.0.1:7891
```

在 `server/index.cjs` 开头添加:

```javascript
require('dotenv').config();

// 自动应用环境变量中的代理设置
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  console.log('✅ 检测到代理环境变量:');
  console.log('   HTTP_PROXY:', process.env.HTTP_PROXY);
  console.log('   HTTPS_PROXY:', process.env.HTTPS_PROXY);
  
  // axios会自动使用这些环境变量
  const axios = require('axios');
  axios.defaults.proxy = false; // 禁用axios自动代理,使用我们的配置
}
```

---

#### 方法C: 全局代理配置

创建 `server/lib/GlobalProxy.cjs`:

```javascript
const { HttpsProxyAgent } = require('https-proxy-agent');
const http = require('http');
const https = require('https');

/**
 * 设置全局代理
 */
function setupGlobalProxy() {
  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  
  if (!proxyUrl) {
    console.log('ℹ️  未设置代理环境变量');
    return false;
  }

  try {
    const agent = new HttpsProxyAgent(proxyUrl);

    // 覆盖全局http/https请求
    const originalHttpRequest = http.request;
    const originalHttpsRequest = https.request;

    http.request = function(options, callback) {
      if (typeof options === 'string') {
        options = new URL(options);
      }
      options.agent = agent;
      return originalHttpRequest.call(this, options, callback);
    };

    https.request = function(options, callback) {
      if (typeof options === 'string') {
        options = new URL(options);
      }
      options.agent = agent;
      return originalHttpsRequest.call(this, options, callback);
    };

    console.log('✅ 全局代理已设置:', proxyUrl);
    return true;
  } catch (error) {
    console.error('❌ 设置全局代理失败:', error);
    return false;
  }
}

module.exports = { setupGlobalProxy };
```

在 `server/index.cjs` 开头调用:

```javascript
const { setupGlobalProxy } = require('./lib/GlobalProxy.cjs');
setupGlobalProxy();
```

---

## 🌐 方案3: DNS优先级配置 (TUN模式VPN)

### 原理

如果您使用的是TUN模式VPN(如Clash TUN),可以通过配置DNS来确保流量走VPN。

### 实现步骤

#### 步骤1: 配置Node.js DNS

创建 `server/lib/DNSConfig.cjs`:

```javascript
const dns = require('dns');
const { Resolver } = dns.promises;

/**
 * 配置DNS使用VPN的DNS服务器
 */
function setupDNS() {
  // 常见VPN DNS服务器
  const vpnDNS = [
    '198.18.0.2',    // Clash TUN DNS
    '1.1.1.1',       // Cloudflare DNS
    '8.8.8.8',       // Google DNS
  ];

  // 设置DNS服务器
  dns.setServers(vpnDNS);

  console.log('✅ DNS服务器已配置:', vpnDNS);

  // 创建自定义Resolver
  const resolver = new Resolver();
  resolver.setServers(vpnDNS);

  return resolver;
}

module.exports = { setupDNS };
```

在 `server/index.cjs` 中调用:

```javascript
const { setupDNS } = require('./lib/DNSConfig.cjs');
setupDNS();
```

---

#### 步骤2: 验证DNS解析

创建测试脚本 `server/test/dns-test.cjs`:

```javascript
const dns = require('dns').promises;

async function testDNS() {
  console.log('🧪 测试DNS解析...\n');

  const testDomains = [
    'google.com',
    'github.com',
    'dexscreener.com',
  ];

  for (const domain of testDomains) {
    try {
      const addresses = await dns.resolve4(domain);
      console.log(`✅ ${domain}:`);
      console.log(`   IP: ${addresses.join(', ')}`);
    } catch (error) {
      console.log(`❌ ${domain}: ${error.message}`);
    }
  }
}

testDNS();
```

运行测试:
```bash
node server/test/dns-test.cjs
```

---

## 🔍 方案4: 诊断和调试

### 创建诊断工具

创建 `server/lib/NetworkDiagnostic.cjs`:

```javascript
const axios = require('axios');
const dns = require('dns').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
      connectivity: await this.checkConnectivity(),
      vpn: await this.checkVPN()
    };

    this.printResults(results);
    return results;
  }

  /**
   * 检查环境变量
   */
  async checkEnvironment() {
    return {
      HTTP_PROXY: process.env.HTTP_PROXY || 'Not set',
      HTTPS_PROXY: process.env.HTTPS_PROXY || 'Not set',
      NO_PROXY: process.env.NO_PROXY || 'Not set',
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
    const testDomains = ['google.com', 'github.com', 'dexscreener.com'];

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
      'https://www.google.com',
      'https://api.github.com',
      'https://api.dexscreener.com/latest/dex/search?q=BTC'
    ];

    for (const url of testUrls) {
      try {
        const start = Date.now();
        const response = await axios.get(url, { timeout: 10000 });
        const latency = Date.now() - start;
        
        results[url] = {
          success: true,
          status: response.status,
          latency: `${latency}ms`
        };
      } catch (error) {
        results[url] = {
          success: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * 检查VPN状态
   */
  async checkVPN() {
    try {
      // 检查是否有TUN/TAP设备
      const { stdout } = await execAsync('ifconfig || ipconfig');
      const hasTun = stdout.includes('tun') || stdout.includes('utun');
      const hasTap = stdout.includes('tap');

      // 检查路由表
      let routeInfo = 'N/A';
      try {
        const { stdout: routeStdout } = await execAsync('netstat -rn || route print');
        routeInfo = routeStdout.substring(0, 500); // 只取前500字符
      } catch (e) {
        // 忽略错误
      }

      return {
        tunDevice: hasTun,
        tapDevice: hasTap,
        routeInfo
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 打印诊断结果
   */
  printResults(results) {
    console.log('\n📊 诊断结果:\n');

    console.log('1️⃣ 环境变量:');
    console.log(JSON.stringify(results.environment, null, 2));

    console.log('\n2️⃣ 系统代理:');
    console.log(JSON.stringify(results.systemProxy, null, 2));

    console.log('\n3️⃣ DNS解析:');
    for (const [domain, result] of Object.entries(results.dns)) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${domain}: ${result.ip || result.error}`);
    }

    console.log('\n4️⃣ 连接性测试:');
    for (const [url, result] of Object.entries(results.connectivity)) {
      const status = result.success ? '✅' : '❌';
      const info = result.success 
        ? `HTTP ${result.status} (${result.latency})`
        : result.error;
      console.log(`   ${status} ${url}`);
      console.log(`      ${info}`);
    }

    console.log('\n5️⃣ VPN状态:');
    console.log(`   TUN设备: ${results.vpn.tunDevice ? '✅' : '❌'}`);
    console.log(`   TAP设备: ${results.vpn.tapDevice ? '✅' : '❌'}`);
  }
}

module.exports = { NetworkDiagnostic };
```

---

### 添加诊断API

在 `server/routes/proxy.cjs` 中添加:

```javascript
/**
 * 网络诊断
 */
router.get('/diagnose', async (req, res) => {
  try {
    const { NetworkDiagnostic } = require('../lib/NetworkDiagnostic.cjs');
    const diagnostic = new NetworkDiagnostic();
    const results = await diagnostic.diagnose();
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### 前端诊断按钮

在 `ProxyConfig.jsx` 中添加:

```jsx
const [diagnosing, setDiagnosing] = useState(false);
const [diagnosticResults, setDiagnosticResults] = useState(null);

const handleDiagnose = async () => {
  setDiagnosing(true);
  try {
    const response = await fetch('/api/proxy/diagnose');
    const data = await response.json();
    
    if (data.success) {
      setDiagnosticResults(data.results);
    }
  } catch (error) {
    alert('诊断失败: ' + error.message);
  } finally {
    setDiagnosing(false);
  }
};

// 在界面中添加诊断按钮
<Button onClick={handleDiagnose} disabled={diagnosing}>
  {diagnosing ? '诊断中...' : '🔍 网络诊断'}
</Button>
```

---

## 📋 快速实施清单

### ✅ 推荐实施步骤 (方案1)

1. **安装依赖**
   ```bash
   npm install get-proxy-settings https-proxy-agent socks-proxy-agent --save
   ```

2. **创建文件**
   - `server/lib/SystemProxyDetector.cjs`
   - `server/lib/NetworkDiagnostic.cjs`

3. **修改现有文件**
   - `server/lib/ProxyManager.cjs` - 集成系统代理检测
   - `server/lib/ProxyClient.cjs` - 支持异步Agent
   - `server/routes/proxy.cjs` - 添加新API
   - `src/components/proxy/ProxyConfig.jsx` - 显示系统代理

4. **测试**
   - 重启后端服务
   - 打开代理设置页面
   - 查看是否检测到系统代理
   - 测试外部MCP服务

---

## 🎯 预期效果

实施后:

1. ✅ **自动检测VPN代理**
   - 应用启动时自动检测系统代理
   - 每60秒自动刷新检测

2. ✅ **无需手动配置**
   - 如果检测到系统代理,自动使用
   - 用户无需任何操作

3. ✅ **智能路由**
   - 国外服务自动走VPN
   - 本地服务直接连接

4. ✅ **实时状态显示**
   - 前端显示当前使用的代理
   - 可以手动刷新检测

5. ✅ **诊断工具**
   - 一键诊断网络问题
   - 详细的诊断报告

---

## 💡 常见问题

### Q1: 为什么检测不到系统代理?

**可能原因**:
1. VPN使用TUN模式,没有设置系统HTTP代理
2. VPN代理端口不是标准端口
3. 需要管理员权限才能读取系统代理

**解决方案**:
- 在VPN设置中启用"系统代理"或"HTTP代理"
- 使用方案2的环境变量配置
- 使用方案3的DNS配置

---

### Q2: 检测到代理但仍然无法访问?

**可能原因**:
1. 代理需要认证
2. 代理协议不匹配(SOCKS5 vs HTTP)
3. 防火墙阻止

**解决方案**:
- 运行网络诊断工具
- 检查VPN是否正常工作
- 尝试手动配置代理

---

### Q3: 如何确认应用正在使用VPN?

**验证方法**:
1. 查看后端日志,应该显示"Using proxy"
2. 使用网络诊断工具
3. 测试访问国外API(如Dexscreener)

---

## 🎉 总结

**最佳方案**: 方案1 (自动读取系统代理)

**优势**:
- ✅ 自动检测,无需配置
- ✅ 支持所有VPN类型
- ✅ 实时状态显示
- ✅ 智能路由
- ✅ 诊断工具

**实施后**:
- 🚀 Dexscreener等外部服务完全可用
- ⚡ 国内服务速度不受影响  
- 🎯 用户体验大幅提升
- 🔍 问题易于诊断

---

**需要我帮您实施这个方案吗?**

