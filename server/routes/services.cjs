/**
 * 服务管理 API
 * 用户可以在前端控制每个服务的启用/禁用状态
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const { db } = require('../db/init.cjs');
const logger = require('../utils/logger.cjs');
const config = require('../config.cjs');

/**
 * GET /api/services
 * 获取所有服务状态和用户配置
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户配置
    const userConfig = await db.prepare(
      'SELECT mcp_config FROM user_configs WHERE user_id = ?'
    ).get(userId);

    let userServicesConfig = {};
    if (userConfig && userConfig.mcp_config) {
      try {
        userServicesConfig = JSON.parse(userConfig.mcp_config);
      } catch (error) {
        logger.warn(`解析用户MCP配置失败: ${error.message}`);
      }
    }

    // 获取所有服务配置
    const allServices = [];

    // 1. MCP服务
    for (const [serviceId, serviceConfig] of Object.entries(config.services)) {
      if (!serviceConfig.command) continue; // 跳过非MCP服务

      // 合并系统配置和用户配置
      const userEnabled = userServicesConfig[serviceId]?.enabled !== undefined
        ? userServicesConfig[serviceId].enabled
        : serviceConfig.enabled && serviceConfig.autoLoad && !serviceConfig.requiresConfig;

      allServices.push({
        id: serviceId,
        name: serviceConfig.name,
        description: serviceConfig.description,
        type: 'mcp',
        category: serviceConfig.requiresConfig ? 'requires-key' : 'free',
        enabled: userEnabled,
        systemDefault: serviceConfig.enabled && serviceConfig.autoLoad,
        requiresConfig: serviceConfig.requiresConfig || false,
        configFields: serviceConfig.configFields || [],
        signupUrl: serviceConfig.signupUrl || null,
        notes: serviceConfig.notes || []
      });
    }

    // 2. 内置服务
    const builtinServices = [
      { id: 'weather', name: '天气服务', description: '获取全球天气信息', category: 'free' },
      { id: 'time', name: '时间服务', description: '获取当前时间和时区转换', category: 'free' },
      { id: 'dexscreener', name: 'Dexscreener加密货币', description: '获取实时加密货币价格和市场数据', category: 'free' },
      { id: 'fetch', name: '网页内容抓取', description: '从URL获取网页内容并转换为Markdown', category: 'free' },
      { id: 'playwright', name: 'Playwright浏览器自动化', description: '使用Playwright进行浏览器自动化操作', category: 'free' },
      { id: 'code_editor', name: '代码编辑器', description: '代码编辑和修改工具', category: 'free' },
      { id: 'command_runner', name: '命令执行器', description: '执行系统命令', category: 'free' },
      { id: 'linter_formatter', name: '代码质量工具', description: '代码检查和格式化', category: 'free' },
      { id: 'test_runner', name: '测试运行器', description: '运行测试用例', category: 'free' }
    ];

    for (const service of builtinServices) {
      const userEnabled = userServicesConfig[service.id]?.enabled !== undefined
        ? userServicesConfig[service.id].enabled
        : true; // 内置服务默认启用

      allServices.push({
        ...service,
        type: 'builtin',
        enabled: userEnabled,
        systemDefault: true,
        requiresConfig: false
      });
    }

    res.json({
      services: allServices,
      stats: {
        total: allServices.length,
        enabled: allServices.filter(s => s.enabled).length,
        free: allServices.filter(s => s.category === 'free').length,
        requiresKey: allServices.filter(s => s.category === 'requires-key').length
      }
    });

  } catch (error) {
    logger.error('获取服务列表失败:', error);
    res.status(500).json({
      error: '获取服务列表失败',
      message: error.message
    });
  }
});

/**
 * PUT /api/services/:serviceId
 * 更新单个服务的启用状态
 */
router.put('/:serviceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: '无效的参数',
        message: 'enabled 必须是布尔值'
      });
    }

    // 获取现有配置
    const userConfig = await db.prepare(
      'SELECT mcp_config FROM user_configs WHERE user_id = ?'
    ).get(userId);

    let mcpConfig = {};
    if (userConfig && userConfig.mcp_config) {
      try {
        mcpConfig = JSON.parse(userConfig.mcp_config);
      } catch (error) {
        logger.warn(`解析用户MCP配置失败: ${error.message}`);
      }
    }

    // 更新服务状态
    if (!mcpConfig[serviceId]) {
      mcpConfig[serviceId] = {};
    }
    mcpConfig[serviceId].enabled = enabled;
    mcpConfig[serviceId].updatedAt = new Date().toISOString();

    // 保存到数据库
    const mcpConfigJson = JSON.stringify(mcpConfig);

    if (userConfig) {
      // 更新现有配置
      await db.prepare(
        'UPDATE user_configs SET mcp_config = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).run(mcpConfigJson, userId);
    } else {
      // 创建新配置
      await db.prepare(
        'INSERT INTO user_configs (user_id, mcp_config) VALUES (?, ?)'
      ).run(userId, mcpConfigJson);
    }

    logger.info(`用户 ${userId} ${enabled ? '启用' : '禁用'} 服务: ${serviceId}`);

    res.json({
      success: true,
      message: `服务 ${serviceId} 已${enabled ? '启用' : '禁用'}`,
      note: '需要重启后端服务才能生效'
    });

  } catch (error) {
    logger.error('更新服务状态失败:', error);
    res.status(500).json({
      error: '更新服务状态失败',
      message: error.message
    });
  }
});

/**
 * PUT /api/services/batch
 * 批量更新服务状态
 */
router.put('/batch/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { services } = req.body;

    if (!Array.isArray(services)) {
      return res.status(400).json({
        error: '无效的参数',
        message: 'services 必须是数组'
      });
    }

    // 获取现有配置
    const userConfig = await db.prepare(
      'SELECT mcp_config FROM user_configs WHERE user_id = ?'
    ).get(userId);

    let mcpConfig = {};
    if (userConfig && userConfig.mcp_config) {
      try {
        mcpConfig = JSON.parse(userConfig.mcp_config);
      } catch (error) {
        logger.warn(`解析用户MCP配置失败: ${error.message}`);
      }
    }

    // 批量更新
    for (const { id, enabled } of services) {
      if (typeof enabled === 'boolean') {
        if (!mcpConfig[id]) {
          mcpConfig[id] = {};
        }
        mcpConfig[id].enabled = enabled;
        mcpConfig[id].updatedAt = new Date().toISOString();
      }
    }

    // 保存到数据库
    const mcpConfigJson = JSON.stringify(mcpConfig);

    if (userConfig) {
      await db.prepare(
        'UPDATE user_configs SET mcp_config = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).run(mcpConfigJson, userId);
    } else {
      await db.prepare(
        'INSERT INTO user_configs (user_id, mcp_config) VALUES (?, ?)'
      ).run(userId, mcpConfigJson);
    }

    logger.info(`用户 ${userId} 批量更新了 ${services.length} 个服务`);

    res.json({
      success: true,
      message: `已更新 ${services.length} 个服务`,
      note: '需要重启后端服务才能生效'
    });

  } catch (error) {
    logger.error('批量更新服务状态失败:', error);
    res.status(500).json({
      error: '批量更新服务状态失败',
      message: error.message
    });
  }
});

/**
 * POST /api/services/restart
 * 请求重启服务（需要管理员权限）
 */
router.post('/restart', authMiddleware, async (req, res) => {
  try {
    // TODO: 实现热重启功能
    // 目前只返回提示信息

    res.json({
      success: false,
      message: '自动重启功能尚未实现，请手动重启服务',
      commands: {
        dev: 'npm run dev',
        prod: 'pm2 restart chatbox'
      }
    });

  } catch (error) {
    logger.error('重启服务失败:', error);
    res.status(500).json({
      error: '重启服务失败',
      message: error.message
    });
  }
});

module.exports = router;

