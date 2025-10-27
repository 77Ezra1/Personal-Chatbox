/**
 * 统一错误处理
 */

class McpError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details
    };
  }
}

// 错误代码常量
const ErrorCodes = {
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  SERVICE_DISABLED: 'SERVICE_DISABLED',
  TIMEOUT: 'TIMEOUT'
};

// 创建特定错误的工厂函数
const createError = {
  serviceUnavailable: (serviceName, reason) => 
    new McpError(
      `${serviceName}服务暂时不可用`,
      ErrorCodes.SERVICE_UNAVAILABLE,
      reason || '当前API服务拥挤导致该服务暂不可用,请稍后再试'
    ),

  invalidParameters: (details) =>
    new McpError(
      '参数错误',
      ErrorCodes.INVALID_PARAMETERS,
      details
    ),

  apiRateLimit: (serviceName) =>
    new McpError(
      `${serviceName}服务请求过于频繁`,
      ErrorCodes.API_RATE_LIMIT,
      '请求次数超过限制,请稍后再试'
    ),

  networkError: (details) =>
    new McpError(
      '网络连接失败',
      ErrorCodes.NETWORK_ERROR,
      details
    ),

  internalError: (details) =>
    new McpError(
      '服务内部错误',
      ErrorCodes.INTERNAL_ERROR,
      details
    ),

  serviceNotFound: (serviceId) =>
    new McpError(
      '服务不存在',
      ErrorCodes.SERVICE_NOT_FOUND,
      `未找到服务: ${serviceId}`
    ),

  serviceDisabled: (serviceName) =>
    new McpError(
      '服务未启用',
      ErrorCodes.SERVICE_DISABLED,
      `${serviceName}服务未启用,请在设置中开启`
    ),

  timeout: (serviceName) =>
    new McpError(
      '请求超时',
      ErrorCodes.TIMEOUT,
      `${serviceName}服务响应超时,请稍后再试`
    ),

  notFound: (message = '资源未找到', details = null) =>
    new McpError(
      message,
      ErrorCodes.SERVICE_NOT_FOUND,
      details
    )
};

// Express错误处理中间件
function errorHandler(err, req, res, next) {
  const logger = require('./logger.cjs');
  
  if (err instanceof McpError) {
    logger.warn('MCP错误:', err.toJSON());
    return res.status(400).json(err.toJSON());
  }

  // 未知错误
  logger.error('未知错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    code: ErrorCodes.INTERNAL_ERROR,
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
}

module.exports = {
  McpError,
  ErrorCodes,
  createError,
  errorHandler
};

