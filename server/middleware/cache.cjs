/**
 * API Response Caching Middleware
 * Implements efficient caching for GET requests to improve performance
 */

const crypto = require('crypto');
const logger = require('../utils/logger.cjs');

// Simple in-memory cache
class SimpleCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 300; // Default 5 minutes in seconds
    this.checkPeriod = options.checkPeriod || 60; // Check every 60 seconds

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.checkPeriod * 1000);
  }

  set(key, value, ttl) {
    const expiresAt = Date.now() + (ttl || this.ttl) * 1000;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  cleanup() {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`[Cache] Cleaned up ${deletedCount} expired entries`);
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl
    };
  }
}

// Create global cache instance
const cache = new SimpleCache({
  ttl: 300, // 5 minutes
  checkPeriod: 60 // Check every minute
});

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {Function} options.condition - Condition function to determine if request should be cached
 */
function cacheMiddleware(options = {}) {
  const ttl = options.ttl || 300;
  const condition = options.condition || (() => true);

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if this request should be cached
    if (!condition(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      logger.debug(`[Cache] HIT: ${req.path}`);
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.json(cachedResponse);
    }

    logger.debug(`[Cache] MISS: ${req.path}`);

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        logger.debug(`[Cache] Stored: ${req.path} (TTL: ${ttl}s)`);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific user
 */
function clearUserCache(userId) {
  const keys = cache.keys();
  const userKeys = keys.filter(key => key.includes(userId));

  userKeys.forEach(key => cache.delete(key));

  logger.info(`[Cache] Cleared ${userKeys.length} entries for user ${userId}`);
  return userKeys.length;
}

/**
 * Clear all cache
 */
function clearAllCache() {
  const count = cache.cache.size;
  cache.clear();
  logger.info(`[Cache] Cleared all ${count} entries`);
  return count;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return cache.getStats();
}

module.exports = {
  cache,
  cacheMiddleware,
  clearUserCache,
  clearAllCache,
  getCacheStats,
  generateCacheKey
};
