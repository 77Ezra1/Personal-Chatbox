import { useState, useEffect } from 'react'
import { Search, Cloud, Eye, EyeOff, Copy, Check, ExternalLink, AlertCircle, Info, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMcpManager } from '@/hooks/useMcpManager'
import './McpServiceConfig.css'

/**
 * MCP 服务配置组件
 * 用于配置搜索、天气和时间等 MCP 服务
 */
export function McpServiceConfig({ language, translate }) {
  // 使用新的 MCP Manager Hook
  const { services, loading, error, toggleService, reload } = useMcpManager()
  
  const [expandedServer, setExpandedServer] = useState(null)
  const [showApiKey, setShowApiKey] = useState({})
  const [copiedKey, setCopiedKey] = useState({})

  const handleToggleServer = async (serverId) => {
    try {
      const service = services.find(s => s.id === serverId)
      const newEnabled = !service.enabled
      
      // 调用后端API更新服务状态
      await toggleService(serverId, newEnabled)
    } catch (err) {
      console.error('Failed to toggle server:', err)
      alert('操作失败，请重试')
    }
  }

  const handleSaveApiKey = async (serverId, apiKey) => {
    try {
      // 目前的预设服务都不需要API Key，所以这个函数暂时简化
      console.log('API Key saved for', serverId, apiKey)
      setExpandedServer(null)
      alert('保存成功！')
    } catch (err) {
      console.error('Failed to save API key:', err)
      alert('保存失败，请重试')
    }
  }

  const handleCopyApiKey = (serverId) => {
    const service = services.find(s => s.id === serverId)
    if (service?.apiKey) {
      navigator.clipboard.writeText(service.apiKey)
      setCopiedKey({ ...copiedKey, [serverId]: true })
      setTimeout(() => {
        setCopiedKey({ ...copiedKey, [serverId]: false })
      }, 2000)
    }
  }

  const getServiceIcon = (type) => {
    const icons = {
      weather: '🌤️',
      search: '🔍',
      time: '🕐',
      default: '🔧'
    }
    return icons[type] || icons.default
  }

  if (loading) {
    return <div className="mcp-loading">加载中...</div>
  }

  if (error) {
    return (
      <div className="mcp-error">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="mcp-service-config">
      <div className="mcp-intro">
        <p>
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。
          所有服务都是免费的，无需API密钥即可使用。
        </p>
      </div>

      <div className="mcp-service-list">
        <h3 className="text-lg font-semibold mb-4">可用服务</h3>
        <div className="mcp-service-grid">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              server={service}
              expanded={expandedServer === service.id}
              showApiKey={showApiKey[service.id]}
              copiedKey={copiedKey[service.id]}
              onToggle={() => handleToggleServer(service.id)}
              onExpand={() => setExpandedServer(
                expandedServer === service.id ? null : service.id
              )}
              onToggleShowKey={() => setShowApiKey({
                ...showApiKey,
                [service.id]: !showApiKey[service.id]
              })}
              onCopyKey={() => handleCopyApiKey(service.id)}
              onSaveKey={(apiKey) => handleSaveApiKey(service.id, apiKey)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 服务卡片组件
 */
function ServiceCard({
  server,
  expanded,
  showApiKey,
  copiedKey,
  onToggle,
  onExpand,
  onToggleShowKey,
  onCopyKey,
  onSaveKey
}) {
  const [apiKeyInput, setApiKeyInput] = useState(server.apiKey || '')

  useEffect(() => {
    setApiKeyInput(server.apiKey || '')
  }, [server.apiKey])

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveKey(apiKeyInput.trim())
    }
  }

  const getServiceIcon = (id) => {
    const icons = {
      weather: '🌤️',
      search: '🔍',
      time: '🕐',
      youtube: '📹',
      coincap: '💰',
      fetch: '🌐'
    }
    return icons[id] || '🔧'
  }

  return (
    <div className={`mcp-service-card ${server.enabled ? 'enabled' : ''}`}>
      <div className="mcp-service-header">
        <div className="mcp-service-info">
          <div className="mcp-service-title">
            <span className="mcp-service-icon">{getServiceIcon(server.id)}</span>
            <h5 className="mcp-service-name">{server.name}</h5>
            <ServiceInfoDialog server={server} />
          </div>
          <p className="mcp-service-description">{server.description}</p>
          <div className="mcp-service-badges">
            <Badge variant="secondary" className="mcp-free-badge">
              免费
            </Badge>
            <Badge variant="outline" className="mcp-limit-badge">
              无需API密钥
            </Badge>
            <Badge variant="outline" className="mcp-lang-badge">
              实时数据
            </Badge>
          </div>
        </div>
        <div className="mcp-service-actions">
          <label className="mcp-switch">
            <input
              type="checkbox"
              checked={server.enabled}
              onChange={onToggle}
            />
            <span className="mcp-switch-slider"></span>
          </label>
        </div>
      </div>

      {false && (
        <div className="mcp-service-body">
          <button
            className="mcp-expand-button"
            onClick={onExpand}
          >
            {expanded ? '收起配置' : '配置 API Key'}
          </button>

          {expanded && (
            <div className="mcp-api-key-config">
              <div className="mcp-api-key-input-group">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="mcp-api-key-input"
                  placeholder={server.apiKeyPlaceholder}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  className="mcp-icon-button"
                  onClick={onToggleShowKey}
                  title={showApiKey ? '隐藏' : '显示'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {server.apiKey && (
                  <button
                    className="mcp-icon-button"
                    onClick={onCopyKey}
                    title="复制"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="mcp-api-key-actions">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!apiKeyInput.trim()}
                >
                  保存
                </Button>
                {server.signupUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(server.signupUrl, '_blank')}
                  >
                    获取 API Key
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {server.isEnabled && (
        <div className="mcp-service-footer">
          <Badge variant="secondary" className="mcp-ready-badge">
            ✓ 已就绪，无需配置
          </Badge>
        </div>
      )}
    </div>
  )
}

/**
 * 服务信息弹窗组件
 */
function ServiceInfoDialog({ server }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // 根据服务类型提供功能描述
  const getServiceFeatures = (serverId) => {
    switch (serverId) {
      case 'open-meteo-weather':
        return [
          { name: '当前天气查询', description: '获取指定城市的实时天气信息' },
          { name: '天气预报', description: '获取未来几天的天气预报' }
        ]
      case 'duckduckgo-search':
        return [
          { name: '网络搜索', description: '使用Wikipedia进行信息搜索' },
          { name: '搜索建议', description: '提供相关搜索建议和链接' }
        ]
      case 'official-time-server':
        return [
          { name: '当前时间', description: '获取当前的日期和时间' },
          { name: '时区支持', description: '支持不同时区的时间查询' }
        ]
      default:
        return []
    }
  }

  const features = getServiceFeatures(server.id)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="mcp-info-button" title="查看详细信息">
          <Info className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="mcp-info-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getServiceIcon(server.type)}</span>
            {server.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mcp-info-content space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="font-semibold mb-2">服务简介</h4>
            <p className="text-sm text-muted-foreground">{server.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">免费服务</Badge>
              <Badge variant="outline">无需API密钥</Badge>
              <Badge variant="outline">实时数据</Badge>
            </div>
          </div>

          {/* 功能列表 */}
          {features.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">提供的功能</h4>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{feature.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div>
            <h4 className="font-semibold mb-2">使用说明</h4>
            <div className="bg-muted p-3 rounded text-sm">
              <p>此服务已自动配置并启用，无需额外设置。</p>
              <p className="mt-2">您可以直接在对话中询问相关问题，AI助手会自动调用此服务获取实时信息。</p>
            </div>
          </div>

          {/* 服务状态 */}
          <div>
            <h4 className="font-semibold mb-2">服务状态</h4>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${server.isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm">
                {server.isEnabled ? '已启用' : '已禁用'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
