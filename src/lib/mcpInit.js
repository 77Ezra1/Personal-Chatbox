/**
 * MCP服务初始化
 * 在浏览器环境中直接初始化MCP服务
 */

import { openDatabase } from './db/index.js'
import { STORES } from './db/schema.js'

import { createLogger } from '../lib/logger'
const logger = createLogger('McpInit')


/**
 * 预置的MCP服务配置
 */
const PRESET_SERVICES = [
  {
    id: 'open-meteo-weather',
    name: 'Open-Meteo 天气',
    type: 'weather',
    description: '完全免费的高精度天气服务，无需API密钥',
    requiresApiKey: false,
    isEnabled: true, // 默认启用
    tools: ['get_current_weather', 'get_weather_forecast']
  },
  {
    id: 'duckduckgo-search',
    name: 'DuckDuckGo 搜索',
    type: 'search',
    description: '隐私保护的免费网络搜索，无需API密钥',
    requiresApiKey: false,
    isEnabled: true, // 默认启用
    tools: ['duckduckgo_search']
  },
  {
    id: 'official-time-server',
    name: '官方时间服务',
    type: 'time',
    description: '支持全球时区转换的时间服务',
    requiresApiKey: false,
    isEnabled: true, // 默认启用
    tools: ['get_current_time', 'convert_time']
  }
]

/**
 * 初始化MCP服务
 */
export async function initializeMcpServices() {
  try {
    logger.log('[MCP Init] Initializing MCP services...')
    
    const db = await openDatabase()
    
    // 检查是否已经初始化过
    const existingServices = await getAllServices(db)
    if (existingServices.length > 0) {
      logger.log('[MCP Init] Services already initialized')
      return existingServices
    }
    
    // 初始化预置服务
    const transaction = db.transaction([STORES.MCP_SERVERS], 'readwrite')
    const store = transaction.objectStore(STORES.MCP_SERVERS)
    
    const services = []
    for (const service of PRESET_SERVICES) {
      const serviceData = {
        ...service,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      await new Promise((resolve, reject) => {
        const request = store.add(serviceData)
        request.onsuccess = () => {
          services.push(serviceData)
          logger.log(`[MCP Init] Added service: ${service.name}`)
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    }
    
    logger.log(`[MCP Init] Initialized ${services.length} services`)
    return services
    
  } catch (error) {
    logger.error('[MCP Init] Failed to initialize services:', error)
    throw error
  }
}

/**
 * 获取所有服务
 */
async function getAllServices(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MCP_SERVERS], 'readonly')
    const store = transaction.objectStore(STORES.MCP_SERVERS)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取已启用的服务
 */
export async function getEnabledServices() {
  try {
    const db = await openDatabase()
    const allServices = await getAllServices(db)
    const enabledServices = allServices.filter(service => service.isEnabled)
    logger.log('[MCP Init] Enabled services:', enabledServices)
    return enabledServices
  } catch (error) {
    logger.error('[MCP Init] Failed to get enabled services:', error)
    return []
  }
}

/**
 * 更新服务状态
 */
export async function updateServiceStatus(serviceId, isEnabled) {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORES.MCP_SERVERS], 'readwrite')
    const store = transaction.objectStore(STORES.MCP_SERVERS)
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(serviceId)
      getRequest.onsuccess = () => {
        const service = getRequest.result
        if (service) {
          service.isEnabled = isEnabled
          service.updatedAt = Date.now()
          
          const putRequest = store.put(service)
          putRequest.onsuccess = () => {
            logger.log(`[MCP Init] Updated service ${serviceId}: enabled=${isEnabled}`)
            resolve(service)
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error(`Service not found: ${serviceId}`))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    logger.error('[MCP Init] Failed to update service status:', error)
    throw error
  }
}
