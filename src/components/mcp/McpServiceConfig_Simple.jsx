import React, { useState } from 'react'
import { AlertCircle, Search, Cloud, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useMcpManager } from '@/hooks/useMcpManager'
import { McpPathConfigDialog } from './McpPathConfig'

/**
 * 简化的MCP服务配置组件
 */
export default function McpServiceConfigSimple() {
  const { services, loading, error, toggleService } = useMcpManager()

  const handleToggleServer = async (serverId) => {
    try {
      const service = services.find(s => s.id === serverId)
      const newEnabled = !service.enabled
      
      await toggleService(serverId, newEnabled)
    } catch (err) {
      console.error('Failed to toggle server:', err)
      alert('操作失败，请重试')
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

  return (
    <div className="p-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。
          所有服务都是免费的，无需API密钥即可使用。
        </p>
      </div>

      <div className="space-y-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            server={service}
            onToggle={() => handleToggleServer(service.id)}
            getServiceIcon={getServiceIcon}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 简化的服务卡片组件
 */
function ServiceCard({ server, onToggle, getServiceIcon }) {
  return (
    <div className={`border rounded-lg p-4 ${server.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getServiceIcon(server.id)}</span>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-medium">{server.name}</h5>
              {(server.id === 'sqlite' || server.id === 'filesystem') && (
                <McpPathConfigDialog service={server} onSave={() => {}} />
              )}
            </div>
            <p className="text-sm text-gray-600">{server.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">免费</Badge>
              <Badge variant="outline">无需API密钥</Badge>
              <Badge variant="outline">实时数据</Badge>
              {server.tools && server.tools.length > 0 && (
                <Badge variant="outline">{server.tools.length} 个工具</Badge>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={server.enabled}
              onChange={onToggle}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              server.enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                server.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </div>
      </div>
      
      {server.enabled && server.loaded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            ✓ 已就绪，无需配置
          </Badge>
        </div>
      )}
    </div>
  )
}

