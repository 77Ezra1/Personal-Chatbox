/**
 * 性能优化工具
 */

const { promisify } = require('util');
const crypto = require('crypto');

/**
 * 简单的内存缓存系统
 */
class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 300000; // 默认5分钟
    this.maxSize = options.maxSize || 1000;
    this.hits = 0;
    this.misses = 0;

    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.ttl) {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttl
    });
  }

  /**
   * 获取缓存
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired items`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttl: this.ttl
    };
  }

  /**
   * 销毁缓存
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

/**
 * 缓存装饰器
 */
function cached(ttl = 300000) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const cache = new MemoryCache({ ttl });

    descriptor.value = async function(...args) {
      // 生成缓存key
      const key = `${propertyKey}_${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 存入缓存
      cache.set(key, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * 数据库查询缓存中间件
 */
class QueryCache {
  constructor(options = {}) {
    this.cache = new MemoryCache(options);
  }

  /**
   * 包装数据库查询
   */
  wrapQuery(db) {
    const originalGet = db.get.bind(db);
    const originalAll = db.all.bind(db);

    // 包装get方法
    db.get = async (sql, params, callback) => {
      const cacheKey = this.generateKey(sql, params);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        if (callback) callback(null, cached);
        return cached;
      }

      return originalGet(sql, params, (err, row) => {
        if (!err && row) {
          this.cache.set(cacheKey, row);
        }
        if (callback) callback(err, row);
      });
    };

    // 包装all方法
    db.all = async (sql, params, callback) => {
      const cacheKey = this.generateKey(sql, params);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        if (callback) callback(null, cached);
        return cached;
      }

      return originalAll(sql, params, (err, rows) => {
        if (!err && rows) {
          this.cache.set(cacheKey, rows);
        }
        if (callback) callback(err, rows);
      });
    };

    return db;
  }

  /**
   * 生成缓存key
   */
  generateKey(sql, params) {
    const hash = crypto.createHash('md5');
    hash.update(sql);
    hash.update(JSON.stringify(params || []));
    return hash.digest('hex');
  }

  /**
   * 清除缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.cache.getStats();
  }
}

/**
 * 响应压缩中间件（已在server/index.cjs中使用compression包）
 */

/**
 * 慢查询日志
 */
class SlowQueryLogger {
  constructor(threshold = 1000) {
    this.threshold = threshold; // 毫秒
    this.slowQueries = [];
    this.maxLogs = 100;
  }

  /**
   * 包装数据库方法记录慢查询
   */
  wrapDatabase(db) {
    const methods = ['run', 'get', 'all'];

    methods.forEach(method => {
      const original = db[method].bind(db);

      db[method] = async (...args) => {
        const start = Date.now();
        const sql = args[0];

        try {
          const result = await original(...args);
          const duration = Date.now() - start;

          if (duration > this.threshold) {
            this.log(sql, args[1], duration);
          }

          return result;
        } catch (err) {
          throw err;
        }
      };
    });

    return db;
  }

  /**
   * 记录慢查询
   */
  log(sql, params, duration) {
    const log = {
      sql,
      params,
      duration,
      timestamp: new Date().toISOString()
    };

    this.slowQueries.push(log);

    // 限制日志数量
    if (this.slowQueries.length > this.maxLogs) {
      this.slowQueries.shift();
    }

    console.warn(`[Slow Query] ${duration}ms - ${sql.substring(0, 100)}...`);
  }

  /**
   * 获取慢查询日志
   */
  getSlowQueries() {
    return this.slowQueries;
  }

  /**
   * 清除日志
   */
  clear() {
    this.slowQueries = [];
  }
}

/**
 * 并发请求批处理
 */
class RequestBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 100;
    this.batches = new Map();
  }

  /**
   * 批量执行
   */
  async batch(key, fn) {
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        requests: [],
        timer: null
      });
    }

    const batch = this.batches.get(key);

    return new Promise((resolve, reject) => {
      batch.requests.push({ fn, resolve, reject });

      // 达到批处理大小立即执行
      if (batch.requests.length >= this.batchSize) {
        this.executeBatch(key);
      }
      // 否则等待超时
      else if (!batch.timer) {
        batch.timer = setTimeout(() => {
          this.executeBatch(key);
        }, this.batchTimeout);
      }
    });
  }

  /**
   * 执行批处理
   */
  async executeBatch(key) {
    const batch = this.batches.get(key);
    if (!batch || batch.requests.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
    }

    const requests = batch.requests.splice(0);
    this.batches.delete(key);

    // 并发执行所有请求
    const results = await Promise.allSettled(
      requests.map(req => req.fn())
    );

    // 返回结果
    results.forEach((result, index) => {
      const req = requests[index];
      if (result.status === 'fulfilled') {
        req.resolve(result.value);
      } else {
        req.reject(result.reason);
      }
    });
  }
}

/**
 * 性能监控
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalDuration: 0,
      slowRequests: 0
    };
    this.histogram = new Map();
  }

  /**
   * 监控中间件
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;

        this.metrics.requests++;
        this.metrics.totalDuration += duration;

        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }

        if (duration > 1000) {
          this.metrics.slowRequests++;
        }

        // 记录到直方图
        const bucket = Math.floor(duration / 100) * 100;
        this.histogram.set(bucket, (this.histogram.get(bucket) || 0) + 1);
      });

      next();
    };
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    const avgDuration = this.metrics.requests > 0
      ? (this.metrics.totalDuration / this.metrics.requests).toFixed(2)
      : 0;

    const errorRate = this.metrics.requests > 0
      ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      avgDuration: `${avgDuration}ms`,
      errorRate: `${errorRate}%`,
      histogram: Object.fromEntries(this.histogram)
    };
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalDuration: 0,
      slowRequests: 0
    };
    this.histogram.clear();
  }
}

/**
 * 内存使用监控
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
  };
}

module.exports = {
  MemoryCache,
  cached,
  QueryCache,
  SlowQueryLogger,
  RequestBatcher,
  PerformanceMonitor,
  getMemoryUsage
};

