const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/app.db');

function openDb() {
  // 优先使用 better-sqlite3（提供稳定的预构建）
  try {
    const BetterSqlite3 = require('better-sqlite3');
    const bs3 = new BetterSqlite3(DB_PATH);
    // 关键 PRAGMA：提升多进程/多句柄一致性与健壮性
    try {
      bs3.pragma('journal_mode = WAL');
      bs3.pragma('synchronous = NORMAL');
      bs3.pragma('foreign_keys = ON');
      bs3.pragma('busy_timeout = 5000');
    } catch (e) {
      console.warn('[DB Adapter] Warning setting PRAGMA:', e.message);
    }

    // 适配到类似 sqlite3 的异步接口
    const db = {
      run(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
          bs3.prepare(sql).run(...(Array.isArray(params) ? params : []));
          cb && cb(null);
        } catch (err) {
          cb && cb(err);
        }
      },
      get(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
          const row = bs3.prepare(sql).get(...(Array.isArray(params) ? params : []));
          cb && cb(null, row);
        } catch (err) {
          cb && cb(err);
        }
      },
      all(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        try {
          const rows = bs3.prepare(sql).all(...(Array.isArray(params) ? params : []));
          cb && cb(null, rows);
        } catch (err) {
          cb && cb(err);
        }
      },
      prepare(sql) {
        return bs3.prepare(sql);
      },
      serialize(fn) { try { fn && fn(); } catch (_) {} },
      close() { bs3.close(); },
      _driver: 'better-sqlite3',
      _raw: bs3
    };
    return db;
  } catch (e) {
    console.error('[DB Adapter] better-sqlite3 error:', e.message);
  }

  // 回退到 sqlite3 (已禁用，仅使用 better-sqlite3)
  // try {
  //   const sqlite3 = require('sqlite3').verbose();
  //   const db = new sqlite3.Database(DB_PATH);
  //   try {
  //     db.serialize(() => {
  //       db.run('PRAGMA journal_mode=WAL');
  //       db.run('PRAGMA synchronous=NORMAL');
  //       db.run('PRAGMA foreign_keys=ON');
  //       db.run('PRAGMA busy_timeout=5000');
  //       });
  //   } catch (e) {
  //     console.warn('[DB Adapter] Warning setting PRAGMA (sqlite3):', e.message);
  //   }
  //   db._driver = 'sqlite3';
  //   return db;
  // } catch (e) {
  //   console.error('[DB Adapter] sqlite3 error:', e.message);
  // }

  console.error('[DB Adapter] No SQLite driver available!');
  return null;
}

module.exports = {
  DB_PATH,
  openDb
};


