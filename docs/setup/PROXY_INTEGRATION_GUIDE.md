# 应用内代理网络集成方案

为Personal Chatbox集成代理网络,使MCP服务能够访问国外API。

---

## 📋 目录

1. [方案对比](#方案对比)
2. [推荐方案](#推荐方案)
3. [实现步骤](#实现步骤)
4. [配置界面](#配置界面)
5. [安全考虑](#安全考虑)
6. [测试验证](#测试验证)

---

## 🎯 方案对比

### 方案1: HTTP/HTTPS代理 (推荐⭐⭐⭐⭐⭐)

**原理**: 通过HTTP代理转发所有外部请求

**优点**:
- ✅ 实现简单
- ✅ 兼容性好
- ✅ 支持所有HTTP/HTTPS请求
- ✅ 可以使用现有的代理服务(Clash, V2Ray等)

**缺点**:
- ⚠️ 需要用户提供代理地址
- ⚠️ 只支持HTTP协议

**适用场景**: 
- 用户已有代理服务
- 需要快速实现

---

### 方案2: SOCKS5代理 (推荐⭐⭐⭐⭐)

**原理**: 通过SOCKS5协议转发所有网络请求

**优点**:
- ✅ 支持所有协议(HTTP, HTTPS, WebSocket等)
- ✅ 性能更好
- ✅ 更底层的代理方式

**缺点**:
- ⚠️ 需要额外的依赖库
- ⚠️ 配置稍复杂

**适用场景**:
- 需要代理WebSocket连接
- 对性能要求高

---

### 方案3: 内置代理服务 (推荐⭐⭐⭐)

**原理**: 在应用内集成完整的代理客户端

**优点**:
- ✅ 用户体验最好
- ✅ 无需外部配置
- ✅ 可以提供订阅管理

**缺点**:
- ❌ 实现复杂
- ❌ 需要维护代理节点
- ❌ 可能涉及法律风险

**适用场景**:
- 商业产品
- 有专业团队维护

---

### 方案4: 智能路由 (推荐⭐⭐⭐⭐⭐)

**原理**: 根据目标域名自动选择是否使用代理

**优点**:
- ✅ 国内服务直连,速度快
- ✅ 国外服务走代理
- ✅ 节省代理流量
- ✅ 用户体验最佳

**缺点**:
- ⚠️ 需要维护域名规则
- ⚠️ 实现稍复杂

**适用场景**:
- 混合使用国内外服务
- 追求最佳性能

---

## 🚀 推荐方案: HTTP代理 + 智能路由

结合方案1和方案4,实现最佳的用户体验。

### 架构设计

```
┌─────────────────────────────────────────────────┐
│                  前端 (React)                    │
│  - 代理配置界面                                   │
│  - 代理状态显示                                   │
│  - 测试连接功能                                   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              后端 (Node.js)                      │
│  ┌──────────────────────────────────────────┐  │
│  │        代理管理模块 (ProxyManager)        │  │
│  │  - 代理配置存储                           │  │
│  │  - 代理健康检查                           │  │
│  │  - 智能路由规则                           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │      HTTP客户端包装器 (ProxyClient)       │  │
│  │  - axios实例配置                          │  │
│  │  - 自动应用代理                           │  │
│  │  - 请求重试机制                           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         MCP服务 (使用ProxyClient)         │  │
│  │  - Dexscreener                            │  │
│  │  - Playwright                             │  │
│  │  - 其他需要代理的服务                      │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│ 国内  │    │ 代理  │    │ 国外  │
│ API   │    │ 服务  │    │ API   │
└───────┘    └───┬───┘    └───────┘
                 │
            ┌────▼────┐
            │  国外   │
            │  API    │
            └─────────┘
```

---

## 🔧 实现步骤

### 步骤1: 创建代理管理模块

创建 `server/lib/ProxyManager.cjs`:

```javascript
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyManager {
  constructor() {
    this.configPath = path.join(__dirname, '../config/proxy.json');
    this.config = this.loadConfig();
    this.agent = null;
    this.initializeAgent();
  }

  /**
   * 加载代理配置
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load proxy config:', error);
    }

    // 默认配置
    return {
      enabled: false,
      type: 'http', // 'http', 'https', 'socks5'
      host: '127.0.0.1',
      port: 7890,
      username: '',
      password: '',
      bypassDomains: [
        // 国内域名,不使用代理
        '*.cn',
        '*.com.cn',
        'localhost',
        '127.0.0.1',
        'baidu.com',
        'qq.com',
        'taobao.com',
        'aliyun.com',
        'bilibili.com',
        'douyin.com',
        'weibo.com',
      ],
      proxyDomains: [
        // 需要代理的域名
        'dexscreener.com',
        'github.com',
        'googleapis.com',
        'cloudflare.com',
      ]
    };
  }

  /**
   * 保存代理配置
   */
  saveConfig(config) {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.config = config;
      this.initializeAgent();
      return true;
    } catch (error) {
      console.error('Failed to save proxy config:', error);
      return false;
    }
  }

  /**
   * 初始化代理Agent
   */
  initializeAgent() {
    if (!this.config.enabled) {
      this.agent = null;
      return;
    }

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

      console.log(`✅ Proxy agent initialized: ${type}://${host}:${port}`);
    } catch (error) {
      console.error('Failed to initialize proxy agent:', error);
      this.agent = null;
    }
  }

  /**
   * 判断是否需要使用代理
   */
  shouldUseProxy(url) {
    if (!this.config.enabled || !this.agent) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // 检查是否在绕过列表中
      for (const pattern of this.config.bypassDomains) {
        if (this.matchDomain(hostname, pattern)) {
          return false;
        }
      }

      // 检查是否在代理列表中
      for (const pattern of this.config.proxyDomains) {
        if (this.matchDomain(hostname, pattern)) {
          return true;
        }
      }

      // 默认不使用代理
      return false;
    } catch (error) {
      console.error('Error checking proxy:', error);
      return false;
    }
  }

  /**
   * 域名匹配
   */
  matchDomain(hostname, pattern) {
    // 精确匹配
    if (hostname === pattern) {
      return true;
    }

    // 通配符匹配
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return hostname.endsWith(suffix) || hostname === suffix;
    }

    // 包含匹配
    return hostname.includes(pattern);
  }

  /**
   * 获取代理Agent
   */
  getAgent(url) {
    if (this.shouldUseProxy(url)) {
      return this.agent;
    }
    return null;
  }

  /**
   * 测试代理连接
   */
  async testProxy() {
    if (!this.config.enabled) {
      return {
        success: false,
        message: '代理未启用'
      };
    }

    try {
      const testUrl = 'https://www.google.com';
      const response = await axios.get(testUrl, {
        httpsAgent: this.agent,
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        return {
          success: true,
          message: '代理连接成功',
          latency: response.headers['x-response-time'] || 'N/A'
        };
      } else {
        return {
          success: false,
          message: `代理连接失败: HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `代理连接失败: ${error.message}`
      };
    }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    // 不返回密码
    const config = { ...this.config };
    if (config.password) {
      config.password = '******';
    }
    return config;
  }
}

// 单例模式
let instance = null;

function getProxyManager() {
  if (!instance) {
    instance = new ProxyManager();
  }
  return instance;
}

module.exports = { ProxyManager, getProxyManager };
```

---

### 步骤2: 创建HTTP客户端包装器

创建 `server/lib/ProxyClient.cjs`:

```javascript
const axios = require('axios');
const { getProxyManager } = require('./ProxyManager.cjs');

/**
 * 创建支持代理的axios实例
 */
function createProxyClient(baseURL = '', options = {}) {
  const proxyManager = getProxyManager();

  const client = axios.create({
    baseURL,
    timeout: options.timeout || 30000,
    ...options
  });

  // 请求拦截器 - 自动应用代理
  client.interceptors.request.use(
    (config) => {
      const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
      const agent = proxyManager.getAgent(url);
      
      if (agent) {
        config.httpsAgent = agent;
        config.httpAgent = agent;
        console.log(`🌐 Using proxy for: ${url}`);
      } else {
        console.log(`🔗 Direct connection for: ${url}`);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 错误处理和重试
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const config = error.config;

      // 如果没有重试配置,添加默认值
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }

      const maxRetries = options.maxRetries || 3;

      // 如果重试次数未达到上限,进行重试
      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        console.log(`🔄 Retrying request (${config.__retryCount}/${maxRetries}): ${config.url}`);
        
        // 延迟重试
        await new Promise(resolve => setTimeout(resolve, 1000 * config.__retryCount));
        
        return client(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = { createProxyClient };
```

---

### 步骤3: 修改MCP服务使用代理

修改 `server/services/dexscreener.cjs`:

```javascript
const { createProxyClient } = require('../lib/ProxyClient.cjs');

class DexscreenerService extends BaseService {
  constructor() {
    super('dexscreener', 'Dexscreener加密货币', '获取实时加密货币价格和市场数据');
    
    // 使用支持代理的客户端
    this.client = createProxyClient('https://api.dexscreener.com/latest', {
      timeout: 15000,
      maxRetries: 3
    });
  }

  async searchToken(query) {
    try {
      const response = await this.client.get(`/dex/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Dexscreener search error:', error.message);
      throw new Error(`搜索失败: ${error.message}`);
    }
  }

  // ... 其他方法
}
```

---

### 步骤4: 添加代理配置API

在 `server/routes/proxy.cjs` 中添加:

```javascript
const express = require('express');
const router = express.Router();
const { getProxyManager } = require('../lib/ProxyManager.cjs');

/**
 * 获取代理配置
 */
router.get('/config', (req, res) => {
  try {
    const proxyManager = getProxyManager();
    const config = proxyManager.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 更新代理配置
 */
router.post('/config', (req, res) => {
  try {
    const proxyManager = getProxyManager();
    const success = proxyManager.saveConfig(req.body);
    
    if (success) {
      res.json({ success: true, message: '代理配置已保存' });
    } else {
      res.status(500).json({ success: false, error: '保存失败' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 测试代理连接
 */
router.post('/test', async (req, res) => {
  try {
    const proxyManager = getProxyManager();
    const result = await proxyManager.testProxy();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 启用/禁用代理
 */
router.post('/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const proxyManager = getProxyManager();
    const config = proxyManager.getConfig();
    config.enabled = enabled;
    proxyManager.saveConfig(config);
    
    res.json({ 
      success: true, 
      message: enabled ? '代理已启用' : '代理已禁用',
      enabled 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

在 `server/index.cjs` 中注册路由:

```javascript
const proxyRoutes = require('./routes/proxy.cjs');
app.use('/api/proxy', proxyRoutes);
```

---

### 步骤5: 创建前端代理配置界面

创建 `src/components/proxy/ProxyConfig.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { Settings, Wifi, WifiOff, CheckCircle, XCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProxyConfig() {
  const [config, setConfig] = useState({
    enabled: false,
    type: 'http',
    host: '127.0.0.1',
    port: 7890,
    username: '',
    password: ''
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/proxy/config')
      const data = await response.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to load proxy config:', error)
    }
  }

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      
      if (data.success) {
        alert('代理配置已保存')
      } else {
        alert('保存失败: ' + data.error)
      }
    } catch (error) {
      alert('保存失败: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // 测试连接
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: '测试失败: ' + error.message
      })
    } finally {
      setTesting(false)
    }
  }

  // 切换启用状态
  const handleToggle = async (enabled) => {
    try {
      const response = await fetch('/api/proxy/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const data = await response.json()
      
      if (data.success) {
        setConfig({ ...config, enabled })
      }
    } catch (error) {
      console.error('Failed to toggle proxy:', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-semibold">代理设置</h2>
            <p className="text-sm text-gray-600">
              配置代理服务器以访问国外API
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {config.enabled ? '已启用' : '已禁用'}
          </span>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      {/* 代理类型 */}
      <div className="space-y-2">
        <Label>代理类型</Label>
        <Select
          value={config.type}
          onChange={(e) => setConfig({ ...config, type: e.target.value })}
        >
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="socks5">SOCKS5</option>
        </Select>
      </div>

      {/* 代理地址 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>主机地址</Label>
          <Input
            type="text"
            placeholder="127.0.0.1"
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>端口</Label>
          <Input
            type="number"
            placeholder="7890"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {/* 认证信息 (可选) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>用户名 (可选)</Label>
          <Input
            type="text"
            placeholder="username"
            value={config.username}
            onChange={(e) => setConfig({ ...config, username: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>密码 (可选)</Label>
          <Input
            type="password"
            placeholder="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
          />
        </div>
      </div>

      {/* 测试结果 */}
      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button onClick={handleTest} disabled={testing || !config.enabled}>
          {testing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 mr-2" />
              测试连接
            </>
          )}
        </Button>
        
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '保存配置'
          )}
        </Button>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">💡 使用说明</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 如果您使用Clash,代理地址通常是 <code>127.0.0.1:7890</code></li>
          <li>• 如果您使用V2Ray,代理地址通常是 <code>127.0.0.1:10808</code></li>
          <li>• 启用代理后,Dexscreener等国外服务将自动通过代理访问</li>
          <li>• 国内服务(如天气、时间)会自动直连,不使用代理</li>
          <li>• 建议先测试连接,确保代理可用后再保存</li>
        </ul>
      </div>
    </div>
  )
}
```

---

### 步骤6: 将代理配置添加到设置页面

修改 `src/components/settings/SettingsPage.jsx`:

```jsx
import ProxyConfig from '@/components/proxy/ProxyConfig'

// 在设置标签中添加
<Tabs.List>
  <Tabs.Trigger value="model">模型配置</Tabs.Trigger>
  <Tabs.Trigger value="prompt">System Prompt</Tabs.Trigger>
  <Tabs.Trigger value="mcp">MCP Services</Tabs.Trigger>
  <Tabs.Trigger value="proxy">代理设置</Tabs.Trigger> {/* 新增 */}
  <Tabs.Trigger value="appearance">外观</Tabs.Trigger>
  <Tabs.Trigger value="language">语言</Tabs.Trigger>
</Tabs.List>

// 在内容区域添加
<Tabs.Content value="proxy">
  <ProxyConfig />
</Tabs.Content>
```

---

### 步骤7: 安装必要的依赖

```bash
cd Personal Chatbox

# 安装代理相关依赖
npm install https-proxy-agent socks-proxy-agent --save
```

---

## 🎨 配置界面预览

```
┌─────────────────────────────────────────────────┐
│  ⚙️  代理设置                      [启用] ●      │
│  配置代理服务器以访问国外API                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  代理类型:  [HTTP ▼]                             │
│                                                  │
│  主机地址:  [127.0.0.1        ]  端口: [7890  ] │
│                                                  │
│  用户名:    [                 ]  (可选)          │
│  密码:      [                 ]  (可选)          │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ✅ 代理连接成功                           │  │
│  │    延迟: 120ms                            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [🌐 测试连接]  [💾 保存配置]                    │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 💡 使用说明                               │  │
│  │ • Clash代理: 127.0.0.1:7890              │  │
│  │ • V2Ray代理: 127.0.0.1:10808             │  │
│  │ • 国外服务自动使用代理                     │  │
│  │ • 国内服务自动直连                         │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔒 安全考虑

### 1. 密码加密存储

```javascript
const crypto = require('crypto');

// 加密密码
function encryptPassword(password) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.SECRET_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// 解密密码
function decryptPassword(encrypted) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.SECRET_KEY || 'default-key', 'salt', 32);
  
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 2. 配置文件权限

```javascript
// 设置配置文件权限为600 (仅所有者可读写)
fs.chmodSync(this.configPath, 0o600);
```

### 3. 环境变量

```bash
# .env
SECRET_KEY=your-secret-key-here
PROXY_CONFIG_PATH=/path/to/secure/location/proxy.json
```

---

## ✅ 测试验证

### 测试脚本

创建 `server/test/proxy-test.cjs`:

```javascript
const { getProxyManager } = require('../lib/ProxyManager.cjs');
const { createProxyClient } = require('../lib/ProxyClient.cjs');

async function testProxy() {
  console.log('🧪 开始测试代理功能...\n');

  const proxyManager = getProxyManager();

  // 测试1: 配置加载
  console.log('1️⃣ 测试配置加载');
  const config = proxyManager.getConfig();
  console.log('   配置:', JSON.stringify(config, null, 2));
  console.log('   ✅ 配置加载成功\n');

  // 测试2: 域名匹配
  console.log('2️⃣ 测试域名匹配');
  const testUrls = [
    'https://dexscreener.com/api',
    'https://api.github.com',
    'https://www.baidu.com',
    'https://api.bilibili.com',
  ];

  for (const url of testUrls) {
    const shouldProxy = proxyManager.shouldUseProxy(url);
    console.log(`   ${url}`);
    console.log(`   ${shouldProxy ? '🌐 使用代理' : '🔗 直接连接'}`);
  }
  console.log('   ✅ 域名匹配测试完成\n');

  // 测试3: 代理连接
  console.log('3️⃣ 测试代理连接');
  const result = await proxyManager.testProxy();
  console.log('   结果:', result);
  console.log(result.success ? '   ✅ 代理连接成功\n' : '   ❌ 代理连接失败\n');

  // 测试4: HTTP客户端
  console.log('4️⃣ 测试HTTP客户端');
  const client = createProxyClient();
  
  try {
    const response = await client.get('https://api.github.com');
    console.log('   GitHub API响应状态:', response.status);
    console.log('   ✅ HTTP客户端测试成功\n');
  } catch (error) {
    console.log('   ❌ HTTP客户端测试失败:', error.message, '\n');
  }

  console.log('🎉 测试完成!');
}

testProxy().catch(console.error);
```

运行测试:

```bash
node server/test/proxy-test.cjs
```

---

## 📊 性能优化

### 1. 连接池

```javascript
const agent = new HttpsProxyAgent(proxyUrl, {
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  scheduling: 'lifo',
  timeout: 60000
});
```

### 2. 请求缓存

```javascript
const cache = new Map();

function getCachedResponse(url, ttl = 60000) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setCachedResponse(url, data) {
  cache.set(url, {
    data,
    timestamp: Date.now()
  });
}
```

### 3. 并发控制

```javascript
const pLimit = require('p-limit');
const limit = pLimit(10); // 最多10个并发请求

const promises = urls.map(url => 
  limit(() => client.get(url))
);

const results = await Promise.all(promises);
```

---

## 🎯 总结

### 优势

1. ✅ **用户友好**: 图形化配置界面,无需手动编辑文件
2. ✅ **智能路由**: 自动判断是否需要代理,节省流量
3. ✅ **安全可靠**: 密码加密存储,配置文件权限控制
4. ✅ **性能优化**: 连接池、缓存、并发控制
5. ✅ **易于维护**: 模块化设计,代码清晰

### 使用场景

- ✅ 用户已有Clash、V2Ray等代理工具
- ✅ 需要访问Dexscreener等国外API
- ✅ 希望国内服务直连,国外服务走代理
- ✅ 需要灵活配置代理规则

### 后续优化

1. 支持PAC自动代理配置
2. 支持多个代理服务器负载均衡
3. 添加代理服务器延迟测试和自动选择
4. 支持订阅链接导入
5. 添加流量统计功能

---

**实施这个方案后,所有MCP服务都能正常访问国外API,同时保持国内服务的高速访问!** 🚀

