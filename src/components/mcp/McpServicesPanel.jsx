import React, { useState, useMemo } from 'react'
import { AlertCircle, Grid, List, Filter, Search, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useMcpManager } from '@/hooks/useMcpManager'
import { useMcpTemplates } from '@/hooks/useMcpTemplates'
import { useMcpUserConfigs } from '@/hooks/useMcpUserConfigs'
import { McpPathConfigDialog } from './McpPathConfig'
import { AddMcpServiceDialog } from './AddMcpServiceDialog'
import { createLogger } from '../../lib/logger'

const logger = createLogger('McpServicesPanel')

/**
 * MCP 服务配置面板 - 支持卡片/列表视图切换和筛选
 */
export default function McpServicesPanel() {
  const { services, loading, error, toggleService } = useMcpManager()
  const { templates, categories, loading: templatesLoading, createFromTemplate } = useMcpTemplates()
  const { configs: userConfigs, loading: configsLoading, reload: reloadUserConfigs } = useMcpUserConfigs()

  // 视图模式：grid（卡片）或 list（列表）
  const [viewMode, setViewMode] = useState('grid')

  // 筛选类型：all（全部）、system（系统内置）、custom（用户自定义）
  const [filterType, setFilterType] = useState('all')

  // 搜索关键词
  const [searchQuery, setSearchQuery] = useState('')

  // 添加服务对话框
  const [showAddDialog, setShowAddDialog] = useState(false)

  // 系统内置服务 ID 列表
  const systemServiceIds = [
    'memory',
    'filesystem',
    'sequential_thinking',
    'wikipedia',
    'brave_search',
    'github',
    'sqlite',
    'weather',
    'time',
    'youtube',
    'dexscreener',
    'fetch',
    'playwright',
    'code_editor',
    'executor',
    'code_analyzer',
    'test_runner'
  ]

  // 根据筛选条件过滤服务
  const filteredServices = useMemo(() => {
    let filtered = services || []

    // 按类型筛选
    if (filterType === 'system') {
      filtered = filtered.filter(s => systemServiceIds.includes(s.id))
    } else if (filterType === 'custom') {
      filtered = filtered.filter(s => !systemServiceIds.includes(s.id))
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [services, filterType, searchQuery])

  // 统计数据
  const stats = useMemo(() => {
    const total = services?.length || 0
    const systemCount = services?.filter(s => systemServiceIds.includes(s.id)).length || 0
    const customCount = total - systemCount
    const enabledCount = services?.filter(s => s.enabled).length || 0

    return { total, systemCount, customCount, enabledCount }
  }, [services])

  const handleToggleServer = async (serverId) => {
    try {
      const service = services.find(s => s.id === serverId)
      const newEnabled = !service.enabled

      await toggleService(serverId, newEnabled)
    } catch (err) {
      logger.error('Failed to toggle server:', err)
      alert('操作失败，请重试')
    }
  }

  // 处理添加服务
  const handleAddService = async (templateId, envVars) => {
    try {
      await createFromTemplate(templateId, envVars)

      // 重新加载用户配置和服务列表
      await reloadUserConfigs()

      // 关闭对话框
      setShowAddDialog(false)

      // 提示成功
      alert('MCP 服务添加成功！')
    } catch (err) {
      logger.error('Failed to add service:', err)
      throw err // 让对话框显示错误
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载服务列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 说明文字 */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            已启用 {stats.enabledCount} / {stats.total}
          </span>
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* 左侧：筛选和搜索 */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
          {/* 添加服务按钮 */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            添加服务
          </button>
          {/* 筛选按钮组 */}
          <div className="inline-flex rounded-lg border p-1 bg-muted/30">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              全部 ({stats.total})
            </button>
            <button
              onClick={() => setFilterType('system')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterType === 'system'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              系统内置 ({stats.systemCount})
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterType === 'custom'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              用户自定义 ({stats.customCount})
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索服务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* 右侧：视图切换 */}
        <div className="inline-flex rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="卡片视图"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="列表视图"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 服务列表 */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>没有找到匹配的服务</p>
          <p className="text-sm mt-1">尝试调整筛选条件或搜索关键词</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
            : 'space-y-2'
        }>
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              viewMode={viewMode}
              onToggle={() => handleToggleServer(service.id)}
              isSystemService={systemServiceIds.includes(service.id)}
            />
          ))}
        </div>
      )}

      {/* 添加服务对话框 */}
      <AddMcpServiceDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        templates={templates}
        categories={categories}
        onAdd={handleAddService}
      />
    </div>
  )
}

/**
 * 服务卡片组件
 */
function ServiceCard({ service, viewMode, onToggle, isSystemService }) {
  const getServiceIcon = (id) => {
    const icons = {
      weather: '🌤️',
      search: '🔍',
      time: '🕐',
      youtube: '📹',
      coincap: '💰',
      fetch: '🌐',
      dexscreener: '💹',
      playwright: '🎭',
      memory: '🧠',
      filesystem: '📁',
      git: '🔀',
      sequential_thinking: '💭',
      sqlite: '🗄️',
      wikipedia: '📚',
      brave_search: '🔎',
      github: '🐙',
      puppeteer: '🎪',
      fetch_official: '🌍',
      google_maps: '🗺️',
      code_editor: '📝',
      executor: '⚡',
      code_analyzer: '🔍',
      test_runner: '🧪'
    }
    return icons[id] || '🔧'
  }

  const requiresConfig = service.requiresConfig ||
    (service.id === 'brave_search' || service.id === 'github')
  const hasApiKey = service.apiKey && service.apiKey.length > 0

  if (viewMode === 'list') {
    // 列表视图
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          service.enabled
            ? 'bg-accent/5 border-accent/20'
            : 'bg-muted/5 border-border/50 hover:bg-muted/10'
        }`}
      >
        {/* 图标 */}
        <span className="text-2xl flex-shrink-0">{getServiceIcon(service.id)}</span>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-medium truncate">{service.name}</h5>
            {!isSystemService && (
              <Badge variant="outline" className="text-xs">自定义</Badge>
            )}
            {(service.id === 'sqlite' || service.id === 'filesystem') && (
              <McpPathConfigDialog service={service} onSave={() => {}} />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{service.description}</p>
        </div>

        {/* 标签 */}
        <div className="flex gap-1 flex-shrink-0">
          {requiresConfig && !hasApiKey && (
            <Badge variant="outline" className="text-xs">需要配置</Badge>
          )}
          {hasApiKey && (
            <Badge variant="secondary" className="text-xs">✓ 已配置</Badge>
          )}
          {!requiresConfig && (
            <Badge variant="secondary" className="text-xs">免费</Badge>
          )}
          {service.tools && service.tools.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {service.tools.length} 工具
            </Badge>
          )}
        </div>

        {/* 开关 */}
        <Toggle checked={service.enabled} onChange={onToggle} />
      </div>
    )
  }

  // 卡片视图
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        service.enabled
          ? 'bg-accent/5 border-accent/20 shadow-sm'
          : 'bg-muted/5 border-border/50 hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl flex-shrink-0">{getServiceIcon(service.id)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-medium truncate">{service.name}</h5>
              {!isSystemService && (
                <Badge variant="outline" className="text-xs flex-shrink-0">自定义</Badge>
              )}
              {(service.id === 'sqlite' || service.id === 'filesystem') && (
                <McpPathConfigDialog service={service} onSave={() => {}} />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {requiresConfig ? (
                <>
                  <Badge variant="outline" className="text-xs">需要配置</Badge>
                  {hasApiKey && (
                    <Badge variant="secondary" className="text-xs">✓ 已配置</Badge>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">免费</Badge>
                  <Badge variant="outline" className="text-xs">无需配置</Badge>
                </>
              )}
              {service.tools && service.tools.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {service.tools.length} 个工具
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Toggle checked={service.enabled} onChange={onToggle} />
      </div>
    </div>
  )
}

/**
 * 开关组件
 */
function Toggle({ checked, onChange }) {
  return (
    <label className="flex items-center cursor-pointer flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked
            ? 'bg-primary'
            : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  )
}

