import { useState, useEffect, useMemo, useCallback } from 'react'
import { createLogger } from '../lib/logger'
import { getToolTranslatedName, getToolTranslatedDescription } from '../i18n/mcpToolsTranslations'
import { subscribeMcpServicesUpdated } from '../lib/mcpEvents'

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
  const loadTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      // 并行请求服务列表和工具列表
      const [servicesRes, toolsRes] = await Promise.all([
        fetch('/api/mcp/services?refresh=true', { headers }),
        fetch('/api/mcp/tools', { headers })
      ])

      if (!servicesRes.ok || !toolsRes.ok) {
        throw new Error(`HTTP Error: services ${servicesRes.status}, tools ${toolsRes.status}`)
      }

      const servicesData = await servicesRes.json()
      const toolsData = await toolsRes.json()

      if (servicesData.success) {
        // 只保留已启用、已配置且有工具的服务
        // 这样确保显示的服务都是真正可用的
        const enabledServices = servicesData.services.filter(s => {
          // 已启用 且 已配置（有必需的API Keys）且 有工具（toolCount > 0）
          return s.enabled === true && s.isConfigured !== false && s.toolCount > 0
        })
        setServices(enabledServices)

        logger.info(`Loaded ${enabledServices.length} enabled and configured services with tools (total ${servicesData.services.length} services)`)
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
  }, [])

  useEffect(() => {
    loadTools()
  }, [loadTools])

  useEffect(() => {
    const unsubscribe = subscribeMcpServicesUpdated(() => {
      logger.info('[useMcpTools] 收到 mcp-services-updated 事件，重新加载工具列表')
      loadTools()
    })
    return unsubscribe
  }, [loadTools])

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

      const originalToolName = tool._toolName || toolName.split('_').slice(1).join('_')
      const originalDescription = tool.function.description || ''

      // 使用国际化翻译
      const translatedName = getToolTranslatedName(originalToolName)
      const translatedDescription = getToolTranslatedDescription(originalToolName, originalDescription)

      grouped[serviceId].tools.push({
        id: toolName,
        name: tool.function.name,
        description: translatedDescription, // 显示翻译后的描述
        originalDescription: originalDescription, // 保留原始描述
        displayName: translatedName, // 显示翻译后的名称
        originalDisplayName: originalToolName, // 保留原始名称
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
      .map(tool => {
        const originalToolName = tool._toolName || tool.function.name.split('_').slice(1).join('_')
        const originalDescription = tool.function.description || ''

        // 使用国际化翻译
        const translatedName = getToolTranslatedName(originalToolName)
        const translatedDescription = getToolTranslatedDescription(originalToolName, originalDescription)

        return {
          value: tool.function.name, // 保持英文，用于API调用
          label: translatedDescription || translatedName, // 显示翻译后的描述
          serviceId: tool._serviceId || tool.function.name.split('_')[0],
          toolName: translatedName, // 显示翻译后的名称
          originalToolName: originalToolName, // 保留原始英文名称
          description: translatedDescription, // 显示翻译后的描述
          originalDescription: originalDescription, // 保留原始英文描述
          parameters: tool.function.parameters || {}
        }
      })
  }, [tools, services])

  // 按类别分组的工具
  const toolsByCategory = useMemo(() => {
    const categories = {
      search: { name: 'Search & Retrieval', tools: [] },
      file: { name: 'File Operations', tools: [] },
      data: { name: 'Data Processing', tools: [] },
      api: { name: 'API & Network', tools: [] },
      automation: { name: 'Automation', tools: [] },
      analysis: { name: 'Analysis', tools: [] },
      other: { name: 'Other', tools: [] }
    }

    flatTools.forEach(tool => {
      // 使用原始英文名称进行分类判断（更准确）
      const originalName = tool.originalToolName.toLowerCase()
      const translatedName = tool.toolName.toLowerCase()
      const translatedDesc = tool.description.toLowerCase()

      // 检查英文和中文关键词
      if (
        originalName.includes('search') || originalName.includes('find') ||
        translatedName.includes('搜索') || translatedName.includes('查找') ||
        translatedDesc.includes('搜索') || translatedDesc.includes('查询')
      ) {
        categories.search.tools.push(tool)
      } else if (
        originalName.includes('file') || originalName.includes('read') || originalName.includes('write') ||
        originalName.includes('directory') || originalName.includes('create') || originalName.includes('edit') ||
        translatedName.includes('文件') || translatedDesc.includes('文件') || translatedDesc.includes('目录')
      ) {
        categories.file.tools.push(tool)
      } else if (
        originalName.includes('data') || originalName.includes('transform') || originalName.includes('parse') ||
        originalName.includes('query') || originalName.includes('database') ||
        translatedName.includes('数据') || translatedDesc.includes('数据库')
      ) {
        categories.data.tools.push(tool)
      } else if (
        originalName.includes('api') || originalName.includes('http') || originalName.includes('fetch') ||
        originalName.includes('request') || originalName.includes('get') || originalName.includes('post') ||
        translatedName.includes('请求') || translatedDesc.includes('网络')
      ) {
        categories.api.tools.push(tool)
      } else if (
        originalName.includes('auto') || originalName.includes('run') || originalName.includes('execute') ||
        originalName.includes('puppeteer') || originalName.includes('click') || originalName.includes('fill') ||
        translatedName.includes('自动') || translatedDesc.includes('自动化') || translatedDesc.includes('浏览器')
      ) {
        categories.automation.tools.push(tool)
      } else if (
        originalName.includes('analy') || originalName.includes('stat') || originalName.includes('calc') ||
        translatedName.includes('分析') || translatedDesc.includes('统计')
      ) {
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
