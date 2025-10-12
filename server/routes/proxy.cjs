const express = require('express');
const router = express.Router();
const { getProxyManager } = require('../lib/ProxyManager.cjs');
const { getSystemProxyDetector } = require('../lib/SystemProxyDetector.cjs');
const { NetworkDiagnostic } = require('../lib/NetworkDiagnostic.cjs');

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
    const detector = getSystemProxyDetector();
    const proxy = await detector.refresh();
    
    // 同时刷新ProxyManager
    const proxyManager = getProxyManager();
    await proxyManager.refresh();
    
    res.json({ 
      success: true, 
      message: '系统代理已刷新',
      proxy 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 网络诊断
 */
router.get('/diagnose', async (req, res) => {
  try {
    const diagnostic = new NetworkDiagnostic();
    const results = await diagnostic.diagnose();
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取代理配置
 */
router.get('/config', async (req, res) => {
  try {
    const { getConfigStorage } = require('../services/config-storage.cjs');
    const configStorage = getConfigStorage();
    
    // 确保配置存储已初始化
    if (!configStorage.config) {
      await configStorage.initialize();
    }
    
    let proxyConfig = configStorage.getServiceConfig('proxy');
    
    // 如果配置不存在，使用默认值
    if (!proxyConfig) {
      proxyConfig = {
        enabled: false,
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890
      };
    }

    const proxyManager = getProxyManager();
    const currentProxy = await proxyManager.getProxyInfo();

    res.json({
      success: true,
      config: proxyConfig,
      current: currentProxy.system || { enabled: false }
    });
  } catch (error) {
    console.error('获取代理配置失败:', error);
    // 即使出错也返回默认配置，避免前端崩溃
    res.json({
      success: true,
      config: {
        enabled: false,
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890
      },
      current: { enabled: false },
      warning: '配置加载失败，使用默认配置'
    });
  }
});

/**
 * 保存代理配置
 */
router.post('/config', async (req, res) => {
  try {
    const { enabled, protocol, host, port } = req.body;

    // 验证参数
    if (enabled) {
      if (!protocol || !host || !port) {
        return res.status(400).json({
          success: false,
          error: '请提供完整的代理配置'
        });
      }

      if (!['http', 'https', 'socks5'].includes(protocol)) {
        return res.status(400).json({
          success: false,
          error: '不支持的代理协议'
        });
      }

      if (port < 1 || port > 65535) {
        return res.status(400).json({
          success: false,
          error: '端口号必须在 1-65535 之间'
        });
      }
    }

    // 保存配置
    const { getConfigStorage } = require('../services/config-storage.cjs');
    const configStorage = getConfigStorage();
    await configStorage.updateServiceConfig('proxy', {
      enabled,
      protocol,
      host,
      port
    });

    // 如果启用了代理,设置环境变量
    if (enabled) {
      const proxyUrl = `${protocol}://${host}:${port}`;
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      console.log('✅ 代理配置已更新:', proxyUrl);
    } else {
      // 禁用代理时清除环境变量
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.http_proxy;
      delete process.env.https_proxy;
      console.log('✅ 代理已禁用');
    }

    // 刷新代理管理器
    const proxyManager = getProxyManager();
    await proxyManager.refresh();

    res.json({
      success: true,
      message: '代理配置已保存'
    });
  } catch (error) {
    console.error('保存代理配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 测试代理连接
 */
router.post('/test', async (req, res) => {
  try {
    const { protocol, host, port } = req.body;

    if (!protocol || !host || !port) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的代理配置'
      });
    }

    const proxyUrl = `${protocol}://${host}:${port}`;

    // 测试代理连接 - 尝试访问一个简单的URL
    const testUrl = 'https://www.google.com';
    
    const { HttpsProxyAgent } = require('https-proxy-agent');
    const agent = new HttpsProxyAgent(proxyUrl);
    const https = require('https');

    const testPromise = new Promise((resolve, reject) => {
      const req = https.get(testUrl, { agent, timeout: 10000 }, (response) => {
        resolve({
          success: true,
          statusCode: response.statusCode
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('连接超时'));
      });
    });

    const result = await testPromise;

    res.json({
      success: true,
      message: '代理连接测试成功',
      statusCode: result.statusCode
    });
  } catch (error) {
    console.error('代理测试失败:', error);
    res.json({
      success: false,
      error: error.message || '代理连接失败'
    });
  }
});

/**
 * 重启服务(应用代理配置)
 */
router.post('/restart', async (req, res) => {
  try {
    res.json({
      success: true,
      message: '服务重启请求已接收'
    });

    // 延迟重启,让响应先返回
    setTimeout(() => {
      console.log('🔄 重启服务以应用代理配置...');
      process.exit(0); // 退出进程,由进程管理器(如 PM2)自动重启
    }, 1000);
  } catch (error) {
    console.error('重启服务失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

