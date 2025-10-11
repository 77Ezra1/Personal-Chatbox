/**
 * IndexedDB Database Manager
 * 数据库管理器
 */

import { DB_NAME, DB_VERSION, initSchema } from './schema.js'

let dbInstance = null
let dbPromise = null

/**
 * 打开数据库连接
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase() {
  // 如果已有连接，直接返回
  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  // 如果正在连接，返回连接Promise
  if (dbPromise) {
    return dbPromise
  }

  // 创建新连接
  dbPromise = new Promise((resolve, reject) => {
    // 检查浏览器支持
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // 数据库升级（创建或更新schema）
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      console.log('[DB] Upgrading database schema...')
      initSchema(db)
    }

    // 连接成功
    request.onsuccess = (event) => {
      dbInstance = event.target.result
      console.log('[DB] Database opened successfully')
      
      // 处理数据库意外关闭
      dbInstance.onclose = () => {
        console.warn('[DB] Database connection closed')
        dbInstance = null
        dbPromise = null
      }

      // 处理版本变更
      dbInstance.onversionchange = () => {
        console.warn('[DB] Database version changed, closing connection')
        dbInstance.close()
        dbInstance = null
        dbPromise = null
      }

      resolve(dbInstance)
    }

    // 连接失败
    request.onerror = (event) => {
      console.error('[DB] Failed to open database:', event.target.error)
      dbPromise = null
      reject(event.target.error)
    }

    // 连接被阻塞
    request.onblocked = () => {
      console.warn('[DB] Database opening blocked')
    }
  })

  return dbPromise
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    dbPromise = null
    console.log('[DB] Database closed')
  }
}

/**
 * 删除数据库
 * @returns {Promise<void>}
 */
export function deleteDatabase() {
  return new Promise((resolve, reject) => {
    closeDatabase()

    const request = indexedDB.deleteDatabase(DB_NAME)

    request.onsuccess = () => {
      console.log('[DB] Database deleted successfully')
      resolve()
    }

    request.onerror = (event) => {
      console.error('[DB] Failed to delete database:', event.target.error)
      reject(event.target.error)
    }

    request.onblocked = () => {
      console.warn('[DB] Database deletion blocked')
    }
  })
}

/**
 * 执行数据库事务
 * @param {string|string[]} storeNames 对象存储名称
 * @param {string} mode 事务模式 ('readonly' | 'readwrite')
 * @param {Function} callback 事务回调函数
 * @returns {Promise<any>}
 */
export async function transaction(storeNames, mode, callback) {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeNames, mode)
      const stores = Array.isArray(storeNames)
        ? storeNames.map(name => tx.objectStore(name))
        : tx.objectStore(storeNames)

      // 执行回调
      const result = callback(Array.isArray(storeNames) ? stores : stores, tx)

      // 事务完成
      tx.oncomplete = () => {
        resolve(result)
      }

      // 事务错误
      tx.onerror = (event) => {
        console.error('[DB] Transaction error:', event.target.error)
        reject(event.target.error)
      }

      // 事务中止
      tx.onabort = (event) => {
        console.error('[DB] Transaction aborted:', event.target.error)
        reject(event.target.error)
      }
    } catch (error) {
      console.error('[DB] Transaction failed:', error)
      reject(error)
    }
  })
}

/**
 * 获取单个记录
 * @param {string} storeName 对象存储名称
 * @param {string} key 主键
 * @returns {Promise<any>}
 */
export async function get(storeName, key) {
  return transaction(storeName, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 获取所有记录
 * @param {string} storeName 对象存储名称
 * @returns {Promise<any[]>}
 */
export async function getAll(storeName) {
  return transaction(storeName, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 添加或更新记录
 * @param {string} storeName 对象存储名称
 * @param {any} data 数据
 * @returns {Promise<string>}
 */
export async function put(storeName, data) {
  return transaction(storeName, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 添加记录（如果已存在则失败）
 * @param {string} storeName 对象存储名称
 * @param {any} data 数据
 * @returns {Promise<string>}
 */
export async function add(storeName, data) {
  return transaction(storeName, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 删除记录
 * @param {string} storeName 对象存储名称
 * @param {string} key 主键
 * @returns {Promise<void>}
 */
export async function remove(storeName, key) {
  return transaction(storeName, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 清空对象存储
 * @param {string} storeName 对象存储名称
 * @returns {Promise<void>}
 */
export async function clear(storeName) {
  return transaction(storeName, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 通过索引查询
 * @param {string} storeName 对象存储名称
 * @param {string} indexName 索引名称
 * @param {any} query 查询值
 * @returns {Promise<any[]>}
 */
export async function getByIndex(storeName, indexName, query) {
  return transaction(storeName, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const index = store.index(indexName)
      const request = index.getAll(query)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  })
}

/**
 * 批量操作
 * @param {string} storeName 对象存储名称
 * @param {any[]} items 数据数组
 * @param {string} operation 操作类型 ('put' | 'add' | 'delete')
 * @returns {Promise<void>}
 */
export async function batch(storeName, items, operation = 'put') {
  return transaction(storeName, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const promises = items.map(item => {
        return new Promise((res, rej) => {
          let request
          if (operation === 'delete') {
            request = store.delete(item)
          } else if (operation === 'add') {
            request = store.add(item)
          } else {
            request = store.put(item)
          }
          request.onsuccess = () => res()
          request.onerror = () => rej(request.error)
        })
      })

      Promise.all(promises).then(resolve).catch(reject)
    })
  })
}

// 导出所有方法
export * from './schema'
export * from './models'
export * from './systemPrompts'
export * from './modelPrompts'
export * from './conversations'
export * from './appSettings'
export * from './providerApiKeys'
export * from './mcpServers'

// 为了向后兼容，导出 openDB 别名
export { openDatabase as openDB }

