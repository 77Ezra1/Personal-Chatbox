import { useState, useEffect } from 'react'
import { Bot, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { agentAPI } from '@/lib/apiClient'
import { useTranslation } from '@/hooks/useTranslation'
import { getAgentStatusLabel, normalizeAgentStatus } from '@/lib/agentsUtils'

/**
 * ✅ Agent 选择器组件
 * 用于在聊天界面或其他地方选择要使用的 Agent
 */
export function AgentSelector({
  selectedAgentId,
  onSelectAgent,
  variant = 'default',
  className = ''
}) {
  const { translate } = useTranslation()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)

  // 加载 Agent 列表
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      setError(false)
      const response = await agentAPI.list()
      setAgents(response.data.agents || [])
    } catch (err) {
      console.error('Failed to load agents:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  const handleSelect = (agentId) => {
    onSelectAgent(agentId)
    setOpen(false)
  }

  const handleClear = () => {
    onSelectAgent(null)
    setOpen(false)
  }

  // 根据状态返回不同的徽章颜色
  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      busy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    return statusColors[normalizeAgentStatus(status)] || statusColors.inactive
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`gap-2 ${className}`}
          disabled={loading}
        >
          <Bot className="h-4 w-4" />
          {loading ? (
            <span className="text-sm">{translate('agents.selector.loading', 'Loading...')}</span>
          ) : selectedAgent ? (
            <>
              <span className="text-sm max-w-[120px] truncate">
                {selectedAgent.name}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${getStatusBadge(selectedAgent.status)}`}
              >
                {getAgentStatusLabel(translate, selectedAgent.status)}
              </Badge>
            </>
          ) : (
            <span className="text-sm">{translate('agents.selector.select', 'Select Agent')}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {translate('agents.selector.availableAgents', 'Available Agents')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">{translate('agents.selector.loading', 'Loading...')}</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{translate('agents.selector.loadFailed', 'Failed to load agents')}</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            {translate('agents.selector.noneAvailable', 'No agents available')}
          </div>
        ) : (
          <>
            {/* 清除选择选项 */}
            {selectedAgentId && (
              <>
                <DropdownMenuItem
                  onClick={handleClear}
                  className="text-muted-foreground"
                >
                  <span className="text-sm">{translate('agents.selector.clearSelection', 'Do not use Agent')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Agent 列表 */}
            {agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleSelect(agent.id)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Bot className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {agent.name}
                    </span>
                    {agent.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {agent.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusBadge(agent.status)}`}
                  >
                    {getAgentStatusLabel(translate, agent.status)}
                  </Badge>
                  {selectedAgentId === agent.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={loadAgents}
          className="text-xs text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 mr-2" />
          {translate('agents.selector.refresh', 'Refresh list')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
