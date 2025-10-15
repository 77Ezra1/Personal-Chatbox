/**
 * 环境变量验证器
 * 用于生产环境启动时检查关键配置
 */

const logger = require('../utils/logger.cjs');

// 生产环境必需的环境变量
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
];

// 生产环境强烈建议配置的环境变量
const RECOMMENDED_ENV_VARS = [
  'DEEPSEEK_API_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
];

// 危险的默认值（生产环境不允许使用）
const DANGEROUS_DEFAULTS = {
  JWT_SECRET: [
    'your-secret-key-change-in-production',
    'change-me',
    'secret',
    'default',
  ],
  SESSION_SECRET: [
    'your-session-secret-change-in-production',
    'change-me',
    'secret',
    'default',
  ],
};

/**
 * 验证环境变量配置
 * @param {boolean} strict - 是否严格模式（生产环境使用）
 * @returns {Object} 验证结果
 */
function validateEnv(strict = false) {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. 检查必需的环境变量
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // 2. 检查推荐的环境变量
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      const message = `Missing recommended environment variable: ${varName}`;
      if (strict) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  // 3. 检查危险的默认值（仅生产环境）
  if (isProduction || strict) {
    for (const [varName, dangerousValues] of Object.entries(DANGEROUS_DEFAULTS)) {
      const value = process.env[varName];
      if (value && dangerousValues.includes(value)) {
        errors.push(
          `Dangerous default value detected for ${varName}. ` +
          `Please set a secure value in production environment.`
        );
      }
    }
  }

  // 4. 检查数据库配置
  const hasPostgres = !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL;
  const hasSqlite = !!process.env.DATABASE_PATH;

  if (!hasPostgres && !hasSqlite) {
    warnings.push('No database configured. Using default SQLite path: ./data/app.db');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    isProduction,
  };
}

/**
 * 启动时验证环境变量
 * 如果验证失败且为生产环境，则拒绝启动
 */
function validateEnvOnStartup() {
  const isProduction = process.env.NODE_ENV === 'production';
  const result = validateEnv(isProduction);

  // 打印警告
  if (result.warnings.length > 0) {
    logger.warn('='.repeat(60));
    logger.warn('Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      logger.warn(`  ⚠ ${warning}`);
    });
    logger.warn('='.repeat(60));
  }

  // 打印错误
  if (result.errors.length > 0) {
    logger.error('='.repeat(60));
    logger.error('Environment Configuration Errors:');
    result.errors.forEach((error) => {
      logger.error(`  ✖ ${error}`);
    });
    logger.error('='.repeat(60));

    // 生产环境下，配置错误将拒绝启动
    if (isProduction) {
      logger.error('');
      logger.error('STARTUP ABORTED: Fix the configuration errors above before starting in production.');
      logger.error('');
      process.exit(1);
    } else {
      logger.warn('');
      logger.warn('Development mode: Server will start despite configuration errors.');
      logger.warn('Please fix these issues before deploying to production.');
      logger.warn('');
    }
  } else {
    logger.info('✓ Environment configuration validated successfully');
  }

  return result;
}

/**
 * 获取敏感信息的脱敏版本（用于日志）
 * @param {string} value - 原始值
 * @returns {string} 脱敏后的值
 */
function maskSensitiveValue(value) {
  if (!value || typeof value !== 'string') {
    return '[not set]';
  }
  if (value.length <= 8) {
    return '***';
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * 打印环境配置摘��（脱敏）
 */
function printEnvSummary() {
  logger.info('='.repeat(60));
  logger.info('Environment Configuration Summary:');
  logger.info(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`  PORT: ${process.env.PORT || '3001'}`);
  logger.info(`  DATABASE: ${process.env.POSTGRES_URL ? 'PostgreSQL' : 'SQLite'}`);
  logger.info(`  DEEPSEEK_API_KEY: ${maskSensitiveValue(process.env.DEEPSEEK_API_KEY)}`);
  logger.info(`  JWT_SECRET: ${maskSensitiveValue(process.env.JWT_SECRET)}`);
  logger.info(`  SESSION_SECRET: ${maskSensitiveValue(process.env.SESSION_SECRET)}`);
  logger.info('='.repeat(60));
}

module.exports = {
  validateEnv,
  validateEnvOnStartup,
  maskSensitiveValue,
  printEnvSummary,
};
