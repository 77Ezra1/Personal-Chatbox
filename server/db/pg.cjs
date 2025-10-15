const { Pool } = require('pg');
const { getPostgresUrl } = require('./env.cjs');

function toPgSql(sql) {
  // 将 SQLite 风格 ? 占位符转换为 $1, $2 ...
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function createPgDb() {
  const connectionString = getPostgresUrl();
  const pool = new Pool({ connectionString });

  const db = {
    _driver: 'pg',
    async _query(sql, params) {
      const client = await pool.connect();
      try {
        const res = await client.query(toPgSql(sql), Array.isArray(params) ? params : []);
        return res;
      } finally {
        client.release();
      }
    },
    run(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      this._query(sql, params).then(() => cb && cb(null)).catch(err => cb && cb(err));
    },
    get(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      this._query(sql, params)
        .then(res => cb && cb(null, res.rows[0] || null))
        .catch(err => cb && cb(err));
    },
    all(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      this._query(sql, params)
        .then(res => cb && cb(null, res.rows || []))
        .catch(err => cb && cb(err));
    },
    serialize(fn) {
      // PG 连接池下无需 serialize，这里直接执行
      try { fn && fn(); } catch (_) {}
    },
    prepare(sql) {
      // 简化的 prepare，返回带 run 方法的对象
      const self = this;
      return {
        run: (...args) => new Promise((resolve, reject) => {
          self._query(sql, args)
            .then(() => resolve())
            .catch(reject);
        }),
        finalize: () => {}
      };
    }
  };

  return db;
}

module.exports = {
  createPgDb
};


