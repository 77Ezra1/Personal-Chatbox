import { useState, useEffect } from 'react'
import { createLogger } from '../lib/logger'

const logger = createLogger('useMcpTemplates')

/**
 * Hook for managing MCP service templates
 */
export function useMcpTemplates() {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/mcp/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
      } else {
        throw new Error(data.message || '加载模板失败')
      }
    } catch (err) {
      logger.error('Failed to load MCP templates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 从模板创建用户配置
  const createFromTemplate = async (templateId, customEnvVars = {}) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/mcp/user-configs/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId,
          customEnvVars
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '创建失败')
      }

      return data
    } catch (err) {
      logger.error('Failed to create from template:', err)
      throw err
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  return {
    templates,
    categories,
    loading,
    error,
    reload: loadTemplates,
    createFromTemplate
  }
}

