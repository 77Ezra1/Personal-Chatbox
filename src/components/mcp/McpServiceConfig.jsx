import { useState, useEffect } from 'react'
import { Search, Cloud, Eye, EyeOff, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRESET_MCP_SERVERS, MCP_SERVICE_TYPES, validateApiKey } from '@/lib/mcpConfig'
import { 
  getAllMcpServers, 
  saveMcpServer, 
  updateMcpServer, 
  deleteMcpServer 
} from '@/lib/db/mcpServers'
import './McpServiceConfig.css'

/**
 * MCP 服务配置组件
 * 用于配置搜索和天气等 MCP 服务
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
    switch (type) {
      case MCP_SERVICE_TYPES.SEARCH:
        return <Search className="w-5 h-5" />
      case MCP_SERVICE_TYPES.WEATHER:
        return <Cloud className="w-5 h-5" />
      default:
        return null
    }
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

  return (
    <div className="mcp-service-config">
      <div className="mcp-intro">
        <p>
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索和天气查询。
          这些服务需要相应的 API Key 才能使用。
        </p>
      </div>

      {/* 搜索服务 */}
      <div className="mcp-service-group">
        <h4 className="mcp-group-title">
          <Search className="w-4 h-4" />
          搜索服务
        </h4>
        <div className="mcp-service-list">
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
      </div>

      {/* 天气服务 */}
      <div className="mcp-service-group">
        <h4 className="mcp-group-title">
          <Cloud className="w-4 h-4" />
          天气服务
        </h4>
        <div className="mcp-service-list">
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

  return (
    <div className={`mcp-service-card ${server.isEnabled ? 'enabled' : ''}`}>
      <div className="mcp-service-header">
        <div className="mcp-service-info">
          <span className="mcp-service-icon">{server.icon}</span>
          <div>
            <h5 className="mcp-service-name">{server.name}</h5>
            <p className="mcp-service-description">{server.description}</p>
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
                  <a
                    href={server.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mcp-link"
                  >
                    获取 API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {server.docsUrl && (
                  <a
                    href={server.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mcp-link"
                  >
                    查看文档
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* 工具列表 */}
              <div className="mcp-tools-info">
                <h6>提供的功能：</h6>
                <ul>
                  {server.tools.map((tool, index) => (
                    <li key={index}>
                      <strong>{tool.name}</strong>: {tool.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {!server.requiresApiKey && server.isEnabled && (
        <div className="mcp-service-footer">
          <span className="mcp-free-badge">✓ 无需 API Key，免费使用</span>
        </div>
      )}
    </div>
  )
}

