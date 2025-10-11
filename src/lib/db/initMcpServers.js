/**
 * MCP 服务器数据初始化
 * 将预置的MCP服务器配置保存到数据库
 */

import { getAllMcpServers, saveMcpServer } from './mcpServers'
import { PRESET_MCP_SERVERS } from '../mcpConfig'

/**
 * 初始化预置的MCP服务器到数据库
 * @returns {Promise<void>}
 */
export async function initializeMcpServers() {
  try {
    // 检查数据库中是否已有MCP服务器
    const existingServers = await getAllMcpServers()
    
    if (existingServers.length > 0) {
      console.log('[MCP] MCP servers already initialized, skipping...')
      return
    }
    
    console.log('[MCP] Initializing MCP servers to database...')
    
    // 将所有预置服务器保存到数据库
    const initPromises = Object.values(PRESET_MCP_SERVERS).map(async (serverConfig) => {
      try {
        const server = {
          id: serverConfig.id,
          name: serverConfig.name,
          type: serverConfig.type,
          description: serverConfig.description,
          requiresApiKey: serverConfig.requiresApiKey,
          isEnabled: false, // 默认不启用，用户手动启用
          config: serverConfig,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        await saveMcpServer(server)
        console.log(`[MCP] Initialized server: ${server.name}`)
      } catch (error) {
        console.error(`[MCP] Failed to initialize server ${serverConfig.name}:`, error)
      }
    })
    
    await Promise.all(initPromises)
    console.log('[MCP] MCP servers initialization completed')
    
  } catch (error) {
    console.error('[MCP] Failed to initialize MCP servers:', error)
  }
}

/**
 * 检查并初始化MCP服务器（如果需要）
 * @returns {Promise<void>}
 */
export async function ensureMcpServersInitialized() {
  try {
    const existingServers = await getAllMcpServers()
    
    if (existingServers.length === 0) {
      await initializeMcpServers()
    }
  } catch (error) {
    console.error('[MCP] Failed to ensure MCP servers initialized:', error)
  }
}
