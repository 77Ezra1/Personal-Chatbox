const axios = require('axios');
const { getProxyManager } = require('./ProxyManager.cjs');

/**
 * 创建支持代理的HTTP客户端
 * @param {string} baseURL - 基础URL
 * @param {object} options - axios配置选项
 * @returns {AxiosInstance}
 */
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

  // 响应拦截器 - 错误处理
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error(`❌ 连接失败: ${error.config?.url}`, error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = { createProxyClient };

