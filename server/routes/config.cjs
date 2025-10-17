/**
 * 配置管理 API 路由
 * 处理用户配置的 API 密钥和设置
 */

const express = require('express');
const router = express.Router();
const ConfigManager = require('../services/configManager.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const { cacheMiddleware, clearUserCache } = require('../middleware/cache.cjs');
const logger = require('../utils/logger.cjs');

const configManager = new ConfigManager();

// 所有config路由都需要认证
router.use(authMiddleware);

// 获取所有配置 - alias for current
router.get('/all', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  try {
    const config = await configManager.loadConfig();
    // 不返回真实的 API 密钥，只返回是否已配置
    const safeConfig = {
      openai: {
        enabled: config.openai.enabled,
        model: config.openai.model,
        hasApiKey: !!config.openai.apiKey
      },
      deepseek: {
        enabled: config.deepseek.enabled,
        model: config.deepseek.model,
        hasApiKey: !!config.deepseek.apiKey
      },
      settings: config.settings
    };
    res.json({ config: safeConfig });
  } catch (error) {
    res.status(500).json({ error: '获取配置失败', message: error.message });
  }
});

// 获取当前配置 (cached for 5 minutes)
router.get('/current', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  try {
    const config = await configManager.loadConfig();
    // 不返回真实的 API 密钥，只返回是否已配置
    const safeConfig = {
      openai: {
        enabled: config.openai.enabled,
        model: config.openai.model,
        hasApiKey: !!config.openai.apiKey
      },
      deepseek: {
        enabled: config.deepseek.enabled,
        model: config.deepseek.model,
        hasApiKey: !!config.deepseek.apiKey
      },
      settings: config.settings
    };
    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ error: '获取配置失败', message: error.message });
  }
});

// 更新 API 密钥
router.post('/api-key', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: '提供商和 API 密钥不能为空' });
    }

    if (!['openai', 'deepseek'].includes(provider)) {
      return res.status(400).json({ error: '不支持的提供商' });
    }

    // 验证API密钥格式
    if (apiKey.length < 20) {
      return res.status(400).json({ error: 'API 密钥格式无效' });
    }

    // 测试 API 密钥
    const testResult = await configManager.testApiKey(provider, apiKey);
    if (!testResult.success) {
      return res.status(400).json({ error: testResult.message });
    }

    // 保存 API 密钥
    const success = await configManager.updateApiKey(provider, apiKey);
    if (success) {
      res.json({
        success: true,
        message: `${provider} API 密钥配置成功`,
        testResult
      });
    } else {
      res.status(500).json({ error: '保存配置失败' });
    }
  } catch (error) {
    res.status(500).json({ error: '配置 API 密钥失败', message: error.message });
  }
});

// 测试 API 密钥
router.post('/test-api', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: '提供商和 API 密钥不能为空' });
    }

    const result = await configManager.testApiKey(provider, apiKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '测试 API 失败', message: error.message });
  }
});

// 更新设置
router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: '设置不能为空' });
    }

    const config = await configManager.loadConfig();
    config.settings = { ...config.settings, ...settings };

    const success = await configManager.saveConfig(config);
    if (success) {
      res.json({ success: true, message: '设置更新成功' });
    } else {
      res.status(500).json({ error: '保存设置失败' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新设置失败', message: error.message });
  }
});

// 重置配置
router.post('/reset', async (req, res) => {
  try {
    const success = await configManager.saveConfig(configManager.defaultConfig);
    if (success) {
      res.json({ success: true, message: '配置已重置' });
    } else {
      res.status(500).json({ error: '重置配置失败' });
    }
  } catch (error) {
    res.status(500).json({ error: '重置配置失败', message: error.message });
  }
});

module.exports = router;
