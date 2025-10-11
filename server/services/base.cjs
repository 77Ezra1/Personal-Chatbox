/**
 * MCP服务基类
 */

const logger = require('../utils/logger.cjs');
const { createError } = require('../utils/errors.cjs');

class BaseService {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.enabled = config.enabled;
    this.loaded = false;
    this.tools = [];
  }

  /**
   * 初始化服务
   * 子类应该重写此方法
   */
  async initialize() {
    logger.info(`初始化服务: ${this.name}`);
    this.loaded = true;
  }

  /**
   * 获取服务提供的工具列表
   */
  getTools() {
    if (!this.enabled) {
      return [];
    }
    return this.tools;
  }

  /**
   * 执行工具调用
   * 子类必须实现此方法
   */
  async execute(toolName, parameters) {
    throw new Error(`${this.name}未实现execute方法`);
  }

  /**
   * 启用服务
   */
  async enable() {
    if (!this.loaded) {
      await this.initialize();
    }
    this.enabled = true;
    logger.info(`服务已启用: ${this.name}`);
  }

  /**
   * 禁用服务
   */
  disable() {
    this.enabled = false;
    logger.info(`服务已禁用: ${this.name}`);
  }

  /**
   * 检查服务健康状态
   */
  async healthCheck() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      loaded: this.loaded,
      status: this.enabled && this.loaded ? 'healthy' : 'disabled'
    };
  }

  /**
   * 验证参数
   */
  validateParameters(parameters, required = []) {
    for (const field of required) {
      if (!(field in parameters)) {
        throw createError.invalidParameters(`缺少必需参数: ${field}`);
      }
    }
  }

  /**
   * 处理API错误
   */
  handleApiError(error, serviceName) {
    logger.error(`${serviceName}服务错误:`, error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw createError.networkError('无法连接到服务');
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        throw createError.apiRateLimit(serviceName);
      }
      if (status >= 500) {
        throw createError.serviceUnavailable(serviceName, '服务器错误');
      }
    }

    if (error.code === 'ETIMEDOUT') {
      throw createError.timeout(serviceName);
    }

    throw createError.internalError(error.message);
  }

  /**
   * 获取服务信息
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      loaded: this.loaded,
      tools: this.getTools().map(tool => ({
        name: tool.function.name,
        description: tool.function.description
      }))
    };
  }
}

module.exports = BaseService;

