/**
 * PostgreSQL数据库适配器
 * 生产级数据库连接和操作
 */

const { Pool } = require('pg');
const path = require('path');

/**
 * PostgreSQL连接池配置
 */
class PostgreSQLAdapter {
  constructor(config = {}) {
    const connectionString = config.connectionString ||
                            process.env.POSTGRES_URL ||
                            process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('PostgreSQL connection string not provided');
    }

    // 创建连接池（性能优化）
    this.pool = new Pool({
      connectionString,
      // 连接池配置
      max: config.max || 20,                    // 最大连接数
      min: config.min || 2,                     // 最小连接数
      idleTimeoutMillis: config.idleTimeout || 30000,  // 空闲连接超时
      connectionTimeoutMillis: config.connectionTimeout || 5000, // 连接超时
      // SSL配置（生产环境必需）
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false  // 某些云服务需要设置为false
      } : false,
      // 应用名称（便于监控）
      application_name: config.appName || 'personal-chatbox'
    });

    // 连接池事件监听
    this.pool.on('connect', (client) => {
      console.log('[PostgreSQL] 新连接已建立');
    });

    this.pool.on('error', (err, client) => {
      console.error('[PostgreSQL] 连接池错误:', err.message);
    });

    this.pool.on('remove', (client) => {
      console.log('[PostgreSQL] 连接已移除');
    });

    this._driver = 'postgresql';
    console.log('[PostgreSQL] ✅ 连接池已创建');
  }

  /**
   * 执行SQL语句（无返回结果）
   */
  async run(sql, params = [], callback) {
    try {
      // 转换SQL语法
      let convertedSql = this.convertSqlPlaceholders(sql);

      // 自动添加 RETURNING id（如果是INSERT语句且没有RETURNING）
      if (convertedSql.trim().toUpperCase().startsWith('INSERT') &&
          !convertedSql.toUpperCase().includes('RETURNING')) {
        // 移除末尾的分号（如果有）
        convertedSql = convertedSql.replace(/;\s*$/, '');
        convertedSql += ' RETURNING id';
      }

      console.log('[PostgreSQL] Executing SQL:', convertedSql);
      console.log('[PostgreSQL] With params:', JSON.stringify(params));

      const result = await this.pool.query(convertedSql, params);

      // 正确获取lastID
      const lastID = result.rows[0]?.id || null;

      if (callback) {
        callback(null, {
          lastID: lastID,
          changes: result.rowCount
        });
      }
      return {
        lastID: lastID,
        changes: result.rowCount
      };
    } catch (err) {
      console.error('[PostgreSQL] Run error:', err.message);
      console.error('[PostgreSQL] Failed SQL:', sql);
      console.error('[PostgreSQL] With params:', JSON.stringify(params));
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * 查询单条记录
   */
  async get(sql, params = [], callback) {
    try {
      // 转换SQLite占位符为PostgreSQL占位符
      const pgSql = this.convertSqlPlaceholders(sql);
      const result = await this.pool.query(pgSql, params);
      const row = result.rows[0] || null;
      if (callback) {
        callback(null, row);
      }
      return row;
    } catch (err) {
      console.error('[PostgreSQL] Get error:', err.message);
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * 查询多条记录
   */
  async all(sql, params = [], callback) {
    try {
      // 转换SQLite占位符为PostgreSQL占位符
      const pgSql = this.convertSqlPlaceholders(sql);
      const result = await this.pool.query(pgSql, params);
      const rows = result.rows;
      if (callback) {
        callback(null, rows);
      }
      return rows;
    } catch (err) {
      console.error('[PostgreSQL] All error:', err.message);
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * 转换SQLite占位符为PostgreSQL占位符
   */
  convertSqlPlaceholders(sql) {
    let index = 1;
    // 将 ? 替换为 $1, $2, $3 ...
    let converted = sql.replace(/\?/g, () => `$${index++}`);

    // 转换SQLite特有语法到PostgreSQL
    converted = converted.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
    converted = converted.replace(/datetime\("now"\)/g, 'CURRENT_TIMESTAMP');

    // 修复Boolean比较
    // is_archived = 0 → is_archived = false
    converted = converted.replace(/\bis_archived\s*=\s*0\b/gi, 'is_archived = false');
    converted = converted.replace(/\bis_archived\s*=\s*1\b/gi, 'is_archived = true');

    // is_favorite = 0 → is_favorite = false
    converted = converted.replace(/\bis_favorite\s*=\s*0\b/gi, 'is_favorite = false');
    converted = converted.replace(/\bis_favorite\s*=\s*1\b/gi, 'is_favorite = true');

    // 修复 INSERT OR IGNORE 语法
    // INSERT OR IGNORE INTO → INSERT INTO ... ON CONFLICT DO NOTHING
    converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES/gi,
      'INSERT INTO $1 ($2) VALUES');

    return converted;
  }

  /**
   * 准备语句（预编译）
   */
  prepare(sql) {
    const self = this;
    // 转换SQLite的?占位符为PostgreSQL的$1, $2...
    const pgSql = this.convertSqlPlaceholders(sql);

    return {
      run(...params) {
        // 兼容SQLite调用方式：prepare().run(param1, param2) 或 prepare().run([param1, param2])
        const paramArray = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        return self.run(pgSql, paramArray);
      },
      get(...params) {
        // 兼容SQLite调用方式
        const paramArray = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        return self.get(pgSql, paramArray);
      },
      all(...params) {
        // 兼容SQLite调用方式
        const paramArray = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
        return self.all(pgSql, paramArray);
      }
    };
  }

  /**
   * 事务支持
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 串行执行（兼容SQLite接口）
   */
  serialize(fn) {
    if (fn) fn();
  }

  /**
   * 关闭连接池
   */
  async close() {
    await this.pool.end();
    console.log('[PostgreSQL] 连接池已关闭');
  }

  /**
   * 获取连接池状态
   */
  getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

/**
 * 创建PostgreSQL数据库适配器
 */
function createPostgreSQLAdapter(config = {}) {
  try {
    const adapter = new PostgreSQLAdapter(config);

    // 返回兼容的接口
    return {
      run(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        return adapter.run(sql, params, callback);
      },

      get(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        return adapter.get(sql, params, callback);
      },

      all(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        return adapter.all(sql, params, callback);
      },

      prepare(sql) {
        return adapter.prepare(sql);
      },

      transaction(callback) {
        return adapter.transaction(callback);
      },

      serialize(fn) {
        adapter.serialize(fn);
      },

      close() {
        return adapter.close();
      },

      getPoolStatus() {
        return adapter.getPoolStatus();
      },

      _driver: 'postgresql',
      _raw: adapter.pool
    };
  } catch (err) {
    console.error('[PostgreSQL] Failed to create adapter:', err.message);
    throw err;
  }
}

module.exports = {
  PostgreSQLAdapter,
  createPostgreSQLAdapter
};

