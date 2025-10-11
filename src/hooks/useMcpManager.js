/**
 * MCP Manager Hook (后端API版本)
 * 通过后端API管理MCP服务
 */

import { useState, useEffect, useCallback } from 'react'
import * as mcpApi from '../lib/mcpApiClient'

/**
 * MCP 服务管理器
 * 通过后端API管理多个 MCP 服务
 */
export function useMcpManager() {
  const [services, setServices] = useState([])
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载服务列表
  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      const serviceList = await mcpApi.getServices()
      console.log('[MCP Manager] Loaded services:', serviceList)
      setServices(serviceList)
      setError(null)
    } catch (err) {
      console.error('[MCP Manager] Failed to load services:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载工具列表
  const loadTools = useCallback(async () => {
    try {
      const toolList = await mcpApi.getTools()
      console.log('[MCP Manager] Loaded tools:', toolList)
      setTools(toolList)
    } catch (err) {
      console.error('[MCP Manager] Failed to load tools:', err)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadServices()
    loadTools()
  }, [loadServices, loadTools])

  // 获取所有可用工具
  const getAllTools = useCallback(() => {
    console.log('[MCP Manager] Getting all tools:', tools)
    return tools
  }, [tools])

  // 调用工具
  const callTool = useCallback(async (toolName, parameters) => {
    console.log('[MCP Manager] Calling tool:', toolName, 'with params:', parameters)
    
    try {
      const result = await mcpApi.callTool(toolName, parameters)
      console.log('[MCP Manager] Tool result:', result)
      return result
    } catch (err) {
      console.error('[MCP Manager] Tool call failed:', err)
      throw err
    }
  }, [])

  // 启用/禁用服务
  const toggleService = useCallback(async (serviceId, enabled) => {
    try {
      await mcpApi.toggleService(serviceId, enabled)
      // 重新加载服务和工具列表
      await loadServices()
      await loadTools()
    } catch (err) {
      console.error(`[MCP Manager] Failed to toggle service ${serviceId}:`, err)
      throw err
    }
  }, [loadServices, loadTools])

  // 获取已启用的服务列表(兼容旧接口)
  const enabledServers = services.filter(s => s.enabled)

  // 模拟connections格式(兼容旧接口)
  const connections = enabledServers.map(service => ({
    serverId: service.id,
    serverName: service.name,
    tools: service.tools || [],
    isReady: service.loaded
  }))

  return {
    loading,
    error,
    enabledServers,
    connections,
    services,
    getAllTools,
    callTool,
    toggleService,
    reload: loadServices
  }
}

