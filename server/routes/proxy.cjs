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

module.exports = router;

