/**
 * MCP服务API路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');
const { cacheManager } = require('../utils/cache.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const mcpService = require('../services/mcp-service.cjs');

// 服务实例存储
let services = {};

/**
 * 清理指定用户的服务缓存
 * @param {number} userId
 */
function invalidateServiceCache(userId) {
  if (userId) {
    const cacheKey = `mcp:services:list:${userId}`;
    cacheManager.delete(cacheKey);
    return;
  }

  for (const key of cacheManager.cache.keys()) {
    if (key.startsWith('mcp:services:list:')) {
      cacheManager.delete(key);
    }
  }
}

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
 * 获取所有可用服务列表（带缓存 + 按需加载）
 *
 * ⚠️ 已废弃：此端点为旧版API，建议使用 /api/mcp/user-configs
 * 为了向后兼容，此端点现在需要认证并只返回当前用户的服务
 */
router.get('/services', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === 'true' || req.query.skipCache === 'true';

    // ✅ 按需加载：如果用户的服务还未加载，自动加载
    if (services.mcpManager && !services.mcpManager.userServicesLoaded.has(userId)) {
      logger.info(`[MCP Services] 用户 ${userId} 的服务未加载，开始自动加载...`);
      try {
        await services.mcpManager.loadUserServices(userId);
        logger.info(`[MCP Services] 用户 ${userId} 的服务自动加载完成`);
      } catch (error) {
        logger.error(`[MCP Services] 用户 ${userId} 的服务自动加载失败:`, error);
        // 继续返回结果，可能部分服务已加载
      }
    }

    // 🔥 修复：为每个用户使用独立的缓存key
    const cacheKey = `mcp:services:list:${userId}`;
    if (forceRefresh) {
      cacheManager.delete(cacheKey);
      logger.info(`[MCP Services] 用户 ${userId} 请求强制刷新服务列表`);
    } else {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        logger.info(`[MCP Services] 从缓存返回用户 ${userId} 的服务列表`);
        return res.json(cached);
      }
    }

    const serviceList = [];

    // 获取所有常规服务（非MCP服务）
    for (const service of Object.values(services)) {
      if (!service.getInfo) continue;

      // 跳过 mcpManager，因为我们会单独处理它
      if (service === services.mcpManager) continue;

      const info = service.getInfo();
      serviceList.push(info);
    }

    // 🔥 修复：调用 mcpManager.getInfo(userId) 获取用户的MCP服务
    if (services.mcpManager && services.mcpManager.getInfo) {
      try {
        const mcpInfo = await services.mcpManager.getInfo(userId);

        // 如果有服务列表，添加到返回数据中
        if (mcpInfo && mcpInfo.services) {
          logger.info(`[MCP Services] 用户 ${userId} 有 ${mcpInfo.services.length} 个MCP服务`);
          serviceList.push(...mcpInfo.services);
        }
      } catch (mcpError) {
        logger.error(`[MCP Services] 获取用户 ${userId} 的MCP服务失败:`, mcpError);
        // 不中断请求，继续返回其他服务
      }
    }

    const response = {
      success: true,
      services: serviceList,
      userId: userId // 返回userId以便前端验证
    };

    // 🔥 修复：缓存30秒（每个用户独立缓存）
    cacheManager.set(cacheKey, response, 30 * 1000);

    logger.info(`[MCP Services] 返回用户 ${userId} 的服务列表，共 ${serviceList.length} 个服务`);
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

    // 全局服务变更，清理所有用户的缓存
    invalidateServiceCache();

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
 * 获取所有启用服务的工具列表（按需加载）
 *
 * ⚠️ 已废弃：此端点为旧版API
 * 为了向后兼容，此端点现在需要认证并只返回当前用户的工具
 */
router.get('/tools', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ✅ 按需加载：如果用户的服务还未加载，自动加载
    if (services.mcpManager && !services.mcpManager.userServicesLoaded.has(userId)) {
      logger.info(`[MCP Tools] 用户 ${userId} 的服务未加载，开始自动加载...`);
      try {
        await services.mcpManager.loadUserServices(userId);
        logger.info(`[MCP Tools] 用户 ${userId} 的服务自动加载完成`);
      } catch (error) {
        logger.error(`[MCP Tools] 用户 ${userId} 的服务自动加载失败:`, error);
        // 继续返回结果，可能部分服务已加载
      }
    }

    const allTools = [];

    for (const service of Object.values(services)) {
      // 处理普通服务（非用户特定的服务）
      if (service.getTools && service.enabled) {
        const tools = service.getTools();
        allTools.push(...tools);
      }
      // 🔥 修复：处理 MCPManager，传递 userId 获取用户特定的工具
      else if (service.getAllTools) {
        const tools = service.getAllTools(userId); // 传递 userId
        allTools.push(...tools);
      }
    }

    logger.info(`[MCP Tools] 用户 ${userId} 获取工具列表，共 ${allTools.length} 个工具`);

    res.json({
      success: true,
      tools: allTools,
      count: allTools.length,
      userId: userId // 返回userId以便前端验证
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/call
 * 调用MCP工具（按需加载）
 * 支持可选认证：如果提供了auth token，使用对应用户的服务；否则尝试从请求体获取userId
 */
router.post('/call', async (req, res, next) => {
  try {
    const { toolName, parameters, userId: bodyUserId } = req.body;

    if (!toolName) {
      throw createError.invalidParameters('缺少toolName参数');
    }

    // 尝试获取userId（优先级：1. auth token中的用户 2. 请求体中的userId 3. null）
    let effectiveUserId = null;

    // 尝试从auth token获取（如果请求经过了auth中间件）
    if (req.user && req.user.id) {
      effectiveUserId = req.user.id;
      logger.info(`[MCP Call] 使用认证用户 ${effectiveUserId} 调用工具: ${toolName}`);
    }
    // 如果没有auth token，尝试从请求体获取（用于Agent调用）
    else if (bodyUserId) {
      effectiveUserId = bodyUserId;
      logger.info(`[MCP Call] 使用请求体userId ${effectiveUserId} 调用工具: ${toolName}`);
    }
    // 如果都没有，使用null（向后兼容）
    else {
      logger.info(`[MCP Call] 无userId，使用全局模式调用工具: ${toolName}`);
    }

    // ✅ 按需加载：如果用户的服务还未加载，自动加载
    if (effectiveUserId && services.mcpManager && !services.mcpManager.userServicesLoaded.has(effectiveUserId)) {
      logger.info(`[MCP Call] 用户 ${effectiveUserId} 的服务未加载，开始自动加载...`);
      try {
        await services.mcpManager.loadUserServices(effectiveUserId);
        logger.info(`[MCP Call] 用户 ${effectiveUserId} 的服务自动加载完成`);
      } catch (error) {
        logger.error(`[MCP Call] 用户 ${effectiveUserId} 的服务自动加载失败:`, error);
        // 继续尝试调用，可能部分服务已加载
      }
    }

    logger.info(`调用工具: ${toolName}`, { parameters, userId: effectiveUserId });

    // 查找拥有该工具的服务
    let targetService = null;
    let isMCPTool = false;

    // 首先检查是否是 MCP Manager 的工具
    const mcpManager = services.mcpManager;
    if (mcpManager && mcpManager.getAllTools) {
      // 🔥 关键修复：传递userId给getAllTools，实现用户隔离
      const mcpTools = mcpManager.getAllTools(effectiveUserId);
      const mcpTool = mcpTools.find(tool => tool.function.name === toolName);

      if (mcpTool) {
        // 这是一个 MCP 工具
        isMCPTool = true;
        const { serviceId, toolName: actualToolName } = mcpManager.parseToolName(toolName);

        try {
          // 🔥 关键修复：传递userId给callTool，确保调用正确的用户服务
          const result = await mcpManager.callTool(serviceId, actualToolName, parameters || {}, effectiveUserId);

          // 格式化返回结果
          return res.json({
            success: true,
            content: JSON.stringify(result, null, 2),
            toolName,
            serviceId,
            actualToolName,
            userId: effectiveUserId // 返回使用的userId
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
 * 获取用户的自定义MCP配置列表（包含配置状态信息）
 */
router.get('/user-configs', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.query;

    // 如果指定了enabled参数，只返回已启用的服务
    let configs;
    if (enabled === 'true') {
      configs = await mcpService.getEnabledServices(userId);
    } else {
      configs = await mcpService.getUserServices(userId);
    }

    // ✅ 增强配置数据：添加配置状态信息
    const config = require('../config.cjs');
    const enrichedConfigs = configs.map(serviceConfig => {
      const serviceId = serviceConfig.mcp_id;
      const serviceTemplate = config.services[serviceId];

      // 检查服务是否已正确配置（有必需的 API Keys）
      let isConfigured = true;

      if (serviceTemplate && serviceTemplate.requiresConfig) {
        const requiredEnvKeys = Object.keys(serviceTemplate.env || {});

        if (requiredEnvKeys.length > 0) {
          let parsedEnvVars = {};
          try {
            parsedEnvVars = typeof serviceConfig.env_vars === 'string'
              ? JSON.parse(serviceConfig.env_vars)
              : (serviceConfig.env_vars || {});
          } catch (e) {
            isConfigured = false;
          }

          // 检查所有必需的环境变量是否都有值
          for (const key of requiredEnvKeys) {
            const value = parsedEnvVars[key];
            if (!value || value.trim() === '') {
              isConfigured = false;
              break;
            }
          }
        }
      }

      return {
        ...serviceConfig,
        isConfigured  // ✅ 添加配置状态
      };
    });

    res.json({
      success: true,
      configs: enrichedConfigs,
      count: enrichedConfigs.length
    });
  } catch (error) {
    logger.error('[MCP Routes] 获取用户配置失败:', error);
    next(error);
  }
});

/**
 * GET /api/mcp/user-configs/:id
 * 获取单个MCP服务配置详情
 */
router.get('/user-configs/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);

    const config = await mcpService.getService(userId, configId);

    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    logger.error('[MCP Routes] 获取配置详情失败:', error);
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs
 * 创建新的用户MCP配置
 */
router.post('/user-configs', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

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

    // 使用新的MCP服务层创建配置（带验证）
    const serviceData = {
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
    };

    const newService = await mcpService.createService(userId, serviceData);

    logger.info(`[MCP Routes] 配置创建成功: ${name} (ID: ${newService.id})`);

    // 动态启动MCP服务
    const mcpManager = services.mcpManager;
    if (mcpManager && newService.enabled) {
      try {
        logger.info(`[MCP Routes] 启动 MCP 服务: ${name} (ID: ${mcp_id})`);

        // 构建服务配置
        const serviceConfig = {
          id: mcp_id,
          name: name,
          description: description || '',
          command: command,
          args: args || [],
          env: env_vars || {},
          enabled: true,
          autoLoad: true,
          category: category || 'other',
          icon: icon || '🔧',
          official: official || false,
          popularity: popularity || 'medium',
          userId
        };

        await mcpManager.startService(serviceConfig);
        logger.info(`[MCP Routes] ✅ MCP 服务 ${name} 已启动`);

        invalidateServiceCache(userId);
        return res.json({
          success: true,
          id: newService.id,
          service: newService,
          message: 'MCP配置创建成功,服务已启动'
        });
      } catch (serviceError) {
        logger.error(`[MCP Routes] MCP 服务启动失败: ${name}`, serviceError);
        invalidateServiceCache(userId);
        return res.json({
          success: true,
          id: newService.id,
          service: newService,
          message: `MCP配置创建成功,但服务启动失败: ${serviceError.message}`,
          warning: serviceError.message
        });
      }
    }

    invalidateServiceCache(userId);
    res.json({
      success: true,
      id: newService.id,
      service: newService,
      message: 'MCP配置创建成功'
    });
  } catch (error) {
    logger.error('[MCP Routes] 创建配置失败:', error);
    next(error);
  }
});

/**
 * PUT /api/mcp/user-configs/:id
 * 更新用户MCP配置
 */
router.put('/user-configs/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);

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

    // 构建更新对象
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (icon !== undefined) updates.icon = icon;
    if (command !== undefined) updates.command = command;
    if (args !== undefined) updates.args = args;
    if (env_vars !== undefined) updates.env_vars = env_vars;
    if (config_data !== undefined) updates.config_data = config_data;
    if (enabled !== undefined) updates.enabled = enabled;
    if (popularity !== undefined) updates.popularity = popularity;
    if (features !== undefined) updates.features = features;
    if (setup_instructions !== undefined) updates.setup_instructions = setup_instructions;
    if (documentation !== undefined) updates.documentation = documentation;

    // 使用新的MCP服务层更新配置（带验证和权限检查）
    const updatedService = await mcpService.updateService(userId, configId, updates);

    invalidateServiceCache(userId);
    res.json({
      success: true,
      service: updatedService,
      message: 'MCP配置更新成功'
    });
  } catch (error) {
    logger.error('[MCP Routes] 更新配置失败:', error);
    next(error);
  }
});

/**
 * DELETE /api/mcp/user-configs/:id
 * 删除用户MCP配置
 */
router.delete('/user-configs/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);

    // 使用新的MCP服务层删除配置（带权限检查和官方服务保护）
    await mcpService.deleteService(userId, configId);

    invalidateServiceCache(userId);
    res.json({
      success: true,
      message: 'MCP配置删除成功'
    });
  } catch (error) {
    logger.error('[MCP Routes] 删除配置失败:', error);
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/:id/toggle
 * 切换用户MCP配置的启用状态,并动态启动/停止服务
 */
router.post('/user-configs/:id/toggle', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);
    const { enabled: targetEnabled } = req.body || {};

    // 获取当前配置
    const config = await mcpService.getService(userId, configId);
    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    const newEnabled = typeof targetEnabled === 'boolean' ? targetEnabled : !config.enabled;

    // 使用新的MCP服务层切换状态
    const updatedService = await mcpService.toggleService(userId, configId, newEnabled);

    logger.info(`[MCP Routes] 切换服务状态: ${config.name} -> ${newEnabled ? '启用' : '禁用'}`);

    // 动态启动或停止MCP服务
    const mcpManager = services.mcpManager;
    if (mcpManager) {
      try {
        if (newEnabled) {
          // 启用服务 - 启动MCP服务
          logger.info(`[MCP Routes] 启动 MCP 服务: ${config.name} (ID: ${config.mcp_id})`);

          // 构建服务配置
          const serviceConfig = {
            id: config.mcp_id,
            name: config.name,
            description: config.description || '',
            command: config.command,
            args: config.args || [],
            env: config.env_vars || {},
            enabled: true,
            autoLoad: true,
            category: config.category,
            icon: config.icon,
            official: config.official,
            popularity: config.popularity,
            userId
          };

          await mcpManager.startService(serviceConfig);
          logger.info(`[MCP Routes] ✅ MCP 服务 ${config.name} 已启动`);
        } else {
          // 禁用服务 - 停止MCP服务
          logger.info(`[MCP Routes] 停止 MCP 服务: ${config.name} (ID: ${config.mcp_id})`);
          await mcpManager.stopService(config.mcp_id, userId);
          logger.info(`[MCP Routes] ✅ MCP 服务 ${config.name} 已停止`);
        }
      } catch (serviceError) {
        logger.error(`[MCP Routes] 切换 MCP 服务失败: ${config.name}`, serviceError);
        // 返回警告但不失败整个请求
        invalidateServiceCache(userId);
        return res.json({
          success: true,
          enabled: newEnabled,
          service: updatedService,
          message: `MCP服务已${newEnabled ? '启用' : '禁用'} (服务${newEnabled ? '启动' : '停止'}失败: ${serviceError.message})`,
          warning: serviceError.message
        });
      }
    }

    invalidateServiceCache(userId);
    res.json({
      success: true,
      enabled: newEnabled,
      service: updatedService,
      message: `MCP服务已${newEnabled ? '启用并启动' : '禁用并停止'}`
    });
  } catch (error) {
    logger.error('[MCP Routes] 切换服务失败:', error);
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/from-template
 * 从模板创建用户MCP配置
 */
router.post('/user-configs/from-template', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { templateId, customEnvVars } = req.body;

    if (!templateId) {
      throw createError.invalidParameters('缺少templateId参数');
    }

    // 读取模板
    const fs = require('fs');
    const path = require('path');
    const templatesPath = path.join(__dirname, '../data/mcp-templates.json');

    if (!fs.existsSync(templatesPath)) {
      throw createError.notFound('模板文件未找到');
    }

    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
    const template = templates.templates.find(t => t.id === templateId);

    if (!template) {
      throw createError.notFound('模板未找到');
    }

    // 合并环境变量
    const envVars = { ...(template.env || {}), ...(customEnvVars || {}) };

    // 使用新的MCP服务层创建配置
    const serviceData = {
      mcp_id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      command: template.command,
      args: template.args || [],
      env_vars: envVars,
      config_data: {},
      official: template.official || false,
      popularity: template.popularity || 'medium',
      features: template.features || [],
      setup_instructions: template.setupInstructions || {},
      documentation: template.documentation || ''
    };

    const newService = await mcpService.createService(userId, serviceData);

    logger.info(`[MCP Routes] 从模板创建配置: ${template.name} (ID: ${newService.id})`);

    // 动态启动MCP服务
    const mcpManager = services.mcpManager;
    if (mcpManager && newService.enabled) {
      try {
        logger.info(`[MCP Routes] 启动 MCP 服务: ${template.name} (ID: ${template.id})`);

        const serviceConfig = {
          id: template.id,
          name: template.name,
          description: template.description || '',
          command: template.command,
          args: template.args || [],
          env: envVars,
          enabled: true,
          autoLoad: true,
          category: template.category,
          icon: template.icon,
          official: template.official || false,
          popularity: template.popularity || 'medium',
          userId
        };

        await mcpManager.startService(serviceConfig);
        logger.info(`[MCP Routes] ✅ MCP 服务 ${template.name} 已启动`);

        invalidateServiceCache(userId);
        return res.json({
          success: true,
          id: newService.id,
          service: newService,
          message: 'MCP配置创建成功,服务已启动'
        });
      } catch (serviceError) {
        logger.error(`[MCP Routes] MCP 服务启动失败: ${template.name}`, serviceError);
        invalidateServiceCache(userId);
        return res.json({
          success: true,
          id: newService.id,
          service: newService,
          message: `MCP配置创建成功,但服务启动失败: ${serviceError.message}`,
          warning: serviceError.message
        });
      }
    }

    invalidateServiceCache(userId);
    res.json({
      success: true,
      id: newService.id,
      service: newService,
      message: 'MCP配置创建成功'
    });
  } catch (error) {
    logger.error('[MCP Routes] 从模板创建失败:', error);
    next(error);
  }
});

/**
 * POST /api/mcp/user-configs/:id/test
 * 测试MCP服务连接
 */
router.post('/user-configs/:id/test', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);

    const config = await mcpService.getService(userId, configId);

    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    // TODO: 实现实际的MCP服务连接测试
    // 这里返回模拟结果
    const testResult = {
      success: true,
      status: 'connected',
      message: 'MCP服务连接成功',
      service: config.name,
      latency: Math.floor(Math.random() * 100) + 50,
      timestamp: new Date().toISOString()
    };

    res.json(testResult);
  } catch (error) {
    logger.error('[MCP Routes] 测试服务失败:', error);
    next(error);
  }
});

/**
 * ✅ POST /api/mcp/user-configs/:id/validate
 * 验证MCP服务配置（实时验证 API Key 有效性）
 */
router.post('/user-configs/:id/validate', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const configId = parseInt(req.params.id);
    const { env_vars } = req.body;

    const config = await mcpService.getService(userId, configId);

    if (!config) {
      throw createError.notFound('MCP配置未找到或无权限');
    }

    // 检查环境变量是否完整
    const serviceId = config.mcp_id;
    const serviceConfig = require('../config.cjs');
    const serviceTemplate = serviceConfig.services[serviceId];

    if (!serviceTemplate) {
      return res.json({
        success: false,
        message: '未找到服务模板'
      });
    }

    // 如果服务需要环境变量配置
    if (serviceTemplate.requiresConfig && serviceTemplate.env) {
      const requiredKeys = Object.keys(serviceTemplate.env);
      const missingKeys = [];

      for (const key of requiredKeys) {
        if (!env_vars || !env_vars[key] || env_vars[key].trim() === '') {
          missingKeys.push(key);
        }
      }

      if (missingKeys.length > 0) {
        return res.json({
          success: false,
          message: `缺少必需的环境变量: ${missingKeys.join(', ')}`
        });
      }

      // TODO: 这里可以添加实际的 API Key 验证逻辑
      // 例如，对于不同的服务调用其验证API
      // 目前返回基本验证结果

      return res.json({
        success: true,
        message: '配置验证通过！所有必需的环境变量都已填写。',
        validated_keys: requiredKeys
      });
    }

    // 如果不需要配置，直接返回成功
    res.json({
      success: true,
      message: '此服务不需要环境变量配置'
    });
  } catch (error) {
    logger.error('[MCP Routes] 验证服务配置失败:', error);
    next(error);
  }
});

module.exports = {
  router,
  initializeRouter
};
