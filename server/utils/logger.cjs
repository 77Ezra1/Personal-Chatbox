/**
 * 日志工具
 */

const config = require('../config.cjs');

class Logger {
  constructor() {
    this.level = config.logging.level;
  }

  _log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (this._shouldLog(level)) {
      console.log(prefix, message, ...args);
    }
  }

  _shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message, ...args) {
    this._log('debug', message, ...args);
  }

  info(message, ...args) {
    this._log('info', message, ...args);
  }

  warn(message, ...args) {
    this._log('warn', message, ...args);
  }

  error(message, ...args) {
    this._log('error', message, ...args);
  }
}

module.exports = new Logger();

