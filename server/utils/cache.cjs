/**
 * 简单的内存缓存管理器
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttlMs - 过期时间（毫秒），默认5分钟
   */
  set(key, value, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, value);
    
    if (ttlMs > 0) {
      const expiresAt = Date.now() + ttlMs;
      this.ttl.set(key, expiresAt);
      
      // 设置定时清理
      setTimeout(() => {
        if (this.ttl.get(key) === expiresAt) {
          this.delete(key);
        }
      }, ttlMs);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存值，如果不存在或已过期则返回undefined
   */
  get(key) {
    // 检查是否过期
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return undefined;
    }
    
    return this.cache.get(key);
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * 包装异步函数，自动缓存结果
   * @param {string} key - 缓存键
   * @param {Function} fn - 异步函数
   * @param {number} ttlMs - 缓存时间
   * @returns {Promise<any>}
   */
  async wrap(key, fn, ttlMs = 5 * 60 * 1000) {
    if (this.has(key)) {
      return this.get(key);
    }
    
    const result = await fn();
    this.set(key, result, ttlMs);
    return result;
  }
}

// 创建全局缓存实例
const cacheManager = new CacheManager();

module.exports = { CacheManager, cacheManager };
