/**
 * 统一日志工具
 * 开发环境显示所有日志，生产环境只显示错误
 */

const isDev = import.meta.env.DEV;

/**
 * 日志级别
 */
const LOG_LEVELS = {
  DEBUG: 0,
  LOG: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * 日志类
 */
class Logger {
  constructor(context = '') {
    this.context = context;
    this.minLevel = isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
  }

  /**
   * 格式化日志前缀
   */
  _formatPrefix() {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return `[${timestamp}]${this.context ? ` [${this.context}]` : ''}`;
  }

  /**
   * 调试日志（仅在开发环境或启用debug模式时显示）
   */
  debug(...args) {
    if (isDev || this._isDebugEnabled()) {
      logger.log(`${this._formatPrefix()} [DEBUG]`, ...args);
    }
  }

  /**
   * 普通日志（仅在开发环境显示）
   */
  log(...args) {
    if (isDev && LOG_LEVELS.LOG >= this.minLevel) {
      logger.log(`${this._formatPrefix()}`, ...args);
    }
  }

  /**
   * 警告日志（仅在开发环境显示）
   */
  warn(...args) {
    if (isDev && LOG_LEVELS.WARN >= this.minLevel) {
      logger.warn(`${this._formatPrefix()} [WARN]`, ...args);
    }
  }

  /**
   * 错误日志（始终显示）
   */
  error(...args) {
    logger.error(`${this._formatPrefix()} [ERROR]`, ...args);
    
    // 发送错误到 Sentry
    if (!isDev && args[0] instanceof Error) {
      // 动态导入避免循环依赖
      import('./sentry').then(({ captureError }) => {
        captureError(args[0], {
          component: this.context,
          additionalInfo: args.slice(1)
        });
      }).catch(() => {
        // Sentry 未初始化或导入失败，忽略
      });
    }
  }

  /**
   * 性能测量
   */
  time(label) {
    if (isDev) {
      console.time(`${this._formatPrefix()} ${label}`);
    }
  }

  timeEnd(label) {
    if (isDev) {
      console.timeEnd(`${this._formatPrefix()} ${label}`);
    }
  }

  /**
   * 分组日志
   */
  group(label) {
    if (isDev) {
      console.group(`${this._formatPrefix()} ${label}`);
    }
  }

  groupEnd() {
    if (isDev) {
      console.groupEnd();
    }
  }

  /**
   * 表格输出
   */
  table(data) {
    if (isDev) {
      console.table(data);
    }
  }

  /**
   * 检查是否启用了debug模式
   */
  _isDebugEnabled() {
    try {
      return localStorage.getItem('debug') === 'true';
    } catch {
      return false;
    }
  }
}

/**
 * 创建带上下文的logger实例
 * @param {string} context - 上下文名称（如组件名、模块名）
 * @returns {Logger}
 */
export function createLogger(context) {
  return new Logger(context);
}

/**
 * 默认logger实例
 */
const defaultLogger = new Logger('App');

export default defaultLogger;

/**
 * 便捷导出
 */
export const logger = defaultLogger;

/**
 * 启用/禁用调试模式
 */
export function enableDebug() {
  try {
    localStorage.setItem('debug', 'true');
    logger.log('Debug mode enabled. Reload the page to see debug logs.');
  } catch (e) {
    logger.error('Failed to enable debug mode:', e);
  }
}

export function disableDebug() {
  try {
    localStorage.removeItem('debug');
    logger.log('Debug mode disabled.');
  } catch (e) {
    logger.error('Failed to disable debug mode:', e);
  }
}
