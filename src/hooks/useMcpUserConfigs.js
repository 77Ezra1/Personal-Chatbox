import { useState, useEffect } from 'react'
import { createLogger } from '../lib/logger'

const logger = createLogger('useMcpUserConfigs')

/**
 * Hook for managing user's custom MCP configurations
 */
export function useMcpUserConfigs() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载用户配置列表
  const loadConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/mcp/user-configs')
      const data = await response.json()

      if (data.success) {
        setConfigs(data.configs || [])
      } else {
        throw new Error(data.message || '加载配置失败')
      }
    } catch (err) {
      logger.error('Failed to load user MCP configs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 创建新配置
  const createConfig = async (configData) => {
    try {
      const response = await fetch('/api/mcp/user-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '创建失败')
      }

      await loadConfigs() // 重新加载列表
      return data
    } catch (err) {
      logger.error('Failed to create config:', err)
      throw err
    }
  }

  // 更新配置
  const updateConfig = async (configId, updates) => {
    try {
      const response = await fetch(`/api/mcp/user-configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '更新失败')
      }

      await loadConfigs() // 重新加载列表
      return data
    } catch (err) {
      logger.error('Failed to update config:', err)
      throw err
    }
  }

  // 删除配置
  const deleteConfig = async (configId) => {
    try {
      const response = await fetch(`/api/mcp/user-configs/${configId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '删除失败')
      }

      await loadConfigs() // 重新加载列表
      return data
    } catch (err) {
      logger.error('Failed to delete config:', err)
      throw err
    }
  }

  // 切换启用状态
  const toggleConfig = async (configId) => {
    try {
      const response = await fetch(`/api/mcp/user-configs/${configId}/toggle`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '切换失败')
      }

      await loadConfigs() // 重新加载列表
      return data
    } catch (err) {
      logger.error('Failed to toggle config:', err)
      throw err
    }
  }

  // 测试连接
  const testConfig = async (configId) => {
    try {
      const response = await fetch(`/api/mcp/user-configs/${configId}/test`, {
        method: 'POST'
      })

      const data = await response.json()
      return data
    } catch (err) {
      logger.error('Failed to test config:', err)
      throw err
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  return {
    configs,
    loading,
    error,
    reload: loadConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
    testConfig
  }
}

