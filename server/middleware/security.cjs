/**
 * 安全中间件
 * 保护应用免受常见Web攻击
 */

const crypto = require('crypto');

/**
 * 安全响应头中间件
 */
function securityHeaders(req, res, next) {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 内容安全策略（CSP）
  // 生产环境使用严格策略，开发环境适当放宽
  const isDev = process.env.NODE_ENV !== 'production';
  const cspDirectives = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // 开发环境：支持HMR
      : "script-src 'self'", // 生产环境：严格策略
    isDev
      ? "style-src 'self' 'unsafe-inline'" // 开发环境：支持动态样式
      : "style-src 'self'", // 生产环境：严格策略
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss: ws:", // 支持WebSocket
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HTTPS强制（生产环境）
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 权限策略
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  next();
}

/**
 * 请求限流中间件（防止暴力破解和DDoS）
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1分钟
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();

    // 定期清理过期记录
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > this.windowMs) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  // 清理资源，防止内存泄漏
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const logger = require('../utils/logger.cjs');
      logger.debug('[RateLimiter] Middleware called. IP:', key);

      // 使用环境变量显式控制，而不是依赖 NODE_ENV
      const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

      if (!rateLimitEnabled) {
        logger.warn('[RateLimiter] Rate limiting is DISABLED - not recommended for production');
        return next();
      }

      // 跳过localhost的限流（仅在开发环境）
      if (process.env.NODE_ENV !== 'production' &&
          (key === '127.0.0.1' || key === '::1' || key === 'localhost' || key === '::ffff:127.0.0.1')) {
        logger.debug('[RateLimiter] Skipping rate limit for localhost:', key);
        return next();
      }

      logger.debug('[RateLimiter] Checking rate limit for IP:', key);

      const now = Date.now();

      let requestData = this.requests.get(key);

      if (!requestData || now - requestData.resetTime > this.windowMs) {
        requestData = {
          count: 0,
          resetTime: now
        };
        this.requests.set(key, requestData);
      }

      requestData.count++;

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - requestData.count));
      res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + this.windowMs).toISOString());

      if (requestData.count > this.maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((requestData.resetTime + this.windowMs - now) / 1000)
        });
        return;
      }

      next();
    };
  }
}

/**
 * 敏感路由限流（登录、注册等）
 */
const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5  // 最多5次尝试
});

/**
 * API通用限流
 */
const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 60  // 每分钟60次
});

/**
 * SQL注入防护
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // 移除潜在的SQL注入字符
  return input
    .replace(/[';-]/g, '')  // 修复：将--改为单个-
    .replace(/\/\*.*?\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '');
}

/**
 * XSS防护中间件
 */
function xssProtection(req, res, next) {
  // 对请求体进行XSS过滤
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // 对查询参数进行过滤
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * 递归清理对象中的XSS
 * Enhanced XSS protection with more comprehensive filtering
 */
function sanitizeObject(obj) {
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }

  // 处理对象
  const sanitized = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Comprehensive string sanitization
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object/embed/applet tags
    .replace(/<(object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove link tags (can load malicious CSS)
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: URLs (can contain XSS)
    .replace(/data:text\/html/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove expression() in CSS
    .replace(/expression\s*\(/gi, '');
}

/**
 * CSRF防护令牌生成
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF防护中间件
 */
function csrfProtection(req, res, next) {
  // GET请求不需要CSRF保护
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // 从cookie或header中获取token
  const sessionToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!sessionToken || !headerToken || sessionToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token validation failed',
      message: 'CSRF令牌验证失败'
    });
  }

  next();
}

/**
 * 敏感数据过滤（日志记录时使用）
 */
function filterSensitiveData(data) {
  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'secret',
    'authorization'
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const filtered = { ...data };

  for (const field of sensitiveFields) {
    if (filtered[field]) {
      filtered[field] = '***REDACTED***';
    }
  }

  return filtered;
}

/**
 * IP白名单中间件（管理员路由使用）
 */
function ipWhitelist(allowedIPs = []) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: 'IP地址不在白名单中'
      });
    }

    next();
  };
}

/**
 * 请求大小限制
 */
function requestSizeLimit(maxSize = 50 * 1024 * 1024) { // 默认50MB
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large',
        message: `请求体过大，最大允许 ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }

    next();
  };
}

/**
 * HTTP方法限制
 */
function allowedMethods(...methods) {
  const allowed = methods.map(m => m.toUpperCase());

  return (req, res, next) => {
    if (!allowed.includes(req.method)) {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
        message: `不支持的HTTP方法: ${req.method}`
      });
    }

    next();
  };
}

/**
 * 安全日志记录
 */
function securityLogger(req, res, next) {
  const start = Date.now();

  // 记录响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id || 'anonymous'
    };

    // 记录异常状态码
    if (res.statusCode >= 400) {
      console.warn('[Security] Suspicious request:', filterSensitiveData(log));
    }
  });

  next();
}

/**
 * 密码强度验证
 */
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`密码长度至少${minLength}个字符`);
  }

  if (!hasUpperCase) {
    errors.push('密码必须包含大写字母');
  }

  if (!hasLowerCase) {
    errors.push('密码必须包含小写字母');
  }

  if (!hasNumbers) {
    errors.push('密码必须包含数字');
  }

  if (!hasSpecialChar) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

/**
 * 计算密码强度（0-100）
 */
function calculatePasswordStrength(password) {
  let strength = 0;

  // 长度
  strength += Math.min(password.length * 4, 40);

  // 字符多样性
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/\d/.test(password)) strength += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;

  // 重复字符扣分
  const repeats = password.match(/(.)\1{2,}/g);
  if (repeats) strength -= repeats.length * 5;

  return Math.max(0, Math.min(100, strength));
}

module.exports = {
  securityHeaders,
  RateLimiter,
  authRateLimiter,
  apiRateLimiter,
  xssProtection,
  csrfProtection,
  generateCsrfToken,
  filterSensitiveData,
  ipWhitelist,
  requestSizeLimit,
  allowedMethods,
  securityLogger,
  validatePasswordStrength,
  calculatePasswordStrength,
  sanitizeInput,
  sanitizeObject,
  sanitizeString
};

