/**
 * MCP Servers Database Operations
 * MCP 服务器数据库操作
 */

import { openDatabase } from './index'
import { generateId, STORES } from './schema'

/**
 * 获取所有 MCP 服务器
 * @returns {Promise<Array>}
 */
export async function getAllMcpServers() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MCP_SERVERS, 'readonly')
    const store = tx.objectStore(STORES.MCP_SERVERS)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取单个 MCP 服务器
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getMcpServer(id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MCP_SERVERS, 'readonly')
    const store = tx.objectStore(STORES.MCP_SERVERS)
    const request = store.get(id)
    
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 保存 MCP 服务器
 * @param {Object} serverConfig 
 * @returns {Promise<Object>}
 */
export async function saveMcpServer(serverConfig) {
  const db = await openDatabase()
  const now = Date.now()
  
  const server = {
    id: serverConfig.id || generateId('mcp'),
    name: serverConfig.name,
    type: serverConfig.type,
    url: serverConfig.url,
    authType: serverConfig.authType || 'none',
    apiKey: serverConfig.apiKey || '',
    isEnabled: serverConfig.isEnabled !== undefined ? serverConfig.isEnabled : false,
    createdAt: now,
    updatedAt: now
  }
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MCP_SERVERS, 'readwrite')
    const store = tx.objectStore(STORES.MCP_SERVERS)
    const request = store.add(server)
    
    request.onsuccess = () => resolve(server)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 更新 MCP 服务器
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
export async function updateMcpServer(id, updates) {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MCP_SERVERS, 'readwrite')
    const store = tx.objectStore(STORES.MCP_SERVERS)
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const server = getRequest.result
      if (!server) {
        reject(new Error(`MCP Server not found: ${id}`))
        return
      }
      
      const updatedServer = {
        ...server,
        ...updates,
        updatedAt: Date.now()
      }
      
      const putRequest = store.put(updatedServer)
      putRequest.onsuccess = () => resolve(updatedServer)
      putRequest.onerror = () => reject(putRequest.error)
    }
    
    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * 删除 MCP 服务器
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteMcpServer(id) {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MCP_SERVERS, 'readwrite')
    const store = tx.objectStore(STORES.MCP_SERVERS)
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取所有激活的 MCP 服务器
 * @returns {Promise<Array>}
 */
export async function getActiveMcpServers() {
  const servers = await getAllMcpServers()
  return servers.filter(server => server.isEnabled)
}

/**
 * 更新服务器连接状态
 * @param {string} id 
 * @param {string} state 
 * @returns {Promise<Object>}
 */
export async function updateConnectionState(id, state) {
  const updates = {
    connectionState: state
  }
  
  if (state === 'connected') {
    updates.lastConnected = Date.now()
  }
  
  return updateMcpServer(id, updates)
}

/**
 * 更新服务器工具列表
 * @param {string} id 
 * @param {Array} tools 
 * @returns {Promise<Object>}
 */
export async function updateMcpTools(id, tools) {
  return updateMcpServer(id, { tools })
}

/**
 * 清除服务器认证信息
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function clearMcpAuth(id) {
  return updateMcpServer(id, {
    authToken: '',
    authConfig: {}
  })
}

