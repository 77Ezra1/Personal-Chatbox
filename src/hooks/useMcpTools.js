import { useState, useEffect, useMemo } from 'react'
import { createLogger } from '../lib/logger'

const logger = createLogger('useMcpTools')

/**
 * Hook for getting available MCP tools from enabled services
 * 获取已启用 MCP 服务的可用工具
 */
export function useMcpTools() {
  const [services, setServices] = useState([])
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载服务和工具列表
  const loadTools = async () => {
    try {
      setLoading(true)
      setError(null)

      // 并行请求服务列表和工具列表
      const [servicesRes, toolsRes] = await Promise.all([
        fetch('/api/mcp/services'),
        fetch('/api/mcp/tools')
      ])

      const servicesData = await servicesRes.json()
      const toolsData = await toolsRes.json()

      if (servicesData.success) {
        // 只保留已启用且有工具的服务
        // 这样确保显示的服务都是真正可用的
        const enabledServices = servicesData.services.filter(s => {
          // 已启用 且 有工具（toolCount > 0）
          return s.enabled === true && s.toolCount > 0
        })
        setServices(enabledServices)

        logger.info(`Loaded ${enabledServices.length} enabled services with tools (total ${servicesData.services.length} services)`)
      }

      if (toolsData.success) {
        // tools 已经由后端过滤，只包含 running 状态的服务
        const availableTools = toolsData.tools || []
        setTools(availableTools)

        logger.info(`Loaded ${availableTools.length} available tools`)
      }

    } catch (err) {
      logger.error('Failed to load MCP tools:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTools()
  }, [])

  // 按服务分组的工具（只包含已启用且运行中的服务）
  const toolsByService = useMemo(() => {
    const grouped = {}

    // 创建已启用服务的 ID 集合，用于快速查找
    const enabledServiceIds = new Set(services.map(s => s.id))

    tools.forEach(tool => {
      // 从工具名称中提取服务ID
      // 格式: serviceId_toolName
      const toolName = tool.function.name
      const serviceId = tool._serviceId || toolName.split('_')[0]

      // 只处理已启用且运行中的服务的工具
      if (!enabledServiceIds.has(serviceId)) {
        return
      }

      if (!grouped[serviceId]) {
        const service = services.find(s => s.id === serviceId)
        grouped[serviceId] = {
          id: serviceId,
          name: service?.name || serviceId,
          description: service?.description || '',
          enabled: true, // 已经过滤，这里一定是 true
          status: service?.status || 'running',
          tools: []
        }
      }

      grouped[serviceId].tools.push({
        id: toolName,
        name: tool.function.name,
        description: tool.function.description || '',
        displayName: tool._toolName || toolName.split('_').slice(1).join('_'),
        serviceId: serviceId,
        parameters: tool.function.parameters || {}
      })
    })

    return grouped
  }, [services, tools])

  // 扁平化的工具列表（用于 Agent 配置，只包含已启用服务的工具）
  const flatTools = useMemo(() => {
    // 创建已启用服务的 ID 集合
    const enabledServiceIds = new Set(services.map(s => s.id))

    return tools
      .filter(tool => {
        const serviceId = tool._serviceId || tool.function.name.split('_')[0]
        return enabledServiceIds.has(serviceId)
      })
      .map(tool => ({
        value: tool.function.name,
        label: tool.function.description || tool.function.name,
        serviceId: tool._serviceId || tool.function.name.split('_')[0],
        toolName: tool._toolName || tool.function.name.split('_').slice(1).join('_'),
        description: tool.function.description || '',
        parameters: tool.function.parameters || {}
      }))
  }, [tools, services])

  // 按类别分组的工具
  const toolsByCategory = useMemo(() => {
    const categories = {
      search: { name: '搜索和检索', tools: [] },
      file: { name: '文件操作', tools: [] },
      data: { name: '数据处理', tools: [] },
      api: { name: 'API 和网络', tools: [] },
      automation: { name: '自动化', tools: [] },
      analysis: { name: '分析', tools: [] },
      other: { name: '其他', tools: [] }
    }

    flatTools.forEach(tool => {
      const toolName = tool.toolName.toLowerCase()
      const desc = tool.description.toLowerCase()

      if (toolName.includes('search') || toolName.includes('find') || desc.includes('搜索') || desc.includes('查询')) {
        categories.search.tools.push(tool)
      } else if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write') || desc.includes('文件')) {
        categories.file.tools.push(tool)
      } else if (toolName.includes('data') || toolName.includes('transform') || toolName.includes('parse')) {
        categories.data.tools.push(tool)
      } else if (toolName.includes('api') || toolName.includes('http') || toolName.includes('fetch') || toolName.includes('request')) {
        categories.api.tools.push(tool)
      } else if (toolName.includes('auto') || toolName.includes('run') || toolName.includes('execute')) {
        categories.automation.tools.push(tool)
      } else if (toolName.includes('analy') || toolName.includes('stat') || toolName.includes('calc')) {
        categories.analysis.tools.push(tool)
      } else {
        categories.other.tools.push(tool)
      }
    })

    // 移除空类别
    Object.keys(categories).forEach(key => {
      if (categories[key].tools.length === 0) {
        delete categories[key]
      }
    })

    return categories
  }, [flatTools])

  return {
    services,
    tools,
    toolsByService,
    flatTools,
    toolsByCategory,
    loading,
    error,
    reload: loadTools
  }
}

