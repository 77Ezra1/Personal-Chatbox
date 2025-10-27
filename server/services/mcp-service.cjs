/**
 * MCP服务数据层
 * 处理user_mcp_configs表的CRUD操作
 */

const { db } = require('../db/init.cjs');
const logger = require('../utils/logger.cjs');
const config = require('../config.cjs');
const configStorage = require('./config-storage.cjs');

class MCPService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1分钟缓存
  }

  /**
   * 为新用户初始化默认MCP服务配置
   * @param {number} userId - 用户ID
   */
  async initializeDefaultServicesForUser(userId) {
    try {
      logger.info(`[MCPService] 为用户 ${userId} 初始化默认MCP服务`);

      const builtInServices = this.getBuiltInServices();

      if (!db || !db.prepare) {
        logger.warn('[MCPService] 数据库不可用，跳过初始化');
        return;
      }

      // 检查用户是否已经有MCP配置
      const existing = await db.prepare(`
        SELECT COUNT(*) as count
        FROM user_mcp_configs
        WHERE user_id = ?
      `).get(userId);

      if (existing && existing.count > 0) {
        logger.info(`[MCPService] 用户 ${userId} 已有 ${existing.count} 个MCP配置，跳过初始化`);
        return;
      }

      // 批量插入
      const stmt = db.prepare(`
        INSERT INTO user_mcp_configs (
          user_id, mcp_id, name, description, category, icon,
          command, args, env_vars, config_data,
          official, popularity, features, setup_instructions, documentation,
          enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insert = db.transaction((services) => {
        services.forEach(service => {
          stmt.run(
            userId,
            service.id,
            service.name,
            service.description || '',
            service.category || 'other',
            service.icon || '🔌',
            service.command,
            JSON.stringify(service.args || []),
            JSON.stringify(service.env || {}),
            JSON.stringify(service.configData || {}),
            true, // official
            service.popularity || 'medium',
            JSON.stringify(service.features || []),
            JSON.stringify(service.setup_instructions || {}),
            service.documentation || '',
            service.autoLoad ? true : false // enabled
          );
        });
      });

      insert(builtInServices);

      logger.info(`[MCPService] 成功为用户 ${userId} 初始化 ${builtInServices.length} 个MCP服务`);

    } catch (error) {
      logger.error(`[MCPService] 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 从config.cjs读取内置服务配置
   * @returns {Array} 内置服务列表
   */
  getBuiltInServices() {
    const services = [];

    for (const [serviceId, serviceConfig] of Object.entries(config.services || {})) {
      services.push({
        id: serviceConfig.id || serviceId,
        name: serviceConfig.name || serviceId,
        description: serviceConfig.description || '',
        category: this.categorizeService(serviceId),
        icon: this.getServiceIcon(serviceId),
        command: serviceConfig.command || 'npx',
        args: serviceConfig.args || [],
        env: serviceConfig.env || {},
        configData: {
          requiresConfig: serviceConfig.requiresConfig || false,
          configurable: serviceConfig.configurable || false,
          configFields: serviceConfig.configFields || [],
          signupUrl: serviceConfig.signupUrl || '',
          apiKeyPlaceholder: serviceConfig.apiKeyPlaceholder || ''
        },
        popularity: this.getServicePopularity(serviceId),
        features: serviceConfig.features || [],
        setup_instructions: {
          en: `Install and configure ${serviceConfig.name}`,
          zh: `安装并配置 ${serviceConfig.name}`
        },
        documentation: serviceConfig.documentation || '',
        autoLoad: serviceConfig.autoLoad !== undefined ? serviceConfig.autoLoad : false
      });
    }

    return services;
  }

  /**
   * 服务分类
   */
  categorizeService(serviceId) {
    const categoryMap = {
      // 搜索类
      'brave_search': 'search',
      'wikipedia': 'search',

      // 开发类
      'github': 'development',
      'git': 'development',
      'filesystem': 'development',

      // 数据库类
      'sqlite': 'database',
      'postgres': 'database',

      // AI增强类
      'memory': 'ai',
      'sequential_thinking': 'ai',

      // 云服务类
      'aws': 'cloud',
      'google_cloud': 'cloud',

      // 自动化类
      'puppeteer': 'automation',
      'playwright': 'automation',

      // 通讯类
      'slack': 'communication',
      'discord': 'communication',

      // 效率类
      'notion': 'productivity',
      'todoist': 'productivity'
    };

    return categoryMap[serviceId] || 'other';
  }

  /**
   * 获取服务图标
   */
  getServiceIcon(serviceId) {
    const iconMap = {
      'brave_search': '🔍',
      'wikipedia': '📚',
      'github': '🐙',
      'git': '📦',
      'filesystem': '📁',
      'sqlite': '🗄️',
      'postgres': '🐘',
      'memory': '🧠',
      'sequential_thinking': '🤔',
      'aws': '☁️',
      'google_cloud': '☁️',
      'puppeteer': '🎭',
      'slack': '💬',
      'notion': '📝',
      'todoist': '✅'
    };

    return iconMap[serviceId] || '🔌';
  }

  /**
   * 获取服务热度
   */
  getServicePopularity(serviceId) {
    const highPopularity = ['github', 'filesystem', 'brave_search', 'memory'];
    const lowPopularity = ['puppeteer', 'slack', 'todoist'];

    if (highPopularity.includes(serviceId)) return 'high';
    if (lowPopularity.includes(serviceId)) return 'low';
    return 'medium';
  }

  /**
   * 获取用户的所有MCP服务配置
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 服务列表
   */
  async getUserServices(userId) {
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    if (!db || !db.prepare) {
      logger.warn('[MCPService] 数据库不可用');
      return [];
    }

    const services = await db.prepare(`
      SELECT * FROM user_mcp_configs
      WHERE user_id = ?
      ORDER BY official DESC, category ASC, name ASC
    `).all(userId);

    // 解析JSON字段
    const parsed = services.map(s => this.parseServiceRecord(s));

    this.cache.set(cacheKey, {
      data: parsed,
      timestamp: Date.now()
    });

    return parsed;
  }

  /**
   * 获取用户已启用的MCP服务
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 启用的服务列表
   */
  async getEnabledServices(userId) {
    if (!db || !db.prepare) {
      return [];
    }

    const services = await db.prepare(`
      SELECT * FROM user_mcp_configs
      WHERE user_id = ? AND enabled = 1
      ORDER BY name ASC
    `).all(userId);

    return services.map(s => this.parseServiceRecord(s));
  }

  /**
   * 获取单个服务详情
   * @param {number} userId - 用户ID
   * @param {number} serviceId - 服务ID
   * @returns {Promise<Object|null>} 服务详情
   */
  async getService(userId, serviceId) {
    if (!db || !db.prepare) {
      return null;
    }

    const service = await db.prepare(`
      SELECT * FROM user_mcp_configs
      WHERE id = ? AND user_id = ?
    `).get(serviceId, userId);

    return service ? this.parseServiceRecord(service) : null;
  }

  /**
   * 创建新的MCP服务配置
   * @param {number} userId - 用户ID
   * @param {Object} serviceData - 服务数据
   * @returns {Promise<Object>} 创建的服务
   */
  async createService(userId, serviceData) {
    // 验证配置
    this.validateServiceConfig(serviceData);

    if (!db || !db.prepare) {
      throw new Error('数据库不可用');
    }

    // 检查mcp_id是否重复
    const existing = await db.prepare(`
      SELECT id FROM user_mcp_configs
      WHERE user_id = ? AND mcp_id = ?
    `).get(userId, serviceData.mcp_id);

    if (existing) {
      throw new Error(`服务ID "${serviceData.mcp_id}" 已存在`);
    }

    // 插入新服务
    const officialFlag = serviceData.official ? 1 : 0;
    const enabledFlag = serviceData.enabled ? 1 : 0;

    const result = await db.prepare(`
      INSERT INTO user_mcp_configs (
        user_id, mcp_id, name, description, category, icon,
        command, args, env_vars, config_data,
        official, popularity, features, setup_instructions, documentation,
        enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      serviceData.mcp_id,
      serviceData.name,
      serviceData.description || '',
      serviceData.category || 'other',
      serviceData.icon || '🔌',
      serviceData.command,
      JSON.stringify(serviceData.args || []),
      JSON.stringify(serviceData.env_vars || {}),
      JSON.stringify(serviceData.config_data || {}),
      officialFlag, // official (用户自定义服务)
      'medium',
      JSON.stringify(serviceData.features || []),
      JSON.stringify(serviceData.setup_instructions || {}),
      serviceData.documentation || '',
      enabledFlag // enabled (默认禁用)
    );

    // 清除缓存
    this.cache.delete(`user_${userId}`);

    logger.info(`[MCPService] 用户 ${userId} 创建新服务: ${serviceData.mcp_id}`);

    return await this.getService(userId, result.lastInsertRowid);
  }

  /**
   * 更新MCP服务配置
   * @param {number} userId - 用户ID
   * @param {number} serviceId - 服务ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的服务
   */
  async updateService(userId, serviceId, updates) {
    if (!db || !db.prepare) {
      throw new Error('数据库不可用');
    }

    // 验证权限
    const existing = await this.getService(userId, serviceId);
    if (!existing) {
      throw new Error('服务不存在或无权访问');
    }

    // 构建更新语句
    const allowedFields = [
      'name', 'description', 'category', 'icon',
      'command', 'args', 'env_vars', 'config_data',
      'popularity', 'features', 'setup_instructions', 'documentation',
      'enabled'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);

        // JSON字段需要stringify
        if (['args', 'env_vars', 'config_data', 'features', 'setup_instructions'].includes(key)) {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'enabled') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return existing;
    }

    values.push(serviceId, userId);

    await db.prepare(`
      UPDATE user_mcp_configs
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(...values);

    // 清除缓存
    this.cache.delete(`user_${userId}`);

    logger.info(`[MCPService] 用户 ${userId} 更新服务 ${serviceId}`);

    return await this.getService(userId, serviceId);
  }

  /**
   * 删除MCP服务配置
   * @param {number} userId - 用户ID
   * @param {number} serviceId - 服务ID
   */
  async deleteService(userId, serviceId) {
    if (!db || !db.prepare) {
      throw new Error('数据库不可用');
    }

    // 验证权限
    const existing = await this.getService(userId, serviceId);
    if (!existing) {
      throw new Error('服务不存在或无权访问');
    }

    // 不允许删除官方服务
    if (existing.official) {
      throw new Error('不能删除官方服务，只能禁用');
    }

    await db.prepare(`
      DELETE FROM user_mcp_configs
      WHERE id = ? AND user_id = ?
    `).run(serviceId, userId);

    // 清除缓存
    this.cache.delete(`user_${userId}`);

    logger.info(`[MCPService] 用户 ${userId} 删除服务 ${serviceId}`);
  }

  /**
   * 切换服务启用状态
   * @param {number} userId - 用户ID
   * @param {number} serviceId - 服务ID
   * @param {boolean} enabled - 是否启用
   * @returns {Promise<Object>} 更新后的服务
   */
  async toggleService(userId, serviceId, enabled) {
    return await this.updateService(userId, serviceId, { enabled });
  }

  /**
   * 解析数据库记录（JSON字段）
   * @param {Object} record - 数据库记录
   * @returns {Object} 解析后的记录
   */
  parseServiceRecord(record) {
    try {
      return {
        ...record,
        args: this.safeJSONParse(record.args, []),
        env_vars: this.safeJSONParse(record.env_vars, {}),
        config_data: this.safeJSONParse(record.config_data, {}),
        features: this.safeJSONParse(record.features, []),
        setup_instructions: this.safeJSONParse(record.setup_instructions, {}),
        // 转换SQLite的0/1为boolean
        enabled: record.enabled === 1 || record.enabled === true,
        official: record.official === 1 || record.official === true
      };
    } catch (error) {
      logger.error('[MCPService] 解析服务记录失败:', error);
      return record;
    }
  }

  /**
   * 安全的JSON解析
   */
  safeJSONParse(str, defaultValue = null) {
    if (!str) return defaultValue;
    if (typeof str !== 'string') return str;

    try {
      return JSON.parse(str);
    } catch (error) {
      logger.warn('[MCPService] JSON解析失败:', str);
      return defaultValue;
    }
  }

  /**
   * 验证服务配置
   * @param {Object} config - 服务配置
   * @throws {Error} 验证失败时抛出错误
   */
  validateServiceConfig(config) {
    // 必填字段
    const required = ['mcp_id', 'name', 'command'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`缺少必填字段: ${field}`);
      }
    }

    // 验证mcp_id格式
    if (!/^[a-z0-9_-]+$/.test(config.mcp_id)) {
      throw new Error('mcp_id只能包含小写字母、数字、下划线和连字符');
    }

    // 验证命令
    const allowedCommands = ['npx', 'node', 'python', 'python3', 'deno'];
    if (!allowedCommands.includes(config.command)) {
      throw new Error(`不允许的命令: ${config.command}。允许的命令: ${allowedCommands.join(', ')}`);
    }

    // 验证参数安全性
    if (config.args) {
      const dangerousPatterns = [';', '&&', '||', '|', '>', '<', '`', '$'];
      const argsStr = JSON.stringify(config.args);

      for (const pattern of dangerousPatterns) {
        if (argsStr.includes(pattern)) {
          throw new Error(`参数中包含危险字符: ${pattern}`);
        }
      }
    }

    return true;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    logger.info('[MCPService] 缓存已清除');
  }
}

// 导出单例
const mcpService = new MCPService();
module.exports = mcpService;
