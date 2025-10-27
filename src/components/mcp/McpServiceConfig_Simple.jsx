import React, { useState } from 'react'
import { AlertCircle, Search, Cloud, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useMcpManager } from '@/hooks/useMcpManager'
import { McpPathConfigDialog } from './McpPathConfig'

import { createLogger } from '../../lib/logger'
const logger = createLogger('McpServiceConfigSimple')
import { useTranslation } from '@/hooks/useTranslation'


/**
 * 简化的MCP服务配置组件
 */
export default function McpServiceConfigSimple() {
  const { services, loading, error, toggleService } = useMcpManager()
  const { translate } = useTranslation()

  const handleToggleServer = async (targetService) => {
    try {
      const service = typeof targetService === 'string'
        ? services.find(s => s.id === targetService)
        : targetService

      if (!service) {
        throw new Error('未找到服务')
      }
      const newEnabled = !service.enabled
      
      await toggleService(service, newEnabled)
    } catch (err) {
      logger.error('Failed to toggle server:', err)
      alert(translate('mcp.common.operationFailed', '操作失败，请重试'))
    }
  }

  const getServiceIcon = (id) => {
    const icons = {
      // 原有服务
      weather: '🌤️',
      search: '🔍',
      time: '🕐',
      youtube: '📹',
      coincap: '💰',
      fetch: '🌐',
      dexscreener: '💹',
      playwright: '🎭',
      // 新MCP服务
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
      google_maps: '🗺️'
    }
    return icons[id] || '🔧'
  }

  if (loading) {
    return <div className="p-4">{translate('mcp.configPanel.loading', '加载中...')}</div>
  }

  if (error) {
    return (
      <div className="p-4 flex items-center gap-2" style={{ color: 'var(--destructive)' }}>
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {translate(
            'mcp.configPanel.intro',
            '通过启用 MCP 服务，您的 AI 助手将能够访问实时信息，包括网络搜索、天气查询、网页抓取等功能。所有服务都是免费的，无需API密钥即可使用。'
          )}
        </p>
      </div>

      <div className="space-y-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            server={service}
            onToggle={() => handleToggleServer(service)}
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
  const { translate } = useTranslation()
  // 判断服务是否需要配置
  const requiresConfig = server.requiresConfig || (server.id === 'brave_search' || server.id === 'github')
  const hasApiKey = server.apiKey && server.apiKey.length > 0

  return (
    <div className={`border rounded-lg p-4 ${server.enabled ? 'bg-opacity-5' : 'bg-opacity-5'}`} style={{
      backgroundColor: server.enabled ? 'color-mix(in srgb, var(--border) 8%, transparent)' : 'color-mix(in srgb, var(--muted) 8%, transparent)',
      borderColor: server.enabled ? 'var(--border)' : 'color-mix(in srgb, var(--border) 50%, transparent)'
    }}>
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
              {requiresConfig ? (
                <>
                  <Badge variant="outline">
                    {translate('mcp.common.badgeNeedsConfig', '需要配置')}
                  </Badge>
                  {hasApiKey && (
                    <Badge variant="secondary" style={{ 
                      color: 'var(--foreground)', 
                      backgroundColor: 'color-mix(in srgb, var(--border) 15%, transparent)',
                      opacity: 0.9
                    }}>
                      ✓ {translate('mcp.common.badgeConfigured', '已配置')}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    {translate('mcp.common.badgeFree', '免费')}
                  </Badge>
                  <Badge variant="outline">
                    {translate('mcp.common.badgeFreeNoConfig', '无需配置')}
                  </Badge>
                </>
              )}
              {server.tools && server.tools.length > 0 && (
                <Badge variant="outline">
                  {translate('mcp.common.badgeTools', '{count} 个工具')
                    .replace('{count}', server.tools.length.toString())}
                </Badge>
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
            <div 
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{
                backgroundColor: server.enabled ? 'var(--foreground)' : 'var(--muted)',
                opacity: server.enabled ? 0.9 : 0.7
              }}
            >
              <span 
                className="inline-block h-4 w-4 transform rounded-full transition-transform"
                style={{
                  backgroundColor: 'var(--background)',
                  transform: server.enabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)'
                }}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
