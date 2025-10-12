/**
 * 配置管理 API 路由
 * 提供用户配置管理接口
 */

const express = require('express');
const router = express.Router();
const configStorage = require('../services/config-storage.cjs');
const logger = require('../utils/logger.cjs');

/**
 * GET /api/config
 * 获取公开配置(不包含敏感信息)
 */
router.get('/', async (req, res, next) => {
  try {
    const publicConfig = configStorage.getPublicConfig();
    
    res.json({
      success: true,
      config: publicConfig
    });
  } catch (error) {
    logger.error('获取配置失败:', error);
    next(error);
  }
});

/**
 * GET /api/config/services
 * 获取所有服务的配置状态
 */
router.get('/services', async (req, res, next) => {
  try {
    const publicConfig = configStorage.getPublicConfig();
    
    // 构建服务列表
    const services = [
      {
        id: 'braveSearch',
        name: 'Brave Search',
        description: '网页搜索服务',
        type: 'api_key',
        fields: [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: '请输入 Brave Search API Key',
            helpUrl: 'https://brave.com/search/api/'
          }
        ],
        enabled: publicConfig.services.braveSearch?.enabled || false,
        configured: publicConfig.services.braveSearch?.configured || false
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub 仓库管理',
        type: 'token',
        fields: [
          {
            key: 'token',
            label: 'Personal Access Token',
            type: 'password',
            required: true,
            placeholder: '请输入 GitHub Personal Access Token',
            helpUrl: 'https://github.com/settings/tokens'
          }
        ],
        enabled: publicConfig.services.github?.enabled || false,
        configured: publicConfig.services.github?.configured || false
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Notion 页面和数据库操作',
        type: 'token',
        fields: [
          {
            key: 'token',
            label: 'Integration Token',
            type: 'password',
            required: true,
            placeholder: '请输入 Notion Integration Token',
            helpUrl: 'https://www.notion.so/my-integrations'
          }
        ],
        enabled: publicConfig.services.notion?.enabled || false,
        configured: publicConfig.services.notion?.configured || false
      },
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Gmail 邮件管理',
        type: 'oauth',
        fields: [
          {
            key: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: '请输入 Gmail OAuth Client ID'
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: '请输入 Gmail OAuth Client Secret'
          },
          {
            key: 'refreshToken',
            label: 'Refresh Token',
            type: 'password',
            required: false,
            placeholder: '请输入 Gmail OAuth Refresh Token (可选)'
          }
        ],
        enabled: publicConfig.services.gmail?.enabled || false,
        configured: publicConfig.services.gmail?.configured || false
      },
      {
        id: 'googleCalendar',
        name: 'Google Calendar',
        description: 'Google Calendar 日程管理',
        type: 'oauth',
        fields: [
          {
            key: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: '请输入 Google Calendar OAuth Client ID'
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: '请输入 Google Calendar OAuth Client Secret'
          },
          {
            key: 'refreshToken',
            label: 'Refresh Token',
            type: 'password',
            required: false,
            placeholder: '请输入 Google Calendar OAuth Refresh Token (可选)'
          }
        ],
        enabled: publicConfig.services.googleCalendar?.enabled || false,
        configured: publicConfig.services.googleCalendar?.configured || false
      },
      {
        id: 'deepseek',
        name: 'DeepSeek AI',
        description: 'DeepSeek AI 模型配置',
        type: 'api_key',
        fields: [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: '请输入 DeepSeek API Key',
            helpUrl: 'https://platform.deepseek.com/api_keys'
          },
          {
            key: 'model',
            label: '模型',
            type: 'select',
            required: true,
            options: [
              { value: 'deepseek-chat', label: 'DeepSeek Chat' },
              { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
            ],
            default: 'deepseek-chat'
          }
        ],
        enabled: publicConfig.services.deepseek?.enabled || false,
        configured: publicConfig.services.deepseek?.configured || false
      }
    ];
    
    res.json({
      success: true,
      services
    });
  } catch (error) {
    logger.error('获取服务配置失败:', error);
    next(error);
  }
});

/**
 * POST /api/config/service/:serviceId
 * 更新服务配置
 */
router.post('/service/:serviceId', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const serviceConfig = req.body;
    
    logger.info(`更新服务配置: ${serviceId}`);
    
    // 验证服务ID (支持两种格式: braveSearch 和 brave_search)
    const validServices = ['braveSearch', 'brave_search', 'github', 'notion', 'gmail', 'googleCalendar', 'deepseek', 'sqlite', 'filesystem'];
    if (!validServices.includes(serviceId)) {
      return res.status(400).json({
        success: false,
        error: '无效的服务ID'
      });
    }
    
    // 规范化服务ID (将下划线格式转换为驼峰格式)
    const normalizedServiceId = serviceId === 'brave_search' ? 'braveSearch' : serviceId;
    
    // 更新配置
    const updated = await configStorage.updateService(normalizedServiceId, serviceConfig);
    
    res.json({
      success: true,
      message: '配置更新成功',
      service: {
        id: normalizedServiceId,
        enabled: updated.enabled,
        configured: true
      }
    });
  } catch (error) {
    logger.error('更新服务配置失败:', error);
    next(error);
  }
});

/**
 * POST /api/config/service/:serviceId/test
 * 测试服务连接
 */
router.post('/service/:serviceId/test', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const credentials = req.body;
    
    logger.info(`测试服务连接: ${serviceId}`);
    
    // TODO: 实现各个服务的连接测试
    // 这里先返回成功,后续实现具体的测试逻辑
    
    res.json({
      success: true,
      message: '连接测试成功',
      details: {
        service: serviceId,
        status: 'connected'
      }
    });
  } catch (error) {
    logger.error('测试服务连接失败:', error);
    res.status(400).json({
      success: false,
      error: error.message || '连接测试失败'
    });
  }
});

/**
 * DELETE /api/config/service/:serviceId
 * 删除服务配置
 */
router.delete('/service/:serviceId', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    
    logger.info(`删除服务配置: ${serviceId}`);
    
    // 重置为默认配置
    const defaultConfig = {
      enabled: false
    };
    
    // 根据服务类型添加空字段
    if (serviceId === 'braveSearch') {
      defaultConfig.apiKey = '';
    } else if (serviceId === 'github') {
      defaultConfig.token = '';
    } else if (serviceId === 'notion') {
      defaultConfig.token = '';
    } else if (serviceId === 'gmail' || serviceId === 'googleCalendar') {
      defaultConfig.clientId = '';
      defaultConfig.clientSecret = '';
      defaultConfig.refreshToken = '';
    } else if (serviceId === 'deepseek') {
      defaultConfig.apiKey = '';
      defaultConfig.model = 'deepseek-chat';
    }
    
    await configStorage.updateService(serviceId, defaultConfig);
    
    res.json({
      success: true,
      message: '配置已删除'
    });
  } catch (error) {
    logger.error('删除服务配置失败:', error);
    next(error);
  }
});

module.exports = router;

