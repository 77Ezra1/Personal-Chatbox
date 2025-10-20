/**
 * 配置管理 API 路由
 * 处理用户配置的 API 密钥和设置
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const { cacheMiddleware, clearUserCache } = require('../middleware/cache.cjs');
const logger = require('../utils/logger.cjs');
const { db } = require('../db/init.cjs');

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

// 获取所有支持的服务列表
router.get('/services', async (req, res) => {
  try {
    const configStorage = require('../services/config-storage.cjs');

    // 定义支持的服务
    const supportedServices = [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT 系列模型',
        category: 'AI Models',
        fields: [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'sk-...',
            helpUrl: 'https://platform.openai.com/api-keys'
          },
          {
            key: 'baseUrl',
            label: 'Base URL',
            type: 'text',
            required: false,
            placeholder: 'https://api.openai.com/v1',
            default: 'https://api.openai.com/v1'
          }
        ]
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'DeepSeek AI 模型',
        category: 'AI Models',
        fields: [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'sk-...',
            helpUrl: 'https://platform.deepseek.com/api_keys'
          },
          {
            key: 'baseUrl',
            label: 'Base URL',
            type: 'text',
            required: false,
            placeholder: 'https://api.deepseek.com',
            default: 'https://api.deepseek.com'
          }
        ]
      },
      {
        id: 'braveSearch',
        name: 'Brave Search',
        description: 'Brave 搜索引擎 API',
        category: 'Search',
        fields: [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'BSA...',
            helpUrl: 'https://brave.com/search/api/'
          }
        ]
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub API 访问',
        category: 'Development',
        fields: [
          {
            key: 'token',
            label: 'Personal Access Token',
            type: 'password',
            required: true,
            placeholder: 'ghp_...',
            helpUrl: 'https://github.com/settings/tokens'
          }
        ]
      },
      {
        id: 'proxy',
        name: '代理服务器',
        description: '配置 HTTP/HTTPS 代理',
        category: 'Network',
        fields: [
          {
            key: 'protocol',
            label: '协议',
            type: 'select',
            required: true,
            default: 'http',
            options: [
              { value: 'http', label: 'HTTP' },
              { value: 'https', label: 'HTTPS' }
            ]
          },
          {
            key: 'host',
            label: '主机地址',
            type: 'text',
            required: true,
            placeholder: 'proxy.example.com'
          },
          {
            key: 'port',
            label: '端口',
            type: 'text',
            required: true,
            placeholder: '8080'
          }
        ]
      }
    ];

    // 检查每个服务是否已配置
    const servicesWithStatus = await Promise.all(
      supportedServices.map(async (service) => {
        const config = await configStorage.getServiceConfig(service.id);
        const configured = config && Object.keys(config).some(key =>
          key !== 'enabled' && config[key] !== null && config[key] !== undefined && config[key] !== ''
        );

        return {
          ...service,
          configured,
          enabled: config?.enabled || false
        };
      })
    );

    res.json({
      success: true,
      services: servicesWithStatus
    });
  } catch (error) {
    logger.error('获取服务列表失败:', error);
    res.status(500).json({ error: '获取服务列表失败', message: error.message });
  }
});

// 更新服务配置（改用数据库，每个用户独立配置）
router.post('/service/:serviceId', authMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const configData = req.body;
    const userId = req.user?.id;  // 从认证中间件获取用户ID

    logger.info(`[Config] POST /service/${serviceId} - userId: ${userId}, configData:`, configData);

    if (!userId) {
      logger.error('[Config] No userId found in req.user');
      return res.status(401).json({ error: '未授权' });
    }

    logger.info(`[User ${userId}] 保存服务配置: ${serviceId}`);

    // 验证服务ID
    const validServices = ['openai', 'deepseek', 'braveSearch', 'github', 'proxy'];
    if (!validServices.includes(serviceId)) {
      return res.status(400).json({ error: '不支持的服务ID' });
    }

    // 从数据库读取用户现有配置
    const { db } = require('../db/init.cjs');
    const existing = await db.prepare(
      'SELECT api_keys FROM user_configs WHERE user_id = ?'
    ).get(userId);

    // 解析现有的 API keys
    let apiKeys = {};
    if (existing && existing.api_keys) {
      try {
        apiKeys = JSON.parse(existing.api_keys);
      } catch (e) {
        logger.warn(`[User ${userId}] 解析 api_keys 失败, 使用空对象`);
      }
    }

    // 更新对应服务的 API key
    if (configData.apiKey) {
      apiKeys[serviceId] = configData.apiKey;
      logger.info(`[User ${userId}] 更新 ${serviceId} API key`);
    }

    // 保存到数据库
    await db.prepare(`
      INSERT INTO user_configs (user_id, api_keys, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        api_keys = excluded.api_keys,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, JSON.stringify(apiKeys));

    logger.info(`[User ${userId}] ${serviceId} 配置已保存到数据库`);

    res.json({
      success: true,
      message: '服务配置已保存'
    });
  } catch (error) {
    logger.error('保存服务配置失败:', error);
    res.status(500).json({ error: '保存服务配置失败', message: error.message });
  }
});

// 删除服务配置
router.delete('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const configStorage = require('../services/config-storage.cjs');

    // 删除配置
    await configStorage.deleteServiceConfig(serviceId);

    res.json({
      success: true,
      message: '服务配置已删除'
    });
  } catch (error) {
    logger.error('删除服务配置失败:', error);
    res.status(500).json({ error: '删除服务配置失败', message: error.message });
  }
});

// 测试服务连接
router.post('/service/:serviceId/test', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const configData = req.body;

    // 根据服务类型执行测试
    let testResult = { success: false, message: '不支持的服务' };

    switch (serviceId) {
      case 'openai':
        testResult = await testOpenAI(configData);
        break;
      case 'deepseek':
        testResult = await testDeepSeek(configData);
        break;
      case 'braveSearch':
        testResult = await testBraveSearch(configData);
        break;
      case 'github':
        testResult = await testGitHub(configData);
        break;
      case 'proxy':
        testResult = await testProxy(configData);
        break;
    }

    res.json(testResult);
  } catch (error) {
    logger.error('测试服务失败:', error);
    res.status(500).json({
      success: false,
      error: '测试服务失败',
      message: error.message
    });
  }
});

// 测试函数
async function testOpenAI(config) {
  try {
    const { default: fetch } = await import('node-fetch');
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: 5000
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API 连接成功' };
    } else {
      const error = await response.text();
      return { success: false, message: `连接失败: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `连接失败: ${error.message}` };
  }
}

async function testDeepSeek(config) {
  try {
    const { default: fetch } = await import('node-fetch');
    const baseUrl = config.baseUrl || 'https://api.deepseek.com';

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: 5000
    });

    if (response.ok) {
      return { success: true, message: 'DeepSeek API 连接成功' };
    } else {
      const error = await response.text();
      return { success: false, message: `连接失败: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `连接失败: ${error.message}` };
  }
}

async function testBraveSearch(config) {
  try {
    const { default: fetch } = await import('node-fetch');

    const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=test', {
      headers: {
        'X-Subscription-Token': config.apiKey
      },
      timeout: 5000
    });

    if (response.ok) {
      return { success: true, message: 'Brave Search API 连接成功' };
    } else {
      const error = await response.text();
      return { success: false, message: `连接失败: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `连接失败: ${error.message}` };
  }
}

async function testGitHub(config) {
  try {
    const { default: fetch } = await import('node-fetch');

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': 'AI-Life-System'
      },
      timeout: 5000
    });

    if (response.ok) {
      const user = await response.json();
      return { success: true, message: `GitHub API 连接成功 (${user.login})` };
    } else {
      const error = await response.text();
      return { success: false, message: `连接失败: ${error}` };
    }
  } catch (error) {
    return { success: false, message: `连接失败: ${error.message}` };
  }
}

async function testProxy(config) {
  try {
    const { default: fetch } = await import('node-fetch');
    const { HttpsProxyAgent } = require('https-proxy-agent');

    const proxyUrl = `${config.protocol}://${config.host}:${config.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch('https://www.google.com', {
      agent,
      timeout: 5000
    });

    if (response.ok) {
      return { success: true, message: '代理服务器连接成功' };
    } else {
      return { success: false, message: '代理服务器连接失败' };
    }
  } catch (error) {
    return { success: false, message: `代理服务器连接失败: ${error.message}` };
  }
}

module.exports = router;
