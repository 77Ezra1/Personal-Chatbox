const { HttpsProxyAgent } = require('https-proxy-agent');
const { getSystemProxyDetector } = require('./SystemProxyDetector.cjs');

/**
 * 代理管理器
 * 负责管理和提供代理Agent
 */
class ProxyManager {
  constructor() {
    this.systemProxyDetector = getSystemProxyDetector();
    this.agent = null;
    this.initialized = false;
  }

  /**
   * 初始化代理Agent
   * 优先使用系统代理
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 尝试使用系统代理
      const systemProxy = await this.systemProxyDetector.getSystemProxy();
      
      if (systemProxy.enabled) {
        console.log('🌐 使用系统代理:', systemProxy.url);
        this.createAgentFromProxy(systemProxy);
        this.initialized = true;
        return;
      }

      // 如果没有系统代理
      console.log('🔗 未检测到代理,使用直接连接');
      this.agent = null;
      this.initialized = true;
    } catch (error) {
      console.error('❌ 初始化代理失败:', error);
      this.agent = null;
      this.initialized = true;
    }
  }

  /**
   * 从代理配置创建Agent
   */
  createAgentFromProxy(proxy) {
    try {
      const proxyUrl = proxy.url;
      this.agent = new HttpsProxyAgent(proxyUrl);
      console.log(`✅ 代理Agent已创建: ${proxyUrl}`);
    } catch (error) {
      console.error('创建代理Agent失败:', error);
      this.agent = null;
    }
  }

  /**
   * 获取代理Agent
   * 根据URL自动判断是否需要使用代理
   */
  async getAgent(url) {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize();
    }

    // 检查是否需要使用代理
    const shouldProxy = await this.systemProxyDetector.shouldUseProxyForUrl(url);
    
    if (!shouldProxy) {
      return null;
    }

    return this.agent;
  }

  /**
   * 获取代理信息
   */
  async getProxyInfo() {
    const systemProxy = await this.systemProxyDetector.getSystemProxy();

    return {
      system: systemProxy,
      active: systemProxy.enabled ? 'system' : 'none'
    };
  }

  /**
   * 刷新代理检测
   */
  async refresh() {
    this.initialized = false;
    await this.initialize();
    return await this.getProxyInfo();
  }
}

// 单例
let instance = null;

function getProxyManager() {
  if (!instance) {
    instance = new ProxyManager();
  }
  return instance;
}

module.exports = { ProxyManager, getProxyManager };

