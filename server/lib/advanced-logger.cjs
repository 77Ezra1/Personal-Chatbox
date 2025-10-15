/**
 * 高级日志系统
 * 支持日志级别、日志轮转、结构化日志
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const LEVEL_COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  FATAL: '\x1b[35m'  // Magenta
};

class AdvancedLogger {
  constructor(options = {}) {
    this.minLevel = LOG_LEVELS[options.level || 'INFO'];
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.context = options.context || {};

    // 确保日志目录存在
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // 当前日志文件路径
    this.currentLogFile = this.enableFile
      ? path.join(this.logDir, 'app.log')
      : null;
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = this.formatTimestamp();
    const levelName = LEVEL_NAMES[level];

    // 结构化日志对象
    const logObject = {
      timestamp,
      level: levelName,
      message,
      ...this.context,
      ...metadata
    };

    // 控制台输出（带颜色）
    const consoleMessage = this.enableConsole
      ? `${LEVEL_COLORS[levelName]}[${timestamp}] [${levelName}]\x1b[0m ${message}${
          Object.keys(metadata).length > 0
            ? '\n' + JSON.stringify(metadata, null, 2)
            : ''
        }`
      : null;

    // 文件输出（JSON格式）
    const fileMessage = this.enableFile
      ? JSON.stringify(logObject)
      : null;

    return { consoleMessage, fileMessage };
  }

  /**
   * 写入日志文件
   */
  writeToFile(message) {
    if (!this.enableFile || !this.currentLogFile) return;

    try {
      // 检查文件大小
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size >= this.maxFileSize) {
          this.rotateLogFiles();
        }
      }

      // 追加日志
      fs.appendFileSync(this.currentLogFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write log file:', error.message);
    }
  }

  /**
   * 日志文件轮转
   */
  rotateLogFiles() {
    try {
      // 删除最旧的日志文件
      const oldestLog = path.join(this.logDir, `app.log.${this.maxFiles}`);
      if (fs.existsSync(oldestLog)) {
        fs.unlinkSync(oldestLog);
      }

      // 重命名现有日志文件
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldPath = path.join(this.logDir, `app.log.${i}`);
        const newPath = path.join(this.logDir, `app.log.${i + 1}`);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }

      // 重命名当前日志文件
      const archivePath = path.join(this.logDir, 'app.log.1');
      if (fs.existsSync(this.currentLogFile)) {
        fs.renameSync(this.currentLogFile, archivePath);
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error.message);
    }
  }

  /**
   * 记录日志
   */
  log(level, message, metadata = {}) {
    if (level < this.minLevel) return;

    const { consoleMessage, fileMessage } = this.formatMessage(
      level,
      message,
      metadata
    );

    if (this.enableConsole && consoleMessage) {
      console.log(consoleMessage);
    }

    if (this.enableFile && fileMessage) {
      this.writeToFile(fileMessage);
    }
  }

  /**
   * 便捷方法
   */
  debug(message, metadata) {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }

  info(message, metadata) {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  warn(message, metadata) {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  error(message, metadata) {
    // 如果metadata是Error对象，提取堆栈信息
    if (metadata instanceof Error) {
      metadata = {
        error: metadata.message,
        stack: metadata.stack,
        name: metadata.name
      };
    }
    this.log(LOG_LEVELS.ERROR, message, metadata);
  }

  fatal(message, metadata) {
    this.log(LOG_LEVELS.FATAL, message, metadata);
  }

  /**
   * 创建子日志器（带上下文）
   */
  child(context) {
    return new AdvancedLogger({
      level: LEVEL_NAMES[this.minLevel],
      logDir: this.logDir,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
      context: { ...this.context, ...context }
    });
  }

  /**
   * 性能计时
   */
  time(label) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`Timer [${label}]`, { duration: `${duration}ms` });
      return duration;
    };
  }

  /**
   * 清理旧日志文件
   */
  cleanup(daysToKeep = 7) {
    if (!this.enableFile) return;

    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to cleanup old logs', error);
    }
  }
}

// 创建默认日志器
const defaultLogger = new AdvancedLogger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production'
});

// 定期清理旧日志（每天执行一次）
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    defaultLogger.cleanup(7); // 保留7天的日志
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  AdvancedLogger,
  logger: defaultLogger,
  LOG_LEVELS
};
