/**
 * 代理辅助工具
 * 为MCP服务提供代理支持
 */

const { HttpsProxyAgent } = require('https-proxy-agent');
const { getProxyManager } = require('./ProxyManager.cjs');

/**
 * 为Node.js的fetch和http/https模块设置全局代理
 */
async function setupGlobalProxy() {
  try {
    const proxyManager = getProxyManager();
    await proxyManager.initialize();
    const proxyInfo = await proxyManager.getProxyInfo();
    
    if (proxyInfo.system && proxyInfo.system.enabled) {
      const proxyUrl = proxyInfo.system.url;
      
      // 设置环境变量
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      
      console.log(`[Proxy Helper] 全局代理已设置: ${proxyUrl}`);
      
      // 尝试为全局fetch设置代理（如果可用）
      if (global.fetch) {
        const originalFetch = global.fetch;
        const agent = new HttpsProxyAgent(proxyUrl);
        
        global.fetch = function(url, options = {}) {
          // 如果URL是外部URL，添加代理agent
          if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            // 检查是否是本地地址
            const urlObj = new URL(url);
            const isLocal = urlObj.hostname === 'localhost' || 
                           urlObj.hostname === '127.0.0.1' ||
                           urlObj.hostname.startsWith('192.168.') ||
                           urlObj.hostname.startsWith('10.');
            
            if (!isLocal) {
              options.agent = agent;
            }
          }
          
          return originalFetch(url, options);
        };
        
        console.log('[Proxy Helper] 全局fetch已配置代理');
      }
      
      return true;
    } else {
      console.log('[Proxy Helper] 未检测到代理配置');
      return false;
    }
  } catch (error) {
    console.error('[Proxy Helper] 设置全局代理失败:', error);
    return false;
  }
}

/**
 * 获取代理Agent（用于http/https请求）
 */
async function getProxyAgent() {
  try {
    const proxyManager = getProxyManager();
    await proxyManager.initialize();
    const proxyInfo = await proxyManager.getProxyInfo();
    
    if (proxyInfo.system && proxyInfo.system.enabled) {
      return new HttpsProxyAgent(proxyInfo.system.url);
    }
    
    return null;
  } catch (error) {
    console.error('[Proxy Helper] 获取代理Agent失败:', error);
    return null;
  }
}

module.exports = {
  setupGlobalProxy,
  getProxyAgent
};

