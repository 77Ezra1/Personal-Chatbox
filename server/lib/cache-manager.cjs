/**
 * 缓存管理器
 * 为MCP工具调用和API响应提供缓存功能
 */

const logger = require('../utils/logger.cjs');

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // 默认5分钟
    this.maxSize = options.maxSize || 1000; // 最大缓存条目
    this.enabled = options.enabled !== false;

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };

    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupInterval || 60 * 1000); // 默认每分钟清理一次
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix, params) {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}:${this.hash(paramsStr)}`;
  }

  /**
   * 简单哈希函数
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取缓存
   */
  get(key) {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = null) {
    if (!this.enabled) return;

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiryTime = ttl || this.ttl;
    this.cache.set(key, {
      value,
      expiry: Date.now() + expiryTime,
      created: Date.now(),
      lastAccessed: Date.now()
    });

    this.stats.sets++;
  }

  /**
   * 删除缓存
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * 清除所有缓存
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    logger.info(`Cache cleared: ${size} entries removed`);
  }

  /**
   * 删除最旧的缓存条目
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cache cleanup: ${cleaned} expired entries removed`);
      this.stats.deletes += cleaned;
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      ...this.stats
    };
  }

  /**
   * 包装函数以使用缓存
   */
  wrap(key, fn, ttl = null) {
    return async (...args) => {
      const cacheKey = typeof key === 'function' ? key(...args) : key;

      // 尝试从缓存获取
      const cached = this.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }

      // 执行函数
      logger.debug(`Cache miss: ${cacheKey}`);
      const result = await fn(...args);

      // 存入缓存
      this.set(cacheKey, result, ttl);
      return result;
    };
  }

  /**
   * 销毁缓存管理器
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// 创建全局缓存实例
const globalCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 1000,
  cleanupInterval: 60 * 1000 // 每分钟清理
});

// MCP工具调用专用缓存
const mcpToolCache = new CacheManager({
  ttl: 2 * 60 * 1000, // 2分钟（工具调用结果变化较快）
  maxSize: 500,
  cleanupInterval: 30 * 1000 // 每30秒清理
});

// API响应缓存
const apiCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10分钟
  maxSize: 200,
  cleanupInterval: 2 * 60 * 1000 // 每2分钟清理
});

/**
 * 创建缓存键的辅助函数
 */
function createMCPToolCacheKey(serviceId, toolName, params) {
  return mcpToolCache.generateKey(`mcp:${serviceId}:${toolName}`, params);
}

function createAPICacheKey(endpoint, params) {
  return apiCache.generateKey(`api:${endpoint}`, params);
}

/**
 * 优雅关闭
 */
function shutdown() {
  logger.info('Shutting down cache managers...');
  globalCache.destroy();
  mcpToolCache.destroy();
  apiCache.destroy();
}

module.exports = {
  CacheManager,
  globalCache,
  mcpToolCache,
  apiCache,
  createMCPToolCacheKey,
  createAPICacheKey,
  shutdown
};
