/**
 * MCP服务API路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');

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
 * GET /api/mcp/services
 * 获取所有可用服务列表
 */
router.get('/services', (req, res, next) => {
  try {
    const serviceList = Object.values(services).map(service => service.getInfo());
    res.json({
      success: true,
      services: serviceList
    });
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
      if (service.enabled) {
        const tools = service.getTools();
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
    
    for (const service of Object.values(services)) {
      if (!service.enabled) continue;
      
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
      healthChecks[id] = await service.healthCheck();
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

module.exports = {
  router,
  initializeRouter
};

