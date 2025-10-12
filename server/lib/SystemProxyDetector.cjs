const { URL } = require('url');

/**
 * 系统代理检测器
 * 自动检测系统的HTTP/HTTPS代理设置
 */
class SystemProxyDetector {
  constructor() {
    this.cachedProxy = null;
    this.lastCheck = 0;
    this.checkInterval = 60000; // 每60秒检查一次
  }

  /**
   * 获取系统代理设置
   * 优先级: 用户配置 > 环境变量 > 自动检测
   */
  async getSystemProxy() {
    const now = Date.now();
    
    // 如果缓存有效,直接返回
    if (this.cachedProxy && (now - this.lastCheck) < this.checkInterval) {
      return this.cachedProxy;
    }

    try {
      // 方法1: 从用户配置读取 (最高优先级)
      try {
        const { getConfigStorage } = require('../services/config-storage.cjs');
        const configStorage = getConfigStorage();
        const proxyConfig = await configStorage.getServiceConfig('proxy');
        
        if (proxyConfig && proxyConfig.enabled) {
          const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
          this.cachedProxy = {
            enabled: true,
            url: proxyUrl,
            source: 'user_config',
            protocol: proxyConfig.protocol,
            host: proxyConfig.host,
            port: proxyConfig.port
          };
          console.log('✅ 使用用户配置的代理:', this.cachedProxy.url);
          this.lastCheck = now;
          return this.cachedProxy;
        }
      } catch (error) {
        // 如果配置读取失败,继续尝试其他方法
        console.log('ℹ️  未找到用户配置的代理,尝试其他方法');
      }

      // 方法2: 从环境变量读取
      const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
      const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
      const proxyUrl = httpsProxy || httpProxy;

      if (proxyUrl) {
        this.cachedProxy = {
          enabled: true,
          url: proxyUrl,
          source: 'environment',
          ...this.parseProxyUrl(proxyUrl)
        };
        console.log('✅ 检测到环境变量代理:', this.cachedProxy.url);
      } else {
        // 方法3: 尝试检测常见的Clash端口
        const clashProxy = await this.detectClashProxy();
        if (clashProxy) {
          this.cachedProxy = clashProxy;
          console.log('✅ 检测到Clash代理:', this.cachedProxy.url);
        } else {
          this.cachedProxy = {
            enabled: false,
            source: 'none'
          };
          console.log('ℹ️  未检测到系统代理');
        }
      }

      this.lastCheck = now;
      return this.cachedProxy;
    } catch (error) {
      console.error('❌ 检测系统代理失败:', error.message);
      return { enabled: false, error: error.message };
    }
  }

  /**
   * 检测Clash代理
   * 尝试连接常见的Clash端口
   */
  async detectClashProxy() {
    const commonPorts = [7890, 7891, 1080, 10808];
    
    for (const port of commonPorts) {
      try {
        // 尝试通过这个端口访问一个简单的URL
        const proxyUrl = `http://127.0.0.1:${port}`;
        
        // 简单检测:如果端口开放,假设是代理
        const net = require('net');
        const isOpen = await new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(1000);
          
          socket.on('connect', () => {
            socket.destroy();
            resolve(true);
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
          });
          
          socket.on('error', () => {
            resolve(false);
          });
          
          socket.connect(port, '127.0.0.1');
        });

        if (isOpen) {
          return {
            enabled: true,
            url: proxyUrl,
            source: 'detected',
            protocol: 'http',
            host: '127.0.0.1',
            port: port
          };
        }
      } catch (error) {
        // 继续尝试下一个端口
      }
    }
    
    return null;
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
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
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

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // localhost和本地IP不使用代理
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          hostname.startsWith('172.17.') ||
          hostname.startsWith('172.18.') ||
          hostname.startsWith('172.19.') ||
          hostname.startsWith('172.20.') ||
          hostname.startsWith('172.21.') ||
          hostname.startsWith('172.22.') ||
          hostname.startsWith('172.23.') ||
          hostname.startsWith('172.24.') ||
          hostname.startsWith('172.25.') ||
          hostname.startsWith('172.26.') ||
          hostname.startsWith('172.27.') ||
          hostname.startsWith('172.28.') ||
          hostname.startsWith('172.29.') ||
          hostname.startsWith('172.30.') ||
          hostname.startsWith('172.31.')) {
        return false;
      }

      // 国内常见域名不使用代理
      const bypassDomains = [
        '.cn',
        'baidu.com',
        'qq.com',
        'taobao.com',
        'aliyun.com',
        'aliyuncs.com',
        'bilibili.com',
        'douyin.com',
        'weibo.com',
        'tencent.com',
        'bytedance.com',
        'jd.com',
        'tmall.com',
        '163.com',
        'sina.com.cn',
        'sohu.com',
        'youku.com',
        'iqiyi.com'
      ];

      for (const domain of bypassDomains) {
        if (hostname.endsWith(domain) || hostname === domain.replace('.', '')) {
          return false;
        }
      }

      // 其他域名使用代理
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

