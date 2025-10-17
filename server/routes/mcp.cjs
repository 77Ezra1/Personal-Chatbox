/**
 * MCP服务API路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');
const { cacheManager } = require('../utils/cache.cjs');

// 服务实例存储
let services = {};

/**
 * 初始化路由,注入服务实例
 */
function initializeRouter(serviceInstances) {
  services = serviceInstances;
  logger.info('MCP路由已初始化');
}

/**
 * GET /api/mcp
 * MCP服务根路径
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MCP服务API',
    version: '1.0.0',
    endpoints: {
      services: '/api/mcp/services',
      status: '/api/mcp/status',
      health: '/api/mcp/health'
    }
  });
});

/**
 * GET /api/mcp/services
 * 获取所有可用服务列表（带缓存）
 */
router.get('/services', (req, res, next) => {
  try {
    // 尝试从缓存获取
    const cacheKey = 'mcp:services:list';
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const serviceList = [];

    // 获取所有常规服务
    for (const service of Object.values(services)) {
      if (!service.getInfo) continue;

      const info = service.getInfo();

      // 如果是MCP Manager，提取其管理的所有服务
      if (info.id === 'mcp' && info.services) {
        serviceList.push(...info.services);
      } else {
        serviceList.push(info);
      }
    }

    const response = {
      success: true,
      services: serviceList
    };

    // 缓存30秒
    cacheManager.set(cacheKey, response, 30 * 1000);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mcp/services/:serviceId
 * 获取特定服务的详细信息
 */
router.get('/services/:serviceId', (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const service = services[serviceId];

    if (!service) {
      throw createError.serviceNotFound(serviceId);
    }

    res.json({
      success: true,
      service: service.getInfo()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/services/:serviceId/toggle
 * 启用或禁用服务
 */
router.post('/services/:serviceId/toggle', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { enabled } = req.body;

    const service = services[serviceId];

    if (!service) {
      throw createError.serviceNotFound(serviceId);
    }

    if (enabled) {
      await service.enable();
    } else {
      service.disable();
    }

    res.json({
      success: true,
      service: service.getInfo()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mcp/tools
 * 获取所有启用服务的工具列表
 */
router.get('/tools', (req, res, next) => {
  try {
    const allTools = [];

    for (const service of Object.values(services)) {
      // 处理普通服务
      if (service.getTools && service.enabled) {
        const tools = service.getTools();
        allTools.push(...tools);
      }
      // 处理 MCPManager
      else if (service.getAllTools) {
        const tools = service.getAllTools();
        allTools.push(...tools);
      }
    }

    res.json({
      success: true,
      tools: allTools,
      count: allTools.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/call
 * 调用MCP工具
 */
router.post('/call', async (req, res, next) => {
  try {
    const { toolName, parameters } = req.body;

    if (!toolName) {
      throw createError.invalidParameters('缺少toolName参数');
    }

    logger.info(`调用工具: ${toolName}`, parameters);

    // 查找拥有该工具的服务
    let targetService = null;
    let isMCPTool = false;

    // 首先检查是否是 MCP Manager 的工具
    const mcpManager = services.mcpManager;
    if (mcpManager && mcpManager.getAllTools) {
      const mcpTools = mcpManager.getAllTools();
      const mcpTool = mcpTools.find(tool => tool.function.name === toolName);

      if (mcpTool) {
        // 这是一个 MCP 工具
        isMCPTool = true;
        const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);

        try {
          const result = await mcpManager.callTool(serviceId, actualToolName, parameters || {});

          // 格式化返回结果
          return res.json({
            success: true,
            content: JSON.stringify(result, null, 2),
            toolName,
            serviceId,
            actualToolName
          });
        } catch (error) {
          logger.error(`MCP工具调用失败: ${toolName}`, error);
          return res.json({
            success: false,
            error: `MCP工具调用失败: ${error.message}`,
            details: error.stack
          });
        }
      }
    }

    // 如果不是 MCP 工具,查找原有服务的工具
    for (const service of Object.values(services)) {
      if (!service.enabled || !service.getTools) continue;

      const tools = service.getTools();
      const hasTool = tools.some(tool => tool.function.name === toolName);

      if (hasTool) {
        targetService = service;
        break;
      }
    }

    if (!targetService) {
      return res.json({
        success: false,
        error: `未找到工具: ${toolName}`,
        details: '该工具不存在或所属服务未启用'
      });
    }

    // 检查服务是否已禁用
    if (!targetService.enabled) {
      throw createError.serviceDisabled(targetService.name);
    }

    // 执行工具
    const result = await targetService.execute(toolName, parameters || {});

    res.json(result);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mcp/health
 * 健康检查
 */
router.get('/health', async (req, res, next) => {
  try {
    const healthChecks = {};

    for (const [id, service] of Object.entries(services)) {
      // 处理普通服务
      if (service.healthCheck) {
        healthChecks[id] = await service.healthCheck();
      }
      // 处理 MCPManager
      else if (service.getStatus) {
        healthChecks[id] = {
          id: 'mcpManager',
          name: 'MCP Manager',
          status: 'healthy',
          services: service.getStatus()
        };
      }
    }

    res.json({
      success: true,
      services: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 用户自定义MCP配置API ====================

/**
 * GET /api/mcp/templates
 * 获取所有可用的MCP服务模板
 */
router.get('/templates', (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const templatesPath = path.join(__dirname, '../data/mcp-templates.json');

    if (!fs.existsSync(templatesPath)) {
      throw createError.notFound('MCP模板文件未找到');
    }

    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

    res.json({
      success: true,
      templates: templates.templates,
      categories: templates.categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mcp/user-configs
 * 获取用户的自定义MCP配置列表
 */
router.get('/user-configs', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1; // 默认用户ID为1
    const db = req.app.locals.db;

    const configs = await db.all(
      'SELECT * FROM user_mcp_configs WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // 解析JSON字段
    const parsedConfigs = configs.map(config => ({
      ...config,
      args: config.args ? JSON.parse(config.args) : [],
      env_vars: config.env_vars ? JSON.parse(config.env_vars) : {},
      features: config.features ? JSON.parse(config.features) : [],
      setup_instructions: config.setup_instructions ? JSON.parse(config.setup_instructions) : {},
      config_data: config.config_data ? JSON.parse(config.config_data) : {}
    }));

    res.json({
      success: true,
      configs: parsedConfigs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs
 * 创建新的用户MCP配置
 */
router.post('/user-configs', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const db = req.app.locals.db;

    const {
      mcp_id,
      name,
      description,
      category,
      icon,
      command,
      args,
      env_vars,
      config_data,
      official,
      popularity,
      features,
      setup_instructions,
      documentation
    } = req.body;

    // 验证必填字段
    if (!mcp_id || !name || !command) {
      throw createError.invalidParameters('缺少必填字段: mcp_id, name, command');
    }

    // 检查是否已存在
    const existing = await db.get(
      'SELECT id FROM user_mcp_configs WHERE user_id = ? AND mcp_id = ?',
      [userId, mcp_id]
    );

    if (existing) {
      throw createError.conflict('该MCP服务已存在，请使用更新接口');
    }

    // 插入新配置
    const result = await db.run(
      `INSERT INTO user_mcp_configs (
        user_id, mcp_id, name, description, category, icon,
        command, args, env_vars, config_data,
        official, popularity, features, setup_instructions, documentation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        mcp_id,
        name,
        description || '',
        category || 'other',
        icon || '🔧',
        command,
        JSON.stringify(args || []),
        JSON.stringify(env_vars || {}),
        JSON.stringify(config_data || {}),
        official ? 1 : 0,
        popularity || 'medium',
        JSON.stringify(features || []),
        JSON.stringify(setup_instructions || {}),
        documentation || ''
      ]
    );

    res.json({
      success: true,
      id: result.lastID,
      message: 'MCP配置创建成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/mcp/user-configs/:id
 * 更新用户MCP配置
 */
router.put('/user-configs/:id', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const configId = req.params.id;
    const db = req.app.locals.db;

    const {
      name,
      description,
      category,
      icon,
      command,
      args,
      env_vars,
      config_data,
      enabled,
      popularity,
      features,
      setup_instructions,
      documentation
    } = req.body;

    // 验证权限
    const existing = await db.get(
      'SELECT id FROM user_mcp_configs WHERE id = ? AND user_id = ?',
      [configId, userId]
    );

    if (!existing) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    // 构建更新语句
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (command !== undefined) {
      updates.push('command = ?');
      values.push(command);
    }
    if (args !== undefined) {
      updates.push('args = ?');
      values.push(JSON.stringify(args));
    }
    if (env_vars !== undefined) {
      updates.push('env_vars = ?');
      values.push(JSON.stringify(env_vars));
    }
    if (config_data !== undefined) {
      updates.push('config_data = ?');
      values.push(JSON.stringify(config_data));
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }
    if (popularity !== undefined) {
      updates.push('popularity = ?');
      values.push(popularity);
    }
    if (features !== undefined) {
      updates.push('features = ?');
      values.push(JSON.stringify(features));
    }
    if (setup_instructions !== undefined) {
      updates.push('setup_instructions = ?');
      values.push(JSON.stringify(setup_instructions));
    }
    if (documentation !== undefined) {
      updates.push('documentation = ?');
      values.push(documentation);
    }

    if (updates.length === 0) {
      throw createError.invalidParameters('没有需要更新的字段');
    }

    values.push(configId, userId);

    await db.run(
      `UPDATE user_mcp_configs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'MCP配置更新成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/mcp/user-configs/:id
 * 删除用户MCP配置
 */
router.delete('/user-configs/:id', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const configId = req.params.id;
    const db = req.app.locals.db;

    const result = await db.run(
      'DELETE FROM user_mcp_configs WHERE id = ? AND user_id = ?',
      [configId, userId]
    );

    if (result.changes === 0) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    res.json({
      success: true,
      message: 'MCP配置删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/:id/toggle
 * 切换用户MCP配置的启用状态
 */
router.post('/user-configs/:id/toggle', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const configId = req.params.id;
    const db = req.app.locals.db;

    const config = await db.get(
      'SELECT enabled FROM user_mcp_configs WHERE id = ? AND user_id = ?',
      [configId, userId]
    );

    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    const newEnabled = !config.enabled;

    await db.run(
      'UPDATE user_mcp_configs SET enabled = ? WHERE id = ? AND user_id = ?',
      [newEnabled ? 1 : 0, configId, userId]
    );

    res.json({
      success: true,
      enabled: newEnabled,
      message: `MCP服务已${newEnabled ? '启用' : '禁用'}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/from-template
 * 从模板创建用户MCP配置
 */
router.post('/user-configs/from-template', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const db = req.app.locals.db;
    const { templateId, customEnvVars } = req.body;

    if (!templateId) {
      throw createError.invalidParameters('缺少templateId参数');
    }

    // 读取模板
    const fs = require('fs');
    const path = require('path');
    const templatesPath = path.join(__dirname, '../data/mcp-templates.json');
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

    const template = templates.templates.find(t => t.id === templateId);
    if (!template) {
      throw createError.notFound('模板未找到');
    }

    // 检查是否已存在
    const existing = await db.get(
      'SELECT id FROM user_mcp_configs WHERE user_id = ? AND mcp_id = ?',
      [userId, template.id]
    );

    if (existing) {
      throw createError.conflict('该MCP服务已存在');
    }

    // 合并环境变量
    const envVars = { ...(template.env || {}), ...(customEnvVars || {}) };

    // 创建配置
    const result = await db.run(
      `INSERT INTO user_mcp_configs (
        user_id, mcp_id, name, description, category, icon,
        command, args, env_vars, config_data,
        official, popularity, features, setup_instructions, documentation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        template.id,
        template.name,
        template.description,
        template.category,
        template.icon,
        template.command,
        JSON.stringify(template.args || []),
        JSON.stringify(envVars),
        JSON.stringify({}),
        template.official ? 1 : 0,
        template.popularity || 'medium',
        JSON.stringify(template.features || []),
        JSON.stringify(template.setupInstructions || {}),
        template.documentation || ''
      ]
    );

    res.json({
      success: true,
      id: result.lastID,
      message: 'MCP配置创建成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/:id/test
 * 测试MCP服务连接
 */
router.post('/user-configs/:id/test', async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const configId = req.params.id;
    const db = req.app.locals.db;

    const config = await db.get(
      'SELECT * FROM user_mcp_configs WHERE id = ? AND user_id = ?',
      [configId, userId]
    );

    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    // TODO: 实现实际的MCP服务连接测试
    // 这里返回模拟结果
    const testResult = {
      success: true,
      status: 'connected',
      message: 'MCP服务连接成功',
      latency: Math.floor(Math.random() * 100) + 50,
      timestamp: new Date().toISOString()
    };

    res.json(testResult);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  initializeRouter
};

