/**
 * 统一错误处理器
 * 提供标准化的错误响应和日志记录
 */

const logger = require('../utils/logger.cjs');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 具体错误类型
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(
      `External service error: ${service} - ${message}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalError: originalError?.message }
    );
  }
}

class MCPToolError extends AppError {
  constructor(toolName, message, originalError = null) {
    super(
      `MCP tool error: ${toolName} - ${message}`,
      500,
      'MCP_TOOL_ERROR',
      { toolName, originalError: originalError?.message }
    );
  }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(err);
  }

  // 记录错误
  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      path: req.path,
      method: req.method,
      details: err.details
    });
  } else {
    logger.error(`Unexpected error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // 构建错误响应
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    }
  };

  // 在开发环境中包含详细信息
  if (process.env.NODE_ENV === 'development') {
    response.error.details = err.details;
    response.error.stack = err.stack;
  } else if (err.details) {
    // 在生产环境中只包含安全的详细信息
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
}

/**
 * 异步路由处理器包装器
 * 自动捕获异步错误
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404错误处理器
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}

/**
 * 验证请求体
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new ValidationError('Validation failed', details));
    }
    req.validatedBody = value;
    next();
  };
}

/**
 * 安全地解析JSON
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.warn('JSON parse failed', { error: error.message });
    return defaultValue;
  }
}

/**
 * 重试机制
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true
  } = options;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      logger.info(`Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}

/**
 * 超时包装器
 */
async function withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new AppError(errorMessage, 408, 'TIMEOUT')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  MCPToolError,

  // 中间件
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validateBody,

  // 工具函数
  safeJsonParse,
  retry,
  withTimeout
};
