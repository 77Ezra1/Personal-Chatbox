/**
 * 统一数据库适配器
 * 生产环境可用的数据库方案
 * 优先级: PostgreSQL > better-sqlite3 > JSON fallback
 */

const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/app.db');
const JSON_DB_PATH = path.join(__dirname, '../../data/database.json');

/**
 * 创建数据库适配器
 * 优先级: PostgreSQL > better-sqlite3 > JSON fallback
 */
function createDatabaseAdapter() {
  // 优先使用 PostgreSQL (生产环境推荐)
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    try {
      const { createPostgreSQLAdapter } = require('./postgres-adapter.cjs');
      const pgAdapter = createPostgreSQLAdapter({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        max: parseInt(process.env.PG_POOL_MAX) || 20,
        min: parseInt(process.env.PG_POOL_MIN) || 2
      });
      console.log('[Unified DB] ✅ Using PostgreSQL (Production Mode)');
      return pgAdapter;
    } catch (err) {
      console.warn('[Unified DB] PostgreSQL not available:', err.message);
      console.warn('[Unified DB] Falling back to SQLite...');
    }
  }

  // 尝试使用 better-sqlite3
  try {
    const BetterSqlite3 = require('better-sqlite3');
    console.log('[Unified DB] 正在打开数据库:', DB_PATH);
    const db = new BetterSqlite3(DB_PATH);

    // 设置PRAGMA
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    console.log('[Unified DB] ✅ Using better-sqlite3, 数据库路径:', DB_PATH);

    // 返回标准接口
    const invokeCallback = (callback, err, info) => {
      if (!callback) return;
      if (err) {
        callback.call({ lastID: undefined, changes: undefined }, err);
        return;
      }

      const lastInsertRowid = info?.lastInsertRowid ?? info?.lastInsertRowId ?? info?.lastID ?? null;
      if (info && lastInsertRowid !== undefined) {
        info.lastID = lastInsertRowid;
      }
      const context = {
        lastID: lastInsertRowid,
        changes: info?.changes ?? 0
      };
      callback.call(context, null, info);
    };

    return {
      run(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        try {
          const info = db.prepare(sql).run(...(Array.isArray(params) ? params : []));
          const result = info || {};
          invokeCallback(callback, null, result);
          return result;
        } catch (err) {
          if (callback) invokeCallback(callback, err);
          else throw err;
        }
      },

      get(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        try {
          const row = db.prepare(sql).get(...(Array.isArray(params) ? params : []));
          if (callback) callback(null, row);
          return row;
        } catch (err) {
          if (callback) callback(err);
          else throw err;
        }
      },

      all(sql, params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        try {
          const rows = db.prepare(sql).all(...(Array.isArray(params) ? params : []));
          if (callback) callback(null, rows);
          return rows;
        } catch (err) {
          if (callback) callback(err);
          else throw err;
        }
      },

      prepare(sql) {
        return db.prepare(sql);
      },

      serialize(fn) {
        if (fn) fn();
      },

      close() {
        db.close();
      },

      _driver: 'better-sqlite3',
      _raw: db
    };
  } catch (err) {
    console.warn('[Unified DB] better-sqlite3 not available:', err.message);
  }

  // Fallback: 使用JSON数据库
  console.log('[Unified DB] Using JSON fallback database');
  return createJsonDatabaseAdapter();
}

/**
 * 创建JSON数据库适配器
 */
function createJsonDatabaseAdapter() {
  const dataDir = path.dirname(JSON_DB_PATH);

  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 初始化数据结构
  let data = {
    users: [],
    oauth_accounts: [],
    sessions: [],
    login_history: [],
    conversations: [],
    messages: [],
    user_configs: [],
    invite_codes: [],
    images: [],
    image_analyses: [],
    voice_records: [],
    file_uploads: [],
    knowledge_bases: [],
    knowledge_documents: [],
    personas: [],
    workflows: [],
    agents: [],
    agent_tasks: [],
    context_memories: [],
    conversation_summaries: [],
    prompt_templates: []
  };

  // 加载现有数据
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const content = fs.readFileSync(JSON_DB_PATH, 'utf8');
      data = JSON.parse(content);
      console.log('[JSON DB] Loaded existing data');
    } else {
      // 初始化默认邀请码
      data.invite_codes = [
        {
          id: 1,
          code: 'WELCOME2025',
          max_uses: -1,
          used_count: 0,
          description: '欢迎使用',
          created_at: new Date().toISOString(),
          expires_at: null,
          is_active: 1
        },
        {
          id: 2,
          code: 'TEST2025',
          max_uses: -1,
          used_count: 0,
          description: '测试邀请码',
          created_at: new Date().toISOString(),
          expires_at: null,
          is_active: 1
        }
      ];
      saveData();
      console.log('[JSON DB] Created new database with default invite codes');
    }
  } catch (err) {
    console.error('[JSON DB] Error loading data:', err);
  }

  // 保存数据
  function saveData() {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[JSON DB] Error saving data:', err);
    }
  }

  // 解析SQL语句
  function parseSQL(sql, params) {
    const sqlTrim = sql.trim();
    const sqlUpper = sqlTrim.toUpperCase();

    // CREATE TABLE - 忽略
    if (sqlUpper.startsWith('CREATE')) {
      return { type: 'CREATE', table: null };
    }

    // INSERT
    if (sqlUpper.startsWith('INSERT INTO')) {
      // 使用[\s\S]而不是.来匹配包括换行符的任何字符
      const match = sql.match(/INSERT INTO (\w+)\s*\(([\s\S]*?)\)\s*VALUES/i);
      if (match) {
        const table = match[1];
        const columns = match[2].split(',').map(c => c.trim());
        console.log('[JSON DB] Parsed INSERT:', { table, columns: columns.length });
        return { type: 'INSERT', table, columns, params };
      } else {
        console.log('[JSON DB] Failed to parse INSERT statement:', sql.substring(0, 100));
      }
    }

    // SELECT
    if (sqlUpper.startsWith('SELECT')) {
      const fromMatch = sql.match(/FROM (\w+)/i);
      const table = fromMatch ? fromMatch[1] : null;

      const whereMatch = sql.match(/WHERE (.+?)(?:ORDER BY|LIMIT|$)/i);
      let where = {};

      if (whereMatch && params && params.length > 0) {
        const whereSql = whereMatch[1].trim();

        // 提取主要的 AND 条件 - 使用简单的字符串分割
        const andConditions = whereSql.split(' AND ').map(s => s.trim());
        let paramIndex = 0;

        andConditions.forEach((cond) => {
          // 匹配 LOWER(column) = LOWER(?) 的条件
          const lowerMatch = cond.match(/LOWER\((\w+)\)\s*=\s*LOWER\(\?\)/i);
          if (lowerMatch && paramIndex < params.length) {
            const column = lowerMatch[1];
            // 存储为特殊标记，在后续匹配时使用小写比较
            where[`LOWER_${column}`] = params[paramIndex].toString().toLowerCase();
            paramIndex++;
            return;
          }

          // 匹配 column = ? 的简单条件
          const simpleMatch = cond.match(/^(\w+)\s*=\s*\?/);
          if (simpleMatch && paramIndex < params.length) {
            const column = simpleMatch[1];
            where[column] = params[paramIndex];
            paramIndex++;
            return;
          }

          // 匹配 column = value 的直接赋值
          const directMatch = cond.match(/^(\w+)\s*=\s*(\d+|'[^']*')/);
          if (directMatch) {
            const column = directMatch[1];
            let value = directMatch[2];
            // 去掉引号
            if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            // 转换数字类型
            if (/^\d+$/.test(value)) {
              value = parseInt(value, 10);
            }
            where[column] = value;
            return;
          }

          // 对于复杂条件（如 expires_at IS NULL OR ...），我们跳过
          // JSON数据库中通常不会有expires_at字段，或者为null/undefined
        });
      }

      return { type: 'SELECT', table, where, params };
    }

    // UPDATE
    if (sqlUpper.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE (\w+)/i);
      const table = tableMatch ? tableMatch[1] : null;
      
      // 解析 SET 子句
      const setMatch = sql.match(/SET\s+(.*?)\s+WHERE/i);
      const setClause = setMatch ? setMatch[1].trim() : '';
      const setFields = {};
      
      if (setClause) {
        // 分割 SET 子句中的字段赋值
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIndex = 0;
        
        assignments.forEach(assignment => {
          const eqMatch = assignment.match(/(\w+)\s*=\s*(.+)/);
          if (eqMatch) {
            const column = eqMatch[1].trim();
            const value = eqMatch[2].trim();
            
            if (value === '?') {
              // 使用参数
              setFields[column] = params[paramIndex++];
            } else if (value === "datetime('now')") {
              // 特殊处理时间戳
              setFields[column] = new Date().toISOString();
            } else {
              // 直接值
              setFields[column] = value.replace(/^'|'$/g, '');
            }
          }
        });
      }
      
      // 解析 WHERE 子句
      const whereMatch = sql.match(/WHERE\s+(.+)$/i);
      const where = {};
      
      if (whereMatch) {
        const whereSql = whereMatch[1].trim();
        const andConditions = whereSql.split(' AND ').map(s => s.trim());
        let whereParamIndex = Object.keys(setFields).filter(k => setClause.includes('?')).length;
        
        andConditions.forEach(cond => {
          const simpleMatch = cond.match(/^(\w+)\s*=\s*\?/);
          if (simpleMatch && whereParamIndex < params.length) {
            where[simpleMatch[1]] = params[whereParamIndex++];
          }
        });
      }
      
      return { type: 'UPDATE', table, setFields, where, params };
    }

    // DELETE
    if (sqlUpper.startsWith('DELETE')) {
      const fromMatch = sql.match(/FROM (\w+)/i);
      const table = fromMatch ? fromMatch[1] : null;
      return { type: 'DELETE', table, params };
    }

    return { type: 'UNKNOWN', table: null };
  }

  // 返回标准接口
  return {
    run(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      // If no callback provided (or callback is not a function), return a promise
      if (!callback || typeof callback !== 'function') {
        return new Promise((resolve, reject) => {
          try {
            const parsed = parseSQL(sql, params);

            if (parsed.type === 'CREATE') {
              resolve();
              return;
            }

            if (parsed.type === 'INSERT' && parsed.table) {
              const table = parsed.table;
              if (!data[table]) data[table] = [];

              const record = {};
              parsed.columns.forEach((col, index) => {
                record[col] = params[index];
              });

              // 自动添加ID和时间戳
              if (!record.id) {
                record.id = data[table].length + 1;
              }
              if (!record.created_at) {
                record.created_at = new Date().toISOString();
              }

              data[table].push(record);
              saveData();

              resolve({ lastID: record.id, changes: 1 });
              return;
            }

            // UPDATE
            if (parsed.type === 'UPDATE' && parsed.table) {
              const table = parsed.table;
              if (!data[table]) {
                resolve({ changes: 0 });
                return;
              }

              let changes = 0;
              data[table] = data[table].map(row => {
                // 检查WHERE条件
                const matches = Object.entries(parsed.where || {}).every(([key, value]) => {
                  return row[key] == value;
                });

                if (matches) {
                  // 应用SET字段更新
                  Object.entries(parsed.setFields || {}).forEach(([key, value]) => {
                    row[key] = value;
                  });
                  changes++;
                }

                return row;
              });

              if (changes > 0) {
                saveData();
              }

              resolve({ changes });
              return;
            }

            // DELETE
            if (parsed.type === 'DELETE' && parsed.table) {
              const table = parsed.table;
              if (!data[table]) {
                resolve({ changes: 0 });
                return;
              }

              const originalLength = data[table].length;
              
              // 解析WHERE条件
              const whereMatch = sql.match(/WHERE\s+(.+)$/i);
              if (whereMatch) {
                const whereSql = whereMatch[1].trim();
                const andConditions = whereSql.split(' AND ').map(s => s.trim());
                let paramIndex = 0;
                const where = {};
                
                andConditions.forEach(cond => {
                  const simpleMatch = cond.match(/^(\w+)\s*=\s*\?/);
                  if (simpleMatch && paramIndex < params.length) {
                    where[simpleMatch[1]] = params[paramIndex++];
                  }
                });
                
                data[table] = data[table].filter(row => {
                  return !Object.entries(where).every(([key, value]) => row[key] == value);
                });
              }

              const changes = originalLength - data[table].length;
              if (changes > 0) {
                saveData();
              }

              resolve({ changes });
              return;
            }

            // 其他操作也返回成功
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }

      // Callback mode
      try {
        const parsed = parseSQL(sql, params);

        if (parsed.type === 'CREATE') {
          callback(null);
          return;
        }

        if (parsed.type === 'INSERT' && parsed.table) {
          const table = parsed.table;
          if (!data[table]) data[table] = [];

          const record = {};
          parsed.columns.forEach((col, index) => {
            record[col] = params[index];
          });

          // 自动添加ID和时间戳
          if (!record.id) {
            record.id = data[table].length + 1;
          }
          if (!record.created_at) {
            record.created_at = new Date().toISOString();
          }

          data[table].push(record);
          saveData();

          // 修复：提供正确的上下文对象
          const context = { lastID: record.id, changes: 1 };
          callback.call(context, null);
          return;
        }

        // UPDATE
        if (parsed.type === 'UPDATE' && parsed.table) {
          const table = parsed.table;
          if (!data[table]) {
            callback.call({ changes: 0 }, null);
            return;
          }

          let changes = 0;
          data[table] = data[table].map(row => {
            // 检查WHERE条件
            const matches = Object.entries(parsed.where || {}).every(([key, value]) => {
              return row[key] == value;
            });

            if (matches) {
              // 应用SET字段更新
              Object.entries(parsed.setFields || {}).forEach(([key, value]) => {
                row[key] = value;
              });
              changes++;
            }

            return row;
          });

          if (changes > 0) {
            saveData();
          }

          callback.call({ changes }, null);
          return;
        }

        // DELETE
        if (parsed.type === 'DELETE' && parsed.table) {
          const table = parsed.table;
          if (!data[table]) {
            callback.call({ changes: 0 }, null);
            return;
          }

          const originalLength = data[table].length;
          
          // 解析WHERE条件
          const whereMatch = sql.match(/WHERE\s+(.+)$/i);
          if (whereMatch) {
            const whereSql = whereMatch[1].trim();
            const andConditions = whereSql.split(' AND ').map(s => s.trim());
            let paramIndex = 0;
            const where = {};
            
            andConditions.forEach(cond => {
              const simpleMatch = cond.match(/^(\w+)\s*=\s*\?/);
              if (simpleMatch && paramIndex < params.length) {
                where[simpleMatch[1]] = params[paramIndex++];
              }
            });
            
            data[table] = data[table].filter(row => {
              return !Object.entries(where).every(([key, value]) => row[key] == value);
            });
          }

          const changes = originalLength - data[table].length;
          if (changes > 0) {
            saveData();
          }

          callback.call({ changes }, null);
          return;
        }

        // 其他操作也返回成功
        const emptyContext = { lastID: null, changes: 0 };
        callback.call(emptyContext, null);
      } catch (err) {
        callback(err);
      }
    },

    get(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      // If no callback provided (or callback is not a function), return a promise
      if (!callback || typeof callback !== 'function') {
        return new Promise((resolve, reject) => {
          try {
            const parsed = parseSQL(sql, params);

            if (parsed.type === 'SELECT' && parsed.table) {
              const table = parsed.table;
              const rows = data[table] || [];

              // 应用WHERE条件
              let filtered = rows;
              if (parsed.where && Object.keys(parsed.where).length > 0) {
                filtered = rows.filter(row => {
                  return Object.entries(parsed.where).every(([key, value]) => {
                    // 处理 LOWER_ 前缀的条件（不区分大小写比较）
                    if (key.startsWith('LOWER_')) {
                      const actualColumn = key.substring(6); // 移除 'LOWER_' 前缀
                      const rowValue = row[actualColumn];
                      if (rowValue == null) return false;
                      return rowValue.toString().toLowerCase() === value;
                    }
                    // 对于布尔字段，undefined 视为 0
                    let rowValue = row[key];
                    if (rowValue === undefined && (key === 'is_archived' || key === 'is_favorite')) {
                      rowValue = 0;
                    }
                    // 普通条件（直接比较）
                    return rowValue == value;
                  });
                });
              }

              const result = filtered[0] || null;
              resolve(result);
              return;
            }

            resolve(null);
          } catch (err) {
            reject(err);
          }
        });
      }

      // Callback mode
      try {
        const parsed = parseSQL(sql, params);

        if (parsed.type === 'SELECT' && parsed.table) {
          const table = parsed.table;
          const rows = data[table] || [];

          // 应用WHERE条件
          let filtered = rows;
          if (parsed.where && Object.keys(parsed.where).length > 0) {
            filtered = rows.filter(row => {
              return Object.entries(parsed.where).every(([key, value]) => {
                // 处理 LOWER_ 前缀的条件（不区分大小写比较）
                if (key.startsWith('LOWER_')) {
                  const actualColumn = key.substring(6); // 移除 'LOWER_' 前缀
                  const rowValue = row[actualColumn];
                  if (rowValue == null) return false;
                  return rowValue.toString().toLowerCase() === value;
                }
                // 对于布尔字段，undefined 视为 0
                let rowValue = row[key];
                if (rowValue === undefined && (key === 'is_archived' || key === 'is_favorite')) {
                  rowValue = 0;
                }
                // 普通条件（直接比较）
                return rowValue == value;
              });
            });
          }

          const result = filtered[0] || null;
          callback(null, result);
          return;
        }

        callback(null, null);
      } catch (err) {
        callback(err);
      }
    },

    all(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      // If no callback provided (or callback is not a function), return a promise
      if (!callback || typeof callback !== 'function') {
        return new Promise((resolve, reject) => {
          try {
            const parsed = parseSQL(sql, params);

            if (parsed.type === 'SELECT' && parsed.table) {
              const table = parsed.table;
              const rows = data[table] || [];

              // 应用WHERE条件
              let filtered = rows;
              if (parsed.where && Object.keys(parsed.where).length > 0) {
                filtered = rows.filter(row => {
                  return Object.entries(parsed.where).every(([key, value]) => {
                    // 处理 LOWER_ 前缀的条件（不区分大小写比较）
                    if (key.startsWith('LOWER_')) {
                      const actualColumn = key.substring(6); // 移除 'LOWER_' 前缀
                      const rowValue = row[actualColumn];
                      if (rowValue == null) return false;
                      return rowValue.toString().toLowerCase() === value;
                    }
                    // 对于布尔字段，undefined 视为 0
                    let rowValue = row[key];
                    if (rowValue === undefined && (key === 'is_archived' || key === 'is_favorite')) {
                      rowValue = 0;
                    }
                    // 普通条件（直接比较）
                    return rowValue == value;
                  });
                });
              }

              resolve(filtered);
              return;
            }

            resolve([]);
          } catch (err) {
            reject(err);
          }
        });
      }

      // Callback mode
      try {
        const parsed = parseSQL(sql, params);

        if (parsed.type === 'SELECT' && parsed.table) {
          const table = parsed.table;
          const rows = data[table] || [];

          // 应用WHERE条件
          let filtered = rows;
          if (parsed.where && Object.keys(parsed.where).length > 0) {
            filtered = rows.filter(row => {
              return Object.entries(parsed.where).every(([key, value]) => {
                // 处理 LOWER_ 前缀的条件（不区分大小写比较）
                if (key.startsWith('LOWER_')) {
                  const actualColumn = key.substring(6); // 移除 'LOWER_' 前缀
                  const rowValue = row[actualColumn];
                  if (rowValue == null) return false;
                  return rowValue.toString().toLowerCase() === value;
                }
                // 对于布尔字段，undefined 视为 0
                let rowValue = row[key];
                if (rowValue === undefined && (key === 'is_archived' || key === 'is_favorite')) {
                  rowValue = 0;
                }
                // 普通条件（直接比较）
                return rowValue == value;
              });
            });
          }

          callback(null, filtered);
          return;
        }

        callback(null, []);
      } catch (err) {
        callback(err);
      }
    },

    prepare(sql) {
      const self = this;
      return {
        run(...args) {
          return self.run(sql, args);
        },
        get(...args) {
          return self.get(sql, args);
        },
        all(...args) {
          return self.all(sql, args);
        }
      };
    },

    serialize(fn) {
      if (fn) fn();
    },

    close() {
      saveData();
    },

    _driver: 'json',
    _raw: { data, saveData }
  };
}

module.exports = {
  createDatabaseAdapter,
  DB_PATH,
  JSON_DB_PATH
};
