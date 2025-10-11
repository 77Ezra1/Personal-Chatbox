import React, { useState, useEffect } from 'react'
import { AlertCircle, Search, Cloud, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { initializeMcpServices, getEnabledServices, updateServiceStatus } from '@/lib/mcpInit'

/**
 * 简化的MCP服务配置组件
 */
export default function McpServiceConfigSimple() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      await initializeMcpServices()
      const services = await getEnabledServices()
      setServers(services)
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
      
      await updateServiceStatus(serverId, newEnabled)
      
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, isEnabled: newEnabled } : s
      ))
    } catch (err) {
      console.error('Failed to toggle server:', err)
      alert('操作失败，请重试')
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
    return <div className="p-4">加载中...</div>
  }

  if (error) {
    return (
      <div className="p-4 flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  // 按类型分组
  const searchServers = servers.filter(s => s.type === 'search')
  const weatherServers = servers.filter(s => s.type === 'weather')
  const timeServers = servers.filter(s => s.type === 'time')

  return (
    <div className="p-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询和时间服务。
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
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

        <TabsContent value="search" className="mt-4">
          <div className="space-y-4">
            {searchServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                onToggle={() => handleToggleServer(server.id)}
                getServiceIcon={getServiceIcon}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weather" className="mt-4">
          <div className="space-y-4">
            {weatherServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                onToggle={() => handleToggleServer(server.id)}
                getServiceIcon={getServiceIcon}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <div className="space-y-4">
            {timeServers.map(server => (
              <ServiceCard
                key={server.id}
                server={server}
                onToggle={() => handleToggleServer(server.id)}
                getServiceIcon={getServiceIcon}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * 简化的服务卡片组件
 */
function ServiceCard({ server, onToggle, getServiceIcon }) {
  return (
    <div className={`border rounded-lg p-4 ${server.isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getServiceIcon(server.type)}</span>
          <div>
            <h5 className="font-medium">{server.name}</h5>
            <p className="text-sm text-gray-600">{server.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">免费</Badge>
              <Badge variant="outline">无需API密钥</Badge>
              <Badge variant="outline">实时数据</Badge>
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={server.isEnabled}
              onChange={onToggle}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              server.isEnabled ? 'bg-green-600' : 'bg-gray-200'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                server.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </div>
      </div>
      
      {server.isEnabled && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            ✓ 已就绪，无需配置
          </Badge>
        </div>
      )}
    </div>
  )
}
