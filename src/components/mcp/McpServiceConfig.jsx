import { useState, useEffect } from 'react'
import { Search, Cloud, Eye, EyeOff, Copy, Check, ExternalLink, AlertCircle, Info, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PRESET_MCP_SERVERS, MCP_SERVICE_TYPES, MCP_SERVICE_TYPE_ICONS, validateApiKey } from '@/lib/mcpConfig'
import { 
  getAllMcpServers, 
  saveMcpServer, 
  updateMcpServer, 
  deleteMcpServer 
} from '@/lib/db/mcpServers'
import './McpServiceConfig.css'

/**
 * MCP 服务配置组件
 * 用于配置搜索、天气和时间等 MCP 服务
 */
export function McpServiceConfig({ language, translate }) {
  const [servers, setServers] = useState([])
  const [expandedServer, setExpandedServer] = useState(null)
  const [showApiKey, setShowApiKey] = useState({})
  const [copiedKey, setCopiedKey] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载已保存的配置
  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const savedServers = await getAllMcpServers()
      
      // 合并预置配置和已保存配置
      const mergedServers = Object.values(PRESET_MCP_SERVERS).map(preset => {
        const saved = savedServers.find(s => s.id === preset.id)
        return saved ? { ...preset, ...saved } : preset
      })
      
      setServers(mergedServers)
      setError(null)
    } catch (err) {
      console.error('Failed to load MCP servers:', err)
      setError('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleServer = async (serverId) => {
    try {
      const server = servers.find(s => s.id === serverId)
      const newEnabled = !server.isEnabled
      
      // 如果启用且需要 API Key，检查是否已配置
      if (newEnabled && server.requiresApiKey && !server.apiKey) {
        setExpandedServer(serverId)
        return
      }

      // 更新数据库
      const savedServer = await getAllMcpServers()
      const existing = savedServer.find(s => s.id === serverId)
      
      if (existing) {
        await updateMcpServer(serverId, { isEnabled: newEnabled })
      } else {
        await saveMcpServer({
          ...server,
          isEnabled: newEnabled
        })
      }

      // 更新本地状态
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, isEnabled: newEnabled } : s
      ))
    } catch (err) {
      console.error('Failed to toggle server:', err)
      alert('操作失败，请重试')
    }
  }

  const handleSaveApiKey = async (serverId, apiKey) => {
    try {
      const server = servers.find(s => s.id === serverId)
      
      // 验证 API Key 格式
      if (!validateApiKey(serverId, apiKey)) {
        alert('API Key 格式不正确，请检查后重试')
        return
      }

      // 保存到数据库
      const savedServers = await getAllMcpServers()
      const existing = savedServers.find(s => s.id === serverId)
      
      if (existing) {
        await updateMcpServer(serverId, { apiKey, isEnabled: true })
      } else {
        await saveMcpServer({
          ...server,
          apiKey,
          isEnabled: true
        })
      }

      // 更新本地状态
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, apiKey, isEnabled: true } : s
      ))
      
      setExpandedServer(null)
      alert('保存成功！')
    } catch (err) {
      console.error('Failed to save API key:', err)
      alert('保存失败，请重试')
    }
  }

  const handleCopyApiKey = (serverId) => {
    const server = servers.find(s => s.id === serverId)
    if (server?.apiKey) {
      navigator.clipboard.writeText(server.apiKey)
      setCopiedKey({ ...copiedKey, [serverId]: true })
      setTimeout(() => {
        setCopiedKey({ ...copiedKey, [serverId]: false })
      }, 2000)
    }
  }

  const getServiceIcon = (type) => {
    return MCP_SERVICE_TYPE_ICONS[type] || '🔧'
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

  // 按类型分组
  const searchServers = servers.filter(s => s.type === MCP_SERVICE_TYPES.SEARCH)
  const weatherServers = servers.filter(s => s.type === MCP_SERVICE_TYPES.WEATHER)
  const timeServers = servers.filter(s => s.type === MCP_SERVICE_TYPES.TIME)

  return (
    <div className="mcp-service-config">
      <div className="mcp-intro">
        <p>
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询和时间服务。
          推荐的服务都是免费的，其中标记为"免费"的服务无需API密钥即可使用。
        </p>
      </div>

      <Tabs defaultValue="search" className="mcp-tabs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            搜索服务
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            天气服务
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            时间服务
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mcp-tab-content">
          <div className="mcp-service-grid">
            {searchServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                expanded={expandedServer === server.id}
                showApiKey={showApiKey[server.id]}
                copiedKey={copiedKey[server.id]}
                onToggle={() => handleToggleServer(server.id)}
                onExpand={() => setExpandedServer(
                  expandedServer === server.id ? null : server.id
                )}
                onToggleShowKey={() => setShowApiKey({
                  ...showApiKey,
                  [server.id]: !showApiKey[server.id]
                })}
                onCopyKey={() => handleCopyApiKey(server.id)}
                onSaveKey={(apiKey) => handleSaveApiKey(server.id, apiKey)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weather" className="mcp-tab-content">
          <div className="mcp-service-grid">
            {weatherServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                expanded={expandedServer === server.id}
                showApiKey={showApiKey[server.id]}
                copiedKey={copiedKey[server.id]}
                onToggle={() => handleToggleServer(server.id)}
                onExpand={() => setExpandedServer(
                  expandedServer === server.id ? null : server.id
                )}
                onToggleShowKey={() => setShowApiKey({
                  ...showApiKey,
                  [server.id]: !showApiKey[server.id]
                })}
                onCopyKey={() => handleCopyApiKey(server.id)}
                onSaveKey={(apiKey) => handleSaveApiKey(server.id, apiKey)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time" className="mcp-tab-content">
          <div className="mcp-service-grid">
            {timeServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                expanded={expandedServer === server.id}
                showApiKey={showApiKey[server.id]}
                copiedKey={copiedKey[server.id]}
                onToggle={() => handleToggleServer(server.id)}
                onExpand={() => setExpandedServer(
                  expandedServer === server.id ? null : server.id
                )}
                onToggleShowKey={() => setShowApiKey({
                  ...showApiKey,
                  [server.id]: !showApiKey[server.id]
                })}
                onCopyKey={() => handleCopyApiKey(server.id)}
                onSaveKey={(apiKey) => handleSaveApiKey(server.id, apiKey)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
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

  return (
    <div className={`mcp-service-card ${server.isEnabled ? 'enabled' : ''}`}>
      <div className="mcp-service-header">
        <div className="mcp-service-info">
          <div className="mcp-service-title">
            <span className="mcp-service-icon">{server.icon}</span>
            <h5 className="mcp-service-name">{server.name}</h5>
            <ServiceInfoDialog server={server} />
          </div>
          <p className="mcp-service-description">{server.description}</p>
          <div className="mcp-service-badges">
            {server.isFree && (
              <Badge variant="secondary" className="mcp-free-badge">
                免费
              </Badge>
            )}
            {server.freeLimit && (
              <Badge variant="outline" className="mcp-limit-badge">
                {server.freeLimit}
              </Badge>
            )}
            <Badge variant="outline" className="mcp-lang-badge">
              {server.language}
            </Badge>
          </div>
        </div>
        <div className="mcp-service-actions">
          <label className="mcp-switch">
            <input
              type="checkbox"
              checked={server.isEnabled}
              onChange={onToggle}
            />
            <span className="mcp-switch-slider"></span>
          </label>
        </div>
      </div>

      {server.requiresApiKey && (
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

      {!server.requiresApiKey && server.isEnabled && (
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
            <span className="text-2xl">{server.icon}</span>
            {server.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mcp-info-content space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="font-semibold mb-2">服务简介</h4>
            <p className="text-sm text-muted-foreground">{server.description}</p>
            <div className="flex gap-2 mt-2">
              {server.isFree && (
                <Badge variant="secondary">免费服务</Badge>
              )}
              {server.freeLimit && (
                <Badge variant="outline">{server.freeLimit}</Badge>
              )}
              <Badge variant="outline">{server.language}</Badge>
            </div>
          </div>

          {/* 功能列表 */}
          <div>
            <h4 className="font-semibold mb-2">提供的功能</h4>
            <div className="space-y-2">
              {server.tools.map((tool, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    参数: {Object.entries(tool.parameters).map(([key, desc]) => 
                      `${key} (${desc})`
                    ).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 安装配置 */}
          <div>
            <h4 className="font-semibold mb-2">安装命令</h4>
            <div className="bg-muted p-3 rounded font-mono text-sm">
              {server.installCommand}
              <button
                className="ml-2 text-xs text-primary hover:underline"
                onClick={() => copyToClipboard(server.installCommand)}
              >
                复制
              </button>
            </div>
          </div>

          {/* 配置示例 */}
          <div>
            <h4 className="font-semibold mb-2">配置示例</h4>
            <div className="bg-muted p-3 rounded">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(server.configExample, null, 2)}
              </pre>
              <button
                className="mt-2 text-xs text-primary hover:underline"
                onClick={() => copyToClipboard(JSON.stringify(server.configExample, null, 2))}
              >
                复制配置
              </button>
            </div>
          </div>

          {/* 链接按钮 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(server.repoUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              GitHub 仓库
            </Button>
            
            {server.docsUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(server.docsUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                官方文档
              </Button>
            )}
            
            {server.signupUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(server.signupUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                获取 API Key
              </Button>
            )}
          </div>

          {/* API Key 要求 */}
          {server.requiresApiKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">需要 API Key</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                此服务需要 API Key 才能使用。请访问官方网站注册并获取免费的 API Key。
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
