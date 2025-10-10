/**
 * useMcpServers Hook
 * 管理 MCP 服务器配置
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllMcpServers, 
  getActiveMcpServers 
} from '@/lib/db/mcpServers'
import { 
  convertMcpToolsToOpenAIFormat, 
  executeMcpTool 
} from '@/lib/mcpClient'

export function useMcpServers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载服务器配置
  const loadServers = useCallback(async () => {
    try {
      setLoading(true)
      const allServers = await getAllMcpServers()
      setServers(allServers)
      setError(null)
    } catch (err) {
      console.error('Failed to load MCP servers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadServers()
  }, [loadServers])

  // 获取已启用的服务器
  const getEnabledServers = useCallback(async () => {
    try {
      return await getActiveMcpServers()
    } catch (err) {
      console.error('Failed to get enabled servers:', err)
      return []
    }
  }, [])

  // 获取 OpenAI 格式的工具列表
  const getTools = useCallback(async () => {
    try {
      const enabledServers = await getEnabledServers()
      return convertMcpToolsToOpenAIFormat(enabledServers)
    } catch (err) {
      console.error('Failed to get tools:', err)
      return []
    }
  }, [getEnabledServers])

  // 执行工具调用
  const callTool = useCallback(async (toolName, parameters) => {
    try {
      const enabledServers = await getEnabledServers()
      return await executeMcpTool(toolName, parameters, enabledServers)
    } catch (err) {
      console.error('Failed to call tool:', err)
      return {
        success: false,
        error: err.message
      }
    }
  }, [getEnabledServers])

  return {
    servers,
    loading,
    error,
    loadServers,
    getEnabledServers,
    getTools,
    callTool
  }
}

